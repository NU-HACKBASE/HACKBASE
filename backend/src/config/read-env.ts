export const readEnv = (
  key: string,
  fallback?: string,
  processEnv: NodeJS.ProcessEnv = process.env,
): string => {
  const value = processEnv[key] ?? fallback

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}
