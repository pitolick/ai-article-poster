export class AIArticlePosterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIArticlePosterError';
  }
}

export class ClaudeRequestError extends AIArticlePosterError {
  readonly status: number;
  readonly body: unknown;
  readonly cause?: unknown;

  constructor(message: string, status: number, body: unknown, cause?: unknown) {
    super(message);
    this.name = 'ClaudeRequestError';
    this.status = status;
    this.body = body;
    this.cause = cause;
  }
}
