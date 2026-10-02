import { useConfiguration } from '@/context/ConfigurationContext'
import { useProject } from '@/context/ProjectContext'
import { BlockOperations } from '@/misc/BlockOperations'
import { FrameAnalyzer } from '@/misc/FrameAnalyzer'
import type { FrameConstraint, FrameOption, FrameVariable } from '@/models/Frame'
import {
  Alert,
  Badge,
  Box,
  Button,
  Dialog,
  Field,
  Flex,
  Heading,
  Input,
  Portal,
  Select,
  Text,
  VStack,
  createListCollection
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'

interface ConfigurationEditorProps {
  isOpen: boolean
  onClose: () => void
  itemType: 'variable' | 'option' | 'constraint' | null
  itemData: FrameVariable | FrameOption | FrameConstraint | null
}

export function ConfigurationEditor({ isOpen, onClose, itemType, itemData }: ConfigurationEditorProps) {
  const { loader } = useProject()
  const {
    variables,
    setVariables,
    selectedOptions,
    setSelectedOptions,
    constraints,
    setConstraints,
    specificationFrame,
    setSpecificationFrame,
    compositionFrames,
    setCompositionFrames,
    setAdaptedFrames
  } = useConfiguration()

  const [editValue, setEditValue] = useState<string[]>([''])
  const [availableValues, setAvailableValues] = useState<string[]>([])
  const [relatedItems, setRelatedItems] = useState<(FrameVariable | FrameOption)[]>([])

  const [constraintType, setConstraintType] = useState<'toBoundary' | 'toSet' | null>(null)
  const [boundaryRange, setBoundaryRange] = useState<{ min: number; max: number } | null>(null)

  const [isInvalid, setIsInvalid] = useState<boolean>(false)

  useEffect(() => {
    if (!itemData || !itemType) return

    if (itemType === 'variable') {
      const variable = itemData as FrameVariable
      setEditValue([variable.value])

      const relatedConstraints = constraints.filter(c => c.variable === variable.name)

      let foundType: 'toBoundary' | 'toSet' | null = null
      let boundary: { min: number; max: number } | null = null

      if (relatedConstraints.length > 0) {
        const condition = relatedConstraints[0].condition
        if (/^\d+,\d+$/.test(condition)) {
          foundType = 'toBoundary'
          const parts = condition.split(',').map(x => Number(x.trim()))
          boundary = { min: parts[0], max: parts[1] }
        } else {
          foundType = 'toSet'
        }
      }

      setConstraintType(foundType)
      setBoundaryRange(boundary)

      if (foundType === 'toSet') {
        setAvailableValues(relatedConstraints.map(x => x.condition.split(',')).flatMap(y => y.map(z => z.trim())))
      } else {
        setAvailableValues([])
      }

      setRelatedItems([])
    } else if (itemType === 'option') {
      const option = itemData as FrameOption
      setEditValue([option.value])

      const relatedConstraints = constraints.filter(c => c.variable === option.name)

      let foundType: 'toBoundary' | 'toSet' | null = null
      let boundary: { min: number; max: number } | null = null

      if (relatedConstraints.length > 0) {
        const condition = relatedConstraints[0].condition
        if (/^\d+,\d+$/.test(condition)) {
          foundType = 'toBoundary'
          const parts = condition.split(',').map(x => Number(x.trim()))
          boundary = { min: parts[0], max: parts[1] }
        } else {
          foundType = 'toSet'
        }
      }

      setConstraintType(foundType)
      setBoundaryRange(boundary)

      if (foundType === 'toSet' && relatedConstraints.length > 0) {
        setAvailableValues(relatedConstraints.map(x => x.condition.split(',')).flatMap(y => y.map(z => z.trim())))
      } else if (!foundType) {
        if (option.value === 'TRUE' || option.value === 'FALSE') {
          setAvailableValues(['TRUE', 'FALSE'])
        } else {
          setAvailableValues([])
        }
      } else {
        setAvailableValues([])
      }

      setRelatedItems([])
    } else if (itemType === 'constraint') {
      const constraint = itemData as FrameConstraint
      setEditValue([constraint.condition])

      const relatedVar = variables.find(v => v.name === constraint.variable)
      const relatedOpt = selectedOptions.find(o => o.name === constraint.variable)

      setRelatedItems([relatedVar, relatedOpt].filter(x => !!x))
      setAvailableValues([])

      const foundType: 'toBoundary' | 'toSet' = /^\d+,\d+$/.test(constraint.condition) ? 'toBoundary' : 'toSet'
      setConstraintType(foundType)
    }

    setIsInvalid(false)
  }, [isOpen, itemType, itemData, variables, selectedOptions, constraints])

  useEffect(() => {
    if (!editValue.length || !editValue[0]) {
      setIsInvalid(true)
      return
    }

    if (itemType === 'variable' || itemType === 'option') {
      if (constraintType === 'toBoundary' && boundaryRange) {
        const num = Number(editValue[0])
        if (isNaN(num) || num < boundaryRange.min || num > boundaryRange.max) {
          setIsInvalid(true)
          return
        }
      }
    }

    if (itemType === 'constraint') {
      if (constraintType === 'toBoundary') {
        const parts = editValue[0].split(',').map(x => x.trim())
        if (parts.length !== 2 || !parts.every(p => /^\d+$/.test(p))) {
          setIsInvalid(true)
          return
        }
        const [min, max] = parts.map(Number)
        if (min >= max) {
          setIsInvalid(true)
          return
        }
      } else if (constraintType === 'toSet') {
        const regex = /^[a-zA-Z0-9_-]+(,[a-zA-Z0-9_-]+)*$/
        if (!regex.test(editValue[0])) {
          setIsInvalid(true)
          return
        }
      }
    }

    setIsInvalid(false)
  }, [editValue, itemType, constraintType, boundaryRange])

  const handleSave = () => {
    if (itemType === 'variable') {
      const variable = itemData as FrameVariable
      const updated = variables.map(v => (v.name === variable.name ? { ...v, value: editValue[0] } : v))
      setVariables(updated)

      if (loader && specificationFrame) {
        BlockOperations.updateConfigurationBlock(specificationFrame.parsed, 'set', variable.name, editValue[0])
        loader.updateFileInPlace(specificationFrame)
        setSpecificationFrame({ ...specificationFrame })
      }
    } else if (itemType === 'option') {
      const option = itemData as FrameOption
      const updated = selectedOptions.map(o => (o.name === option.name ? { ...o, value: editValue[0] } : o))
      setSelectedOptions(updated)

      if (loader && specificationFrame) {
        BlockOperations.updateConfigurationBlock(specificationFrame.parsed, 'select', option.name, editValue[0])
        loader.updateFileInPlace(specificationFrame)
        setSpecificationFrame({ ...specificationFrame })
      }

      const recalculatedAdaptedFrames = FrameAnalyzer.extractAdaptedFrames(
        compositionFrames.flatMap(f => f.parsed),
        updated
      )
      setAdaptedFrames(recalculatedAdaptedFrames)
    } else if (itemType === 'constraint') {
      const constraint = itemData as FrameConstraint
      const newValue = editValue[0].split(',').map(x => x.trim())

      if (relatedItems.length > 0) {
        const vars = variables.map(v => (v.name === constraint.variable ? { ...v, value: newValue[0] } : v))
        setVariables(vars)

        const opts = selectedOptions.map(o => (o.name === constraint.variable ? { ...o, value: newValue[0] } : o))
        setSelectedOptions(opts)

        if (loader && specificationFrame) {
          const hasSet = BlockOperations.updateConfigurationBlock(
            specificationFrame.parsed,
            'set',
            constraint.variable,
            newValue[0]
          )
          const hasSelect = BlockOperations.updateConfigurationBlock(
            specificationFrame.parsed,
            'select',
            constraint.variable,
            newValue[0]
          )

          if (hasSet || hasSelect) {
            loader.updateFileInPlace(specificationFrame)
            setSpecificationFrame({ ...specificationFrame })
          }
        }

        const recalculatedAdaptedFrames = FrameAnalyzer.extractAdaptedFrames(
          compositionFrames.flatMap(f => f.parsed),
          opts
        )
        setAdaptedFrames(recalculatedAdaptedFrames)
      }

      const updated = constraints.map(c =>
        c.variable === constraint.variable ? { ...c, condition: newValue.join(',') } : c
      )
      setConstraints(updated)

      if (loader && compositionFrames.length > 0) {
        for (const frame of compositionFrames) {
          const success = BlockOperations.updateConfigurationBlock(
            frame.parsed,
            'constrain',
            constraint.variable,
            newValue.join(',')
          )
          if (success) {
            loader.updateFileInPlace(frame)
          }
        }
        setCompositionFrames([...compositionFrames])
      }
    }

    onClose()
  }

  if (!itemData || !itemType) {
    return null
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={() => onClose()} placement={'center'} size={'md'}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Heading size={'md'}>Edit {itemType.charAt(0).toUpperCase() + itemType.slice(1)}</Heading>
            </Dialog.Header>
            <Dialog.Body>
              <VStack align={'stretch'} gap={4}>
                {itemType === 'variable' && itemData && (
                  <Box p={2} bg={'bg.muted'} rounded={'sm'}>
                    <Text fontSize={'sm'} color={'fg.muted'} mb={2}>
                      Variable Name
                    </Text>
                    <Badge colorPalette={'teal'}>{(itemData as FrameVariable).name}</Badge>
                  </Box>
                )}

                {itemType === 'option' && itemData && (
                  <Box p={2} bg={'bg.muted'} rounded={'sm'}>
                    <Text fontSize={'sm'} color={'fg.muted'} mb={2}>
                      Option Name
                    </Text>
                    <Badge colorPalette={'green'}>{(itemData as FrameOption).name}</Badge>
                  </Box>
                )}

                {itemType === 'constraint' && itemData && (
                  <Box p={2} bg={'bg.muted'} rounded={'sm'}>
                    <Text fontSize={'sm'} color={'fg.muted'} mb={2}>
                      Constraint
                    </Text>
                    <Badge colorPalette={'red'}>{(itemData as FrameConstraint).variable}</Badge>
                  </Box>
                )}

                {relatedItems.length > 0 && (
                  <Alert.Root status="info" alignItems={'center'}>
                    <Alert.Indicator />
                    <Alert.Title truncate>Referenced items will be set to first changed value</Alert.Title>
                  </Alert.Root>
                )}

                <Box>
                  {availableValues.length > 0 ? (
                    <Select.Root
                      collection={createListCollection({
                        items: availableValues.map(val => ({ label: val, value: val }))
                      })}
                      value={editValue}
                      onValueChange={e => setEditValue(e.value)}
                      size={'xs'}
                    >
                      <Select.HiddenSelect />
                      <Select.Control>
                        <Select.Trigger>
                          <Select.ValueText placeholder="Select Value" />
                        </Select.Trigger>
                        <Select.IndicatorGroup>
                          <Select.Indicator />
                        </Select.IndicatorGroup>
                      </Select.Control>
                      <Select.Positioner>
                        <Select.Content>
                          {availableValues.map(val => (
                            <Select.Item key={val} item={{ label: val, value: val }}>
                              {val}
                              <Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Select.Root>
                  ) : (
                    <Field.Root invalid={isInvalid}>
                      <Input
                        size={'xs'}
                        value={editValue[0]}
                        onChange={e => setEditValue([e.target.value])}
                        placeholder="Enter Value"
                      />
                      {itemType !== 'constraint' && constraintType === 'toBoundary' && boundaryRange && (
                        <Field.ErrorText fontSize={'xs'}>
                          Must be a number between {boundaryRange.min} and {boundaryRange.max}
                        </Field.ErrorText>
                      )}
                      {itemType === 'constraint' && (
                        <Field.ErrorText fontSize={'xs'}>
                          {constraintType === 'toBoundary'
                            ? 'Must be two numbers representing boundary (e.g., 1024,4096)'
                            : 'Must be comma-separated values (e.g., value1,value2,value3)'}
                        </Field.ErrorText>
                      )}
                    </Field.Root>
                  )}
                </Box>

                {availableValues.length > 0 && (
                  <Box p={2} bg={'bg.muted'} rounded={'sm'} borderLeftWidth={4} borderLeftColor={'green'}>
                    <Text fontSize={'xs'} color={'fg.muted'}>
                      Suggested values based on constraints/configuration
                    </Text>
                  </Box>
                )}
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <Flex gap={2}>
                <Button colorPalette={'red'} variant={'outline'} size={'xs'} onClick={onClose}>
                  Cancel
                </Button>
                <Button disabled={isInvalid} colorPalette={'green'} size={'xs'} onClick={handleSave}>
                  Save
                </Button>
              </Flex>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
