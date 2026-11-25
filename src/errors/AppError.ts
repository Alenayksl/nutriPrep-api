export class AppError extends Error {
  public readonly statusCode: number;
  public readonly headers: Record<string, string>;

  constructor(statusCode: number, message: string, headers: Record<string, string> = {}) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.headers = headers;
  }
}
