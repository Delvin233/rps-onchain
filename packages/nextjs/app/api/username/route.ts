import { NextResponse } from "next/server";
import { getUsername, setUsername } from "../../../lib/userStore";

export async function POST(request: Request) {
  const { address, username } = await request.json();

  if (!address || !username) {
    return NextResponse.json({ error: "Address and username required" }, { status: 400 });
  }

  setUsername(address, username);
  return NextResponse.json({ success: true });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Address required" }, { status: 400 });
  }

  const username = getUsername(address);
  return NextResponse.json({ username });
}
