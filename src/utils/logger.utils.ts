const chalkImport = import('chalk')

export const logger = {
  info: async (msg: string) => console.log((await chalkImport).default.grey(`[INFO] ${msg}`)),
  success: async (msg: string) => console.log((await chalkImport).default.green(`[SUCCESS] ${msg}`)),
  error: async (msg: string) => console.log((await chalkImport).default.red(`[ERROR] ${msg}`)),
  warning: async (msg: string) => console.log((await chalkImport).default.yellow(`[WARNING] ${msg}`))
}
