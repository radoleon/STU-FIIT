import type { BlockType, CodeBlock } from '@/models/CodeBlock'
import type { FileNode } from '@/models/DirectoryTree'
import { ParseError } from '@/models/ParseError'
import { XMLBuilder, XMLParser, XMLValidator, type X2jOptions, type XmlBuilderOptions } from 'fast-xml-parser'
import { nanoid } from 'nanoid'

const PARSER_OPTIONS: X2jOptions = {
  preserveOrder: true,
  ignoreAttributes: false,
  processEntities: false,
  trimValues: false,
  attributeNamePrefix: ''
}

const BUILDER_OPTIONS: XmlBuilderOptions = {
  preserveOrder: true,
  ignoreAttributes: false,
  processEntities: false,
  format: false,
  attributeNamePrefix: '',
  suppressEmptyNode: true
}

export class Parser {
  private readonly _xmlParser: XMLParser
  private readonly _xmlBuilder: XMLBuilder

  constructor() {
    this._xmlParser = new XMLParser(PARSER_OPTIONS)
    this._xmlBuilder = new XMLBuilder(BUILDER_OPTIONS)
  }

  private _escapeXmlTags(content: string): string {
    const lines: string[] = content.split('\n')

    const regex = /<.*?(plain|option|select|set|constrain|frame|adapt).*?>/
    const result: string[] = []

    for (const line of lines) {
      if (regex.test(line)) {
        result.push(line)
      } else {
        result.push(line.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'))
      }
    }

    return result.join('\n')
  }

  private _unescapeXmlTags(content: string): string {
    return content.replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>')
  }

  private _recurseParsedNodes(nodes: Record<string, any>[], cursor: { pos: number }): CodeBlock[] {
    const result: CodeBlock[] = []

    for (const node of nodes) {
      if (Object.keys(node).length === 1 && node['#text']) {
        const raw = this._unescapeXmlTags(String(node['#text']))
        const formatted = raw.replace(/^\n+/, '').replace(/\n+$/, '')

        if (!formatted.trim()) continue

        const linesCount = formatted.split('\n').length

        result.push({
          id: nanoid(),
          kind: 'plain',
          editMode: false,
          originalContent: formatted,
          content: formatted,
          attributes: {},
          children: [],
          offset: cursor.pos,
          length: linesCount
        })

        cursor.pos += linesCount
      } else {
        const tagName = Object.keys(node).find(k => k !== ':@' && k !== '#text')!

        const block: Partial<CodeBlock> = {
          id: nanoid(),
          kind: tagName as BlockType,
          originalContent: null,
          content: null,
          attributes: node[':@'] ?? {},
          offset: cursor.pos,
          length: 0
        }

        block.children = this._recurseParsedNodes(node[tagName] ?? [], cursor)

        result.push(block as CodeBlock)
      }
    }

    return result
  }

  private _recurseBuiltNodes(blocks: CodeBlock[]): Record<string, any>[] {
    const result: Record<string, any>[] = []

    for (const block of blocks) {
      if (block.kind === 'plain') {
        result.push({ '#text': block.content ?? '' })
      } else {
        result.push({ '#text': '\n' })
        const node: Record<string, any> = {}
        const attrs = block.attributes ?? {}

        if (Object.keys(attrs).length > 0) {
          node[':@'] = attrs
        }

        const builtChildren = this._recurseBuiltNodes(block.children ?? [])
        node[block.kind] = builtChildren.length > 0 ? [{ '#text': '\n' }, ...builtChildren, { '#text': '\n' }] : []

        result.push(node)
        result.push({ '#text': '\n' })
      }
    }

    return result
  }

  public parseFile(content: string, filePath?: string, fileName?: string): Record<string, any>[] {
    const wrapped = `<xml>\n${this._escapeXmlTags(content)}\n</xml>`

    if (filePath && fileName) {
      const result = XMLValidator.validate(wrapped, { allowBooleanAttributes: true })

      if (result !== true) {
        throw new ParseError({ filePath, fileName, line: result.err.line, column: result.err.col }, result.err.msg)
      }
    }

    const parsed = this._xmlParser.parse(wrapped)
    return parsed[0]['xml']
  }

  public rebuildBlocksFromParserResult(parserResult: Record<string, any>[]): CodeBlock[] {
    return this._recurseParsedNodes(parserResult, { pos: 0 })
  }

  public buildFile(file: FileNode): string {
    const reconstructed = this._recurseBuiltNodes(file.parsed)
    const built: string = this._xmlBuilder.build([{ xml: reconstructed }])

    return built.replace(/^<xml>\n?/, '').replace(/\n?<\/xml>$/, '')
  }
}
