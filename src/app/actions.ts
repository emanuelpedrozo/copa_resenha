"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  currentUser,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { knockoutPairs, roundRobin } from "@/lib/tournament";
import { saveEvidence, saveTeamCrest } from "@/lib/uploads";

export async function logout() {
  cookies().set("copa_session", "", { httpOnly: true, path: "/", maxAge: 0 });
  redirect("/login");
}

export async function submitResult(form: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const input = z
    .object({
      matchId: z.string().min(1),
      homeScore: z.coerce.number().int().min(0).max(99),
      awayScore: z.coerce.number().int().min(0).max(99),
    })
    .parse(Object.fromEntries(form));
  const match = await prisma.match.findUnique({
    where: { id: input.matchId },
    include: { championship: true },
  });
  if (!match || ![match.homePlayerId, match.awayPlayerId].includes(user.id))
    throw new Error("Você não participa desta partida.");
  if (match.status !== "PENDING")
    throw new Error("Esta partida não aceita um novo resultado.");
  const evidence = form.get("evidence");
  let evidenceName: string | null = null;
  if (match.championship.requireEvidence) {
    if (!(evidence instanceof File) || evidence.size === 0)
      throw new Error("A foto do resultado é obrigatória.");
    evidenceName = await saveEvidence(evidence);
  }
  await prisma.$transaction(async (tx) => {
    await tx.match.update({
      where: { id: match.id },
      data: {
        homeScore: input.homeScore,
        awayScore: input.awayScore,
        status: "WAITING_CONFIRMATION",
        submittedById: user.id,
        submittedAt: new Date(),
        playedAt: new Date(),
        winnerId:
          input.homeScore === input.awayScore
            ? null
            : input.homeScore > input.awayScore
              ? match.homePlayerId
              : match.awayPlayerId,
      },
    });
    if (evidenceName)
      await tx.matchEvidence.create({
        data: { matchId: match.id, userId: user.id, imageUrl: evidenceName },
      });
    const opponent =
      match.homePlayerId === user.id ? match.awayPlayerId : match.homePlayerId;
    await tx.notification.create({
      data: {
        userId: opponent,
        message: `${user.nickname} informou o placar da partida. Confirme ou conteste.`,
      },
    });
  });
  revalidatePath("/dashboard");
  revalidatePath("/jogos");
  redirect(`/jogos/${match.id}?ok=enviado`);
}

export async function confirmResult(form: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const matchId = z.string().parse(form.get("matchId"));
  await prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({ where: { id: matchId } });
    if (
      !match ||
      match.status !== "WAITING_CONFIRMATION" ||
      match.submittedById === user.id ||
      ![match.homePlayerId, match.awayPlayerId].includes(user.id)
    )
      throw new Error("Você não pode confirmar este resultado.");
    await tx.match.update({
      where: { id: match.id },
      data: {
        status: "CONFIRMED",
        confirmedById: user.id,
        confirmedAt: new Date(),
      },
    });
    if (match.submittedById)
      await tx.notification.create({
        data: {
          userId: match.submittedById,
          message: `${user.nickname} confirmou o resultado. Placar valendo!`,
        },
      });
  });
  revalidatePath("/dashboard");
  revalidatePath("/jogos");
  revalidatePath("/classificacao");
  redirect(`/jogos/${matchId}?ok=confirmado`);
}

export async function disputeResult(form: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const data = z
    .object({ matchId: z.string(), reason: z.string().trim().min(5).max(500) })
    .parse(Object.fromEntries(form));
  await prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({ where: { id: data.matchId } });
    if (
      !match ||
      match.status !== "WAITING_CONFIRMATION" ||
      match.submittedById === user.id ||
      ![match.homePlayerId, match.awayPlayerId].includes(user.id)
    )
      throw new Error("Você não pode contestar este resultado.");
    await tx.match.update({
      where: { id: match.id },
      data: { status: "DISPUTED" },
    });
    await tx.matchDispute.create({
      data: { matchId: match.id, openedBy: user.id, reason: data.reason },
    });
    const admins = await tx.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    if (admins.length)
      await tx.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          message: `${user.nickname} contestou um resultado: ${data.reason}`,
        })),
      });
  });
  revalidatePath("/jogos");
  redirect(`/jogos/${data.matchId}?ok=contestado`);
}

