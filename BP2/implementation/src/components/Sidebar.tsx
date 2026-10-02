import { NAVBAR_HEIGHT_PX } from '@/constants'
import { useConfiguration } from '@/context/ConfigurationContext'
import { useProject } from '@/context/ProjectContext'
import {
  Alert,
  Box,
  createTreeCollection,
  Flex,
  IconButton,
  Text,
  TreeView,
  type TreeCollection
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { LuArrowLeftFromLine, LuArrowRightToLine, LuChevronRight, LuFile, LuFolder } from 'react-icons/lu'
import { useNavigate } from 'react-router'

export default function Sidebar() {
  const [collection, setCollection] = useState<TreeCollection | null>(null)
  const [isExpanded, setIsExpanded] = useState<boolean>(true)
  const [isTreeEmpty, setIsTreeEmpty] = useState<boolean>(false)

  const { loader, setIsPending } = useProject()
  const { specificationFrame, compositionFrames } = useConfiguration()

  const navigate = useNavigate()

  useEffect(() => {
    if (loader && loader.directoryTree) {
      const { id, name, children } = loader.directoryTree

      setIsTreeEmpty(loader.isTreeEmpty)

      const collection = createTreeCollection({
        nodeToValue: node => node.id,
        nodeToString: node => node.name,
        rootNode: { id, name, children }
      })

      setCollection(collection)
      setIsPending(false)
    }
  }, [loader])

  const navigateToFile = (id?: string) => {
    if (id) {
      navigate('/workspace/' + id)
    } else {
      navigate('/workspace')
    }
  }

  const sidebarHeightCalculation = `calc(100vh - ${NAVBAR_HEIGHT_PX}px - 16px)`
  const hasNoErrors: boolean = !isTreeEmpty && !!specificationFrame && compositionFrames.length > 0

  return (
    <Box
      position={'sticky'}
      top={NAVBAR_HEIGHT_PX + 'px'}
      w={isExpanded ? '250px' : '66px'}
      minW={isExpanded ? '250px' : '66px'}
      h={sidebarHeightCalculation}
      maxH={sidebarHeightCalculation}
      bg={'bg.subtle'}
      overflow={isExpanded ? 'scroll' : 'none'}
      scrollbarWidth={'none'}
      rounded={'md'}
      transition="all 200ms ease"
      borderWidth={'1px'}
    >
      <Flex
        position={'sticky'}
        top={0}
        alignItems={'center'}
        justifyContent={'space-between'}
        p={4}
        borderBottomWidth={'1px'}
        bg={'bg.subtle'}
        zIndex={10}
        roundedTop={'md'}
      >
        {isExpanded && (
          <Text fontWeight={'medium'} color={'fg.muted'} cursor={'pointer'} onClick={() => navigateToFile()}>
            Workspace
          </Text>
        )}
        <IconButton onClick={() => setIsExpanded(prev => !prev)} size={'xs'} variant={'subtle'}>
          {isExpanded ? <LuArrowLeftFromLine /> : <LuArrowRightToLine />}
        </IconButton>
      </Flex>
      <Box p={4}>
        {collection && (
          <TreeView.Root
            collection={collection}
            display={isExpanded && hasNoErrors ? 'block' : 'none'}
            maxW={'250px'}
            animateContent
          >
            <TreeView.Tree>
              <TreeView.Node
                indentGuide={<TreeView.BranchIndentGuide />}
                render={({ node, nodeState }) =>
                  nodeState.isBranch ? (
                    <TreeView.BranchControl>
                      <TreeView.BranchTrigger>
                        <TreeView.BranchIndicator asChild>
                          <LuChevronRight />
                        </TreeView.BranchIndicator>
                      </TreeView.BranchTrigger>
                      <LuFolder />
                      <TreeView.BranchText truncate>{node.name}</TreeView.BranchText>
                    </TreeView.BranchControl>
                  ) : (
                    <TreeView.Item onClick={() => navigateToFile(node.id)}>
                      <LuFile />
                      <TreeView.ItemText truncate>{node.name}</TreeView.ItemText>
                    </TreeView.Item>
                  )
                }
              />
            </TreeView.Tree>
          </TreeView.Root>
        )}

        {!hasNoErrors && isExpanded && (
          <Alert.Root status="error" mb={4} alignItems={'center'}>
            <Alert.Indicator />
            {isExpanded && <Alert.Title truncate>Invalid project loaded</Alert.Title>}
          </Alert.Root>
        )}
      </Box>
    </Box>
  )
}
