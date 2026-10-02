import { useConfiguration } from '@/context/ConfigurationContext'
import { useProject } from '@/context/ProjectContext'
import { Badge, Box, Flex, HoverCard, Portal, Span, Text, VStack } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { LuCheck } from 'react-icons/lu'
import { useNavigate } from 'react-router'

interface ReferenceHoverCardProps {
  children: ReactNode
  referenceType: 'frame' | 'option' | 'variable'
  referenceName: string
  currentBlockId: string
}

export function ReferenceHoverCard({
  children,
  referenceType,
  referenceName,
  currentBlockId
}: ReferenceHoverCardProps) {
  const [open, setOpen] = useState(false)

  const { loader, setIsPending } = useProject()
  const { visitedBlocks, setVisitedBlocks, compositionFrames } = useConfiguration()

  const navigate = useNavigate()

  const references = (loader?.referenceIndex[referenceType][referenceName] || []).filter(
    x => x.blockId !== currentBlockId && !compositionFrames.map(x => x.id).includes(x.fileId)
  )

  const isVisited = (blockId: string): boolean => !!visitedBlocks[blockId]
  const formatVisitedAt = (ts: number): string => new Date(ts).toLocaleTimeString()

  const handleNavigateToBlock = async (fileId: string, blockId: string) => {
    const ts = Date.now()
    const nextVisitedBlocks: Record<string, number> = { ...visitedBlocks }
    const relevantBlocks = [currentBlockId, ...references.map(x => x.blockId)]

    const isFirstNavigation = relevantBlocks.every(x => !visitedBlocks[x])

    if (isFirstNavigation) {
      nextVisitedBlocks[currentBlockId] = ts
    }

    nextVisitedBlocks[blockId] = ts

    const allVisited = relevantBlocks.every(x => !!nextVisitedBlocks[x])

    if (allVisited) {
      for (const blockId of relevantBlocks) {
        delete nextVisitedBlocks[blockId]
      }
    }

    setVisitedBlocks(nextVisitedBlocks)

    setIsPending(true)
    await navigate(`/workspace/${fileId}`, { state: { targetBlockId: blockId } })
  }

  return (
    <HoverCard.Root size="lg" open={open} onOpenChange={e => setOpen(e.open)}>
      <HoverCard.Trigger asChild>{children}</HoverCard.Trigger>
      <Portal>
        <HoverCard.Positioner>
          <HoverCard.Content maxWidth={'1000px'} pointerEvents={'auto'}>
            <HoverCard.Arrow />
            <VStack align={'start'} gap={4} minW={'450px'}>
              <Box>
                <Text fontSize={'sm'} fontWeight={700} color="fg">
                  {referenceType.charAt(0).toUpperCase() + referenceType.slice(1)} References
                </Text>
                <Text fontSize={'xs'} color={'fg.muted'}>
                  {references.length} {references.length === 1 ? 'reference' : 'references'}
                </Text>
              </Box>
              {references.length > 0 ? (
                <VStack
                  align={'stretch'}
                  gap={2}
                  w={'full'}
                  maxH={'300px'}
                  overflowY={'auto'}
                  scrollbarWidth={'thin'}
                  pe={1}
                >
                  {references.map((ref, idx) => (
                    <Box
                      key={idx}
                      p={2}
                      bg={isVisited(ref.blockId) ? 'bg.emphasized' : 'bg.subtle'}
                      rounded={'sm'}
                      borderWidth={'1px'}
                      borderColor={isVisited(ref.blockId) ? 'blue.muted' : 'border'}
                      cursor={'pointer'}
                      _hover={{ bg: 'bg.muted', borderColor: 'blue.muted' }}
                      transition={'all 0.2s'}
                      onClick={() => handleNavigateToBlock(ref.fileId, ref.blockId)}
                    >
                      <Flex justify={'space-between'} align={'start'} gap={4} mb={1}>
                        <Text fontSize={'sm'} fontWeight={600} color={'blue.500'}>
                          {decodeURIComponent(ref.fileId)}
                        </Text>
                        {isVisited(ref.blockId) && (
                          <Badge size={'sm'} variant={'solid'} colorPalette={'gray'}>
                            <LuCheck /> Visited
                          </Badge>
                        )}
                      </Flex>
                      <Flex justify={'space-between'} align={'start'}>
                        <Text fontSize={'xs'} color={'fg.muted'}>
                          Block ID: <Span fontFamily={'mono'}>{ref.blockId}</Span>
                        </Text>
                        {isVisited(ref.blockId) && (
                          <Text fontSize={'2xs'} color={'fg.muted'}>
                            Visited at: {formatVisitedAt(visitedBlocks[ref.blockId])}
                          </Text>
                        )}
                      </Flex>
                    </Box>
                  ))}
                </VStack>
              ) : (
                <Text fontSize={'sm'} color={'fg.muted'}>
                  No references found.
                </Text>
              )}
            </VStack>
          </HoverCard.Content>
        </HoverCard.Positioner>
      </Portal>
    </HoverCard.Root>
  )
}
