import { ChakraProvider, createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'
import { ColorModeProvider, type ColorModeProviderProps } from './color-mode'

const config = defineConfig({
  globalCss: {
    html: {
      colorPalette: 'green'
    }
  }
})

export const system = createSystem(defaultConfig, config)

export function UIProvider(props: ColorModeProviderProps) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider {...props} />
    </ChakraProvider>
  )
}
