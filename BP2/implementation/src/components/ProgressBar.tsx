import { Box, ProgressCircle } from '@chakra-ui/react'

export default function ProgressBar() {
  return (
    <Box
      w={'100vw'}
      h={'100vh'}
      display={'flex'}
      alignItems={'center'}
      justifyContent={'center'}
      pos={'fixed'}
      top={0}
      left={0}
      zIndex={100000}
      bg={'bg'}
    >
      <ProgressCircle.Root value={null} size="md">
        <ProgressCircle.Circle>
          <ProgressCircle.Track />
          <ProgressCircle.Range />
        </ProgressCircle.Circle>
      </ProgressCircle.Root>
    </Box>
  )
}
