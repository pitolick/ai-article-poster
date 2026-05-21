export class AIArticlePosterError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'AIArticlePosterError';
  }
}

export class ClaudeRequestError extends AIArticlePosterError {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown, cause?: unknown) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = 'ClaudeRequestError';
    this.status = status;
    this.body = body;
  }
}
