export interface ParseErrorLocation {
  filePath: string
  fileName: string
  line?: number
  column?: number
}

export class ParseError extends Error {
  public readonly location: ParseErrorLocation

  constructor(location: ParseErrorLocation, message: string) {
    super(message)
    this.location = location
  }
}
