import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/generations/[id]/iterations — save a completed iteration
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: generationId } = await params;

  const generation = await db.generation.findUnique({ where: { id: generationId } });
  if (!generation || generation.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { iterationNum, prompt, videoUrl, scores, healed, userRemarks, accepted } =
    await req.json();

  const iteration = await db.iteration.create({
    data: {
      generationId,
      iterationNum,
      prompt,
      videoUrl,
      scores,
      healed: healed ?? false,
      userRemarks: userRemarks ?? null,
      accepted: accepted ?? false,
    },
  });

  return NextResponse.json(iteration, { status: 201 });
}
