import { useConfiguration } from '@/context/ConfigurationContext'
import { useProject } from '@/context/ProjectContext'
import { toaster } from '@/generated/toaster'
import { Derivation } from '@/misc/Derivation'
import { Alert, Box, Button, Dialog, Flex, Heading, Portal } from '@chakra-ui/react'
import { useMemo } from 'react'

interface DerivationDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function DerivationDialog({ isOpen, onClose }: DerivationDialogProps) {
  const { loader, setIsPending } = useProject()
  const { specificationFrame, compositionFrames, variables, selectedOptions, adaptedFrames } = useConfiguration()

  const { missingVariables, missingOptions } = useMemo(() => {
    if (!loader) return { missingVariables: [], missingOptions: [] }

    const refIndex = loader.referenceIndex

    const configVarNames = new Set(variables.map(v => v.name))
    const configOptNames = new Set(selectedOptions.map(o => o.name))

    return {
      missingVariables: Object.keys(refIndex.variable).filter(name => !configVarNames.has(name)),
      missingOptions: Object.keys(refIndex.option).filter(name => !configOptNames.has(name))
    }
  }, [isOpen, variables, selectedOptions, loader])

  const hasMissingItems = missingVariables.length > 0 || missingOptions.length > 0

  const handleDerive = async () => {
    if (!loader?.directoryTree) return

    const excludedFileIds = new Set<string>(
      [specificationFrame, ...compositionFrames].filter(f => f !== null).map(f => f.id)
    )

    setIsPending(true)

    try {
      await Derivation.deriveProduct(loader.directoryTree, excludedFileIds, variables, selectedOptions, adaptedFrames)

      toaster.create({
        title: 'Success',
        description: 'The ZIP file has been downloaded successfully.',
        type: 'success'
      })
    } catch {
      toaster.create({
        title: 'Error',
        description: 'An error occurred while generating the product.',
        type: 'error'
      })
    } finally {
      setIsPending(false)
      onClose()
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={() => onClose()} placement={'top'} size={'md'}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Heading size={'md'}>Derive Product</Heading>
            </Dialog.Header>

            <Dialog.Body>
              {hasMissingItems ? (
                <Alert.Root status="error" variant={'surface'}>
                  <Alert.Indicator mt={1} />
                  <Box>
                    <Alert.Title>Configuration incomplete</Alert.Title>
                    <Alert.Description>Fix the missing items in the configuration before derivation.</Alert.Description>
                  </Box>
                </Alert.Root>
              ) : (
                <Alert.Root status="success" variant={'surface'}>
                  <Alert.Indicator />
                  <Box>
                    <Alert.Title>Configuration is complete</Alert.Title>
                    <Alert.Description>All variables and options are configured. Ready to derive.</Alert.Description>
                  </Box>
                </Alert.Root>
              )}
            </Dialog.Body>

            <Dialog.Footer>
              <Flex gap={2}>
                {hasMissingItems ? (
                  <Button colorPalette={'gray'} size={'xs'} onClick={onClose}>
                    Close
                  </Button>
                ) : (
                  <>
                    <Button colorPalette={'red'} variant={'outline'} size={'xs'} onClick={onClose}>
                      Cancel
                    </Button>
                    <Button colorPalette={'green'} size={'xs'} onClick={handleDerive}>
                      Derive
                    </Button>
                  </>
                )}
              </Flex>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
