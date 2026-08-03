import { NextResponse } from "next/server";
import { ADMIN_PIN } from "@/lib/admin-auth";

// Deletes a feedback row. Guarded by the admin PIN and executed server-side
// with the Supabase service-role key, so feedback can be moderated without
// opening a public delete policy on the table.
export async function DELETE(request: Request) {
  const body = await request.json().catch(() => null);
  const id = body?.id as string | undefined;
  const pin = body?.pin as string | undefined;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
  }
  if (pin !== ADMIN_PIN) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ ok: false, error: "Server not configured" }, { status: 500 });
  }

  const res = await fetch(`${url}/rest/v1/feedback?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "return=minimal",
    },
  });

  if (!res.ok) {
    return NextResponse.json({ ok: false, error: "Delete failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
