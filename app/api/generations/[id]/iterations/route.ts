import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

// POST /api/generations/[id]/iterations — save a completed iteration
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: generationId } = await params;
  const supabase = await createServerSupabaseClient();

  // Verify generation ownership
  const { data: gen } = await supabase
    .from("generations")
    .select("user_id")
    .eq("id", generationId)
    .single();

  if (!gen || gen.user_id !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { iterationNum, prompt, videoUrl, scores, healed, userRemarks, accepted } =
    await req.json();

  const { data, error } = await supabase
    .from("iterations")
    .insert({
      generation_id: generationId,
      iteration_num: iterationNum,
      prompt,
      video_url: videoUrl,
      scores,
      healed: healed ?? false,
      user_remarks: userRemarks ?? null,
      accepted: accepted ?? false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