export async function updateProfile(form: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const data = z
    .object({
      name: z.string().trim().min(2).max(100),
      nickname: z.string().trim().min(2).max(30),
      teamName: z.string().trim().min(2),
    })
    .parse(Object.fromEntries(form));
  const team = await prisma.team.findUnique({ where: { name: data.teamName } });
  if (!team) throw new Error("Time não encontrado.");
  await prisma.user.update({
    where: { id: user.id },
    data: { ...data, teamCrestUrl: team.crestUrl },
  });
  revalidatePath("/perfil");
  revalidatePath("/dashboard");
  revalidatePath("/jogos");
  revalidatePath("/jogadores");
  redirect("/perfil?ok=perfil");
}
export async function changePassword(form: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const data = z
    .object({
      current: z.string().min(8),
      password: z.string().min(8),
      confirm: z.string().min(8),
    })
    .parse(Object.fromEntries(form));
  if (data.password !== data.confirm)
    throw new Error("As senhas não conferem.");
  const stored = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
  });
  if (!(await verifyPassword(data.current, stored.passwordHash)))
    throw new Error("Senha atual incorreta.");
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(data.password) },
  });
  redirect("/perfil?ok=senha");
}

export async function resolveDispute(form: FormData) {
  const admin = await currentUser();
  if (!admin || admin.role !== "ADMIN") throw new Error("Acesso negado.");
  const data = z
    .object({
      matchId: z.string(),
      homeScore: z.coerce.number().int().min(0),
      awayScore: z.coerce.number().int().min(0),
      reason: z.string().min(3),
    })
    .parse(Object.fromEntries(form));
  await prisma.$transaction(async (tx) => {
    const old = await tx.match.findUniqueOrThrow({
      where: { id: data.matchId },
    });
    await tx.match.update({
      where: { id: data.matchId },
      data: {
        homeScore: data.homeScore,
        awayScore: data.awayScore,
        status: "CONFIRMED",
        confirmedById: admin.id,
        confirmedAt: new Date(),
        winnerId:
          data.homeScore === data.awayScore
            ? null
            : data.homeScore > data.awayScore
              ? old.homePlayerId
              : old.awayPlayerId,
      },
    });
    await tx.matchDispute.updateMany({
      where: { matchId: data.matchId, status: "OPEN" },
      data: {
        status: "RESOLVED",
        resolvedBy: admin.id,
        resolution: data.reason,
        resolvedAt: new Date(),
      },
    });
    await tx.auditLog.create({
      data: {
        userId: admin.id,
        action: "RESOLVE_DISPUTE",
        entity: "Match",
        entityId: data.matchId,
        oldData: {
          homeScore: old.homeScore,
          awayScore: old.awayScore,
          status: old.status,
        },
        newData: {
          homeScore: data.homeScore,
          awayScore: data.awayScore,
          status: "CONFIRMED",
        },
        reason: data.reason,
      },
    });
  });
  revalidatePath("/admin");
  revalidatePath("/classificacao");
  redirect("/admin?ok=resolvido");
}

export async function createUser(form: FormData) {
  const admin = await currentUser();
  if (!admin || admin.role !== "ADMIN") throw new Error("Acesso negado.");
  const data = z
    .object({
      name: z.string().trim().min(2),
      nickname: z.string().trim().min(2),
      username: z
        .string()
        .trim()
        .toLowerCase()
        .regex(/^[a-z0-9._-]+$/),
      email: z.string().email().toLowerCase(),
      password: z.string().min(8),
      teamName: z.string().trim().min(2),
    })
    .parse(Object.fromEntries(form));
  const { password, ...profile } = data;
  const team = await prisma.team.findUnique({ where: { name: data.teamName } });
  if (!team) throw new Error("Time não encontrado.");
  await prisma.user.create({
    data: {
      ...profile,
      teamCrestUrl: team.crestUrl,
      passwordHash: await hashPassword(password),
    },
  });
  redirect("/admin/usuarios?ok=criado");
}

