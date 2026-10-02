export interface CodeBlock {
  id: string
  kind: BlockType
  editMode: boolean
  originalContent: string | null
  content: string | null
  attributes: { [k: string]: string }
  children: CodeBlock[]
  offset: number
  length: number
}

export interface InsertBlockData {
  kind: 'text' | 'option'
  optionName?: string
  optionValue?: string
  content?: string
}

export type BlockType = 'plain' | 'option' | 'select' | 'set' | 'constrain' | 'frame' | 'adapt'

export interface FeatureNodeDatum {
  name: string
  type: 'root' | 'option' | 'frame'
  mandatory?: boolean
  fileId?: string
  children?: FeatureNodeDatum[]
}

export type FrameMap = Record<
  string,
  {
    fileId: string
    children: CodeBlock[]
  }
>
