import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { unlockMountain } from "@/lib/gamification/mountain-unlocks";

type RouteContext = { params: Promise<{ mountainId: string }> };

const getBearerToken = (request: Request) => {
  const authorization = request.headers.get("authorization");
  return authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;
};

export async function POST(request: Request, { params }: RouteContext) {
  const token = getBearerToken(request);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    return NextResponse.json(
      { error: "Progression is unavailable." },
      { status: 503 },
    );
  if (!token)
    return NextResponse.json(
      { error: "Authentication is required." },
      { status: 401 },
    );

  const client = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser(token);
  if (userError || !user)
    return NextResponse.json(
      { error: "Authentication is required." },
      { status: 401 },
    );

  try {
    return NextResponse.json(
      await unlockMountain(client, (await params).mountainId),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to unlock mountain.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
