import { useProject } from '@/context/ProjectContext'
import { toaster } from '@/generated/toaster'
import { Derivation } from '@/misc/Derivation'
import { Badge, Box, Flex, IconButton, Stack, Text, Textarea } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { LuEye, LuEyeOff, LuFile, LuFileX, LuSave, LuUpload } from 'react-icons/lu'

interface DocumentationItemProps {
  name: string
  value?: string
  badge: string
  badgeColor: string
  referencedFiles: string[]
  itemKey: string
  showValue: boolean
  showFiles: boolean
  onToggleValue: () => void
  onToggleFiles: () => void
  refsMap: Record<string, HTMLTextAreaElement | null>
}

export default function DocumentationItem({
  name,
  value,
  badge,
  badgeColor,
  referencedFiles,
  itemKey,
  showValue,
  showFiles,
  onToggleValue,
  onToggleFiles,
  refsMap
}: DocumentationItemProps) {
  const { persistence } = useProject()

  const [hasContent, setHasContent] = useState(false)

  useEffect(() => {
    if (!persistence) return

    persistence.getDescription(itemKey).then(text => {
      if (text !== null && refsMap[itemKey]) {
        refsMap[itemKey].value = text
        setHasContent(text.length > 0)
      }
    })
  }, [persistence, itemKey])

  const handleSave = async () => {
    if (!persistence || !refsMap[itemKey]) return

    const content = refsMap[itemKey].value.trim()
    await persistence.saveDescription(itemKey, content)

    toaster.create({
      title: 'Success',
      description: 'Description of the item was saved successfully.',
      type: 'success'
    })
  }

  const handleLoad = async () => {
    if (!persistence) return

    const text = await persistence.getDescription(itemKey)

    if (text !== null && refsMap[itemKey]) {
      refsMap[itemKey].value = text
      setHasContent(text.length > 0)
    }
  }

  return (
    <Box borderWidth={1} rounded={'md'} p={4}>
      <Flex justifyContent={'space-between'} alignItems={'center'} mb={4}>
        <Flex gap={2} alignItems={'center'}>
          <Text fontWeight={'semibold'}>{name}</Text>
          {value && showValue && (
            <Text fontSize={'sm'} color={`${badgeColor}.fg`}>
              ({badge === 'constraint' ? Derivation.formatCondition(value) : `Value: ${value}`})
            </Text>
          )}
        </Flex>
        <Flex gap={2} alignItems={'center'}>
          {value && (
            <IconButton size={'2xs'} variant={'ghost'} colorPalette={'gray'} onClick={() => onToggleValue()}>
              {showValue ? <LuEyeOff /> : <LuEye />}
            </IconButton>
          )}
          {referencedFiles.length > 0 && (
            <IconButton size={'2xs'} variant={'ghost'} colorPalette={'gray'} onClick={() => onToggleFiles()}>
              {showFiles ? <LuFileX /> : <LuFile />}
            </IconButton>
          )}
          <Badge variant={'surface'} colorPalette={badgeColor} fontSize={'xs'}>
            {badge}
          </Badge>
        </Flex>
      </Flex>

      {showFiles && referencedFiles.length > 0 && (
        <Box mb={4}>
          <Text fontSize={'xs'} fontWeight={'semibold'} mb={2}>
            Referenced in
          </Text>
          <Flex gap={2} wrap={'wrap'}>
            {referencedFiles.map((fileId, i) => (
              <Badge key={i} variant={'surface'} colorPalette={'gray'} fontSize={'2xs'}>
                {decodeURIComponent(fileId).split('/').slice(1).join('/')}
              </Badge>
            ))}
          </Flex>
        </Box>
      )}

      <Text fontSize={'xs'} fontWeight={'semibold'} mb={2}>
        Description
      </Text>
      <Flex gap={2} alignItems={'flex-start'}>
        <Textarea
          ref={el => {
            refsMap[itemKey] = el
          }}
          onChange={e => setHasContent(e.target.value.trim().length > 0)}
          size={'xs'}
          placeholder="Enter Value"
          rows={4}
          autoresize
        />
        <Stack gap={3}>
          <IconButton size={'xs'} variant={'subtle'} colorPalette={'gray'} onClick={handleSave} disabled={!hasContent}>
            <LuSave />
          </IconButton>
          <IconButton size={'xs'} variant={'subtle'} colorPalette={'green'} onClick={handleLoad}>
            <LuUpload />
          </IconButton>
        </Stack>
      </Flex>
    </Box>
  )
}
