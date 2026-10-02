import { useConfiguration } from '@/context/ConfigurationContext'
import { useProject } from '@/context/ProjectContext.tsx'
import { toaster } from '@/generated/toaster'
import { Badge, Button, ButtonGroup, Flex, Image, Span } from '@chakra-ui/react'
import { useState } from 'react'
import { LuBox, LuCircleX, LuFileText, LuSave, LuSettings, LuWaypoints } from 'react-icons/lu'
import { Link } from 'react-router'
import { ColorModeButton } from '../generated/color-mode'
import { ConfigurationDrawer } from './ConfigurationDrawer'
import { DerivationDialog } from './DerivationDialog'

export default function Navbar() {
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState(false)
  const [isDerivationDialogOpen, setIsDerivationDialogOpen] = useState(false)

  const { loader, setLoader, persistence, setPersistence, setIsPending, changedFilesCount, setChangedFilesCount } =
    useProject()

  const {
    specificationFrame,
    setSpecificationFrame,
    compositionFrames,
    setCompositionFrames,
    setCodeFrames,
    setVariables,
    setSelectedOptions,
    setConstraints,
    setAdaptedFrames
  } = useConfiguration()

  const hasNoErrors = !loader?.isTreeEmpty && !!specificationFrame && compositionFrames.length > 0

  const handleClose = () => {
    if (persistence) {
      persistence.close()
      setPersistence(null)
    }

    setLoader(null)
    setChangedFilesCount(0)

    setSpecificationFrame(null)
    setCompositionFrames([])

    setCodeFrames([])
    setVariables([])
    setSelectedOptions([])
    setConstraints([])
    setAdaptedFrames([])
  }

  const handleSave = async () => {
    if (!loader) return

    setIsPending(true)

    try {
      const savedCount = await loader.saveProject(
        new Set([specificationFrame, ...compositionFrames].filter(f => f !== null).map(f => f.id))
      )

      toaster.create({
        title: 'Success',
        description: `${savedCount} file(s) were saved successfully.`,
        type: 'success'
      })

      setChangedFilesCount(0)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Flex
      justifyContent={'space-between'}
      alignItems={'center'}
      bg={'bg'}
      paddingBlock={4}
      position={'sticky'}
      top={0}
      left={0}
      zIndex={100}
    >
      <Flex alignItems={'center'} gap={8}>
        <Link to="/workspace">
          <Image src="/logo.png" alt="Logo" width={6} height={6} />
        </Link>
        {loader && (
          <ButtonGroup size="xs" variant="ghost" colorPalette="gray" gap={4}>
            <Link to="/workspace/h/feature-model">
              <Button disabled={!hasNoErrors}>
                <LuWaypoints />
                Feature Model
              </Button>
            </Link>
            <Button disabled={!hasNoErrors} onClick={() => setIsDerivationDialogOpen(true)}>
              <LuBox />
              Derive Product
            </Button>
            <Link to="/workspace/h/documentation">
              <Button disabled={!hasNoErrors}>
                <LuFileText />
                Documentation
              </Button>
            </Link>
            <Button colorPalette={'red'} variant={!hasNoErrors ? 'outline' : 'ghost'} onClick={handleClose}>
              <LuCircleX />
              Close Project
            </Button>
            <Button colorPalette="green" disabled={changedFilesCount === 0 || !hasNoErrors} onClick={handleSave}>
              <LuSave />
              Save Project
            </Button>
          </ButtonGroup>
        )}
      </Flex>
      <Flex gap={4}>
        {loader && (
          <>
            {changedFilesCount > 0 && (
              <Badge variant="subtle" colorPalette="red" size="sm" px={4}>
                <Span fontWeight={700}>{changedFilesCount}</Span> file(s) changed
              </Badge>
            )}
            <Button
              variant="outline"
              size="xs"
              colorPalette={'gray'}
              disabled={!hasNoErrors}
              onClick={() => setIsConfigDrawerOpen(true)}
            >
              <LuSettings /> Configuration
            </Button>
          </>
        )}
        <ColorModeButton />
      </Flex>
      <ConfigurationDrawer isOpen={isConfigDrawerOpen} onClose={() => setIsConfigDrawerOpen(false)} />
      <DerivationDialog isOpen={isDerivationDialogOpen} onClose={() => setIsDerivationDialogOpen(false)} />
    </Flex>
  )
}
