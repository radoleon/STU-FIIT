import type { CodeBlock } from '@/models/CodeBlock'
import type { FileNode } from '@/models/DirectoryTree'
import type {
  FrameAdapt,
  FrameAnalysisResult,
  FrameConstraint,
  FrameOption,
  FrameVariable,
  ReferenceIndex
} from '@/models/Frame'

export class FrameAnalyzer {
  private static allBlocksMatchKinds(blocks: CodeBlock[], kinds: string[]): boolean {
    for (const block of blocks) {
      if (!kinds.includes(block.kind)) {
        return false
      }
      if (block.children.length > 0 && !this.allBlocksMatchKinds(block.children, kinds)) {
        return false
      }
    }
    return true
  }

  private static hasBlockKind(blocks: CodeBlock[], kinds: string[]): boolean {
    for (const block of blocks) {
      if (kinds.includes(block.kind)) {
        return true
      }
      if (block.children.length > 0 && this.hasBlockKind(block.children, kinds)) {
        return true
      }
    }
    return false
  }

  private static extractVariables(blocks: CodeBlock[]): FrameVariable[] {
    const variables: FrameVariable[] = []

    const traverse = (blocks: CodeBlock[]) => {
      for (const block of blocks) {
        if (block.kind === 'set' && block.attributes.var && block.attributes.value) {
          variables.push({
            name: block.attributes.var,
            value: block.attributes.value
          })
        }
        if (block.children.length > 0) {
          traverse(block.children)
        }
      }
    }

    traverse(blocks)
    return variables
  }

  private static extractSelectedOptions(blocks: CodeBlock[]): FrameOption[] {
    const options: FrameOption[] = []

    const traverse = (blocks: CodeBlock[]) => {
      for (const block of blocks) {
        if (block.kind === 'select' && block.attributes.option && block.attributes.value) {
          options.push({
            name: block.attributes.option,
            value: block.attributes.value
          })
        }
        if (block.children.length > 0) {
          traverse(block.children)
        }
      }
    }

    traverse(blocks)
    return options
  }

  private static extractConstraints(blocks: CodeBlock[]): FrameConstraint[] {
    const constraints: FrameConstraint[] = []

    const traverse = (blocks: CodeBlock[]) => {
      for (const block of blocks) {
        if (block.kind === 'constrain') {
          const variable = block.attributes.var
          const boundary = block.attributes.toBoundary
          const set = block.attributes.toSet

          if (variable && (boundary || set)) {
            constraints.push({
              variable,
              condition: boundary || set
            })
          }
        }
        if (block.children.length > 0) {
          traverse(block.children)
        }
      }
    }

    traverse(blocks)
    return constraints
  }

  public static extractAdaptedFrames(blocks: CodeBlock[], selectedOptions: FrameOption[] = []): FrameAdapt[] {
    const adaptations: FrameAdapt[] = []

    const traverse = (blocks: CodeBlock[]) => {
      for (const block of blocks) {
        if (block.kind === 'option') {
          const optionName = block.attributes.name
          const optionValue = block.attributes.value

          const selectedOption = selectedOptions.find(opt => opt.name === optionName)
          let shouldInclude = false

          if (selectedOption) {
            if (!optionValue && selectedOption.value === 'TRUE') {
              shouldInclude = true
            } else if (optionValue && selectedOption.value === optionValue) {
              shouldInclude = true
            }
          }

          if (shouldInclude && block.children.length > 0) {
            traverse(block.children)
          }
        } else if (block.kind === 'adapt' && block.attributes.frame) {
          adaptations.push({
            frame: block.attributes.frame
          })
        } else if (block.children.length > 0) {
          traverse(block.children)
        }
      }
    }

    traverse(blocks)
    return adaptations
  }

  static analyzeFrames(files: FileNode[]): FrameAnalysisResult {
    let specificationFrame: FileNode | null = null
    const compositionFrames: FileNode[] = []
    const codeFrames: FileNode[] = []

    const specAllowedKinds = ['set', 'select', 'adapt', 'plain', 'frame']
    const composAllowedKinds = ['option', 'constrain', 'adapt', 'plain', 'frame']

    for (const file of files) {
      if (!specificationFrame && this.allBlocksMatchKinds(file.parsed, specAllowedKinds)) {
        if (this.hasBlockKind(file.parsed, ['set']) && this.hasBlockKind(file.parsed, ['select'])) {
          specificationFrame = file
          continue
        }
      }

      if (this.allBlocksMatchKinds(file.parsed, composAllowedKinds)) {
        if (this.hasBlockKind(file.parsed, ['adapt']) && this.hasBlockKind(file.parsed, ['constrain'])) {
          compositionFrames.push(file)
          continue
        }
      }

      if (this.hasBlockKind(file.parsed, ['frame'])) {
        codeFrames.push(file)
      }
    }

    const variables = specificationFrame ? this.extractVariables(specificationFrame.parsed) : []
    const selectedOptions = specificationFrame ? this.extractSelectedOptions(specificationFrame.parsed) : []
    const constraints = this.extractConstraints(compositionFrames.flatMap(f => f.parsed))
    const adaptedFrames = this.extractAdaptedFrames(
      compositionFrames.flatMap(f => f.parsed),
      selectedOptions
    )

    return {
      specificationFrame,
      compositionFrames,
      codeFrames,
      variables,
      selectedOptions,
      constraints,
      adaptedFrames
    }
  }

