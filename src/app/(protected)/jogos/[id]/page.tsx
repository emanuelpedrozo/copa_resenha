import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { confirmResult, disputeResult, submitResult } from "@/app/actions";
import { PageTitle } from "@/components/ui";
import { statusLabel } from "@/lib/data";
export default async function MatchDetails({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { ok?: string };
}) {
  const user = await requireUser();
  const m = await prisma.match.findUnique({
    where: { id: params.id },
    include: {
      homePlayer: true,
      awayPlayer: true,
      round: true,
      submittedBy: true,
      confirmedBy: true,
      evidences: true,
      disputes: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!m) notFound();
  const participant = [m.homePlayerId, m.awayPlayerId].includes(user.id);
  const canViewEvidence = participant || user.role === "ADMIN";
  const canRespond =
    participant &&
    m.status === "WAITING_CONFIRMATION" &&
    m.submittedById !== user.id;
  return (
    <>
      <PageTitle
        title="Detalhes da partida"
        subtitle={m.round?.name || "Mata-mata"}
      />
      {searchParams.ok && (
        <p className="mb-4 rounded-xl bg-pitch/10 p-3 text-sm text-pitch">
          Operação realizada com sucesso.
        </p>
      )}
      <section className="card mb-5 p-6">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center text-center">
          <Player name={m.homePlayer.nickname} />
          <div>
            {m.homeScore === null ? (
              <b className="text-2xl text-pitch">VS</b>
            ) : (
              <b className="text-3xl">
                {m.homeScore} × {m.awayScore}
              </b>
            )}
            <span className="mt-2 block text-[10px] font-black uppercase text-muted">
              {statusLabel[m.status]}
            </span>
          </div>
          <Player name={m.awayPlayer.nickname} />
        </div>
        {m.submittedBy && (
          <div className="mt-6 border-t border-white/10 pt-4 text-xs text-muted">
            Informado por <b className="text-white">{m.submittedBy.nickname}</b>
            {m.confirmedBy && (
              <>
                {" "}
                · confirmado por{" "}
                <b className="text-white">{m.confirmedBy.nickname}</b>
              </>
            )}
          </div>
        )}
        {canViewEvidence && m.evidences.length > 0 && (
          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="mb-3 text-xs font-black uppercase text-muted">
              Foto do resultado
            </p>
            {m.evidences.map((evidence) => (
              <a
                key={evidence.id}
                href={`/api/evidences/${evidence.imageUrl}`}
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src={`/api/evidences/${evidence.imageUrl}`}
                  alt="Comprovante do resultado"
                  className="max-h-96 w-full rounded-xl object-contain"
                />
              </a>
            ))}
          </div>
        )}
      </section>
      {participant && m.status === "PENDING" && (
        <form
          action={submitResult}
          encType="multipart/form-data"
          className="card mb-5 p-5"
        >
          <h2 className="mb-4 font-black">Informar resultado</h2>
          <input type="hidden" name="matchId" value={m.id} />
          <div className="grid grid-cols-2 gap-4">
            <Score name="homeScore" label={m.homePlayer.nickname} />
            <Score name="awayScore" label={m.awayPlayer.nickname} />
          </div>
          <label className="mt-4 block text-sm font-bold">
            Foto do resultado
            <input
              name="evidence"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              required
              className="mt-2 block w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-pitch file:px-3 file:py-2 file:font-black file:text-ink"
            />
            <span className="mt-2 block text-xs font-normal text-muted">
              JPG, PNG ou WEBP, até 10 MB.
            </span>
          </label>
          <button className="mt-5 w-full rounded-xl bg-pitch py-3 font-black text-ink">
            ENVIAR RESULTADO
          </button>
        </form>
      )}
      {canRespond && (
        <div className="grid gap-4 md:grid-cols-2">
          <form action={confirmResult} className="card p-5">
            <input type="hidden" name="matchId" value={m.id} />
            <h2 className="font-black text-pitch">O placar está correto?</h2>
            <p className="my-3 text-sm text-muted">
              Confirme para atualizar a classificação.
            </p>
            <button className="w-full rounded-xl bg-pitch py-3 font-black text-ink">
              CONFIRMAR
            </button>
          </form>
          <form action={disputeResult} className="card p-5">
            <input type="hidden" name="matchId" value={m.id} />
            <h2 className="font-black text-rose-400">Contestar resultado</h2>
            <textarea
              name="reason"
              required
              minLength={5}
              placeholder="Explique o problema"
              className="my-3 min-h-20 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm"
            />
            <button className="w-full rounded-xl border border-rose-500/40 py-3 font-black text-rose-400">
              CONTESTAR
            </button>
          </form>
        </div>
      )}
      {m.disputes.length > 0 && (
        <section className="card mt-5 p-5">
          <h2 className="mb-2 font-black text-rose-400">Contestação</h2>
          <p className="text-sm">{m.disputes[0].reason}</p>
          <span className="mt-2 block text-xs text-muted">
            Status: {m.disputes[0].status}
          </span>
        </section>
      )}
    </>
  );
}
function Player({ name }: { name: string }) {
  return (
    <div>
      <div className="mx-auto mb-2 grid h-16 w-16 place-items-center rounded-full border-2 border-white/10 bg-white/5 font-black">
        {name.slice(0, 2).toUpperCase()}
      </div>
      <b>{name}</b>
    </div>
  );
}
function Score({ name, label }: { name: string; label: string }) {
  return (
    <label className="text-center text-sm font-bold">
      {label}
      <input
        name={name}
        type="number"
        min="0"
        max="99"
        required
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-4 text-center text-3xl font-black outline-none focus:border-pitch"
      />
    </label>
  );
}
