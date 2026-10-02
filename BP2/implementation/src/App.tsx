import { Container } from '@chakra-ui/react'
import { Outlet } from 'react-router'
import Navbar from './components/Navbar'
import ProgressBar from './components/ProgressBar'
import { useProject } from './context/ProjectContext'
import { Toaster } from './generated/toaster'

export default function App() {
  const { isPending } = useProject()

  return (
    <>
      {isPending && <ProgressBar />}
      <Container paddingBottom={4}>
        <Navbar />
        <Outlet />
        <Toaster />
      </Container>
    </>
  )
}
