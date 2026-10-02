import type { CodeBlock, FeatureNodeDatum, FrameMap, InsertBlockData } from '@/models/CodeBlock'
import type { DirectoryNode, FileNode } from '@/models/DirectoryTree'
import { nanoid } from 'nanoid'

export class BlockOperations {
  public static createFromInsertData(data: InsertBlockData): CodeBlock {
    const id = nanoid()

    if (data.kind === 'text') {
      return {
        id,
        kind: 'plain',
        editMode: false,
        originalContent: data.content!,
        content: data.content!,
        attributes: {},
        children: [],
        offset: 0,
        length: data.content!.split('\n').length
      }
    } else {
      const children: CodeBlock[] = []

      if (data.content) {
        const contentBlock: CodeBlock = {
          id: nanoid(),
          kind: 'plain',
          editMode: false,
          originalContent: data.content,
          content: data.content,
          attributes: {},
          children: [],
          offset: 0,
          length: data.content.split('\n').length
        }
        children.push(contentBlock)
      }

      return {
        id,
        kind: 'option',
        editMode: false,
        originalContent: null,
        content: null,
        attributes: {
          name: data.optionName!,
          ...(data.optionValue != null ? { value: data.optionValue } : {})
        },
        children,
        offset: 0,
        length: 0
      }
    }
  }

  public static findBlockById(blocks: CodeBlock[], blockId: string): CodeBlock | null {
    for (const block of blocks) {
      if (block.id === blockId) {
        return block
      }

      const found = this.findBlockById(block.children, blockId)
      if (found) return found
    }

    return null
  }

  public static updateConfigurationBlock(
    blocks: CodeBlock[],
    blockKind: 'set' | 'select' | 'constrain',
    nameAttribute: string,
    newValue: string
  ): boolean {
    for (const block of blocks) {
      if (block.kind === blockKind) {
        let nameMatch = false

        if (blockKind === 'set' && block.attributes.var === nameAttribute) {
          nameMatch = true
        } else if (blockKind === 'select' && block.attributes.option === nameAttribute) {
          nameMatch = true
        } else if (blockKind === 'constrain' && block.attributes.var === nameAttribute) {
          nameMatch = true
        }

        if (nameMatch) {
          if (blockKind === 'constrain') {
            if (block.attributes.toBoundary) {
              block.attributes.toBoundary = newValue
            } else if (block.attributes.toSet) {
              block.attributes.toSet = newValue
            }
          } else {
            block.attributes.value = newValue
          }

          return true
        }
      }

      if (
        block.children.length > 0 &&
        this.updateConfigurationBlock(block.children, blockKind, nameAttribute, newValue)
      ) {
        return true
      }
    }

    return false
  }

  public static insertBlockAsSibling(
    blocks: CodeBlock[],
    targetBlockId: string,
    newBlock: CodeBlock,
    position: 'above' | 'below'
  ): CodeBlock[] {
    const index = blocks.findIndex(b => b.id === targetBlockId)

    if (index !== -1) {
      const newBlocks = [...blocks]
      const insertIndex = position === 'above' ? index : index + 1
      newBlocks.splice(insertIndex, 0, newBlock)
      return newBlocks
    }

    return blocks.map(b => ({
      ...b,
      children: this.insertBlockAsSibling(b.children, targetBlockId, newBlock, position)
    }))
  }

  public static insertBlockAsChild(blocks: CodeBlock[], parentBlockId: string, newBlock: CodeBlock): CodeBlock[] {
    return blocks.map(b => {
      if (b.id === parentBlockId) {
        return {
          ...b,
          children: [...b.children, newBlock]
        }
      }

      return {
        ...b,
        children: this.insertBlockAsChild(b.children, parentBlockId, newBlock)
      }
    })
  }

  public static createConfigurationBlock(kind: 'set' | 'select', name: string, value: string): CodeBlock {
    const id = nanoid()
    const attrName = kind === 'set' ? 'var' : 'option'

    return {
      id,
      kind,
      editMode: false,
      originalContent: null,
      content: null,
      attributes: {
        [attrName]: name,
        value: value
      },
      children: [],
      offset: 0,
      length: 0
    }
  }

  public static removeBlock(blocks: CodeBlock[], targetBlockId: string): CodeBlock[] {
    const filtered = blocks.filter(b => b.id !== targetBlockId)

    return filtered.map(b => {
      const updated = {
        ...b,
        children: this.removeBlock(b.children, targetBlockId)
      }

      return updated
    })
  }

  public static recalculateOffsets(blocks: CodeBlock[]): CodeBlock[] {
    const cursor = { pos: 0 }

    const traverse = (blocks: CodeBlock[]): CodeBlock[] => {
      return blocks.map(block => {
        block.offset = cursor.pos

        if (block.kind === 'plain') {
          const lineCount = block.content!.split('\n').length
          block.length = lineCount
          cursor.pos += lineCount
        } else {
          block.length = 0
          traverse(block.children)
        }

        return block
      })
    }

    return traverse(blocks)
  }

  private static _getAllFiles(node: DirectoryNode | FileNode, files: FileNode[] = []): FileNode[] {
    if (!node.isDir) {
      files.push(node)
      return files
    }

    for (const child of node.children) {
      this._getAllFiles(child, files)
    }

    return files
  }

