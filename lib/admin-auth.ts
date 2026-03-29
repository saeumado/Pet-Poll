import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getServerEnv } from "@/lib/env";

const COOKIE_NAME = "dachshund-admin-session";

function createSignature(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function createSessionToken(secret: string) {
  const payload = "admin";
  const signature = createSignature(payload, secret);
  return `${payload}.${signature}`;
}

function isValidToken(token: string | undefined, secret: string) {
  if (!token) {
    return false;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return false;
  }

  const expected = createSignature(payload, secret);
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const { adminSessionSecret } = getServerEnv();

  return isValidToken(token, adminSessionSecret);
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  const { adminSessionSecret } = getServerEnv();

  cookieStore.set(COOKIE_NAME, createSessionToken(adminSessionSecret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
