import { NextRequest, NextResponse } from "next/server";
import { Errors, createClient } from "@farcaster/quick-auth";
import * as jose from "jose";
import { fetchFarcasterUser } from "~~/lib/neynar";

export const dynamic = "force-dynamic";

const quickAuthClient = createClient();

export const POST = async (req: NextRequest) => {
  const { token: farcasterToken } = await req.json();
  let fid: number;
  let isValidSignature = false;

  try {
    const payload = await quickAuthClient.verifyJwt({
      domain: new URL(process.env.NEXT_PUBLIC_URL || "https://www.rpsonchain.xyz").hostname,
      token: farcasterToken,
    });
    isValidSignature = !!payload;
    fid = Number(payload.sub);
  } catch (e) {
    if (e instanceof Errors.InvalidTokenError) {
      console.error("Invalid token", e);
    }
    return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
  }

  if (!isValidSignature || !fid) {
    return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
  }

  const user = await fetchFarcasterUser(fid.toString(), process.env.NEYNAR_API_KEY || "");

  const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");
  const token = await new jose.SignJWT({ fid, timestamp: Date.now() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const response = NextResponse.json({ success: true, user });
  response.cookies.set({
    name: "farcaster_auth",
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return response;
};
