import "server-only";

/** Error layanan yang langsung bisa diterjemahkan ke respons HTTP. */
export class ServiceError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}
