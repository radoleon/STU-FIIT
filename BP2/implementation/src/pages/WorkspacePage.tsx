import { Box, Circle, Flex, Heading, HStack, Icon, List, Text } from '@chakra-ui/react'
import { LuFolderOpen, LuFile, LuCircleX, LuStar } from 'react-icons/lu'

export default function WorkspacePage() {
  return (
    <Flex align="center" justify="center" mt={6}>
      <Flex direction="column" align="center" textAlign="center" gap={6}>
        <Circle size={20} bg={'green'} color="white">
          <Icon size={'2xl'}>
            <LuFolderOpen />
          </Icon>
        </Circle>
        <Box>
          <Heading size={'2xl'}>You’re in the workspace</Heading>
          <Text mt={4} color={'fg.muted'}>
            To start working, open a file from the left sidebar, or use the navbar for extra features.
          </Text>
        </Box>

        <List.Root gap={4} w={'1/2'} color={'green'} variant={'plain'} textAlign={'left'}>
          <List.Item>
            <HStack gap={4} align={'start'}>
              <Icon size={'md'} mt={2}>
                <LuFile />
              </Icon>
              <Box>
                <Text fontWeight={'medium'} color={'fg'}>
                  Open a file from the left sidebar
                </Text>
                <Text fontSize={'sm'} color={'fg.muted'}>
                  Expand folders and click a file to start editing.
                </Text>
              </Box>
            </HStack>
          </List.Item>

          <List.Item>
            <HStack gap={4} align={'start'}>
              <Icon size={'md'} mt={2}>
                <LuCircleX />
              </Icon>
              <Box>
                <Text fontWeight={'medium'} color={'fg'}>
                  Close the project to select another
                </Text>
                <Text fontSize={'sm'} color={'fg.muted'}>
                  Return to the project loader and pick a different folder.
                </Text>
              </Box>
            </HStack>
          </List.Item>

          <List.Item>
            <HStack gap={4} align={'start'}>
              <Icon size={'md'} mt={2}>
                <LuStar />
              </Icon>
              <Box>
                <Text fontWeight={'medium'} color={'fg'}>
                  Explore options in the navbar
                </Text>
                <Text fontSize={'sm'} color={'fg.muted'}>
                  Use the top bar to access available tools and actions.
                </Text>
              </Box>
            </HStack>
          </List.Item>
        </List.Root>
      </Flex>
    </Flex>
  )
}