  static buildReferenceIndex(files: FileNode[]): ReferenceIndex {
    const referenceIndex: ReferenceIndex = {
      frame: {},
      variable: {},
      option: {}
    }

    const variableRefRegex = /<@([a-zA-Z_][a-zA-Z0-9_-]*)>/g

    const traverse = (blocks: CodeBlock[], fileId: string) => {
      for (const block of blocks) {
        if (block.kind === 'frame' && block.attributes.name) {
          const frameName = block.attributes.name
          if (!referenceIndex.frame[frameName]) {
            referenceIndex.frame[frameName] = []
          }
          referenceIndex.frame[frameName].push({ fileId, blockId: block.id })
        } else if (block.kind === 'option' && block.attributes.name) {
          const optionName = block.attributes.name
          if (!referenceIndex.option[optionName]) {
            referenceIndex.option[optionName] = []
          }
          referenceIndex.option[optionName].push({ fileId, blockId: block.id })
        } else if (block.kind === 'plain' && block.content) {
          let match
          while ((match = variableRefRegex.exec(block.content)) !== null) {
            const variableName = match[1]
            if (!referenceIndex.variable[variableName]) {
              referenceIndex.variable[variableName] = []
            }
            referenceIndex.variable[variableName].push({ fileId, blockId: block.id })
          }
        }

        if (block.children.length > 0) {
          traverse(block.children, fileId)
        }
      }
    }

    for (const file of files) {
      traverse(file.parsed, file.id)
    }

    return referenceIndex
  }

  static addBlockToReferenceIndex(referenceIndex: ReferenceIndex, fileId: string, block: CodeBlock): ReferenceIndex {
    const variableRefRegex = /<@([a-zA-Z_][a-zA-Z0-9_-]*)>/g

    const traverse = (block: CodeBlock) => {
      if (block.kind === 'frame' && block.attributes.name) {
        const frameName = block.attributes.name
        if (!referenceIndex.frame[frameName]) {
          referenceIndex.frame[frameName] = []
        }
        if (!referenceIndex.frame[frameName].some(ref => ref.blockId === block.id)) {
          referenceIndex.frame[frameName].push({ fileId, blockId: block.id })
        }
      } else if (block.kind === 'option' && block.attributes.name) {
        const optionName = block.attributes.name
        if (!referenceIndex.option[optionName]) {
          referenceIndex.option[optionName] = []
        }
        if (!referenceIndex.option[optionName].some(ref => ref.blockId === block.id)) {
          referenceIndex.option[optionName].push({ fileId, blockId: block.id })
        }
      } else if (block.kind === 'plain' && block.content) {
        let match
        while ((match = variableRefRegex.exec(block.content)) !== null) {
          const variableName = match[1]
          if (!referenceIndex.variable[variableName]) {
            referenceIndex.variable[variableName] = []
          }
          if (!referenceIndex.variable[variableName].some(ref => ref.blockId === block.id)) {
            referenceIndex.variable[variableName].push({ fileId, blockId: block.id })
          }
        }
      }

      if (block.children.length > 0) {
        for (const child of block.children) {
          traverse(child)
        }
      }
    }

    traverse(block)
    return referenceIndex
  }

  static removeBlockFromReferenceIndex(referenceIndex: ReferenceIndex, block: CodeBlock): ReferenceIndex {
    const traverse = (block: CodeBlock) => {
      for (const key in referenceIndex.frame) {
        referenceIndex.frame[key] = referenceIndex.frame[key].filter(ref => ref.blockId !== block.id)
        if (referenceIndex.frame[key].length === 0) {
          delete referenceIndex.frame[key]
        }
      }

      for (const key in referenceIndex.option) {
        referenceIndex.option[key] = referenceIndex.option[key].filter(ref => ref.blockId !== block.id)
        if (referenceIndex.option[key].length === 0) {
          delete referenceIndex.option[key]
        }
      }

      for (const key in referenceIndex.variable) {
        referenceIndex.variable[key] = referenceIndex.variable[key].filter(ref => ref.blockId !== block.id)
        if (referenceIndex.variable[key].length === 0) {
          delete referenceIndex.variable[key]
        }
      }

      if (block.children.length > 0) {
        for (const child of block.children) {
          traverse(child)
        }
      }
    }

    traverse(block)
    return referenceIndex
  }
}
