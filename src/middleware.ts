import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;

  if (!req.auth && nextUrl.pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.href);
    return Response.redirect(loginUrl);
  }

  if (req.auth && nextUrl.pathname === "/") {
    return Response.redirect(new URL("/dashboard", nextUrl.origin));
  }
});

export const config = { matcher: ["/dashboard/:path*", "/"] };
