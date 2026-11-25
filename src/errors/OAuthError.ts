export type OAuthErrorCode =
  | "invalid_request"
  | "invalid_client"
  | "invalid_grant"
  | "unauthorized_client"
  | "unsupported_grant_type"
  | "invalid_scope";

export class OAuthError extends Error {
  public readonly statusCode: number;

  constructor(public readonly code: OAuthErrorCode, description: string) {
    super(description);
    this.name = "OAuthError";
    this.statusCode = code === "invalid_client" ? 401 : 400;
  }
}
