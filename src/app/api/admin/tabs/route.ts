import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt-server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("authToken")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (payload.categoria !== "Admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("abas")
      .select("*")
      .order("nome");
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET /api/admin/tabs error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("authToken")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (payload.categoria !== "Admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id, habilitada } = await request.json();
    if (!id || typeof habilitada !== "boolean")
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("abas")
      .update({ habilitada, atualizado_em: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/admin/tabs error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
