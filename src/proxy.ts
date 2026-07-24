import NextAuth from "next-auth";
import { edgeAuthConfig } from "@/lib/auth/edge-config";

export default NextAuth(edgeAuthConfig).auth;

export const config = {
  matcher: [
    // Aplica o proxy em todas as rotas exceto assets estáticos e API do auth
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
