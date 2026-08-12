import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createUser } from "@/app/actions";
import { PageTitle, TeamCrest } from "@/components/ui";
import { teams } from "@/lib/teams";
export default async function UsersAdmin({
  searchParams,
}: {
  searchParams: { ok?: string };
}) {
  await requireAdmin();
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
  return (
    <>
      <PageTitle title="Usuários" subtitle={`${users.length} cadastrados`} />
      {searchParams.ok && (
        <p className="mb-4 rounded-xl bg-pitch/10 p-3 text-pitch">
          Usuário criado.
        </p>
      )}
      <form
        action={createUser}
        className="card mb-6 grid gap-3 p-5 sm:grid-cols-2"
      >
        <h2 className="sm:col-span-2 font-black">Novo participante</h2>
        <Input name="name" label="Nome" />
        <Input name="nickname" label="Apelido" />
        <Input name="username" label="Username" />
        <Input name="email" label="E-mail" type="email" />
        <label className="text-xs font-bold text-muted">
          TIME
          <select
            name="teamName"
            required
            defaultValue=""
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c1317] p-3 text-white"
          >
            <option value="" disabled>
              Selecione o time
            </option>
            {teams.map(([name]) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <Input name="password" label="Senha inicial" type="password" />
        <button className="rounded-xl bg-pitch px-5 py-3 font-black text-ink sm:self-end">
          CRIAR USUÁRIO
        </button>
      </form>
      <div className="card divide-y divide-white/[.06]">
        {users.map((u) => (
          <div key={u.id} className="flex items-center gap-3 p-4">
            <TeamCrest url={u.teamCrestUrl} team={u.teamName} size="sm" />
            <div>
              <b>{u.name}</b>
              <p className="text-xs text-muted">
                {u.teamName || `@${u.username}`} · {u.email}
              </p>
            </div>
            <span className="tag ml-auto text-pitch">{u.role}</span>
          </div>
        ))}
      </div>
    </>
  );
}
function Input({
  name,
  label,
  type = "text",
  optional = false,
}: {
  name: string;
  label: string;
  type?: string;
  optional?: boolean;
}) {
  return (
    <label className="text-xs font-bold text-muted">
      {label.toUpperCase()}
      <input
        name={name}
        type={type}
        required={!optional}
        minLength={optional ? undefined : type === "password" ? 8 : 2}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white"
      />
    </label>
  );
}
