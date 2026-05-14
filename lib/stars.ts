import type { TeamCode } from "./teams";

// Curated star list per nation. Names must match TheSportsDB's `strPlayer` for
// the photo lookup to succeed. When in doubt, use the most common Romanization.
// 3–5 per top nation, 1–3 for smaller ones.
export const STARS: Record<TeamCode, string[]> = {
  ARG: ["Lionel Messi", "Lautaro Martinez", "Julian Alvarez", "Emiliano Martinez"],
  BRA: ["Vinicius Junior", "Rodrygo", "Raphinha", "Alisson Becker", "Casemiro"],
  FRA: ["Kylian Mbappe", "Antoine Griezmann", "Aurelien Tchouameni", "Mike Maignan"],
  ENG: ["Jude Bellingham", "Harry Kane", "Bukayo Saka", "Phil Foden", "Jordan Pickford"],
  ESP: ["Pedri", "Gavi", "Lamine Yamal", "Rodri", "Unai Simon"],
  POR: ["Cristiano Ronaldo", "Bruno Fernandes", "Bernardo Silva", "Ruben Dias"],
  GER: ["Jamal Musiala", "Florian Wirtz", "Joshua Kimmich", "Kai Havertz", "Manuel Neuer"],
  NED: ["Virgil van Dijk", "Frenkie de Jong", "Cody Gakpo", "Memphis Depay"],
  BEL: ["Kevin De Bruyne", "Romelu Lukaku", "Thibaut Courtois", "Youri Tielemans"],
  MEX: ["Hirving Lozano", "Edson Alvarez", "Raul Jimenez", "Guillermo Ochoa"],
  USA: ["Christian Pulisic", "Tim Weah", "Tyler Adams", "Weston McKennie"],
  CAN: ["Alphonso Davies", "Jonathan David", "Cyle Larin"],
  JPN: ["Kaoru Mitoma", "Takefusa Kubo", "Wataru Endo", "Takehiro Tomiyasu"],
  KOR: ["Heung-Min Son", "Kang-In Lee", "Min-Jae Kim"],
  MAR: ["Achraf Hakimi", "Hakim Ziyech", "Yassine Bounou", "Youssef En-Nesyri"],
  SEN: ["Sadio Mane", "Edouard Mendy", "Kalidou Koulibaly"],
  URU: ["Federico Valverde", "Darwin Nunez", "Rodrigo Bentancur", "Ronald Araujo"],
  CRO: ["Luka Modric", "Mateo Kovacic", "Josko Gvardiol"],
  AUS: ["Mathew Ryan", "Aaron Mooy", "Martin Boyle"],
  COL: ["James Rodriguez", "Luis Diaz", "Juan Cuadrado"],
  ECU: ["Moises Caicedo", "Pervis Estupinan"],
  IRN: ["Sardar Azmoun", "Mehdi Taremi", "Alireza Beiranvand"],
  KSA: ["Salem Al-Dawsari", "Salman Al-Faraj"],
  AUT: ["Marko Arnautovic", "David Alaba"],
  SUI: ["Granit Xhaka", "Yann Sommer", "Manuel Akanji"],
  TUR: ["Hakan Calhanoglu", "Arda Guler", "Caglar Soyuncu"],
  CZE: ["Patrik Schick", "Tomas Soucek"],
  NOR: ["Erling Haaland", "Martin Odegaard"],
  SCO: ["Andrew Robertson", "John McGinn"],
  SWE: ["Alexander Isak", "Viktor Gyokeres"],
  BIH: ["Edin Dzeko"],
  IRQ: ["Aymen Hussein"],
  JOR: ["Mousa Tamari"],
  UZB: ["Eldor Shomurodov"],
  QAT: ["Almoez Ali", "Akram Afif"],
  PAN: ["Anibal Godoy", "Jose Fajardo"],
  HAI: ["Duckens Nazon"],
  CUW: ["Leandro Bacuna"],
  CIV: ["Sebastien Haller", "Franck Kessie"],
  GHA: ["Mohammed Kudus", "Thomas Partey", "Jordan Ayew"],
  ALG: ["Riyad Mahrez", "Ismael Bennacer"],
  EGY: ["Mohamed Salah", "Mohamed Elneny"],
  TUN: ["Wahbi Khazri", "Hannibal Mejbri"],
  RSA: ["Ronwen Williams", "Percy Tau"],
  COD: ["Yoane Wissa", "Cedric Bakambu"],
  PAR: ["Miguel Almiron", "Junior Alonso"],
  NZL: ["Chris Wood"],
  CPV: ["Ryan Mendes"],
};

export function getStars(code: TeamCode): string[] {
  return STARS[code] ?? [];
}
