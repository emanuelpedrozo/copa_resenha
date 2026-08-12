export const teams = [
  ["Arsenal", "arsenal.com"],
  ["Atlético de Madrid", "atleticodemadrid.com"],
  ["Barcelona", "fcbarcelona.com"],
  ["Bayer Leverkusen", "bayer04.de"],
  ["Bayern de Munique", "fcbayern.com"],
  ["Borússia Dortmund", "bvb.de"],
  ["Chelsea", "chelseafc.com"],
  ["Inter de Milão", "inter.it"],
  ["Juventus", "juventus.com"],
  ["Liverpool", "liverpoolfc.com"],
  ["Manchester City", "mancity.com"],
  ["Manchester United", "manutd.com"],
  ["Milan", "acmilan.com"],
  ["PSG", "psg.fr"],
  ["Real Madrid", "realmadrid.com"],
  ["Tottenham", "tottenhamhotspur.com"],
] as const;

export function teamCrestUrl(teamName: string) {
  const domain = teams.find(([name]) => name === teamName)?.[1];
  return domain
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
    : null;
}
