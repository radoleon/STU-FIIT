import { useConfiguration } from '@/context/ConfigurationContext'
import { useProject } from '@/context/ProjectContext'
import { BlockOperations } from '@/misc/BlockOperations'
import { Badge, Box, Button, Dialog, Field, Flex, Heading, Input, Portal, Text, VStack } from '@chakra-ui/react'
import { useEffect, useState } from 'react'

interface AddConfigurationDialogProps {
  isOpen: boolean
  onClose: () => void
  itemType: 'variable' | 'option' | null
  itemName: string | null
}

export function AddConfigurationDialog({ isOpen, onClose, itemType, itemName }: AddConfigurationDialogProps) {
  const { loader } = useProject()
  const { specificationFrame, setSpecificationFrame, variables, setVariables, selectedOptions, setSelectedOptions } =
    useConfiguration()

  const [value, setValue] = useState('')
  const [isInvalid, setIsInvalid] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setValue('')
      setIsInvalid(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (!value?.trim()) {
      setIsInvalid(true)
      return
    }
    setIsInvalid(false)
  }, [value])

  const handleSave = () => {
    if (!loader || !specificationFrame || !itemType || !itemName) return

    const frameBlock = specificationFrame.parsed.find(block => block.kind === 'frame')
    if (!frameBlock) return

    const newBlock = BlockOperations.createConfigurationBlock(
      itemType === 'variable' ? 'set' : 'select',
      itemName,
      value
    )

    const updatedBlocks = BlockOperations.insertBlockAsChild(specificationFrame.parsed, frameBlock.id, newBlock)
    specificationFrame.parsed = updatedBlocks
    loader.updateFileInPlace(specificationFrame)
    setSpecificationFrame({ ...specificationFrame })

    if (itemType === 'variable') {
      setVariables([...variables, { name: itemName, value: value }])
    } else {
      setSelectedOptions([...selectedOptions, { name: itemName, value: value }])
    }

    onClose()
  }

  if (!itemType || !itemName) {
    return null
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={() => onClose()} placement={'center'} size={'md'}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Heading size={'md'}>Add {itemType[0].toUpperCase() + itemType.slice(1)}</Heading>
            </Dialog.Header>
            <Dialog.Body>
              <VStack align={'stretch'} gap={4}>
                <Box p={2} bg={'bg.muted'} rounded={'sm'}>
                  <Text fontSize={'sm'} color={'fg.muted'} mb={2}>
                    {itemType[0].toUpperCase() + itemType.slice(1)} Name
                  </Text>
                  <Badge colorPalette={itemType === 'variable' ? 'teal' : 'green'}>{itemName}</Badge>
                </Box>
                <Box>
                  <Field.Root invalid={isInvalid}>
                    <Input
                      size={'xs'}
                      value={value}
                      onChange={e => setValue(e.target.value)}
                      placeholder="Enter Value"
                    />
                  </Field.Root>
                </Box>
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
