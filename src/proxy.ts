import NextAuth from "next-auth";
import { edgeAuthConfig } from "@/lib/auth/edge-config";

export const proxy = NextAuth(edgeAuthConfig).auth;

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|icon.png|icon-192.png|icon-512.png).*)",
  ],
};