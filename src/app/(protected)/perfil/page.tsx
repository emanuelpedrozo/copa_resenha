import { requireUser } from "@/lib/auth";
import { changePassword, logout, updateProfile } from "@/app/actions";
import { PageTitle, TeamCrest } from "@/components/ui";
import { teams } from "@/lib/teams";

export default async function Profile({
  searchParams,
}: {
  searchParams: { ok?: string };
}) {
  const user = await requireUser();
  return (
    <>
      <PageTitle title="Meu perfil" subtitle={`@${user.username}`} />
      {searchParams.ok && (
        <p className="mb-4 rounded-xl bg-pitch/10 p-3 text-sm text-pitch">
          Dados atualizados.
        </p>
      )}
      <section className="card mb-5 p-5">
        <div className="mb-5 flex items-center gap-4">
          <TeamCrest url={user.teamCrestUrl} team={user.teamName} size="lg" />
          <div>
            <b>{user.name}</b>
            <p className="text-sm text-muted">{user.email}</p>
            <p className="text-xs text-muted">
              {user.teamName || "Time não vinculado"}
            </p>
            <span className="tag text-pitch">{user.role}</span>
          </div>
        </div>
        <form action={updateProfile} className="grid gap-4 sm:grid-cols-2">
          <Field name="name" label="Nome do participante" value={user.name} />
          <Field name="nickname" label="Apelido" value={user.nickname} />
          <label className="text-xs font-bold text-muted sm:col-span-2">
            TIME VINCULADO
            <select
              name="teamName"
              defaultValue={user.teamName || ""}
              required
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c1317] p-3 text-white"
            >
              <option value="" disabled>
                Selecione seu time
              </option>
              {teams.map(([name]) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <span className="mt-2 block font-normal normal-case">
              O escudo será vinculado automaticamente.
            </span>
          </label>
          <button className="rounded-xl bg-pitch px-5 py-3 font-black text-ink sm:col-span-2 sm:justify-self-start">
            SALVAR PERFIL
          </button>
        </form>
      </section>
      <form action={changePassword} className="card mb-5 space-y-3 p-5">
        <h2 className="font-black">Alterar senha</h2>
        <input
          name="current"
          type="password"
          placeholder="Senha atual"
          required
          className="w-full rounded-xl border border-white/10 bg-black/20 p-3"
        />
        <input
          name="password"
          type="password"
          placeholder="Nova senha"
          required
          minLength={8}
          className="w-full rounded-xl border border-white/10 bg-black/20 p-3"
        />
        <input
          name="confirm"
          type="password"
          placeholder="Confirmar nova senha"
          required
          minLength={8}
          className="w-full rounded-xl border border-white/10 bg-black/20 p-3"
        />
        <button className="rounded-xl border border-pitch/40 px-5 py-3 font-black text-pitch">
          ALTERAR SENHA
        </button>
      </form>
      <form action={logout}>
        <button className="w-full rounded-xl border border-rose-500/30 py-3 font-black text-rose-400">
          SAIR DA CONTA
        </button>
      </form>
    </>
  );
}
function Field({
  name,
  label,
  value,
}: {
  name: string;
  label: string;
  value: string;
}) {
  return (
    <label className="text-xs font-bold text-muted">
      {label.toUpperCase()}
      <input
        name={name}
        defaultValue={value}
        required
        minLength={2}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white"
      />
    </label>
  );
}
