import Link from "next/link";
import { createTeam, updateTeam } from "@/app/actions";
import { PageTitle, TeamCrest } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function TeamsAdmin({
  searchParams,
}: {
  searchParams: { ok?: string; error?: string };
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
          {searchParams.ok === "editado"
            ? "Time atualizado com sucesso."
            : "Time cadastrado com sucesso."}
        </p>
      )}
      {searchParams.error && (
        <p className="mb-4 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-300">
          {searchParams.error === "duplicado"
            ? "Já existe um time com esse nome."
            : searchParams.error === "arquivo"
              ? "Selecione o arquivo do escudo."
              : searchParams.error === "inexistente"
                ? "O time não foi encontrado."
                : "Formato não reconhecido. Envie JPG, PNG, WEBP, GIF ou ICO."}
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
            accept="image/jpeg,image/png,image/webp,image/gif,image/x-icon,.ico"
            required
            className="mt-2 block w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-pitch file:px-3 file:py-2 file:font-black file:text-ink"
          />
        </label>
        <p className="text-xs text-muted sm:col-span-2">
          Use uma imagem quadrada, de preferência PNG com fundo transparente.
          Aceita JPG, PNG, WEBP, GIF e ICO, até 10 MB.
        </p>
        <button className="rounded-xl bg-pitch px-5 py-3 font-black text-ink sm:col-span-2 sm:justify-self-start">
          CADASTRAR TIME
        </button>
      </form>
      <section className="space-y-4">
        {teams.map((team) => (
          <form
            key={team.id}
            action={updateTeam}
            encType="multipart/form-data"
            className="card grid items-end gap-4 p-4 sm:grid-cols-[auto_1fr_1fr_auto]"
          >
            <input type="hidden" name="id" value={team.id} />
            <TeamCrest url={team.crestUrl} team={team.name} />
            <label className="text-xs font-bold text-muted">
              NOME DO TIME
              <input
                name="name"
                defaultValue={team.name}
                required
                minLength={2}
                maxLength={80}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white"
              />
            </label>
            <label className="text-xs font-bold text-muted">
              NOVO ESCUDO (OPCIONAL)
              <input
                name="crest"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/x-icon,.ico"
                className="mt-2 block w-full rounded-xl border border-white/10 bg-black/20 p-2 text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-pitch file:px-3 file:py-2 file:font-black file:text-ink"
              />
            </label>
            <button className="rounded-xl border border-pitch/40 px-4 py-3 text-xs font-black text-pitch">
              SALVAR
            </button>
          </form>
        ))}
      </section>
    </>
  );
}
