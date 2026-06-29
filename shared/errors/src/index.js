export class AppError extends Error {
  constructor(code, message, { status = 500, cause, details } = {}) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.cause = cause;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message, details) {
    super("VALIDATION_ERROR", message, { status: 400, details });
  }
}

export class NotFoundError extends AppError {
  constructor(resource) {
    super("NOT_FOUND", `${resource} not found`, { status: 404 });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "authentication required") {
    super("UNAUTHORIZED", message, { status: 401 });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "forbidden") {
    super("FORBIDDEN", message, { status: 403 });
  }
}

export class ConflictError extends AppError {
  constructor(message) {
    super("CONFLICT", message, { status: 409 });
  }
}

export class RateLimitedError extends AppError {
  constructor(retryAfter) {
    super("RATE_LIMITED", "too many requests", { status: 429, details: { retryAfter } });
  }
}
