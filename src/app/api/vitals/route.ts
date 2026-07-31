import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    name: string;
    value: number;
    id: string;
    rating: string;
    path: string;
    timestamp: number;
  };

  console.log(JSON.stringify({ type: "web-vital", ...body }));

  return NextResponse.json({ ok: true });
}
