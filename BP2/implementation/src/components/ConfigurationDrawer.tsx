import { useConfiguration } from '@/context/ConfigurationContext'
import { useProject } from '@/context/ProjectContext'
import { toaster } from '@/generated/toaster'
import { BlockOperations } from '@/misc/BlockOperations'
import type { CodeBlock } from '@/models/CodeBlock'
import type { FrameConstraint, FrameOption, FrameVariable } from '@/models/Frame'
import {
  Alert,
  Badge,
  Box,
  Button,
  CloseButton,
  Drawer,
  Field,
  Flex,
  Heading,
  IconButton,
  Input,
  Portal,
  Separator,
  Stack,
  Stat,
  Tag,
  VStack
} from '@chakra-ui/react'
import { useMemo, useRef, useState } from 'react'
import { LuCheck, LuCirclePlus, LuDatabase, LuPencilLine, LuPlus, LuSearch, LuX } from 'react-icons/lu'
import { AddConfigurationDialog } from './AddConfigurationDialog'
import { ConfigurationEditor } from './ConfigurationEditor'
import { LoadPresetDialog } from './LoadPresetDialog'

interface ConfigurationDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function ConfigurationDrawer({ isOpen, onClose }: ConfigurationDrawerProps) {
  const { loader, persistence } = useProject()
  const {
    specificationFrame,
    setSpecificationFrame,
    variables,
    setVariables,
    selectedOptions,
    setSelectedOptions,
    constraints,
    setConstraints,
    compositionFrames,
    setCompositionFrames,
    adaptedFrames
  } = useConfiguration()

  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editorItemType, setEditorItemType] = useState<'variable' | 'option' | 'constraint' | null>(null)
  const [editorItemData, setEditorItemData] = useState<FrameVariable | FrameOption | FrameConstraint | null>(null)

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [addItemType, setAddItemType] = useState<'variable' | 'option' | null>(null)
  const [addItemName, setAddItemName] = useState<string | null>(null)

  const presetInputRef = useRef<HTMLInputElement>(null)
  const [hasPresetInput, setHasPresetInput] = useState(false)

  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState(false)

  const [presetState, setPresetState] = useState<'idle' | 'error' | 'new'>('idle')
  const [presetError, setPresetError] = useState<string | null>(null)

  const { newVariables, newOptions, unusedVariables, unusedOptions } = useMemo(() => {
    if (!loader) {
      return { newVariables: [], newOptions: [], unusedVariables: [], unusedOptions: [] }
    }

    const refIndex = loader.referenceIndex

    const configVarNames = new Set(variables.map(v => v.name))
    const configOptNames = new Set(selectedOptions.map(o => o.name))

    const referencedVarNames = Object.keys(refIndex.variable)
    const referencedOptNames = Object.keys(refIndex.option)

    return {
      newVariables: referencedVarNames.filter(name => !configVarNames.has(name)),
      newOptions: referencedOptNames.filter(name => !configOptNames.has(name)),
      unusedVariables: variables.filter(v => !referencedVarNames.includes(v.name)),
      unusedOptions: selectedOptions.filter(o => !referencedOptNames.includes(o.name))
    }
  }, [isOpen, variables, selectedOptions, loader])

  const handleAddItem = (type: 'variable' | 'option', name: string) => {
    setAddItemType(type)
    setAddItemName(name)
    setIsAddDialogOpen(true)
  }

  const handleRemoveItem = (type: 'variable' | 'option', name: string) => {
    if (!loader || !specificationFrame) return

    const findBlocks = (blocks: CodeBlock[], kind: string, attrName: string, attrValue: string): CodeBlock[] => {
      const found: CodeBlock[] = []
      for (const block of blocks) {
        if (block.kind === kind && block.attributes[attrName] === attrValue) {
          found.push(block)
        }
        if (block.children.length > 0) {
          found.push(...findBlocks(block.children, kind, attrName, attrValue))
        }
      }
      return found
    }

    const blockKind = type === 'variable' ? 'set' : 'select'
    const attrName = type === 'variable' ? 'var' : 'option'

    const [blockToRemove] = findBlocks(specificationFrame.parsed, blockKind, attrName, name)
    if (!blockToRemove) return

    const updatedBlocks = BlockOperations.removeBlock(specificationFrame.parsed, blockToRemove.id)
    specificationFrame.parsed = updatedBlocks
    loader.updateFileInPlace(specificationFrame)
    setSpecificationFrame({ ...specificationFrame })

    for (const frame of compositionFrames) {
      const constraintBlocks = findBlocks(frame.parsed, 'constrain', 'var', name)

      if (constraintBlocks.length > 0) {
        let updatedFrameBlocks = frame.parsed

        for (const constraintBlock of constraintBlocks) {
          updatedFrameBlocks = BlockOperations.removeBlock(updatedFrameBlocks, constraintBlock.id)
        }

        frame.parsed = updatedFrameBlocks
        loader.updateFileInPlace(frame)
      }
    }

    setCompositionFrames([...compositionFrames])
    setConstraints(constraints.filter(c => c.variable !== name))

    if (type === 'variable') {
      setVariables(variables.filter(v => v.name !== name))
    } else {
      setSelectedOptions(selectedOptions.filter(o => o.name !== name))
    }
  }

  const openEditor = (
    type: 'variable' | 'option' | 'constraint',
    data: FrameVariable | FrameOption | FrameConstraint
  ) => {
    setEditorItemType(type)
    setEditorItemData(data)
    setIsEditorOpen(true)
  }

  const closeEditor = () => {
    setEditorItemType(null)
    setEditorItemData(null)
    setIsEditorOpen(false)
  }

  const closeAddDialog = () => {
    setAddItemType(null)
    setAddItemName(null)
    setIsAddDialogOpen(false)
  }

  const clearPresetState = () => {
    setPresetState('idle')
    setHasPresetInput(false)
    setPresetError(null)

    if (presetInputRef.current) {
      presetInputRef.current.value = ''
    }
  }

  const handleConfirmSavePreset = async () => {
    if (!persistence || !presetInputRef.current) return

    const inputValue = presetInputRef.current.value.trim()
    const result = await persistence.isPresetSaved({ variables, selectedOptions, constraints }, inputValue)

    if (result) {
      setPresetState('error')
      setHasPresetInput(false)
      setPresetError(result)

      if (presetInputRef.current) {
        presetInputRef.current.value = ''
      }
      return
    }

    await persistence.savePreset(inputValue, { variables, selectedOptions, constraints })

    toaster.create({
      title: 'Preset saved',
      description: `"${inputValue}" was saved successfully.`,
      type: 'success'
    })

    clearPresetState()
  }

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={() => {
        clearPresetState()
        onClose()
      }}
    >
      <Portal>
        <Drawer.Positioner>
          <Drawer.Backdrop />
          <Drawer.Content maxW={'50%'}>
            <Drawer.Header borderBottomWidth={'1px'} p={6}>
              <Heading size={'lg'} m={0}>
                Configuration
              </Heading>
              <Drawer.CloseTrigger asChild top={6} right={6}>
                <CloseButton colorPalette={'gray'} size="xs" />
              </Drawer.CloseTrigger>
            </Drawer.Header>
            <Drawer.Body overflowY={'auto'} scrollbarWidth={'thin'} py={6}>
              <VStack gap={4} mb={6} borderWidth={'1px'} p={4} rounded={'md'} bg={'bg.muted'}>
                <Flex w={'full'}>
                  <Stat.Root flex={1}>
                    <Stat.Label fontSize={'sm'}>Specification Frame</Stat.Label>
                    <Stat.ValueText fontSize={'sm'} me={4}>
                      <Badge colorPalette={'green'}>{specificationFrame?.name}</Badge>
                    </Stat.ValueText>
                  </Stat.Root>
                  <Stat.Root flex={3}>
                    <Stat.Label fontSize={'sm'}>Composition Frames</Stat.Label>
                    <Stat.ValueText fontSize={'sm'}>
                      <Flex gap={1} wrap={'wrap'}>
                        {compositionFrames.map((frame, i) => (
                          <Badge key={i} colorPalette={'blue'}>
                            {frame.name}
                          </Badge>
                        ))}
                      </Flex>
                    </Stat.ValueText>
                  </Stat.Root>
                </Flex>
                <Flex gap={4} w={'full'} justifyContent={'space-between'}>
                  <Stat.Root>
                    <Stat.Label fontSize={'sm'}>Variables</Stat.Label>
                    <Stat.ValueText>{variables.length}</Stat.ValueText>
                  </Stat.Root>
                  <Stat.Root>
                    <Stat.Label fontSize={'sm'}>Options</Stat.Label>
                    <Stat.ValueText>{selectedOptions.length}</Stat.ValueText>
                  </Stat.Root>
                  <Stat.Root>
                    <Stat.Label fontSize={'sm'}>Constraints</Stat.Label>
                    <Stat.ValueText>{constraints.length}</Stat.ValueText>
                  </Stat.Root>
                  <Stat.Root>
                    <Stat.Label fontSize={'sm'}>Adapted Frames</Stat.Label>
                    <Stat.ValueText>{adaptedFrames.length}</Stat.ValueText>
                  </Stat.Root>
                </Flex>
              </VStack>

              <Box>
                <Flex gap={3}>
                  <Button
                    size={'xs'}
                    variant={'surface'}
                    colorPalette={'gray'}
                    disabled={presetState !== 'idle'}
                    onClick={() => setPresetState('new')}
                  >
                    <LuDatabase />
                    Save Preset
                  </Button>
                  <Button
                    size={'xs'}
                    variant={'surface'}
                    colorPalette={'gray'}
                    disabled={presetState !== 'idle'}
                    onClick={() => setIsPresetDialogOpen(true)}
                  >
                    <LuSearch />
                    Load Preset
                  </Button>
                </Flex>
                {presetState === 'error' && (
                  <Alert.Root status={'error'} mt={3} pos={'relative'}>
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title>Error</Alert.Title>
                      <Alert.Description>{presetError}.</Alert.Description>
                    </Alert.Content>
                    <CloseButton pos="relative" top="-2" insetEnd="-2" onClick={() => clearPresetState()} />
                  </Alert.Root>
                )}
                {presetState === 'new' && (
                  <Flex mt={3} gap={2}>
                    <Field.Root>
                      <Input
                        size={'xs'}
                        ref={presetInputRef}
                        onChange={e => setHasPresetInput(e.target.value.trim().length > 0)}
                        placeholder="Preset Name"
                      />
                    </Field.Root>
                    <IconButton
                      size={'xs'}
                      colorPalette={'green'}
                      variant={'subtle'}
                      disabled={!hasPresetInput}
                      onClick={handleConfirmSavePreset}
                    >
                      <LuCirclePlus />
                    </IconButton>
                    <IconButton size={'xs'} colorPalette={'red'} variant={'subtle'} onClick={clearPresetState}>
                      <LuX />
                    </IconButton>
                  </Flex>
                )}
              </Box>
              <Separator my={6} />

              {(newVariables.length > 0 || newOptions.length > 0) && (
                <Alert.Root status="warning" colorPalette={'yellow'} variant={'outline'} mb={6}>
                  <Alert.Indicator />
                  <VStack align={'stretch'} gap={2} flex={1}>
                    <Alert.Title>New Variable Items Detected</Alert.Title>
                    <Alert.Description>
                      <Flex gap={2} wrap={'wrap'}>
                        {newVariables.map((v, i) => (
                          <Tag.Root
                            key={`v-${i}`}
                            size={'md'}
                            variant={'surface'}
                            colorPalette={'gray'}
                            cursor={'pointer'}
                            onClick={() => handleAddItem('variable', v)}
                          >
                            <Tag.Label>{v}</Tag.Label>
                            <Tag.EndElement>
                              <LuPlus />
                            </Tag.EndElement>
                          </Tag.Root>
                        ))}
                        {newOptions.map((o, i) => (
                          <Tag.Root
                            key={`o-${i}`}
                            size={'md'}
                            variant={'surface'}
                            colorPalette={'gray'}
                            cursor={'pointer'}
                            onClick={() => handleAddItem('option', o)}
                          >
                            <Tag.Label>{o}</Tag.Label>
                            <Tag.EndElement>
                              <LuPlus />
                            </Tag.EndElement>
                          </Tag.Root>
                        ))}
                      </Flex>
                    </Alert.Description>
                  </VStack>
                </Alert.Root>
              )}

              {(unusedVariables.length > 0 || unusedOptions.length > 0) && (
                <Alert.Root status="info" variant={'outline'} mb={6}>
                  <Alert.Indicator />
                  <VStack align={'stretch'} gap={2} flex={1}>
                    <Alert.Title>Unused Configuration Items</Alert.Title>
                    <Alert.Description>
                      <Flex gap={2} wrap={'wrap'}>
                        {unusedVariables.map((v, i) => (
                          <Tag.Root
                            key={`v-${i}`}
                            size={'md'}
                            variant={'surface'}
                            colorPalette={'gray'}
                            cursor={'pointer'}
                            onClick={() => handleRemoveItem('variable', v.name)}
                          >
                            <Tag.Label>{v.name}</Tag.Label>
                            <Tag.EndElement>
                              <LuX />
                            </Tag.EndElement>
                          </Tag.Root>
                        ))}
                        {unusedOptions.map((o, i) => (
                          <Tag.Root
                            key={`o-${i}`}
                            size={'md'}
                            variant={'surface'}
                            colorPalette={'gray'}
                            cursor={'pointer'}
                            onClick={() => handleRemoveItem('option', o.name)}
                          >
                            <Tag.Label>{o.name}</Tag.Label>
                            <Tag.EndElement>
                              <LuX />
                            </Tag.EndElement>
                          </Tag.Root>
                        ))}
                      </Flex>
                    </Alert.Description>
                  </VStack>
                </Alert.Root>
              )}

              <VStack align={'stretch'} gap={6}>
                {variables.length > 0 && (
                  <Box>
                    <Heading borderBottomWidth={'1px'} size={'sm'} pb={2} mb={2}>
                      Variables
                    </Heading>
                    <Stack gap={2}>
                      {variables.map((variable, i) => (
                        <Flex
                          key={i}
                          justifyContent={'space-between'}
                          alignItems={'center'}
                          py={1}
                          px={2}
                          bg={'bg.muted'}
                          rounded={'sm'}
                          gap={4}
                        >
                          <Flex justifyContent={'space-between'} alignItems={'center'} gap={2} flex={1}>
                            <Badge variant={'subtle'} colorPalette={'teal'}>
                              {variable.name}
                            </Badge>
                            <Badge variant={'surface'} colorPalette={'gray'} fontFamily={'monospace'}>
                              {variable.value}
                            </Badge>
                          </Flex>
                          <IconButton variant={'ghost'} size={'xs'} onClick={() => openEditor('variable', variable)}>
                            <LuPencilLine />
                          </IconButton>
                        </Flex>
                      ))}
                    </Stack>
                  </Box>
                )}

                {selectedOptions.length > 0 && (
                  <Box>
                    <Heading borderBottomWidth={'1px'} size={'sm'} pb={2} mb={2}>
                      Selected Options
                    </Heading>
                    <Stack gap={2}>
                      {selectedOptions.map((option, i) => (
                        <Flex
                          key={i}
                          justifyContent={'space-between'}
                          alignItems={'center'}
                          py={1}
                          px={2}
                          bg={'bg.muted'}
                          rounded={'sm'}
                          gap={4}
                        >
                          <Flex justifyContent={'space-between'} alignItems={'center'} gap={2} flex={1}>
                            <Badge variant={'subtle'} colorPalette={'green'}>
                              {option.name}
                            </Badge>
                            <Badge variant={'surface'} colorPalette={'gray'} fontFamily={'monospace'}>
                              {option.value}
                            </Badge>
                          </Flex>
                          <IconButton variant={'ghost'} size={'xs'} onClick={() => openEditor('option', option)}>
                            <LuPencilLine />
                          </IconButton>
                        </Flex>
                      ))}
                    </Stack>
                  </Box>
                )}

                {constraints.length > 0 && (
                  <Box>
                    <Heading borderBottomWidth={'1px'} size={'sm'} pb={2} mb={2}>
                      Constraints
                    </Heading>
                    <Stack gap={2}>
                      {constraints.map((constraint, i) => (
                        <Flex
                          key={i}
                          justifyContent={'space-between'}
                          alignItems={'center'}
                          py={1}
                          px={2}
                          bg={'bg.muted'}
                          rounded={'sm'}
                          gap={4}
                        >
                          <Flex justifyContent={'space-between'} alignItems={'center'} gap={2} flex={1}>
                            <Badge variant={'subtle'} colorPalette={'red'}>
                              {constraint.variable}
                            </Badge>
                            <Badge variant={'surface'} colorPalette={'gray'} fontFamily={'monospace'}>
                              {constraint.condition}
                            </Badge>
                          </Flex>
                          <IconButton
                            variant={'ghost'}
                            size={'xs'}
                            onClick={() => openEditor('constraint', constraint)}
                          >
                            <LuPencilLine />
                          </IconButton>
                        </Flex>
                      ))}
                    </Stack>
                  </Box>
                )}

                {adaptedFrames.length > 0 && (
                  <Box>
                    <Heading borderBottomWidth={'1px'} size={'sm'} pb={2} mb={2}>
                      Adapted Frames
                    </Heading>
                    <Stack gap={2}>
                      {adaptedFrames.map((adapt, i) => (
                        <Flex
                          key={i}
                          justifyContent={'space-between'}
                          alignItems={'center'}
                          py={1}
                          px={2}
                          bg={'bg.muted'}
                          rounded={'sm'}
                          gap={4}
                        >
                          <Badge variant={'subtle'} colorPalette={'yellow'}>
                            {adapt.frame}
                          </Badge>
                          <IconButton variant={'ghost'} size={'xs'} disabled>
                            <LuCheck />
                          </IconButton>
                        </Flex>
                      ))}
                    </Stack>
                  </Box>
                )}
              </VStack>
            </Drawer.Body>
            <ConfigurationEditor
              isOpen={isEditorOpen}
              onClose={() => closeEditor()}
              itemType={editorItemType}
              itemData={editorItemData}
            />
            <AddConfigurationDialog
              isOpen={isAddDialogOpen}
              onClose={() => closeAddDialog()}
              itemType={addItemType}
              itemName={addItemName}
            />
            <LoadPresetDialog isOpen={isPresetDialogOpen} onClose={() => setIsPresetDialogOpen(false)} />
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  )
}
