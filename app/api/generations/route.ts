import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/generations — list user's generation history
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const generations = await db.generation.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      iterations: {
        orderBy: { iterationNum: "asc" },
      },
    },
    take: 50,
  });

  return NextResponse.json(generations);
}

// POST /api/generations — create a new generation record
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prompt } = await req.json();
  if (!prompt) {
    return NextResponse.json({ error: "prompt required" }, { status: 400 });
  }

  const generation = await db.generation.create({
    data: { userId: session.user.id, prompt, status: "running" },
  });

  return NextResponse.json(generation, { status: 201 });
}
