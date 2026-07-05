export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const errorBody = (error: ApiError) => ({
  error: {
    code: error.code,
    message: error.message,
  },
})
