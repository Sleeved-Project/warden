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
  user: {
    id: string
    email: string
    fullName: string | null
  }
  token: string
  type: string
}

export interface UserPayload {
  id: string
  email: string
  fullName: string | null
}
