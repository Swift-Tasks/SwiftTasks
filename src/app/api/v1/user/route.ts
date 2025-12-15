import { NextRequest, NextResponse } from "next/server";
import { authenticateBearer } from "@/lib/bearer-auth";

export async function GET(request: NextRequest) {
  const auth = await authenticateBearer(request);

  if (!auth.authenticated) {
    return NextResponse.json(
      { error: auth.error || "Unauthorized" },
      { status: 401 }
    );
  }

  const { user } = auth;

  return NextResponse.json({
    id: user!.id,
    name: user!.name,
    email: user!.email,
    emailVerified: user!.emailVerified,
    image: user!.image,
    theme: user!.theme,
    createdAt: user!.createdAt,
  });
}
