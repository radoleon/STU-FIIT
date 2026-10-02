import type { FileNode } from '@/models/DirectoryTree'
import type { FrameAdapt, FrameAnalysisResult, FrameConstraint, FrameOption, FrameVariable } from '@/models/Frame'
import React, { createContext, useContext, useState } from 'react'

export interface ConfigurationContextValue extends FrameAnalysisResult {
  setSpecificationFrame: (frame: FileNode | null) => void
  setCompositionFrames: (frames: FileNode[]) => void
  setCodeFrames: (frames: FileNode[]) => void
  setVariables: (variables: FrameVariable[]) => void
  setSelectedOptions: (options: FrameOption[]) => void
  setConstraints: (constraints: FrameConstraint[]) => void
  setAdaptedFrames: (adaptedFrames: FrameAdapt[]) => void
  visitedBlocks: Record<string, number>
  setVisitedBlocks: (visitedBlocks: Record<string, number>) => void
}

const ConfigurationContext = createContext<ConfigurationContextValue | null>(null)

export const ConfigurationProvider = ({ children }: { children: React.ReactNode }) => {
  const [specificationFrame, setSpecificationFrame] = useState<FileNode | null>(null)
  const [compositionFrames, setCompositionFrames] = useState<FileNode[]>([])
  const [codeFrames, setCodeFrames] = useState<FileNode[]>([])

  const [variables, setVariables] = useState<FrameVariable[]>([])
  const [selectedOptions, setSelectedOptions] = useState<FrameOption[]>([])
  const [constraints, setConstraints] = useState<FrameConstraint[]>([])
  const [adaptedFrames, setAdaptedFrames] = useState<FrameAdapt[]>([])
  const [visitedBlocks, setVisitedBlocks] = useState<Record<string, number>>({})

  return (
    <ConfigurationContext.Provider
      value={{
        specificationFrame,
        setSpecificationFrame,
        compositionFrames,
        setCompositionFrames,
        codeFrames,
        setCodeFrames,
        variables,
        setVariables,
        selectedOptions,
        setSelectedOptions,
        constraints,
        setConstraints,
        adaptedFrames,
        setAdaptedFrames,
        visitedBlocks,
        setVisitedBlocks
      }}
    >
      {children}
    </ConfigurationContext.Provider>
  )
}

export const useConfiguration = () => {
  const context = useContext(ConfigurationContext)
  if (!context) {
    throw new Error('useConfiguration must be used within a ConfigurationProvider')
  }
  return context
}
