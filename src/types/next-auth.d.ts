import { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: 'ADMIN' | 'SELLER' | 'BUYER'
      companyName?: string | null
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: 'ADMIN' | 'SELLER' | 'BUYER'
    companyName?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: 'ADMIN' | 'SELLER' | 'BUYER'
    companyName?: string | null
  }
}