  private static _buildFrameMap(files: FileNode[]): FrameMap {
    const map: FrameMap = {}

    const traverse = (blocks: CodeBlock[], fileId: string) => {
      for (const block of blocks) {
        if (block.kind === 'frame' && block.attributes.name) {
          map[block.attributes.name] = { fileId, children: block.children }
        }

        traverse(block.children, fileId)
      }
    }

    for (const file of files) {
      traverse(file.parsed, file.id)
    }

    return map
  }

  private static _deduplicateNodes(nodes: FeatureNodeDatum[]): FeatureNodeDatum[] {
    const seen: Record<string, FeatureNodeDatum> = {}

    for (const node of nodes) {
      const existing = seen[node.name]

      if (existing) {
        const combined = [...(existing.children ?? []), ...(node.children ?? [])]
        existing.children = combined.length > 0 ? this._deduplicateNodes(combined) : undefined

        if (node.mandatory) {
          existing.mandatory = true
        }
      } else {
        seen[node.name] = {
          ...node,
          children: node.children ? this._deduplicateNodes(node.children) : undefined
        }
      }
    }

    return Object.values(seen)
  }

  private static _blocksToNodes(
    blocks: CodeBlock[],
    fileId: string,
    frameMap: FrameMap,
    visited: Set<string>
  ): FeatureNodeDatum[] {
    const result: FeatureNodeDatum[] = []

    for (const block of blocks) {
      if (block.kind === 'option' && block.attributes.name) {
        const val = block.attributes.value

        const mandatory = !!block.attributes.value && block.attributes.value !== 'TRUE'
        const label = mandatory ? `${block.attributes.name} = ${val}` : block.attributes.name

        const children = this._blocksToNodes(block.children, fileId, frameMap, new Set(visited))

        result.push({
          name: label,
          type: 'option',
          mandatory,
          fileId,
          children: children.length > 0 ? children : undefined
        })
      } else if (block.kind === 'adapt' && block.attributes.frame) {
        const frameName = block.attributes.frame
        const entry = frameMap[frameName]

        if (entry && !visited.has(frameName)) {
          const nextVisited = new Set(visited).add(frameName)
          const children = this._blocksToNodes(entry.children, entry.fileId, frameMap, nextVisited)

          result.push({
            name: frameName,
            type: 'frame',
            fileId: entry.fileId,
            children: children.length > 0 ? children : undefined
          })
        } else if (!visited.has(frameName)) {
          result.push({ name: frameName, type: 'frame' })
        }
      } else if (block.kind === 'frame' && block.attributes.name) {
        const frameName = block.attributes.name

        if (!visited.has(frameName)) {
          const nextVisited = new Set(visited).add(frameName)
          const children = this._blocksToNodes(block.children, fileId, frameMap, nextVisited)

          result.push({
            name: frameName,
            type: 'frame',
            fileId,
            children: children.length > 0 ? children : undefined
          })
        }
      } else if (block.children.length > 0) {
        result.push(...this._blocksToNodes(block.children, fileId, frameMap, new Set(visited)))
      }
    }

    return this._deduplicateNodes(result)
  }

  public static buildFeatureTree(directoryTree: DirectoryNode): FeatureNodeDatum {
    const allFiles = this._getAllFiles(directoryTree)
    const frameMap = this._buildFrameMap(allFiles)

    const referencedFrameNames = new Set<string>()

    const collectAdaptRefs = (blocks: CodeBlock[]) => {
      for (const block of blocks) {
        if (block.kind === 'adapt' && block.attributes.frame) {
          referencedFrameNames.add(block.attributes.frame)
        }

        collectAdaptRefs(block.children)
      }
    }

    for (const file of allFiles) {
      collectAdaptRefs(file.parsed)
    }

    const rootChildren: FeatureNodeDatum[] = []
    const topVisited = new Set<string>()

    for (const file of allFiles) {
      for (const block of file.parsed) {
        if (block.kind === 'option' && block.attributes.name) {
          const children = this._blocksToNodes(block.children, file.id, frameMap, new Set())
          const mandatory = !!block.attributes.value && block.attributes.value !== 'TRUE'
          const label = mandatory ? `${block.attributes.name} = ${block.attributes.value}` : block.attributes.name

          rootChildren.push({
            name: label,
            type: 'option',
            mandatory,
            fileId: file.id,
            children: children.length > 0 ? children : undefined
          })
        } else if (block.kind === 'adapt' && block.attributes.frame) {
          const frameName = block.attributes.frame

          if (!topVisited.has(frameName)) {
            const entry = frameMap[frameName]
            const children = this._blocksToNodes(entry.children, entry.fileId, frameMap, new Set([frameName]))

            topVisited.add(frameName)

            rootChildren.push({
              name: frameName,
              type: 'frame',
              fileId: entry.fileId,
              children: children.length > 0 ? children : undefined
            })
          }
        } else if (block.kind === 'frame' && block.attributes.name) {
          const frameName = block.attributes.name

          if (!referencedFrameNames.has(frameName) && !topVisited.has(frameName)) {
            const children = this._blocksToNodes(block.children, file.id, frameMap, new Set([frameName]))

            topVisited.add(frameName)

            rootChildren.push({
              name: frameName,
              type: 'frame',
              fileId: file.id,
              children: children.length > 0 ? children : undefined
            })
          }
        }
      }
    }

    const deduplicated = this._deduplicateNodes(rootChildren)

    const tree: FeatureNodeDatum = {
      name: directoryTree.name,
      type: 'root',
      children: deduplicated.length > 0 ? deduplicated : undefined
    }

    return tree
  }
}
