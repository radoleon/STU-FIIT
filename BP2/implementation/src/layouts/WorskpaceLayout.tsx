import Sidebar from '@/components/Sidebar'
import { useProject } from '@/context/ProjectContext'
import { Box, Flex } from '@chakra-ui/react'
import { Navigate, Outlet } from 'react-router'

export default function WorskpaceLayout() {
  const { loader } = useProject()

  if (!loader) {
    return <Navigate to="/" replace />
  }

  return (
    <Flex gap={8}>
      <Sidebar />
      <Box width={'full'} overflowX={'auto'}>
        <Outlet />
      </Box>
    </Flex>
  )
}
