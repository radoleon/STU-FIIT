import { useConfiguration } from '@/context/ConfigurationContext'
import { useProject } from '@/context/ProjectContext'
import { useColorModeValue } from '@/generated/color-mode'
import type { InsertBlockData } from '@/models/CodeBlock'
import {
  Alert,
  Box,
  Button,
  Dialog,
  Field,
  Flex,
  Heading,
  Input,
  Portal,
  Select,
  Span,
  Text,
  VStack,
  createListCollection
} from '@chakra-ui/react'
import { Editor } from '@monaco-editor/react'
import { useEffect, useState } from 'react'

interface InsertBlockDialogProps {
  isOpen: boolean
  isOptionInsert: boolean
  onClose: () => void
  onConfirm: (data: InsertBlockData) => void
}

export function InsertBlockDialog({ isOpen, isOptionInsert, onClose, onConfirm }: InsertBlockDialogProps) {
  const editorTheme = useColorModeValue('vs', 'vs-dark')
  const { constraints, selectedOptions } = useConfiguration()
  const { loader } = useProject()

  const [optionName, setOptionName] = useState('')
  const [optionValue, setOptionValue] = useState<string[]>([''])
  const [textContent, setTextContent] = useState('')

  const [isInvalid, setIsInvalid] = useState(false)

  const [relatedType, setRelatedType] = useState<'constraint' | 'option' | null>(null)
  const [availableValues, setAvailableValues] = useState<string[]>([])

  useEffect(() => {
    if (!isOptionInsert || !optionName.trim()) {
      setAvailableValues([])
      setRelatedType(null)
      return
    }

    const relatedConstraints = constraints.filter(c => c.variable === optionName)
    const relatedSelectedOptions = selectedOptions.filter(o => o.name === optionName)

    setAvailableValues([])
    setRelatedType(null)

    if (relatedConstraints.length > 0) {
      const values = relatedConstraints.map(c => c.condition.split(',').map(v => v.trim())).flat()
      setAvailableValues(values)
      setRelatedType('constraint')
    } else if (relatedSelectedOptions.length > 0) {
      if (relatedSelectedOptions.every(o => o.value === 'TRUE' || o.value === 'FALSE')) {
        setAvailableValues(['TRUE'])
        setRelatedType('option')
      }
    }
  }, [optionName, isOptionInsert, constraints, selectedOptions])

  useEffect(() => {
    if (!isOptionInsert || !optionName.trim() || !optionValue[0]?.trim()) {
      setIsInvalid(false)
      return
    }

    if (availableValues.length > 0 && !availableValues.includes(optionValue[0])) {
      setIsInvalid(true)
    } else {
      setIsInvalid(false)
    }
  }, [optionValue, optionName, isOptionInsert, availableValues])

  const handleSave = () => {
    const data: Partial<InsertBlockData> = {
      kind: isOptionInsert ? 'option' : 'text'
    }

    if (isOptionInsert) {
      data.optionName = optionName

      if (optionValue[0] !== 'TRUE') {
        data.optionValue = optionValue[0]
      }
    }

    if (textContent.trim()) {
      data.content = textContent
    }

    onConfirm(data as InsertBlockData)

    resetForm()
    onClose()
  }

  const resetForm = () => {
    setOptionName('')
    setOptionValue([])
    setTextContent('')

    setIsInvalid(false)

    setAvailableValues([])
    setRelatedType(null)
  }

  const isSaveDisabled = isOptionInsert
    ? !optionName.trim() || !optionValue[0]?.trim() || isInvalid
    : !textContent.trim()

  return (
    <Dialog.Root open={isOpen} onOpenChange={() => onClose()} placement={'center'} size={'xl'}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Heading size={'md'}>Insert {isOptionInsert ? 'Option' : 'Text'}</Heading>
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body>
              <VStack align={'stretch'} gap={4}>
                {isOptionInsert && (
                  <>
                    <Field.Root>
                      <Field.Label fontSize={'xs'}>Option Name</Field.Label>
                      <Input
                        size={'xs'}
                        placeholder="Enter Value"
                        value={optionName}
                        onChange={e => setOptionName(e.target.value)}
                      />
                    </Field.Root>

                    <Field.Root invalid={isInvalid}>
                      <Field.Label fontSize={'xs'}>Option Value</Field.Label>
                      <Input
                        size={'xs'}
                        placeholder="Enter Value"
                        value={optionValue[0]}
                        onChange={e => setOptionValue([e.target.value])}
                      />
                    </Field.Root>

                    {isInvalid && availableValues.length > 0 && (
                      <>
                        {relatedType === 'constraint' && (
                          <Alert.Root status="error" alignItems={'center'}>
                            <Alert.Indicator />
                            <Alert.Title truncate>Value must match one of the constraint options</Alert.Title>
                          </Alert.Root>
                        )}

                        <Select.Root
                          collection={createListCollection({
                            items: availableValues.map(val => ({ label: val, value: val }))
                          })}
                          value={optionValue}
                          onValueChange={e => setOptionValue(e.value)}
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

                        <Box p={2} bg={'bg.muted'} rounded={'sm'} borderLeftWidth={4} borderLeftColor={'green'}>
                          <Text fontSize={'xs'} color={'fg.muted'}>
                            Suggested values based on constraints/configuration
                          </Text>
                        </Box>
                      </>
                    )}
                  </>
                )}

                <Field.Root>
                  <Field.Label fontSize={'xs'}>
                    Text Content
                    {isOptionInsert && (
                      <Span fontSize={'xs'} color={'fg.muted'}>
                        (optional)
                      </Span>
                    )}
                  </Field.Label>
                  <Editor
                    value={textContent}
                    onChange={value => setTextContent(value || '')}
                    language={loader?.syntaxLanguage}
                    height={'200px'}
                    theme={editorTheme}
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      renderValidationDecorations: 'off',
                      contextmenu: false,
                      wordWrap: 'on'
                    }}
                  />
                </Field.Root>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <Flex gap={2}>
                <Button
                  colorPalette={'red'}
                  variant={'outline'}
                  size={'xs'}
                  onClick={() => {
                    resetForm()
                    onClose()
                  }}
                >
                  Cancel
                </Button>
                <Button disabled={isSaveDisabled} colorPalette={'green'} size={'xs'} onClick={handleSave}>
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
