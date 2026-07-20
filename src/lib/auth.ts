import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { connectDB } from "@/db";
import { User, IUser } from "@/db/models";

const JWT_SECRET = process.env.JWT_SECRET || "sb-stocks-trading-secret-key-2026";

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export type AuthUser = IUser & { id: string };

export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sb_token")?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    await connectDB();
    const user = await User.findById(decoded.userId);
    if (!user) return null;

    // Returning the live document (not lean/toObject) keeps the `.id`
    // virtual working, matching the old Drizzle `user.id` contract used
    // throughout the API routes.
    return user as unknown as AuthUser;
  } catch (error) {
    console.error("Auth verification error:", error);
    return null;
  }
}
