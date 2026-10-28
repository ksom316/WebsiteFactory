export class MissingEnvError extends Error {
  constructor(name: string) {
    super(`Missing required environment variable: ${name}`)
    this.name = 'MissingEnvError'
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new MissingEnvError(name)
  return value
}

export function isProduction(): boolean {
  return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'
}
