import Link from "next/link";
import { createTeam } from "@/app/actions";
import { PageTitle, TeamCrest } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function TeamsAdmin({
  searchParams,
}: {
  searchParams: { ok?: string };
}) {
  await requireAdmin();
  const teams = await prisma.team.findMany({ orderBy: { name: "asc" } });
  return (
    <>
      <PageTitle
        title="Times"
        subtitle={`${teams.length} cadastrados`}
        action={
          <Link
            href="/admin/usuarios"
            className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold"
          >
            USUÁRIOS
          </Link>
        }
      />
      {searchParams.ok && (
        <p className="mb-4 rounded-xl bg-pitch/10 p-3 text-sm text-pitch">
          Time cadastrado com sucesso.
        </p>
      )}
      <form
        action={createTeam}
        encType="multipart/form-data"
        className="card mb-6 grid gap-4 p-5 sm:grid-cols-2"
      >
        <h2 className="font-black sm:col-span-2">Cadastrar novo time</h2>
        <label className="text-xs font-bold text-muted">
          NOME DO TIME
          <input
            name="name"
            required
            minLength={2}
            maxLength={80}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white"
          />
        </label>
        <label className="text-xs font-bold text-muted">
          ARQUIVO DO ESCUDO
          <input
            name="crest"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="mt-2 block w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-pitch file:px-3 file:py-2 file:font-black file:text-ink"
          />
        </label>
        <p className="text-xs text-muted sm:col-span-2">
          Use uma imagem quadrada, de preferência PNG com fundo transparente.
          Limite de 10 MB.
        </p>
        <button className="rounded-xl bg-pitch px-5 py-3 font-black text-ink sm:col-span-2 sm:justify-self-start">
          CADASTRAR TIME
        </button>
      </form>
      <section className="card divide-y divide-white/[.06]">
        {teams.map((team) => (
          <div key={team.id} className="flex items-center gap-4 p-4">
            <TeamCrest url={team.crestUrl} team={team.name} />
            <b>{team.name}</b>
          </div>
        ))}
      </section>
    </>
  );
}
