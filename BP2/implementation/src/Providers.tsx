import { RouterProvider } from 'react-router'
import { ConfigurationProvider } from './context/ConfigurationContext'
import { ProjectProvider } from './context/ProjectContext'
import { UIProvider } from './generated/provider'
import { router } from './router'

export default function Providers() {
  return (
    <UIProvider>
      <ProjectProvider>
        <ConfigurationProvider>
          <RouterProvider router={router} />
        </ConfigurationProvider>
      </ProjectProvider>
    </UIProvider>
  )
}
