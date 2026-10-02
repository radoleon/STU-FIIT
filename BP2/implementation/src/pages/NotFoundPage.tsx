import { Alert, Box, Button, Heading, Separator, Text } from '@chakra-ui/react'
import { Link, useLocation } from 'react-router'

export default function NotFoundPage() {
  const location = useLocation()

  return (
    <Box my={8} w={'2xl'} mx={'auto'}>
      <Heading lineHeight={1} mb={6}>
        404 Not Found
      </Heading>
      <Alert.Root status="error" mb={6}>
        <Alert.Indicator />
        <Box>
          <Alert.Title>Page not found</Alert.Title>
          <Alert.Description>The page you are looking for does not exist or has been moved.</Alert.Description>
        </Box>
      </Alert.Root>
      <Box borderWidth={1} borderRadius="md" borderColor={'red'} p={4} mb={6}>
        <Text fontWeight="semibold" mb={2}>
          Requested Path
        </Text>
        <Text fontSize="sm" color="red">
          No route matched this path.
        </Text>
        <Separator my={3} />
        <Text fontSize="xs" color="fg.muted">
          {location.pathname}
        </Text>
      </Box>
      <Link to="/">
        <Button colorPalette="gray" size="xs">
          Go Home
        </Button>
      </Link>
    </Box>
  )
}
