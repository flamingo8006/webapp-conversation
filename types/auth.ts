export interface User {
  loginId: string
  empNo: string
  name: string
  role: 'user' | 'admin'
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (loginId: string, password: string) => Promise<void>
  logout: () => Promise<void>
}
