import type { InsertBlockData } from '@/models/CodeBlock'
import { Menu, Portal } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import {
  LuBookDown,
  LuBookPlus,
  LuBookUp,
  LuCircleArrowDown,
  LuCircleArrowUp,
  LuCirclePlus,
  LuTrash
} from 'react-icons/lu'
import { InsertBlockDialog } from './InsertBlockDialog'

interface BlockContextMenuProps {
  children: ReactNode
  blockId: string
  onInsertBlock: (blockId: string, insertOption: string, data: InsertBlockData) => void
  onRemoveBlock: (blockId: string) => void
  isOption?: boolean
}

export function BlockContextMenu({
  children,
  blockId,
  isOption = false,
  onInsertBlock,
  onRemoveBlock
}: BlockContextMenuProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [insertOption, setInsertOption] = useState<string | null>(null)

  const handleMenuSelect = (value: string) => {
    if (value === 'remove') {
      onRemoveBlock(blockId)

      setInsertOption(null)
      setIsDialogOpen(false)
    } else {
      setInsertOption(value)
      setIsDialogOpen(true)
    }
  }

  const handleInsert = (data: InsertBlockData) => {
    if (insertOption) {
      onInsertBlock(blockId, insertOption, data)
    }

    setInsertOption(null)
    setIsDialogOpen(false)
  }

  return (
    <>
      <Menu.Root>
        <Menu.ContextTrigger asChild>{children}</Menu.ContextTrigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content>
              {isOption && (
                <>
                  <Menu.Item
                    value="insert_child_text"
                    color={'blue.fg'}
                    onClick={() => handleMenuSelect('insert_child_text')}
                  >
                    <LuBookPlus />
                    Insert Text as Child
                  </Menu.Item>
                  <Menu.Item
                    value="insert_child_option"
                    color={'blue.fg'}
                    onClick={() => handleMenuSelect('insert_child_option')}
                  >
                    <LuCirclePlus />
                    Insert Option as Child
                  </Menu.Item>
                  <Menu.Separator />
                </>
              )}
              <Menu.Item value="insert_above_text" onClick={() => handleMenuSelect('insert_above_text')}>
                <LuBookUp />
                Insert Text Above
              </Menu.Item>
              <Menu.Item value="insert_below_text" onClick={() => handleMenuSelect('insert_below_text')}>
                <LuBookDown />
                Insert Text Below
              </Menu.Item>
              <Menu.Separator />
              <Menu.Item value="insert_above_option" onClick={() => handleMenuSelect('insert_above_option')}>
                <LuCircleArrowUp />
                Insert Option Above
              </Menu.Item>
              <Menu.Item value="insert_below_option" onClick={() => handleMenuSelect('insert_below_option')}>
                <LuCircleArrowDown />
                Insert Option Below
              </Menu.Item>
              <Menu.Separator />
              <Menu.Item value="remove" color={'fg.error'} onClick={() => handleMenuSelect('remove')}>
                <LuTrash />
                Remove Code Block
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>

      {insertOption && (
        <InsertBlockDialog
          isOpen={isDialogOpen}
          isOptionInsert={insertOption.includes('option')}
          onClose={() => {
            setInsertOption(null)
            setIsDialogOpen(false)
          }}
          onConfirm={handleInsert}
        />
      )}
    </>
  )
}
