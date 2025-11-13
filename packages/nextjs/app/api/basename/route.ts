import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ name: null });
    }

    const response = await fetch(`https://resolver-api.basename.app/v1/name/${address}`);
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ name: data.name || null });
    }

    return NextResponse.json({ name: null });
  } catch {
    return NextResponse.json({ name: null });
  }
}
