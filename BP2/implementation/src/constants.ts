export const NAVBAR_HEIGHT_PX = 64

interface FileInfo {
  allowedExtensions: string[]
  iconClass: string
  syntaxLanguage: string
}

export const FILE_TYPES: Record<string, FileInfo> = {
  cpp: {
    allowedExtensions: ['.c', '.cpp', '.h', '.hpp'],
    iconClass: 'devicon-cplusplus-plain colored',
    syntaxLanguage: 'cpp'
  },
  js: {
    allowedExtensions: ['.js', '.ts', '.jsx', '.tsx'],
    iconClass: 'devicon-javascript-plain colored',
    syntaxLanguage: 'javascript'
  },
  cs: {
    allowedExtensions: ['.cs', '.csproj', '.vb', '.fs'],
    iconClass: 'devicon-dotnetcore-plain colored',
    syntaxLanguage: 'csharp'
  },
  java: {
    allowedExtensions: ['.java', '.aj'],
    iconClass: 'devicon-java-plain colored',
    syntaxLanguage: 'java'
  },
  python: {
    allowedExtensions: ['.py', '.pyw'],
    iconClass: 'devicon-python-plain colored',
    syntaxLanguage: 'python'
  },
  rust: {
    allowedExtensions: ['.rs'],
    iconClass: 'devicon-rust-plain colored',
    syntaxLanguage: 'rust'
  },
  php: {
    allowedExtensions: ['.php', '.phtml'],
    iconClass: 'devicon-php-plain colored',
    syntaxLanguage: 'php'
  }
}

export const MODEL_NODE_COLORS = {
  root: '#E2E8F0',
  optionalFeature: '#22C55E',
  mandatoryFeature: '#22C55E',
  module: '#805AD5'
}

export const MODEL_LEGEND = [
  { color: MODEL_NODE_COLORS.optionalFeature, label: 'Optional Feature', hollow: true },
  { color: MODEL_NODE_COLORS.mandatoryFeature, label: 'Mandatory Feature', hollow: false },
  { color: MODEL_NODE_COLORS.module, label: 'Module', hollow: false }
]
