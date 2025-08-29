export interface RegisterData {
  email: string
  password: string
  username?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface TokenResponse {
  user: UserPayload
  token: string
  refreshToken: string
  type: string
}

export interface TokenRefreshResponse {
  token: string
  type: string
}

export interface UserPayload {
  id: string
  email: string
  username: string | null
  isVerified: boolean
  role: UserRole
}

export interface RegisterResponse {
  user: UserPayload
  requiresVerification: boolean
  message: string
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}
