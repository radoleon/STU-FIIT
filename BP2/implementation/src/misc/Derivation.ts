import type { CodeBlock } from '@/models/CodeBlock'
import type { DirectoryNode, FileNode } from '@/models/DirectoryTree'
import type { FrameAdapt, FrameConstraint, FrameOption, FrameVariable, ReferenceIndex } from '@/models/Frame'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'

export class Derivation {
  public static exportDocumentation(
    directoryName: string | undefined,
    title: string,
    description: string,
    generatedAt: string,
    variables: FrameVariable[],
    selectedOptions: FrameOption[],
    constraints: FrameConstraint[],
    adaptedFrames: FrameAdapt[],
    refIndex: ReferenceIndex | undefined,
    showValues: Record<string, boolean>,
    showFiles: Record<string, boolean>,
    textareaRefs: Record<string, HTMLTextAreaElement | null>
  ): void {
    const lines: string[] = []

    lines.push(`# ${title}`, '')
    lines.push(`Generated: ${generatedAt}`, '')

    if (description) {
      lines.push(...description.split('\n').map(x => `> ${x}`), '')
    }

    const addSection = (heading: string, items: { key: string; name: string; value?: string; refs: string[] }[]) => {
      if (items.length === 0) return
      lines.push(`### ${heading}`, '---', '')

      for (const item of items) {
        lines.push(`#### ${item.name}`, '')

        if (item.value && (showValues[item.key] ?? true)) {
          lines.push(`**Value:** ${item.value}`, '')
        }

        const desc = textareaRefs[item.key]?.value?.trim()
        if (desc) {
          lines.push(...desc.split('\n').map(x => `> ${x}`), '')
        }

        if (item.refs.length > 0 && (showFiles[item.key] ?? true)) {
          lines.push('**Referenced in:**')
          for (const ref of item.refs) {
            lines.push(`- ${decodeURIComponent(ref).split('/').slice(1).join('/')}`)
          }
          lines.push('')
        }

        lines.push('---', '')
      }
    }

    addSection(
      'Variables',
      variables.map(v => ({
        key: `v:${v.name}`,
        name: v.name,
        value: v.value,
        refs: [...new Set((refIndex?.variable[v.name] ?? []).map(r => r.fileId))]
      }))
    )

    addSection(
      'Selected Options',
      selectedOptions.map(o => ({
        key: `o:${o.name}`,
        name: o.name,
        value: o.value,
        refs: [...new Set((refIndex?.option[o.name] ?? []).map(r => r.fileId))]
      }))
    )

    addSection(
      'Constraints',
      constraints.map(c => ({
        key: `c:${c.variable}`,
        name: c.variable,
        value: Derivation.formatCondition(c.condition),
        refs: []
      }))
    )

    addSection(
      'Adapted Frames',
      adaptedFrames.map(f => ({
        key: `f:${f.frame}`,
        name: f.frame,
        refs: [...new Set((refIndex?.frame[f.frame] ?? []).map(r => r.fileId))]
      }))
    )

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' })
    saveAs(blob, `${directoryName || 'spl'}-documentation.md`)
  }

  public static buildFileContent(
    parsed: CodeBlock[],
    variables: FrameVariable[],
    selectedOptions: FrameOption[],
    adaptedFrames: FrameAdapt[]
  ): string {
    const variableRefRegex = /<@([a-zA-Z_][a-zA-Z0-9_-]*)>/g

    const replaceVariables = (text: string): string => {
      return text.replace(variableRefRegex, (match, varName: string) => {
        const config = variables.find(v => v.name === varName)
        return config?.value ?? match
      })
    }

    const lines: string[] = []

    const traverseBlocks = (blocks: CodeBlock[]): void => {
      for (const block of blocks) {
        if (block.kind === 'frame') {
          const adapted = adaptedFrames.find(f => f.frame === block.attributes.name)
          if (adapted) {
            traverseBlocks(block.children)
          }
        } else if (block.kind === 'option') {
          const selectedOption = selectedOptions.find(o => o.name === block.attributes.name)
          let shouldInclude = false

          if (selectedOption) {
            if (!block.attributes.value && selectedOption.value === 'TRUE') {
              shouldInclude = true
            } else if (block.attributes.value && selectedOption.value === block.attributes.value) {
              shouldInclude = true
            }
          }

          if (shouldInclude) {
            traverseBlocks(block.children)
          }
        } else if (block.kind === 'plain') {
          if (block.content && block.content.trim()) {
            lines.push(replaceVariables(block.content))
          }
        }
      }
    }

    traverseBlocks(parsed)
    return lines.join('\n')
  }

  private static async _collectFiles(
    node: DirectoryNode | FileNode,
    excludedFileIds: Set<string>,
    result: FileNode[]
  ): Promise<void> {
    if (!node.isDir) {
      if (!excludedFileIds.has(node.id)) {
        result.push(node)
      }
      return
    }
    for (const child of node.children) {
      await this._collectFiles(child, excludedFileIds, result)
    }
  }

  public static async deriveProduct(
    directoryTree: DirectoryNode,
    excludedFileIds: Set<string>,
    variables: FrameVariable[],
    selectedOptions: FrameOption[],
    adaptedFrames: FrameAdapt[]
  ): Promise<void> {
    const files: FileNode[] = []
    await this._collectFiles(directoryTree, excludedFileIds, files)

    const zip = new JSZip()
    const rootPrefix = directoryTree.name + '/'

    for (const file of files) {
      const content = this.buildFileContent(file.parsed, variables, selectedOptions, adaptedFrames)

      if (!content.trim()) continue

      const zipPath = file.fullPath.startsWith(rootPrefix) ? file.fullPath.slice(rootPrefix.length) : file.fullPath

      zip.file(zipPath, content)
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    saveAs(blob, directoryTree.name + '-derived.zip')
  }

  public static formatCondition(condition: string): string {
    if (/^\d+,\d+$/.test(condition)) {
      const [min, max] = condition.split(',')
      return `Range: ${min} - ${max}`
    }
    return `Allowed: ${condition.split(',').join(', ')}`
  }
}
