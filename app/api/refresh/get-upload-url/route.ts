/**
 * POST /api/refresh/get-upload-url
 *
 * Devuelve una signed URL para subir el .xlsx directo a Supabase Storage,
 * bypassando los límites de body de Vercel.
 *
 * Protegido por Basic Auth (middleware).
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST() {
  try {
    const supa = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const path = `incoming/VASS-${Date.now()}.xlsx`;

    const { data, error } = await supa.storage
      .from("vass-uploads")
      .createSignedUploadUrl(path);

    if (error || !data) {
      return NextResponse.json(
        { ok: false, error: "SIGNED_URL_ERROR", message: error?.message ?? "no data" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      path: data.path,
      token: data.token,
      signedUrl: data.signedUrl,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[get-upload-url] error:", err);
    return NextResponse.json({ ok: false, error: "EXCEPTION", message: msg }, { status: 500 });
  }
}
