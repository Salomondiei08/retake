import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

// PATCH /api/generations/[id] — mark done, set best score
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status, bestScore } = await req.json();

  const supabase = await createServerSupabaseClient();

  // Verify ownership before updating
  const { data: gen } = await supabase
    .from("generations")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!gen || gen.user_id !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("generations")
    .update({ status, best_score: bestScore })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
