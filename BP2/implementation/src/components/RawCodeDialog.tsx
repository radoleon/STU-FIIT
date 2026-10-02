import { useConfiguration } from '@/context/ConfigurationContext'
import { useColorModeValue } from '@/generated/color-mode'
import { Derivation } from '@/misc/Derivation'
import type { CodeBlock } from '@/models/CodeBlock'
import { CloseButton, Dialog, VStack } from '@chakra-ui/react'
import { Editor } from '@monaco-editor/react'
import { useEffect, useState } from 'react'

interface RawCodeDialogProps {
  open: boolean
  onClose: () => void
  parsed: CodeBlock[]
  syntaxLanguage: string
}

export function RawCodeDialog({ open, onClose, parsed, syntaxLanguage }: RawCodeDialogProps) {
  const editorTheme = useColorModeValue('vs', 'vs-dark')
  const { selectedOptions, adaptedFrames, variables } = useConfiguration()

  const [content, setContent] = useState('')

  useEffect(() => {
    setContent(Derivation.buildFileContent(parsed, variables, selectedOptions, adaptedFrames))
  }, [parsed, selectedOptions, adaptedFrames, variables])

  return (
    <Dialog.Root open={open} size={'cover'} placement={'center'} onOpenChange={() => onClose()}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content overflow={'hidden'}>
          <Dialog.Header py={6}>
            <Dialog.CloseTrigger asChild>
              <CloseButton colorPalette={'gray'} size="xs" />
            </Dialog.CloseTrigger>
          </Dialog.Header>
          <VStack flex={1} w="full">
            <Editor
              value={content}
              language={syntaxLanguage}
              height="100%"
              theme={editorTheme}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                renderValidationDecorations: 'off',
                contextmenu: false,
                wordWrap: 'on',
                readOnly: true,
                lineNumbers: 'on'
              }}
            />
          </VStack>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}
