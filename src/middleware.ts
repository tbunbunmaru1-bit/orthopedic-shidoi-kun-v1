import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // APIルートとログインページは認証不要
  if (pathname.startsWith("/api/") || pathname === "/login") {
    return NextResponse.next();
  }

  const auth = request.cookies.get("auth")?.value;
  const password = process.env.APP_PASSWORD || "shidoi2024";

  if (auth !== password) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
