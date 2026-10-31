export class AuthError extends Error {
  constructor(message: string, public code: string, public statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor(message: string = 'Invalid username or password') {
    super(message, 'INVALID_CREDENTIALS', 401);
  }
}

export class AccountLockedError extends AuthError {
  constructor(message: string = 'Account temporarily locked due to excessive failed attempts') {
    super(message, 'ACCOUNT_LOCKED', 429);
  }
}

export class SessionExpiredError extends AuthError {
  constructor(message: string = 'Authentication session has expired') {
    super(message, 'SESSION_EXPIRED', 401);
  }
}

export class UnauthorizedError extends AuthError {
  constructor(message: string = 'You do not have permission to access this resource') {
    super(message, 'UNAUTHORIZED', 403);
  }
}
