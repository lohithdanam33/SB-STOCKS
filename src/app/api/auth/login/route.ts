import { NextResponse } from "next/server";
import { connectDB } from "@/db";
import { User } from "@/db/models";
import { comparePassword, generateToken } from "@/lib/auth";
import { seedDatabaseIfNeeded } from "@/lib/seed";
import { serializeUser } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await seedDatabaseIfNeeded();
    await connectDB();
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: serializeUser(user),
    });

    response.cookies.set("sb_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (err: unknown) {
    console.error("Login Error:", err);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
