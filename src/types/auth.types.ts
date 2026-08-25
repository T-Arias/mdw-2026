export type UserRole = "ADMIN" | "USER";

export interface JwtAccessPayload {
  userId: string;
  role: UserRole;
}

export interface JwtRefreshPayload {
  userId: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: UserRole;
    }
  }
}
