import { FILE_TYPES } from '@/constants'
import type { CodeBlock } from '@/models/CodeBlock'
import type { DirectoryNode, FileNode } from '@/models/DirectoryTree'
import type { FrameAnalysisResult, ReferenceIndex } from '@/models/Frame'
import { ParseError } from '@/models/ParseError'
import { FrameAnalyzer } from './FrameAnalyzer'
import { Parser } from './Parser'

declare global {
  interface Window {
    showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>
  }
  interface FileSystemDirectoryHandle {
    entries(): AsyncIterableIterator<[string, FileSystemFileHandle | FileSystemDirectoryHandle]>
  }
}

export class Loader {
  private readonly _fileTypes = FILE_TYPES
  private _lang: string
  private _directoryTree: DirectoryNode | null = null
  private _isTreeEmpty: boolean = true
  private _parser: Parser
  private _frameAnalysis: FrameAnalysisResult | null = null
  private _referenceIndex: ReferenceIndex
  private _changedFiles: Set<string> = new Set()

  constructor(lang: string) {
    this._lang = lang
    this._parser = new Parser()
    this._referenceIndex = {
      frame: {},
      variable: {},
      option: {}
    }
  }

  public get directoryTree() {
    return this._directoryTree
  }

  public get isTreeEmpty() {
    return this._isTreeEmpty
  }

  public get frameAnalysis(): FrameAnalysisResult | null {
    return this._frameAnalysis
  }

  public get referenceIndex(): ReferenceIndex {
    return this._referenceIndex
  }

  public get changedFiles(): Set<string> {
    return this._changedFiles
  }

  public get allowedExtensions(): string[] {
    return [...this._fileTypes[this._lang].allowedExtensions, '.xml']
  }

  public get iconClass(): string {
    return this._fileTypes[this._lang].iconClass
  }

  public get syntaxLanguage(): string {
    return this._fileTypes[this._lang].syntaxLanguage
  }

  private async _readFileContent(handle: FileSystemFileHandle) {
    const file = await handle.getFile()
    const fileContent = await file.text()

    return fileContent
  }

  private async _readDirectoryTree(
    directoryHandle: FileSystemDirectoryHandle,
    parentPath?: string
  ): Promise<DirectoryNode> {
    const fullPath = parentPath ? `${parentPath}/${directoryHandle.name}` : directoryHandle.name
    const children: (FileNode | DirectoryNode)[] = []

    for await (const [name, handle] of directoryHandle.entries()) {
      if (handle.kind === 'file' && this.allowedExtensions.some(x => name.endsWith(x))) {
        const filePath = `${fullPath}/${name}`
        const content = await this._readFileContent(handle)

        const parsedFile = this._parser.parseFile(content, filePath, name)

        const fileNode: FileNode = {
          id: encodeURIComponent(filePath),
          name,
          fullPath: filePath,
          extension: name.slice(name.lastIndexOf('.')),
          isDir: false,
          handle: handle as FileSystemFileHandle,
          parsed: this._parser.rebuildBlocksFromParserResult(parsedFile),
          parserResult: parsedFile
        }
        children.push(fileNode)

        this._isTreeEmpty = false
      } else if (handle.kind === 'directory') {
        const directoryNode = await this._readDirectoryTree(handle as FileSystemDirectoryHandle, fullPath)
        children.push(directoryNode)
      }
    }

    return {
      id: encodeURIComponent(fullPath),
      name: directoryHandle.name,
      fullPath,
      isDir: true,
      handle: directoryHandle,
      children,
      childrenCount: children.length
    }
  }

  private async _traverseTree(
    node: DirectoryNode | FileNode,
    onFile: (file: FileNode) => Promise<void>
  ): Promise<void> {
    if (!node.isDir) {
      await onFile(node)
      return
    }

    for (const child of node.children) {
      await this._traverseTree(child, onFile)
    }
  }

  private async _saveFile(file: FileNode): Promise<void> {
    const writable = await file.handle.createWritable()
    await writable.write(this._parser.buildFile(file))
    await writable.close()
  }

  public async loadFiles(): Promise<void> {
    try {
      const directoryHandle: FileSystemDirectoryHandle = await window.showDirectoryPicker()

      const treeStructure = await this._readDirectoryTree(directoryHandle)
      this._directoryTree = treeStructure

      const allFiles = await this._extractAllFiles(treeStructure)
      this._frameAnalysis = FrameAnalyzer.analyzeFrames(allFiles)
      this._referenceIndex = FrameAnalyzer.buildReferenceIndex(allFiles)
    } catch (error) {
      if (error instanceof ParseError) {
        throw error
      }

      throw new Error('Project folder was not selected')
    }
  }

  public loadFileFromTree(path: string): FileNode | null {
    let pathParts = path.split('/')
    let currentDirectory = this.directoryTree

    if (currentDirectory && currentDirectory.name === pathParts[0]) {
      pathParts = pathParts.slice(1)

      for (const [i, part] of pathParts.entries()) {
        if (i === pathParts.length - 1) {
          return (currentDirectory.children.find(x => !x.isDir && x.name === part) as FileNode) ?? null
        } else {
          const subDirectory = currentDirectory.children.find(x => x.isDir && x.name === part) as DirectoryNode

          if (!subDirectory) {
            return null
          }

          currentDirectory = subDirectory
        }
      }
    }

    return null
  }

  private async _extractAllFiles(node: DirectoryNode): Promise<FileNode[]> {
    const files: FileNode[] = []

    await this._traverseTree(node, async file => {
      files.push(file)
    })

    return files
  }

  public async saveProject(configurationFiles: Set<string> = new Set()): Promise<number> {
    if (!this.directoryTree || (this._changedFiles.size === 0 && configurationFiles.size === 0)) {
      return 0
    }

    let savedCount = 0

    await this._traverseTree(this.directoryTree, async file => {
      if (this._changedFiles.has(file.id) || configurationFiles.has(file.id)) {
        await this._saveFile(file)
        savedCount++
      }
    })

    this._changedFiles = new Set()

    return savedCount
  }

  public updateFileInPlace(updatedFile: FileNode): void {
    if (!this._directoryTree) {
      return
    }

    const updateInTree = (node: DirectoryNode | FileNode): boolean => {
      if (node.isDir) {
        for (const child of node.children) {
          if (updateInTree(child)) {
            return true
          }
        }
        return false
      }

      if (node.id === updatedFile.id) {
        node.parsed = updatedFile.parsed
        return true
      }

      return false
    }

    updateInTree(this._directoryTree)
  }

  public addBlockToReferenceIndex(fileId: string, block: CodeBlock): void {
    this._referenceIndex = FrameAnalyzer.addBlockToReferenceIndex(this._referenceIndex, fileId, block)
  }

  public removeBlockFromReferenceIndex(block: CodeBlock): void {
    this._referenceIndex = FrameAnalyzer.removeBlockFromReferenceIndex(this._referenceIndex, block)
  }

  public markFileAsChanged(fileId: string): void {
    this._changedFiles.add(fileId)
    this._changedFiles = new Set(this._changedFiles)
  }

  public revertFile(fileId: string): FileNode | null {
    const file = this.loadFileFromTree(decodeURIComponent(fileId))

    if (!file) {
      return null
    }

    file.parsed = this._parser.rebuildBlocksFromParserResult(file.parserResult)

    this._changedFiles.delete(fileId)
    this._changedFiles = new Set(this._changedFiles)

    return file
  }
}
