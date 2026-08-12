import { NextResponse } from "next/server";
import { evidenceMime, loadEvidence } from "@/lib/uploads";

export async function GET(
  _request: Request,
  { params }: { params: { name: string } },
) {
  if (!params.name.startsWith("team-"))
    return new NextResponse("Não encontrado", { status: 404 });
  const data = await loadEvidence(params.name);
  if (!data) return new NextResponse("Não encontrado", { status: 404 });
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": evidenceMime(params.name),
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
