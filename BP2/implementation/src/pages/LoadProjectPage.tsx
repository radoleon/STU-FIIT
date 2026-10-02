import { useConfiguration } from '@/context/ConfigurationContext'
import { useProject } from '@/context/ProjectContext'
import { toaster } from '@/generated/toaster'
import { Loader } from '@/misc/Loader'
import { Persistence } from '@/misc/Persistence'
import { ParseError } from '@/models/ParseError'
import { Alert, Box, Button, ButtonGroup, Heading, Span } from '@chakra-ui/react'
import { Navigate, useNavigate } from 'react-router'

export default function LoadProjectPage() {
  const { loader, setLoader, setPersistence, setIsPending } = useProject()
  const {
    setSpecificationFrame,
    setCompositionFrames,
    setCodeFrames,
    setVariables,
    setSelectedOptions,
    setConstraints,
    setAdaptedFrames
  } = useConfiguration()

  const navigate = useNavigate()

  if (loader) {
    return <Navigate to="/workspace" replace />
  }

  const loadFiles = async (lang: string) => {
    const loader = new Loader(lang)
    try {
      setIsPending(true)

      await loader.loadFiles()

      const persistence = new Persistence(loader.directoryTree!.name)
      await persistence.init()

      const frameAnalysis = loader.frameAnalysis

      if (frameAnalysis) {
        setSpecificationFrame(frameAnalysis.specificationFrame)
        setCompositionFrames(frameAnalysis.compositionFrames)
        setCodeFrames(frameAnalysis.codeFrames)
        setVariables(frameAnalysis.variables)
        setSelectedOptions(frameAnalysis.selectedOptions)
        setConstraints(frameAnalysis.constraints)
        setAdaptedFrames(frameAnalysis.adaptedFrames)
      }

      setLoader(loader)
      setPersistence(persistence)

      toaster.create({
        title: 'Success',
        description: `Project folder was loaded successfully.`,
        type: 'success'
      })
    } catch (error) {
      setIsPending(false)

      if (error instanceof ParseError) {
        navigate('/error', { state: { location: error.location, message: error.message } })
        return
      }

      if (error instanceof Error) {
        toaster.create({
          title: 'Error',
          description: 'Unexpected error occurred during loading.',
          type: 'error'
        })
      }
    }
  }

  return (
    <Box my={8} w={'sm'} mx={'auto'}>
      <Heading lineHeight={1}>Load Project</Heading>
      <Alert.Root status="info" my={6} alignItems={'center'}>
        <Alert.Indicator />
        <Alert.Description>
          Select a <b>programming language</b> of your project.
        </Alert.Description>
      </Alert.Root>
      <ButtonGroup colorPalette={'gray'} variant={'surface'} display={'flex'} flexDir={'column'} gap={4} w={'full'}>
        <Button w={'full'} onClick={() => loadFiles('cpp')}>
          <Span display={'flex'} alignItems={'center'} gap={2}>
            <i className="devicon-cplusplus-plain colored"></i>
            <Span lineHeight={1} w={'4rem'} textAlign={'left'}>
              C/C++
            </Span>
          </Span>
        </Button>

        <Button w={'full'} onClick={() => loadFiles('js')}>
          <Span display={'flex'} alignItems={'center'} gap={2}>
            <i className="devicon-javascript-plain colored"></i>
            <Span lineHeight={1} w={'4rem'} textAlign={'left'}>
              JS/TS
            </Span>
          </Span>
        </Button>

        <Button w={'full'} onClick={() => loadFiles('cs')}>
          <Span display={'flex'} alignItems={'center'} gap={2}>
            <i className="devicon-dotnetcore-plain colored"></i>
            <Span lineHeight={1} w={'4rem'} textAlign={'left'}>
              C#/.NET
            </Span>
          </Span>
        </Button>

        <Button w={'full'} onClick={() => loadFiles('java')}>
          <Span display={'flex'} alignItems={'center'} gap={2}>
            <i className="devicon-java-plain colored"></i>
            <Span lineHeight={1} w={'4rem'} textAlign={'left'}>
              Java
            </Span>
          </Span>
        </Button>

        <Button w={'full'} onClick={() => loadFiles('python')}>
          <Span display={'flex'} alignItems={'center'} gap={2}>
            <i className="devicon-python-plain colored"></i>
            <Span lineHeight={1} w={'4rem'} textAlign={'left'}>
              Python
            </Span>
          </Span>
        </Button>

        <Button w={'full'} onClick={() => loadFiles('rust')}>
          <Span display={'flex'} alignItems={'center'} gap={2}>
            <i className="devicon-rust-plain colored"></i>
            <Span lineHeight={1} w={'4rem'} textAlign={'left'}>
              Rust
            </Span>
          </Span>
        </Button>

        <Button w={'full'} onClick={() => loadFiles('php')}>
          <Span display={'flex'} alignItems={'center'} gap={2}>
            <i className="devicon-php-plain colored"></i>
            <Span lineHeight={1} w={'4rem'} textAlign={'left'}>
              PHP
            </Span>
          </Span>
        </Button>
      </ButtonGroup>
    </Box>
  )
}
