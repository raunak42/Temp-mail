import { compare } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { assertCoreConfig, env, hasCoreConfig } from "@/lib/env";

const SESSION_COOKIE = "mailroom_session";
const encoder = new TextEncoder();

type SessionPayload = {
  sub: "admin";
};

function getSecret() {
  assertCoreConfig();
  return encoder.encode(env.authSecret!);
}

export async function verifyPassword(password: string) {
  if (!hasCoreConfig()) {
    return false;
  }

  return compare(password, env.adminPasswordHash!);
}

export async function createSession() {
  const token = await new SignJWT({ sub: "admin" } satisfies SessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.appUrl.startsWith("https://"),
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession() {
  if (!hasCoreConfig()) {
    return null;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());

    if (payload.sub !== "admin") {
      return null;
    }

    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireApiSession() {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
}
