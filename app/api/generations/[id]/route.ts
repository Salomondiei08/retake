import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// PATCH /api/generations/[id] — mark done, set best score
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status, bestScore } = await req.json();

  const generation = await db.generation.findUnique({ where: { id } });
  if (!generation || generation.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await db.generation.update({
    where: { id },
    data: { status, bestScore },
  });

  return NextResponse.json(updated);
}
