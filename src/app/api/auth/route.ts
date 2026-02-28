import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = await request.json();
  const correct = (process.env.APP_PASSWORD || "shidoi2024").trim();

  if (password !== correct) {
    return NextResponse.json({ error: "パスワードが違います" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("auth", correct, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30日間
    path: "/",
  });
  return response;
}
