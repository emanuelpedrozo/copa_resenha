import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
const db = new PrismaClient();
async function main() {
  const passwordHash = await bcrypt.hash(
    process.env.SEED_PASSWORD || "Resenha@2026",
    12,
  );
  const admin = await db.user.upsert({
    where: { email: "admin@coparesenha.local" },
    update: { role: Role.ADMIN },
    create: {
      name: "Administrador",
      nickname: "Admin",
      username: "admin",
      email: "admin@coparesenha.local",
      passwordHash,
      role: Role.ADMIN,
    },
  });
  const roster = [
    [
      "emanuel",
      "Emanuel Pedrozo",
      "Emanuel",
      "Bayern de Munique",
      "fcbayern.com",
    ],
    [
      "luiz.paulo",
      "Luiz Paulo Felizali",
      "Luiz Paulo",
      "Real Madrid",
      "realmadrid.com",
    ],
    ["julio.cesar", "Julio Cesar", "Julio", "Bayer Leverkusen", "bayer04.de"],
    [
      "diogo.marcelino",
      "Diogo Marcelino",
      "Diogo",
      "Inter de Milão",
      "inter.it",
    ],
    [
      "rodrigo.abreu",
      "Rodrigo Abreu",
      "Rodrigo Abreu",
      "Atlético de Madrid",
      "atleticodemadrid.com",
    ],
    ["yuri.pereira", "Yuri Pereira", "Yuri", "Manchester United", "manutd.com"],
    ["anthony.jose", "Anthony José", "Anthony", "Juventus", "juventus.com"],
    [
      "felipe.gabriel",
      "Felipe Gabriel",
      "Felipe",
      "Borússia Dortmund",
      "bvb.de",
    ],
    [
      "eduardo.coutinho",
      "Eduardo Coutinho",
      "Eduardo",
      "Tottenham",
      "tottenhamhotspur.com",
    ],
    [
      "everton.lima",
      "Everton Lima",
      "Everton",
      "Manchester City",
      "mancity.com",
    ],
    [
      "matheus.coutinho",
      "Matheus Coutinho",
      "Matheus",
      "Barcelona",
      "fcbarcelona.com",
    ],
    [
      "eugenio.marques",
      "Eugenio Marques",
      "Eugenio",
      "Liverpool",
      "liverpoolfc.com",
    ],
    ["gabriel.naka", "Gabriel Naka", "Gabriel", "PSG", "psg.fr"],
    [
      "carlos.alberto",
      "Carlos Alberto",
      "Carlos Alberto",
      "Chelsea",
      "chelseafc.com",
    ],
    ["rodrigo.silva", "Rodrigo Silva", "Rodrigo Silva", "Milan", "acmilan.com"],
    ["alex.campos", "Alex Campos", "Alex", "Arsenal", "arsenal.com"],
  ];
  for (const [, , , teamName, domain] of roster) {
    await db.team.upsert({
      where: { name: teamName },
      update: {},
      create: {
        name: teamName,
        crestUrl: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      },
    });
  }
  for (const [username, name, nickname, teamName, domain] of roster) {
    const teamCrestUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    await db.user.upsert({
      where: { username },
      update: {},
      create: {
        name,
        nickname,
        username,
        email: `${username}@coparesenha.local`,
        passwordHash,
        teamName,
        teamCrestUrl,
      },
    });
  }
  console.log(`Seed de usuários concluído. Admin: ${admin.email}`);
}
main().finally(() => db.$disconnect());
