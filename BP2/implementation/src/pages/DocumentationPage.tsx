import DocumentationItem from '@/components/DocumentationItem'
import { useConfiguration } from '@/context/ConfigurationContext'
import { useProject } from '@/context/ProjectContext'
import { toaster } from '@/generated/toaster'
import { Derivation } from '@/misc/Derivation'
import { Box, Button, Flex, Heading, Input, Separator, Stack, Text, Textarea, VStack } from '@chakra-ui/react'
import { useRef, useState } from 'react'
import { LuDownload } from 'react-icons/lu'
import { useNavigate } from 'react-router'

export default function DocumentationPage() {
  const { loader } = useProject()
  const { variables, selectedOptions, constraints, adaptedFrames } = useConfiguration()

  const navigate = useNavigate()

  const titleRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({})

  const [hasTitle, setHasTitle] = useState(false)

  const [showValues, setShowValues] = useState<Record<string, boolean>>({})
  const [showFiles, setShowFiles] = useState<Record<string, boolean>>({})

  const toggleValue = (key: string) => {
    setShowValues(prev => ({ ...prev, [key]: !(prev[key] ?? true) }))
  }

  const toggleFiles = (key: string) => {
    setShowFiles(prev => ({ ...prev, [key]: !(prev[key] ?? true) }))
  }

  const generatedAt = new Date().toUTCString()
  const refIndex = loader?.referenceIndex

  const handleExport = () => {
    if (!titleRef.current) {
      return
    }

    const title = titleRef.current.value.trim()
    const description = descriptionRef.current?.value?.trim()

    Derivation.exportDocumentation(
      loader?.directoryTree?.name,
      title,
      description ?? '',
      generatedAt,
      variables,
      selectedOptions,
      constraints,
      adaptedFrames,
      refIndex,
      showValues,
      showFiles,
      textareaRefs.current
    )

    toaster.create({
      title: 'Success',
      description: 'The documentation file has been generated.',
      type: 'success'
    })

    navigate('/workspace')
  }

  return (
    <Box maxW={'3xl'} mx={'auto'} pt={8}>
      <Box>
        <Flex justifyContent={'space-between'}>
          <Text fontSize={'xs'} color={'fg.subtle'}>
            Generated: {generatedAt}
          </Text>
          <Button size="xs" colorPalette={'gray'} onClick={handleExport} disabled={!hasTitle}>
            <LuDownload />
            Export
          </Button>
        </Flex>
        <Heading size={'2xl'} color={'green.fg'} mb={2}>
          Documentation
        </Heading>
        <Text fontSize={'sm'} color={'fg.muted'}>
          {loader?.directoryTree?.name}
        </Text>
        <VStack align={'stretch'} gap={4} mt={6}>
          <Box>
            <Text fontWeight={'semibold'} fontSize={'sm'} mb={1}>
              Sowftware Product Line Title
            </Text>
            <Input
              size={'xs'}
              ref={titleRef}
              onChange={e => setHasTitle(e.target.value.trim().length > 0)}
              placeholder="Enter Title"
            />
          </Box>
          <Box>
            <Text fontWeight={'semibold'} fontSize={'sm'} mb={1}>
              Description
            </Text>
            <Textarea size={'xs'} ref={descriptionRef} placeholder="Enter Value" rows={5} autoresize />
          </Box>
        </VStack>
      </Box>

      <Separator my={10} />

      {variables.length > 0 && (
        <Box mb={10}>
          <Heading size={'md'} mb={4} color={'green.fg'}>
            Variables
          </Heading>
          <Stack gap={4}>
            {variables.map(v => {
              const key = `v:${v.name}`
              return (
                <DocumentationItem
                  key={key}
                  name={v.name}
                  value={v.value}
                  badge={'variable'}
                  badgeColor={'teal'}
                  referencedFiles={[...new Set((refIndex?.variable[v.name] ?? []).map(r => r.fileId))]}
                  itemKey={key}
                  showValue={showValues[key] ?? true}
                  showFiles={showFiles[key] ?? true}
                  onToggleValue={() => toggleValue(key)}
                  onToggleFiles={() => toggleFiles(key)}
                  refsMap={textareaRefs.current}
                />
              )
            })}
          </Stack>
        </Box>
      )}

      {selectedOptions.length > 0 && (
        <Box mb={10}>
          <Heading size={'md'} mb={4} color={'green.fg'}>
            Selected Options
          </Heading>
          <Stack gap={4}>
            {selectedOptions.map(o => {
              const key = `o:${o.name}`
              return (
                <DocumentationItem
                  key={key}
                  name={o.name}
                  value={o.value}
                  badge={'option'}
                  badgeColor={'green'}
                  referencedFiles={[...new Set((refIndex?.option[o.name] ?? []).map(r => r.fileId))]}
                  itemKey={key}
                  showValue={showValues[key] ?? true}
                  showFiles={showFiles[key] ?? true}
                  onToggleValue={() => toggleValue(key)}
                  onToggleFiles={() => toggleFiles(key)}
                  refsMap={textareaRefs.current}
                />
              )
            })}
          </Stack>
        </Box>
      )}

      {constraints.length > 0 && (
        <Box mb={10}>
          <Heading size={'md'} mb={4} color={'green.fg'}>
            Constraints
          </Heading>
          <Stack gap={4}>
            {constraints.map(c => {
              const key = `c:${c.variable}`
              return (
                <DocumentationItem
                  key={key}
                  name={c.variable}
                  value={c.condition}
                  badge={'constraint'}
                  badgeColor={'red'}
                  referencedFiles={[]}
                  itemKey={key}
                  showValue={showValues[key] ?? true}
                  showFiles={showFiles[key] ?? true}
                  onToggleValue={() => toggleValue(key)}
                  onToggleFiles={() => toggleFiles(key)}
                  refsMap={textareaRefs.current}
                />
              )
            })}
          </Stack>
        </Box>
      )}

      {adaptedFrames.length > 0 && (
        <Box>
          <Heading size={'md'} mb={4} color={'green.fg'}>
            Adapted Frames
          </Heading>
          <Stack gap={4}>
            {adaptedFrames.map(f => {
              const key = `f:${f.frame}`
              return (
                <DocumentationItem
                  key={key}
                  name={f.frame}
                  badge={'frame'}
                  badgeColor={'yellow'}
                  referencedFiles={[...new Set((refIndex?.frame[f.frame] ?? []).map(r => r.fileId))]}
                  itemKey={key}
                  showValue={showValues[key] ?? true}
                  showFiles={showFiles[key] ?? true}
                  onToggleValue={() => toggleValue(key)}
                  onToggleFiles={() => toggleFiles(key)}
                  refsMap={textareaRefs.current}
                />
              )
            })}
          </Stack>
        </Box>
      )}
    </Box>
  )
}
