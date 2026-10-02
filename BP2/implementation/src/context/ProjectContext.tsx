import type { Loader } from '@/misc/Loader'
import type { Persistence } from '@/misc/Persistence'
import React, { createContext, useContext, useState } from 'react'

interface ProjectContextValue {
  loader: Loader | null
  setLoader: (loader: Loader | null) => void
  persistence: Persistence | null
  setPersistence: (persistence: Persistence | null) => void
  isPending: boolean
  setIsPending: (value: boolean) => void
  changedFilesCount: number
  setChangedFilesCount: (count: number) => void
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

export const ProjectProvider = ({ children }: { children: React.ReactNode }) => {
  const [loader, setLoader] = useState<Loader | null>(null)
  const [persistence, setPersistence] = useState<Persistence | null>(null)
  const [isPending, setIsPending] = useState<boolean>(false)
  const [changedFilesCount, setChangedFilesCount] = useState<number>(0)

  return (
    <ProjectContext.Provider
      value={{
        loader,
        setLoader,
        persistence,
        setPersistence,
        isPending,
        setIsPending,
        changedFilesCount,
        setChangedFilesCount
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export const useProject = () => {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider')
  }
  return context
}
