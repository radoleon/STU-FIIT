import type { FileNode } from './DirectoryTree'

export interface FrameVariable {
  name: string
  value: string
}

export interface FrameOption {
  name: string
  value: string
}

export interface FrameConstraint {
  variable: string
  condition: string
}

export interface FrameAdapt {
  frame: string
}

export interface ConfigurationPreset {
  variables: FrameVariable[]
  selectedOptions: FrameOption[]
  constraints: FrameConstraint[]
}

export interface FrameAnalysisResult {
  specificationFrame: FileNode | null
  compositionFrames: FileNode[]
  codeFrames: FileNode[]
  variables: FrameVariable[]
  selectedOptions: FrameOption[]
  constraints: FrameConstraint[]
  adaptedFrames: FrameAdapt[]
}

export interface ReferenceLocation {
  fileId: string
  blockId: string
}

export interface ReferenceIndex {
  frame: { [name: string]: ReferenceLocation[] }
  variable: { [name: string]: ReferenceLocation[] }
  option: { [name: string]: ReferenceLocation[] }
}

export interface PresetEntry {
  key: string
  preset: ConfigurationPreset
  isCompatible?: boolean
}
