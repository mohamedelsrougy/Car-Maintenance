export class ApiError extends Error {
  readonly statusCode: number;
  readonly isOperational: boolean;
  readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
