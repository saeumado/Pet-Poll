import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getServerEnv } from "@/lib/env";

const COOKIE_NAME = "dachshund-admin-session";
const LOGIN_STATE_COOKIE = "dachshund-admin-login-state";
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 60 * 5;

type LoginState = {
  failedAttempts: number;
  lockedUntil: number;
};

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

async function getLoginState() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOGIN_STATE_COOKIE)?.value;

  if (!raw) {
    return {
      failedAttempts: 0,
      lockedUntil: 0,
    } satisfies LoginState;
  }

  const [attemptsText, lockedUntilText] = raw.split(".");
  const failedAttempts = Number(attemptsText);
  const lockedUntil = Number(lockedUntilText);

  return {
    failedAttempts: Number.isFinite(failedAttempts) ? failedAttempts : 0,
    lockedUntil: Number.isFinite(lockedUntil) ? lockedUntil : 0,
  } satisfies LoginState;
}

async function setLoginState(state: LoginState) {
  const cookieStore = await cookies();

  cookieStore.set(LOGIN_STATE_COOKIE, `${state.failedAttempts}.${state.lockedUntil}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: LOCKOUT_SECONDS,
  });
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

  cookieStore.set(LOGIN_STATE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
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

export async function getAdminLoginCooldownSeconds() {
  const state = await getLoginState();
  const seconds = Math.ceil((state.lockedUntil - Date.now()) / 1000);

  return seconds > 0 ? seconds : 0;
}

export async function registerFailedAdminLogin() {
  const state = await getLoginState();
  const cooldownSeconds = Math.ceil((state.lockedUntil - Date.now()) / 1000);

  if (cooldownSeconds > 0) {
    return cooldownSeconds;
  }

  const failedAttempts = state.failedAttempts + 1;
  const lockedUntil = failedAttempts >= MAX_FAILED_ATTEMPTS ? Date.now() + LOCKOUT_SECONDS * 1000 : 0;

  await setLoginState({
    failedAttempts: lockedUntil ? 0 : failedAttempts,
    lockedUntil,
  });

  return lockedUntil ? LOCKOUT_SECONDS : 0;
}
