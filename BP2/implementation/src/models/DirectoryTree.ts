import type { CodeBlock } from './CodeBlock'

export interface FileNode {
  id: string
  name: string
  fullPath: string
  extension: string
  isDir: false
  handle: FileSystemFileHandle
  parsed: CodeBlock[]
  parserResult: Record<string, any>[]
}

export interface DirectoryNode {
  id: string
  name: string
  fullPath: string
  isDir: true
  handle: FileSystemDirectoryHandle
  children: (FileNode | DirectoryNode)[]
  childrenCount: number
}
