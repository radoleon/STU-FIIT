import { useConfiguration } from '@/context/ConfigurationContext'
import { useProject } from '@/context/ProjectContext'
import { toaster } from '@/generated/toaster'
import { BlockOperations } from '@/misc/BlockOperations'
import { FrameAnalyzer } from '@/misc/FrameAnalyzer'
import type { PresetEntry } from '@/models/Frame'
import { Alert, Box, Button, CloseButton, Code, Dialog, Flex, Heading, Portal, Stack, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { LuTrash, LuWrench } from 'react-icons/lu'

interface LoadPresetDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function LoadPresetDialog({ isOpen, onClose }: LoadPresetDialogProps) {
  const { loader, persistence } = useProject()
  const {
    variables,
    setVariables,
    selectedOptions,
    setSelectedOptions,
    constraints,
    setConstraints,
    setAdaptedFrames,
    compositionFrames,
    setCompositionFrames,
    specificationFrame,
    setSpecificationFrame
  } = useConfiguration()

  const [entries, setEntries] = useState<PresetEntry[]>([])

  useEffect(() => {
    if (!isOpen || !persistence) return

    const loadPresets = async () => {
      const allPresets = await persistence.getAllPresets()

      const cVars = new Set(variables.map(v => v.name))
      const cOpts = new Set(selectedOptions.map(o => o.name))
      const cCons = new Set(constraints.map(c => c.variable))

      const mapped: PresetEntry[] = allPresets.map(({ key, preset }) => {
        const pVars = new Set(preset.variables.map(v => v.name))
        const pOpts = new Set(preset.selectedOptions.map(o => o.name))
        const pCons = new Set(preset.constraints.map(c => c.variable))

        const isCompatible =
          pVars.size === cVars.size &&
          [...pVars].every(v => cVars.has(v)) &&
          pOpts.size === cOpts.size &&
          [...pOpts].every(o => cOpts.has(o)) &&
          pCons.size === cCons.size &&
          [...pCons].every(c => cCons.has(c))

        return { key, preset, isCompatible }
      })

      setEntries(mapped)
    }

    loadPresets()
  }, [isOpen, persistence, variables, selectedOptions, constraints])

  const handleDelete = async (key: string) => {
    if (!persistence) return

    await persistence.deletePreset(key)
    setEntries(prev => prev.filter(x => x.key !== key))

    toaster.create({
      title: 'Warning',
      description: `Preset "${key}" was deleted successfully.`,
      type: 'warning'
    })
  }

  const handleApply = (entry: PresetEntry) => {
    if (!loader || !specificationFrame) return

    for (const variable of entry.preset.variables) {
      BlockOperations.updateConfigurationBlock(specificationFrame.parsed, 'set', variable.name, variable.value)
    }
    for (const option of entry.preset.selectedOptions) {
      BlockOperations.updateConfigurationBlock(specificationFrame.parsed, 'select', option.name, option.value)
    }

    loader.updateFileInPlace(specificationFrame)
    setSpecificationFrame({ ...specificationFrame })

    for (const frame of compositionFrames) {
      let changed = false

      for (const constraint of entry.preset.constraints) {
        if (
          BlockOperations.updateConfigurationBlock(frame.parsed, 'constrain', constraint.variable, constraint.condition)
        ) {
          changed = true
        }
      }

      if (changed) {
        loader.updateFileInPlace(frame)
      }
    }

    setCompositionFrames([...compositionFrames])

    setVariables(entry.preset.variables)
    setSelectedOptions(entry.preset.selectedOptions)
    setConstraints(entry.preset.constraints)

    const recalculatedAdaptedFrames = FrameAnalyzer.extractAdaptedFrames(
      compositionFrames.flatMap(f => f.parsed),
      entry.preset.selectedOptions
    )

    setAdaptedFrames(recalculatedAdaptedFrames)

    toaster.create({
      title: 'Success',
      description: `Preset "${entry.key}" was applied successfully.`,
      type: 'success'
    })

    onClose()
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={() => onClose()} placement={'center'} size={'md'}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Heading size={'md'}>Load Preset</Heading>
              <Dialog.CloseTrigger asChild top={6} right={6}>
                <CloseButton colorPalette={'gray'} size="xs" />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              {entries.length === 0 ? (
                <Text fontSize={'sm'} color={'fg.muted'}>
                  No presets saved for this project.
                </Text>
              ) : (
                <Stack gap={4} maxH={'400px'} overflowY={'auto'} scrollbarWidth={'thin'}>
                  {entries.map(entry => (
                    <Box key={entry.key} borderWidth={1} rounded={'md'} p={4}>
                      <Flex justifyContent={'space-between'} alignItems={'center'} mb={4}>
                        <Text fontSize={'xs'} fontWeight={'bold'}>
                          {entry.key}
                        </Text>
                        <Flex gap={2} alignItems={'center'}>
                          <Code size={'xs'} colorPalette={'gray'}>
                            {entry.preset.variables.length} var
                          </Code>
                          <Code size={'xs'} colorPalette={'gray'}>
                            {entry.preset.selectedOptions.length} opt
                          </Code>
                          <Code size={'xs'} colorPalette={'gray'}>
                            {entry.preset.constraints.length} con
                          </Code>
                        </Flex>
                      </Flex>
                      {entry.isCompatible ? (
                        <Flex alignItems={'center'} gap={4}>
                          <Alert.Root status={'success'} py={2} variant={'outline'}>
                            <Alert.Indicator />
                            <Alert.Title fontSize={'xs'}>Preset can be applied</Alert.Title>
                          </Alert.Root>
                          <Button
                            size={'xs'}
                            w={'1/4'}
                            colorPalette={'green'}
                            variant={'surface'}
                            onClick={() => handleApply(entry)}
                          >
                            <LuWrench />
                            Apply
                          </Button>
                        </Flex>
                      ) : (
                        <Flex alignItems={'center'} gap={4}>
                          <Alert.Root status={'error'} py={2} variant={'outline'}>
                            <Alert.Indicator />
                            <Alert.Title fontSize={'xs'}>Preset is incompatible</Alert.Title>
                          </Alert.Root>
                          <Button
                            size={'xs'}
                            w={'1/4'}
                            colorPalette={'red'}
                            variant={'surface'}
                            onClick={() => handleDelete(entry.key)}
                          >
                            <LuTrash />
                            Delete
                          </Button>
                        </Flex>
                      )}
                    </Box>
                  ))}
                </Stack>
              )}
            </Dialog.Body>
            <Dialog.Footer />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
