import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evidenceMime, loadEvidence } from "@/lib/uploads";

export async function GET(
  _request: Request,
  { params }: { params: { name: string } },
) {
  const user = await currentUser();
  if (!user) return new NextResponse("Não autorizado", { status: 401 });
  const evidence = await prisma.matchEvidence.findFirst({
    where: { imageUrl: params.name },
    include: { match: true },
  });
  if (!evidence) return new NextResponse("Não encontrado", { status: 404 });
  const participant = [
    evidence.match.homePlayerId,
    evidence.match.awayPlayerId,
  ].includes(user.id);
  if (user.role !== "ADMIN" && !participant)
    return new NextResponse("Acesso negado", { status: 403 });
  const data = await loadEvidence(params.name);
  if (!data) return new NextResponse("Não encontrado", { status: 404 });
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": evidenceMime(params.name),
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
