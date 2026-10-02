import { BlockRenderer } from '@/components/BlockRenderer'
import { RawCodeDialog } from '@/components/RawCodeDialog'
import { useConfiguration } from '@/context/ConfigurationContext'
import { useProject } from '@/context/ProjectContext'
import { BlockOperations } from '@/misc/BlockOperations'
import type { CodeBlock, InsertBlockData } from '@/models/CodeBlock'
import type { FileNode } from '@/models/DirectoryTree'
import { Alert, Badge, Box, Breadcrumb, Button, Flex, Span, VStack } from '@chakra-ui/react'
import { Fragment, useEffect, useRef, useState } from 'react'
import { LuCodeXml, LuUndoDot } from 'react-icons/lu'
import { useLocation, useNavigate, useParams } from 'react-router'

export default function EditorPage() {
  const [file, setFile] = useState<FileNode>()
  const [showRawCodeDialog, setShowRawCodeDialog] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [pendingScrollBlockId, setPendingScrollBlockId] = useState<string | null>(null)
  const [glowBlockId, setGlowBlockId] = useState<string | null>(null)

  const handledTargetBlockId = useRef<string | null>(null)

  const { loader, isPending, setChangedFilesCount, setIsPending } = useProject()
  const { specificationFrame, compositionFrames } = useConfiguration()

  const params = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (loader && params.id) {
      const path = decodeURIComponent(params.id)
      const loadedFile = loader.loadFileFromTree(path)
      if (!loadedFile) {
        navigate('/workspace')
      } else {
        setFile(loadedFile)
      }
    }
  }, [loader, params, navigate])

  useEffect(() => {
    if (loader && file) {
      setHasChanges(loader.changedFiles.has(file.id))
    }
  }, [loader, file])

  useEffect(() => {
    const state = location.state as { targetBlockId?: string } | null

    if (!state?.targetBlockId || handledTargetBlockId.current === state.targetBlockId) {
      return
    }

    handledTargetBlockId.current = state.targetBlockId

    setPendingScrollBlockId(state.targetBlockId)
    setIsPending(false)
  }, [location.state])

  useEffect(() => {
    if (isPending || !pendingScrollBlockId) {
      return
    }

    const targetElement = document.getElementById(`b:${pendingScrollBlockId}`)

    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setGlowBlockId(pendingScrollBlockId)

      const glowTimeout = setTimeout(() => {
        setGlowBlockId(prev => (prev === pendingScrollBlockId ? null : prev))
      }, 2500)

      setPendingScrollBlockId(null)

      return () => clearTimeout(glowTimeout)
    }
  }, [isPending, pendingScrollBlockId])

  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const onContentChange = (blockId: string, newContent: string) => {
    if (!file || !loader) return

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    debounceTimeout.current = setTimeout(() => {
      loader.markFileAsChanged(file.id)
      setChangedFilesCount(loader.changedFiles.size)

      const originalBlock = BlockOperations.findBlockById(file.parsed, blockId)

      const updateBlockContent = (blocks: CodeBlock[], id: string, newContent: string): boolean => {
        for (const block of blocks) {
          if (block.id === id) {
            block.content = newContent
            return true
          }
          if (block.children.length > 0 && updateBlockContent(block.children, id, newContent)) {
            return true
          }
        }
        return false
      }

      updateBlockContent(file.parsed, blockId, newContent)
      updateFileInSource(BlockOperations.recalculateOffsets(file.parsed))

      if (originalBlock && originalBlock.kind === 'plain') {
        loader.removeBlockFromReferenceIndex(originalBlock)
        loader.addBlockToReferenceIndex(file.id, { ...originalBlock, content: newContent })
      }
    }, 300)
  }

  const updateFileInSource = (updatedBlocks: CodeBlock[]) => {
    if (!file || !loader) return

    const updatedFile = { ...file, parsed: updatedBlocks }
    setFile(updatedFile)

    loader.updateFileInPlace(updatedFile)
  }

  const onInsertBlock = (blockId: string, insertOption: string, data: InsertBlockData) => {
    if (!file || !loader) return

    loader.markFileAsChanged(file.id)
    setChangedFilesCount(loader.changedFiles.size)

    const newBlock = BlockOperations.createFromInsertData(data)
    let updatedBlocks = [...file.parsed]

    if (insertOption === 'insert_above_text' || insertOption === 'insert_above_option') {
      updatedBlocks = BlockOperations.insertBlockAsSibling(updatedBlocks, blockId, newBlock, 'above')
    } else if (insertOption === 'insert_below_text' || insertOption === 'insert_below_option') {
      updatedBlocks = BlockOperations.insertBlockAsSibling(updatedBlocks, blockId, newBlock, 'below')
    } else if (insertOption === 'insert_child_text' || insertOption === 'insert_child_option') {
      updatedBlocks = BlockOperations.insertBlockAsChild(updatedBlocks, blockId, newBlock)
    }

    updatedBlocks = BlockOperations.recalculateOffsets(updatedBlocks)

    updateFileInSource(updatedBlocks)
    loader.addBlockToReferenceIndex(file.id, newBlock)
  }

  const onRemoveBlock = (blockId: string) => {
    if (!file || !loader) return

    loader.markFileAsChanged(file.id)
    setChangedFilesCount(loader.changedFiles.size)

    const blockToRemove = BlockOperations.findBlockById(file.parsed, blockId)
    let updatedBlocks = BlockOperations.removeBlock(file.parsed, blockId)

    updatedBlocks = BlockOperations.recalculateOffsets(updatedBlocks)

    updateFileInSource(updatedBlocks)

    if (blockToRemove) {
      loader.removeBlockFromReferenceIndex(blockToRemove)
    }
  }

  if (!file) {
    return null
  }

  const handleRevertChanges = () => {
    if (!file || !loader) return

    const reverted = loader.revertFile(file.id)

    if (reverted) {
      setChangedFilesCount(loader.changedFiles.size)
      updateFileInSource(reverted.parsed)
    }
  }

  const isSpecFrame = specificationFrame?.id === file.id
  const isCompFrame = compositionFrames.some(f => f.id === file.id)

  return (
    <Box>
      <Flex
        justifyContent={'space-between'}
        alignItems={'center'}
        mb={4}
        borderBottomWidth={1}
        borderBottomColor={'fg.subtle'}
      >
        <Flex gap={2} alignItems={'center'}>
          <Breadcrumb.Root>
            <Breadcrumb.List>
              {file.fullPath.split('/').map((part, idx, arr) => {
                const isLast = idx === arr.length - 1
                if (idx === 0) {
                  return null
                }
                return (
                  <Fragment key={idx}>
                    <Breadcrumb.Item>
                      {isLast ? (
                        <Breadcrumb.CurrentLink fontSize={'sm'}>
                          <Span me={2}>
                            <i className={loader?.iconClass}></i>
                          </Span>
                          {part}
                        </Breadcrumb.CurrentLink>
                      ) : (
                        <Breadcrumb.Link outline={'none'} fontSize={'sm'}>
                          {part}
                        </Breadcrumb.Link>
                      )}
                    </Breadcrumb.Item>
                    {!isLast && <Breadcrumb.Separator />}
                  </Fragment>
                )
              })}
            </Breadcrumb.List>
          </Breadcrumb.Root>
          {isSpecFrame && <Badge colorPalette={'green'}>Specification Frame</Badge>}
          {isCompFrame && <Badge colorPalette={'blue'}>Composition Frame</Badge>}
        </Flex>

        <Box>
          <Button
            size="xs"
            variant="plain"
            colorPalette={'gray'}
            disabled={isSpecFrame || isCompFrame}
            onClick={() => setShowRawCodeDialog(true)}
          >
            <LuCodeXml />
            Show Raw Code
          </Button>
          <Button size="xs" variant="plain" colorPalette={'gray'} disabled={!hasChanges} onClick={handleRevertChanges}>
            <LuUndoDot />
            Revert Changes
          </Button>
        </Box>
      </Flex>

      {file && (
        <RawCodeDialog
          open={showRawCodeDialog}
          onClose={() => setShowRawCodeDialog(false)}
          parsed={file.parsed}
          syntaxLanguage={loader!.syntaxLanguage}
        />
      )}

      {isSpecFrame && (
        <Alert.Root status="info" colorPalette={'green'} alignItems={'center'}>
          <Alert.Indicator />
          <Box>
            <Alert.Title>Specification Frame</Alert.Title>
            <Alert.Description>
              Configure variables and options from the <b>configuration panel</b>.
            </Alert.Description>
          </Box>
        </Alert.Root>
      )}

      {isCompFrame && (
        <Alert.Root status="info" colorPalette={'blue'} alignItems={'center'}>
          <Alert.Indicator />
          <Box>
            <Alert.Title>Composition Frame</Alert.Title>
            <Alert.Description>
              Configure constraints and frames from the <b>configuration panel</b>.
            </Alert.Description>
          </Box>
        </Alert.Root>
      )}

      {!isSpecFrame && !isCompFrame && (
        <VStack align={'stretch'} gap={3}>
          {file.parsed.map(block => (
            <BlockRenderer
              key={block.id}
              block={block}
              fileId={file.id}
              onContentChange={onContentChange}
              onInsertBlock={onInsertBlock}
              onRemoveBlock={onRemoveBlock}
              language={loader!.syntaxLanguage}
              glowBlockId={glowBlockId}
            />
          ))}
        </VStack>
      )}
    </Box>
  )
}
