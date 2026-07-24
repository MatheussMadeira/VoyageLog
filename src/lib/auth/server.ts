/**
 * Instância centralizada do NextAuth para uso no servidor (Server Actions, Server Components).
 * Não importar em edge runtime — use lib/auth/edge-config.ts lá.
 */
import NextAuth from "next-auth";
import { authConfig } from "./config";

export const {
  auth,
  signIn: serverSignIn,
  signOut: serverSignOut,
  handlers,
} = NextAuth(authConfig);
