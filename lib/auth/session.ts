import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

export const PARTICIPANT_SESSION_COOKIE = "ff_participant_session";
export const STAFF_SESSION_COOKIE = "ff_staff_session";

// --- Types ---

export interface ParticipantSessionData {
  role: "participant";
  participantId: string;
  participantCode: string;
  name: string;
}

export interface StaffSessionData {
  role: "staff";
  selectedStaffId?: string;
  selectedStaffName?: string;
}

// --- Helpers ---

function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET env var must be at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

function getCookieOptions(isProduction: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
  };
}

// --- Encode ---

export async function encodeParticipantSession(data: ParticipantSessionData): Promise<string> {
  const secret = getSessionSecret();
  return new SignJWT({ ...data } as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

export async function encodeStaffSession(data: StaffSessionData): Promise<string> {
  const secret = getSessionSecret();
  return new SignJWT({ ...data } as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

// --- Decode / Verify ---

export async function verifyParticipantSession(): Promise<ParticipantSessionData | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(PARTICIPANT_SESSION_COOKIE)?.value;
    if (!token) return null;

    const secret = getSessionSecret();
    const { payload } = await jwtVerify(token, secret);

    if (payload.role !== "participant" || !payload.participantId || !payload.participantCode) {
      return null;
    }

    return {
      role: "participant",
      participantId: payload.participantId as string,
      participantCode: payload.participantCode as string,
      name: (payload.name as string) || "",
    };
  } catch {
    return null;
  }
}

export async function verifyStaffSession(): Promise<StaffSessionData | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(STAFF_SESSION_COOKIE)?.value;
    if (!token) return null;

    const secret = getSessionSecret();
    const { payload } = await jwtVerify(token, secret);

    if (payload.role !== "staff") {
      return null;
    }

    return {
      role: "staff",
      selectedStaffId: (payload.selectedStaffId as string) || undefined,
      selectedStaffName: (payload.selectedStaffName as string) || undefined,
    };
  } catch {
    return null;
  }
}

// --- Set / Clear Cookies ---

export async function setParticipantSessionCookie(token: string) {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";
  cookieStore.set(PARTICIPANT_SESSION_COOKIE, token, {
    ...getCookieOptions(isProduction),
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

export async function clearParticipantSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(PARTICIPANT_SESSION_COOKIE);
}

export async function setStaffSessionCookie(token: string) {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";
  cookieStore.set(STAFF_SESSION_COOKIE, token, {
    ...getCookieOptions(isProduction),
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

export async function clearStaffSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(STAFF_SESSION_COOKIE);
}
