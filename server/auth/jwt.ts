import { SignJWT, jwtVerify } from "jose";

const secretValue = process.env.JWT_SECRET;

if (!secretValue) {
  throw new Error("JWT_SECRET is missing in environment variables.");
}

const secret = new TextEncoder().encode(secretValue);

type SessionPayload = {
  userId: string;
  email: string;
  role: "STUDENT" | "ADMIN" | "SUB_ADMIN";
};

export async function signSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as SessionPayload;
}
