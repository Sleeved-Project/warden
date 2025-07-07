export interface RegisterData {
  email: string
  password: string
  fullName?: string
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
  expiresIn: number
}

export interface UserPayload {
  id: string
  email: string
  fullName: string | null
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
