export const competiciones = [
    {
      id: "futsal",
      titulo: "Fútbol 7 EUNEIZ Cup",
      fecha: "Mayo 15",
      descripcion:
        "Fase de grupos + fase final. Equipos formados por estudiantes de distintos grados.",
      grupos: [
        {
          nombre: "Grupo A",
          tabla: [
            { equipo: "CAFyD United", pj: 3, v: 2, e: 1, d: 0, gf: 7, gc: 3, pts: 7 },
            { equipo: "Los Pelaos", pj: 3, v: 2, e: 0, d: 1, gf: 6, gc: 2, pts: 6 },
            { equipo: "Borrusia Donut", pj: 3, v: 1, e: 0, d: 2, gf: 4, gc: 6, pts: 3 },
            { equipo: "Saragoza Sport", pj: 3, v: 0, e: 1, d: 2, gf: 2, gc: 6, pts: 1 },
          ],
        },
        {
          nombre: "Grupo B",
          tabla: [
            { equipo: "Real Fisio", pj: 3, v: 3, e: 0, d: 0, gf: 8, gc: 2, pts: 9 },
            { equipo: "Gerga civil", pj: 3, v: 1, e: 1, d: 1, gf: 5, gc: 5, pts: 4 },
            { equipo: "Podo FC", pj: 3, v: 1, e: 0, d: 2, gf: 3, gc: 6, pts: 3 },
            { equipo: "Alpha Taurí", pj: 3, v: 0, e: 1, d: 2, gf: 2, gc: 7, pts: 1 },
          ],
        },
      ],
      stats: {
        pichichis: [
          { jugador: "Iñaki (CAFyD United)", goles: 5 },
          { jugador: "Izaro (Los Pelaos)", goles: 4 },
          { jugador: "Mikel (Los pelaos)", goles: 4 },
          { jugador: "Unai (Gerga civil)", goles: 4 },
        ],
        masGoleadores: [
          { equipo: "Los pelaos", gf: 15 },
          { equipo: "CAFyD United", gf: 12 },
          { equipo: "Real fisio", gf: 10 },
        ],
        menosGoleados: [
          { equipo: "Real Fisio", gc: 4 },
          { equipo: "CAFyD United", gc: 5 },
          { equipo: "Los Pelaos", gc: 6 },
        ],
      },
      faseFinal: {
        semifinales: [
          { id: "sf1", equipoA: "Fisio Warriors", equipoB: "Los Pelaos", resultado: "3 - 6" },
          { id: "sf2", equipoA: "CAFyD United", equipoB: "Ciber Titans", resultado: "3 - 0" },
        ],
        final: [{ id: "f1", equipoA: "Los Pelaos", equipoB: "CAFyD United", resultado: "3 - 1" }],
      },
    },
  
    {
        id: "esports",
        tipo: "lol",
        titulo: "Esports EUNEIZ League of Legends",
      fecha: "Mayo",
      descripcion:
        "Fase de grupos + playoffs. Equipos de LoL.",
      grupos: [
        {
          nombre: "Grupo A",
          tabla: [
            { equipo: "Los Herectos", pj: 3, v: 3, d: 0, pts: 9 },
            { equipo: "GGez", pj: 3, v: 2, d: 1, pts: 6 },
            { equipo: "Tilt Therapy", pj: 3, v: 1, d: 2, pts: 3 },
            { equipo: "Hands Diff", pj: 3, v: 0, d: 3, pts: 0 },
          ],
        },
        {
          nombre: "Grupo B",
          tabla: [
            { equipo: "Jaime EC", pj: 3, v: 2, d: 0, pts: 9 },
            { equipo: "Ñoi", pj: 3, v: 2, d: 1, pts: 6 },
            { equipo: "FF15", pj: 3, v: 1, d: 2, pts: 3 },
            { equipo: "Feets NoHands", pj: 3, v: 0, d: 2, pts: 0 },
          ],
        },
      ],
      stats: {
        mvps: [
          { jugador: "Jaime (Jaime EC)", mvp: 3 },
          { jugador: "Mikel (Los Herectos)", mvp: 2 },
          { jugador: "Ijurko (Los Herectos)", mvp: 1 },
        ],
        masKills: [
          { jugador: "Pablo (Jaime EC)", kills: 52 },
          { jugador: "Markel (Ñoi)", kills: 40 },
          { jugador: "Mikel (Los Herectos)", kills: 40 },
        ],
        masVision: [
          { jugador: "Manu (FF15)", vision: 162 },
          { jugador: "Eric (Jaime EC)", vision: 151 },
          { jugador: "Mario (GGez)", vision: 138 },
        ],
        kdaTop: [
          { jugador: "Jaime (Jaime EC)", kda: "6.4" },
          { jugador: "Mikel (Los herectos)", kda: "5.9" },
          { jugador: "Maria (Los Herectos)", kda: "5.2" },
        ],
      },
      faseFinal: {
        semifinales: [
          { id: "sf1", equipoA: "Los Herectos", equipoB: "Ñoi", resultado: "2 - 1" },
          { id: "sf2", equipoA: "Jaime EC", equipoB: "GGez", resultado: "2 - 0" },
        ],
        final: [{ id: "f1", equipoA: "Los Herectos", equipoB: "Jaime EC", resultado: "3 - 2" }],
      },
    },
  ];