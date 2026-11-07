/*
 * Açık zeminden koyu oyun arenasına geçiş: Corsi bloklarından bir kenar.
 *
 * Bölüm sınırı düz bir çizgi değil, kademeli bir blok mozaiği. Okur
 * kaydırdıkça bloklar tek tek yerine oturur — sıra rastgele değil, bir
 * Corsi dizisi gibi önceden belirlenmiş bir permütasyon: geçişin
 * koreografisi ürünün ölçtüğü görevin kendisi.
 *
 * Hareket tümüyle CSS'te (`animation-timeline: view()`), JS yok, ana iş
 * parçacığı kaydırma sırasında boş kalır. Desteklemeyen tarayıcı ve
 * hareketi azaltan okur son kareyi görür: kenar zaten kurulmuş hâlde.
 * Sunucu bileşeni — desen derleme anında sabit.
 */

const COLS = 48;
const ROWS = 3;
/* Satır başına doluluk: alttaki satır tam, yukarı çıktıkça seyrelir. */
const DENSITY = [0.3, 0.62, 1] as const;

/* Deterministik sözde rastgele (mulberry32): her derlemede aynı desen. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Cell = { r: number; c: number; o: number };

function buildCells(seed: number): Cell[] {
  const rand = rng(seed);
  const cells: Omit<Cell, "o">[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (r === ROWS - 1 || rand() < DENSITY[r]) cells.push({ r, c });
    }
  }
  /* Sıra: alttan yukarı ağırlıklı ama karışık — kenar aşağıdan büyür. */
  const ordered = cells
    .map((cell) => ({ cell, k: (ROWS - 1 - cell.r) * 0.55 + rand() }))
    .sort((a, b) => a.k - b.k);
  return ordered.map(({ cell }, i) => ({ ...cell, o: i / (ordered.length - 1) }));
}

const TOP = buildCells(9);
const BOTTOM = buildCells(17);

export function BlockEdge({ side }: { readonly side: "top" | "bottom" }) {
  const cells = side === "top" ? TOP : BOTTOM;
  return (
    <div aria-hidden="true" className={`block-edge block-edge-${side}`}>
      {cells.map((cell) => (
        <span
          key={`${cell.r}-${cell.c}`}
          className="block-edge-cell"
          data-tier={cell.c < 12 ? "a" : cell.c < 24 ? "b" : cell.c < 32 ? "c" : cell.c < 40 ? "d" : "e"}
          style={{
            gridColumn: cell.c + 1,
            /* Alt kenarda desen ters çevrilir: koyu bloklar aşağı sarkar. */
            gridRow: side === "top" ? cell.r + 1 : ROWS - cell.r,
            ["--o" as string]: cell.o.toFixed(3),
          }}
        />
      ))}
    </div>
  );
}
