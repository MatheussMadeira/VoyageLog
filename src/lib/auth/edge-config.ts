import type { NextAuthConfig } from "next-auth";

/**
 * Config mínimo para a Edge Runtime (middleware/proxy).
 * Não importa nada do Node.js (mongoose, bcrypt, etc.).
 * Usa apenas o JWT já presente nos cookies para checar se o usuário está logado.
 */
export const edgeAuthConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: "/auth",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname.startsWith("/auth");

      // Redireciona autenticados que tentam acessar /auth
      if (isLoggedIn && isAuthPage) {
        return Response.redirect(new URL("/", nextUrl));
      }

      // Bloqueia não autenticados fora de /auth
      if (!isLoggedIn && !isAuthPage) {
        return false;
      }

      return true;
    },
  },
};
