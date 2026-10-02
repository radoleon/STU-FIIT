import { createBrowserRouter } from 'react-router'
import App from './App'
import WorskpaceLayout from './layouts/WorskpaceLayout'
import DocumentationPage from './pages/DocumentationPage'
import EditorPage from './pages/EditorPage'
import FeatureModelPage from './pages/FeatureModelPage'
import LoadProjectPage from './pages/LoadProjectPage'
import NotFoundPage from './pages/NotFoundPage'
import ParseErrorPage from './pages/ParseErrorPage'
import WorkspacePage from './pages/WorkspacePage'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: App,
    children: [
      { index: true, Component: LoadProjectPage },
      { path: 'error', Component: ParseErrorPage },
      {
        path: 'workspace',
        Component: WorskpaceLayout,
        children: [
          {
            index: true,
            Component: WorkspacePage
          },
          {
            path: ':id',
            Component: EditorPage
          },
          {
            path: 'h',
            children: [
              {
                path: 'documentation',
                Component: DocumentationPage
              },
              {
                path: 'feature-model',
                Component: FeatureModelPage
              }
            ]
          }
        ]
      },
      { path: '*', Component: NotFoundPage }
    ]
  }
])