export async function createTeam(form: FormData) {
  const admin = await currentUser();
  if (!admin || admin.role !== "ADMIN") throw new Error("Acesso negado.");
  const name = z.string().trim().min(2).max(80).parse(form.get("name"));
  if (await prisma.team.findUnique({ where: { name } }))
    throw new Error("Já existe um time com esse nome.");
  const crest = form.get("crest");
  if (!(crest instanceof File) || crest.size === 0)
    throw new Error("O arquivo do escudo é obrigatório.");
  const fileName = await saveTeamCrest(crest);
  await prisma.team.create({
    data: { name, crestUrl: `/api/team-crests/${fileName}` },
  });
  revalidatePath("/admin/times");
  revalidatePath("/admin/usuarios");
  revalidatePath("/perfil");
  redirect("/admin/times?ok=criado");
}

export async function createChampionship(form: FormData) {
  const admin = await currentUser();
  if (!admin || admin.role !== "ADMIN") throw new Error("Acesso negado.");
  const raw = Object.fromEntries(form);
  const data = z
    .object({
      name: z.string().trim().min(3),
      description: z.string().trim().max(500).optional(),
      competitionFormat: z.enum(["LEAGUE", "KNOCKOUT"]),
      matchFormat: z.enum(["SINGLE", "HOME_AWAY"]),
      participants: z.array(z.string()).min(2),
    })
    .parse({ ...raw, participants: form.getAll("participants") });
  await prisma.$transaction(async (tx) => {
    await tx.championship.updateMany({
      where: { status: "ACTIVE" },
      data: { status: "FINISHED" },
    });
    const c = await tx.championship.create({
      data: {
        name: data.name,
        description: data.description,
        competitionFormat: data.competitionFormat,
        matchFormat: data.matchFormat,
        status: "ACTIVE",
        requireEvidence: true,
        knockoutDrawType:
          data.competitionFormat === "KNOCKOUT" ? "RANDOM" : null,
        knockoutTiebreaker:
          data.competitionFormat === "KNOCKOUT" ? "PENALTIES" : null,
        startDate: new Date(),
        participants: {
          create: data.participants.map((userId, seed) => ({
            userId,
            seed: seed + 1,
          })),
        },
      },
    });
    if (data.competitionFormat === "LEAGUE") {
      const fixtures = roundRobin(
        data.participants,
        data.matchFormat === "HOME_AWAY",
      );
      for (const number of Array.from(new Set(fixtures.map((f) => f.round)))) {
        const round = await tx.round.create({
          data: {
            championshipId: c.id,
            roundNumber: number,
            name: `Rodada ${number}`,
            phase: "LEAGUE",
          },
        });
        await tx.match.createMany({
          data: fixtures
            .filter((f) => f.round === number)
            .map((f) => ({
              championshipId: c.id,
              roundId: round.id,
              homePlayerId: f.home,
              awayPlayerId: f.away,
            })),
        });
      }
    } else {
      const pairs = knockoutPairs(data.participants);
      const size = pairs.length * 2;
      const phase =
        size <= 2
          ? "FINAL"
          : size <= 4
            ? "SEMI_FINAL"
            : size <= 8
              ? "QUARTER_FINAL"
              : size <= 16
                ? "ROUND_OF_16"
                : "ROUND_OF_32";
      const round = await tx.round.create({
        data: {
          championshipId: c.id,
          roundNumber: 1,
          name: phase.replaceAll("_", " "),
          phase,
        },
      });
      for (const [player1, player2] of pairs) {
        if (!player1 && !player2) continue;
        const tie = await tx.knockoutTie.create({
          data: {
            championshipId: c.id,
            phase,
            player1Id: player1,
            player2Id: player2,
            status: player1 && player2 ? "ACTIVE" : "COMPLETED",
            winnerId: player1 || player2,
          },
        });
        if (player1 && player2) {
          await tx.match.create({
            data: {
              championshipId: c.id,
              roundId: round.id,
              knockoutTieId: tie.id,
              homePlayerId: player1,
              awayPlayerId: player2,
            },
          });
          if (data.matchFormat === "HOME_AWAY")
            await tx.match.create({
              data: {
                championshipId: c.id,
                roundId: round.id,
                knockoutTieId: tie.id,
                homePlayerId: player2,
                awayPlayerId: player1,
              },
            });
        }
      }
    }
    await tx.auditLog.create({
      data: {
        userId: admin.id,
        action: "CREATE_CHAMPIONSHIP",
        entity: "Championship",
        entityId: c.id,
        newData: {
          name: c.name,
          competitionFormat: c.competitionFormat,
          matchFormat: c.matchFormat,
        },
      },
    });
  });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
