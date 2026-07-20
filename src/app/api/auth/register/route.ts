import { NextResponse } from "next/server";
import { connectDB } from "@/db";
import { User } from "@/db/models";
import { hashPassword, generateToken } from "@/lib/auth";
import { seedDatabaseIfNeeded } from "@/lib/seed";
import { serializeUser } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await seedDatabaseIfNeeded();
    await connectDB();
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "user",
      virtualBalance: 100000,
    });

    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    });

    const response = NextResponse.json({
      success: true,
      message: "Registration successful! Welcome to SB Stocks.",
      user: serializeUser(newUser),
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
    console.error("Register Error:", err);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
