import { useConfiguration } from '@/context/ConfigurationContext'
import { useColorModeValue } from '@/generated/color-mode'
import type { CodeBlock, InsertBlockData } from '@/models/CodeBlock'
import { Accordion, Badge, Box, Flex, Span, Status, Tag, VStack } from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { Editor } from '@monaco-editor/react'
import { LuFrame, LuOption, LuTriangleAlert } from 'react-icons/lu'
import { BlockContextMenu } from './BlockContextMenu'
import { ReferenceHoverCard } from './ReferenceHoverCard'

const glowAnimation = keyframes(`
  0% {
    filter: drop-shadow(0 0 0 rgba(59, 130, 246, 0));
  }
  20% {
    filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.45))
    drop-shadow(0 0 10px rgba(59, 130, 246, 0.2));
  }
  100% {
    filter: drop-shadow(0 0 0 rgba(59, 130, 246, 0));
  }`)

interface BlockRendererProps {
  block: CodeBlock
  fileId: string
  onContentChange: (blockId: string, newContent: string) => void
  onInsertBlock: (blockId: string, insertOption: string, data: InsertBlockData) => void
  onRemoveBlock: (blockId: string) => void
  language: string
  glowBlockId?: string | null
  level?: number
  disabled?: boolean
}

export function BlockRenderer({
  block,
  fileId,
  onContentChange,
  onInsertBlock,
  onRemoveBlock,
  language,
  glowBlockId,
  level,
  disabled = false
}: BlockRendererProps) {
  const editorTheme = useColorModeValue('vs', 'vs-dark')
  const { selectedOptions, adaptedFrames, variables } = useConfiguration()

  function calculateEditorHeight(content: string | null): string {
    if (!content) return '19px'
    return `${(content.split('\n').length || 1) * 19}px`
  }

  function getVariablesWithValues(): { [key: string]: string | undefined } {
    if (block.kind !== 'plain' || !block.content) {
      return {}
    }

    const variableRefRegex = /<@([a-zA-Z_][a-zA-Z0-9_-]*)>/g
    const detected = new Set<string>()
    let match

    while ((match = variableRefRegex.exec(block.content)) !== null) {
      detected.add(match[1])
    }

    const result: { [key: string]: string | undefined } = {}
    for (const v of detected) {
      const config = variables.find(variable => variable.name === v)
      result[v] = config?.value
    }

    return result
  }

  let isDisabled = disabled || false

  if (block.kind === 'frame') {
    const adaptedFrame = adaptedFrames.find(f => f.frame === block.attributes.name)

    if (!adaptedFrame) {
      isDisabled = true
    }
  }

  if (block.kind === 'option') {
    const selectedOption = selectedOptions.find(opt => opt.name === block.attributes.name)

    if (!selectedOption) {
      isDisabled = true
    } else {
      if (!block.attributes.value && !(selectedOption.value === 'TRUE')) {
        isDisabled = true
      }

      if (block.attributes.value && selectedOption.value !== block.attributes.value) {
        isDisabled = true
      }
    }
  }

  if (block.kind === 'frame') {
    return (
      <VStack
        id={`b:${block.id}`}
        align={'stretch'}
        gap={3}
        animation={glowBlockId === block.id ? `${glowAnimation} 2.5s ease-out` : undefined}
      >
        <Badge
          colorPalette={'yellow'}
          size={'sm'}
          display={'flex'}
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <ReferenceHoverCard referenceType="frame" referenceName={block.attributes.name} currentBlockId={block.id}>
            <Flex alignItems={'center'} gap={2} cursor={'pointer'}>
              <Span fontWeight={700}>Frame</Span>
              <LuFrame />
              {block.attributes.name}
            </Flex>
          </ReferenceHoverCard>
          {isDisabled && (
            <Span color={'fg'}>
              <Status.Root color={'fg'} fontWeight={400} colorPalette="red" size={'sm'}>
                <Status.Indicator />
                Inactive
              </Status.Root>
            </Span>
          )}
        </Badge>
        <VStack align={'stretch'} gap={3}>
          {block.children.map(child => (
            <BlockRenderer
              key={child.id}
              block={child}
              fileId={fileId}
              onContentChange={onContentChange}
              onInsertBlock={onInsertBlock}
              onRemoveBlock={onRemoveBlock}
              language={language}
              glowBlockId={glowBlockId}
              disabled={isDisabled}
            />
          ))}
        </VStack>
      </VStack>
    )
  }

  if (block.kind === 'option') {
    return (
      <Box
        id={`b:${block.id}`}
        mx={!level ? 0 : 1}
        animation={glowBlockId === block.id ? `${glowAnimation} 2.5s ease-out` : undefined}
      >
        <Accordion.Root
          collapsible
          variant={'enclosed'}
          bg={'bg'}
          borderColor={(level || 0) % 2 === 0 ? 'green' : 'blue'}
          borderWidth={'2px'}
          disabled={isDisabled}
        >
          <Accordion.Item value={block.id}>
            <BlockContextMenu
              blockId={block.id}
              isOption={true}
              onInsertBlock={onInsertBlock}
              onRemoveBlock={onRemoveBlock}
            >
              <Accordion.ItemTrigger>
                <Badge
                  w={'full'}
                  colorPalette={(level || 0) % 2 === 0 ? 'green' : 'blue'}
                  size={'sm'}
                  display={'flex'}
                  justifyContent={'space-between'}
                  alignItems={'center'}
                >
                  <ReferenceHoverCard
                    referenceType="option"
                    referenceName={block.attributes.name}
                    currentBlockId={block.id}
                  >
                    <Flex alignItems={'center'} gap={2} cursor={'pointer'}>
                      <Span fontWeight={700}>Option</Span>
                      <LuOption />
                      {block.attributes.name}
                    </Flex>
                  </ReferenceHoverCard>
                  <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'} gap={2}>
                    {block.attributes.value && (
                      <Tag.Root size="sm" variant={'solid'} colorPalette={'gray'}>
                        <Tag.Label>{block.attributes.value}</Tag.Label>
                      </Tag.Root>
                    )}
                    {isDisabled && (
                      <Span color={'fg'}>
                        <Status.Root color={'fg'} fontWeight={400} colorPalette="red" size={'sm'}>
                          <Status.Indicator />
                          Inactive
                        </Status.Root>
                      </Span>
                    )}
                  </Box>
                </Badge>
                <Accordion.ItemIndicator />
              </Accordion.ItemTrigger>
            </BlockContextMenu>
            <Accordion.ItemContent px={0}>
              <Accordion.ItemBody p={0}>
                <VStack align={'stretch'} gap={3}>
                  {block.children.map(child => (
                    <BlockRenderer
                      key={child.id}
                      block={child}
                      fileId={fileId}
                      onContentChange={onContentChange}
                      onInsertBlock={onInsertBlock}
                      onRemoveBlock={onRemoveBlock}
                      language={language}
                      glowBlockId={glowBlockId}
                      level={(level || 0) + 1}
                      disabled={isDisabled}
                    />
                  ))}
                </VStack>
              </Accordion.ItemBody>
            </Accordion.ItemContent>
          </Accordion.Item>
        </Accordion.Root>
      </Box>
    )
  }

  if (block.kind === 'plain') {
    if (!block.content || !block.content.trim()) {
      return null
    }

    const detectedVariables = getVariablesWithValues()

    return (
      <Box
        id={`b:${block.id}`}
        bg={'bg.subtle'}
        rounded={'sm'}
        borderWidth={'1px'}
        overflow={'hidden'}
        opacity={isDisabled ? 0.5 : 1}
        animation={glowBlockId === block.id ? `${glowAnimation} 2.5s ease-out` : undefined}
      >
        <BlockContextMenu blockId={block.id} onInsertBlock={onInsertBlock} onRemoveBlock={onRemoveBlock}>
          <VStack align={'stretch'} gap={2}>
            {Object.keys(detectedVariables).length > 0 && (
              <Flex mt={2} mx={4} gap={2} flexWrap={'wrap'} alignItems={'center'}>
                {Object.entries(detectedVariables).map(([varName, value]) => (
                  <ReferenceHoverCard
                    key={varName}
                    referenceType="variable"
                    referenceName={varName}
                    currentBlockId={block.id}
                  >
                    <Tag.Root size="sm" colorPalette={value ? 'gray' : 'red'} variant={'surface'} cursor={'pointer'}>
                      {value ? (
                        <Tag.Label>
                          {varName}={value}
                        </Tag.Label>
                      ) : (
                        <>
                          <LuTriangleAlert />
                          <Tag.Label>{varName}</Tag.Label>
                        </>
                      )}
                    </Tag.Root>
                  </ReferenceHoverCard>
                ))}
              </Flex>
            )}
            <Box ms={(level || 1) * -1} pointerEvents={isDisabled ? 'none' : 'auto'}>
              <Editor
                defaultValue={block.content}
                defaultLanguage={language}
                height={calculateEditorHeight(block.content)}
                onChange={value => onContentChange(block.id, value || '')}
                theme={editorTheme}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  renderValidationDecorations: 'off',
                  lineNumbers: ln => (block.offset + ln).toString(),
                  contextmenu: false,
                  wordWrap: 'on',
                  readOnly: isDisabled
                }}
              />
            </Box>
          </VStack>
        </BlockContextMenu>
      </Box>
    )
  }

  return (
    <VStack
      id={`b:${block.id}`}
      align={'stretch'}
      gap={3}
      animation={glowBlockId === block.id ? `${glowAnimation} 2.5s ease-out` : undefined}
    >
      {block.children.map(child => (
        <BlockRenderer
          key={child.id}
          block={child}
          fileId={fileId}
          onContentChange={onContentChange}
          onInsertBlock={onInsertBlock}
          onRemoveBlock={onRemoveBlock}
          language={language}
          glowBlockId={glowBlockId}
          disabled={isDisabled}
        />
      ))}
    </VStack>
  )
}
