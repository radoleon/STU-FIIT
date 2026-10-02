import type { ParseErrorLocation } from '@/models/ParseError'
import { Alert, Badge, Box, Button, Heading, Separator, Text } from '@chakra-ui/react'
import { Link, Navigate, useLocation } from 'react-router'

interface ParseErrorState {
  location: ParseErrorLocation
  message: string
}

export default function ParseErrorPage() {
  const location = useLocation()

  const state = location.state as ParseErrorState | null

  if (!state) {
    return <Navigate to="/" replace />
  }

  const {
    location: { filePath, fileName, line, column },
    message
  } = state

  return (
    <Box my={8} w={'2xl'} mx={'auto'}>
      <Heading lineHeight={1} mb={6}>
        Parse Error
      </Heading>
      <Alert.Root status="error" mb={6}>
        <Alert.Indicator />
        <Box>
          <Alert.Title>Failed to load project</Alert.Title>
          <Alert.Description>A file could not be parsed. Fix the issue in the file and try again.</Alert.Description>
        </Box>
      </Alert.Root>
      <Box borderWidth={1} borderRadius="md" borderColor={'red'} p={4} mb={4}>
        <Text fontWeight="semibold" mb={2}>
          File
        </Text>
        <Badge colorPalette={'gray'} variant={'surface'}>
          {fileName}
        </Badge>
        <Separator my={3} />
        <Text fontSize="xs" color="fg.muted">
          {filePath}
        </Text>
      </Box>
      <Box borderWidth={1} borderRadius="md" borderColor={'red'} p={4} mb={6}>
        <Text fontWeight="semibold" mb={2}>
          Error
        </Text>
        <Text fontSize="sm" color="red">
          {message}
        </Text>
        <Separator my={3} />
        <Text fontSize="xs" color="fg.muted">
          Line {line}, Column {column}
        </Text>
      </Box>
      <Link to="/">
        <Button colorPalette="gray" size="xs">
          Load Another Project
        </Button>
      </Link>
    </Box>
  )
}
