/**
 * Pure game logic functions for Mimio platform.
 * These functions have no side effects and no React dependencies.
 * Extracted from MimioApp.tsx for maintainability.
 */

import type {
  CommandKey,
  DifferenceTile,
  LogicCell,
  LogicPuzzle,
  LogicShape,
  Scoreboard,
  ScanTile,
} from "@/lib/game-types";
import {
  EMPTY_SCOREBOARD,
  LOGIC_COLORS,
  LOGIC_SHAPES,
  MEMORY_TILES,
  ROUTE_COMMANDS,
  SYMBOL_LIBRARY,
} from "@/lib/game-constants";

export function randomIndex(length: number, avoid?: number): number {
  let next = Math.floor(Math.random() * length);
  if (typeof avoid === "number" && length > 1) {
    while (next === avoid) next = Math.floor(Math.random() * length);
  }
  return next;
}

export function shuffleArray<T>(items: T[]): T[] {
  const clone = [...items];
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }
  return clone;
}

export function createMemorySequence(length: number, previousLast?: number): number[] {
  const next: number[] = [];
  for (let index = 0; index < length; index += 1) {
    const avoid = index === 0 ? previousLast : next[index - 1];
    next.push(randomIndex(MEMORY_TILES.length, avoid));
  }
  return next;
}

export function getDifficultyLevel(difficultyLevel: string | undefined): 1 | 2 | 3 {
  if (!difficultyLevel) return 2;
  const s = difficultyLevel.toLowerCase().trim();
  if (["kolay", "low", "easy", "1", "başlangıç", "hafif", "düşük"].some(k => s.includes(k))) return 1;
  if (["zor", "high", "hard", "3", "ileri", "expert", "yüksek", "ilerlemiş"].some(k => s.includes(k))) return 3;
  return 2;
}

export function createPairsDeck(pairCount = 8) {
  const count = Math.min(pairCount, SYMBOL_LIBRARY.length);
  const selected = SYMBOL_LIBRARY.slice(0, count);
  const duplicated = selected.flatMap((variant) => [
    { ...variant, id: `${variant.label}-a`, matched: false, revealed: false },
    { ...variant, id: `${variant.label}-b`, matched: false, revealed: false },
  ]);
  return shuffleArray(duplicated);
}

export function createRouteCommand(avoid?: CommandKey): CommandKey {
  const avoidIndex = ROUTE_COMMANDS.findIndex((command) => command.key === avoid);
  return ROUTE_COMMANDS[randomIndex(ROUTE_COMMANDS.length, avoidIndex >= 0 ? avoidIndex : undefined)].key;
}

export function createDifferenceRound(round: number) {
  const baseIndex = randomIndex(SYMBOL_LIBRARY.length);
  const oddIndex = randomIndex(SYMBOL_LIBRARY.length, baseIndex);
  const oddTileIndex = randomIndex(6);
  const tiles: DifferenceTile[] = Array.from({ length: 6 }, (_, index) => {
    const variant = index === oddTileIndex ? SYMBOL_LIBRARY[oddIndex] : SYMBOL_LIBRARY[baseIndex];
    return { id: `diff-${round}-${index}`, odd: index === oddTileIndex, rotation: (index % 2 === 0 ? -2 : 2) + (index === oddTileIndex ? 4 : 0), ...variant };
  });
  return { tiles, oddId: tiles[oddTileIndex].id };
}

export function createScanRound(round: number, tileCount = 9): { tiles: ScanTile[]; targetLabel: string; targetId: string | null } {
  const targetIndex = randomIndex(SYMBOL_LIBRARY.length);
  const distractorOne = randomIndex(SYMBOL_LIBRARY.length, targetIndex);
  let distractorTwo = randomIndex(SYMBOL_LIBRARY.length, distractorOne);
  while (distractorTwo === targetIndex) distractorTwo = randomIndex(SYMBOL_LIBRARY.length, distractorOne);
  const targetVariant = SYMBOL_LIBRARY[targetIndex];
  const distractors = [SYMBOL_LIBRARY[distractorOne], SYMBOL_LIBRARY[distractorTwo]];
  const tiles = shuffleArray(
    Array.from({ length: tileCount }, (_, index) => {
      if (index === 0) return { ...targetVariant, target: true, rotation: 4 };
      const variant = distractors[index % distractors.length];
      return { ...variant, target: false, rotation: index % 2 === 0 ? -2 : 2 };
    })
  ).map((tile, index) => ({ id: `scan-${round}-${index}`, ...tile, rotation: tile.rotation + (index % 2 === 0 ? -1 : 1) }));
  const targetTile = tiles.find((tile) => tile.target) ?? null;
  return { tiles, targetLabel: targetVariant.label, targetId: targetTile?.id ?? null };
}

export function mergeScoreboard(payload: Partial<Scoreboard> | null | undefined): Scoreboard {
  return {
    memory: { ...EMPTY_SCOREBOARD.memory, ...(payload?.memory ?? {}) },
    pairs: { ...EMPTY_SCOREBOARD.pairs, ...(payload?.pairs ?? {}) },
    pulse: { ...EMPTY_SCOREBOARD.pulse, ...(payload?.pulse ?? {}) },
    route: { ...EMPTY_SCOREBOARD.route, ...(payload?.route ?? {}) },
    difference: { ...EMPTY_SCOREBOARD.difference, ...(payload?.difference ?? {}) },
    scan: { ...EMPTY_SCOREBOARD.scan, ...(payload?.scan ?? {}) },
    logic: { ...EMPTY_SCOREBOARD.logic, ...(payload?.logic ?? {}) },
  };
}

export function renderLogicShape(shape: LogicShape, color: string, size = 40): string {
  const s = size;
  const half = s / 2;
  if (shape === "circle") return `<circle cx="${half}" cy="${half}" r="${half * 0.7}" fill="${color}" />`;
  if (shape === "square") { const pad = s * 0.15; return `<rect x="${pad}" y="${pad}" width="${s - pad * 2}" height="${s - pad * 2}" rx="4" fill="${color}" />`; }
  if (shape === "triangle") return `<polygon points="${half},${s * 0.1} ${s * 0.9},${s * 0.9} ${s * 0.1},${s * 0.9}" fill="${color}" />`;
  const pad = s * 0.1;
  return `<polygon points="${half},${pad} ${s - pad},${half} ${half},${s - pad} ${pad},${half}" fill="${color}" />`;
}

export function createLogicPuzzle(): LogicPuzzle {
  const useColorRule = Math.random() < 0.5;
  const shapes = [...LOGIC_SHAPES];
  const colors = [...LOGIC_COLORS];
  const threeShapes = shuffleArray([...shapes]).slice(0, 3) as LogicShape[];
  const threeColors = shuffleArray([...colors]).slice(0, 3);

  let grid: LogicCell[];
  let answerCell: LogicCell;
  let ruleHint: string;

  if (useColorRule) {
    const rowShapes = shuffleArray(threeShapes) as LogicShape[];
    grid = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        grid.push({ shape: rowShapes[row], color: threeColors[col] });
      }
    }
    answerCell = grid[8];
    ruleHint = "Her satırda aynı şekil, her sütunda farklı renk";
  } else {
    const colColors = shuffleArray(threeColors);
    grid = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        grid.push({ shape: threeShapes[row], color: colColors[col] });
      }
    }
    answerCell = grid[8];
    ruleHint = "Her sütunda aynı renk, her satırda farklı şekil";
  }

  const wrong: LogicCell[] = [];
  const allCells: LogicCell[] = [];
  for (const sh of threeShapes) {
    for (const co of threeColors) {
      allCells.push({ shape: sh, color: co });
    }
  }
  for (const sh of LOGIC_SHAPES) {
    for (const co of LOGIC_COLORS) {
      allCells.push({ shape: sh, color: co });
    }
  }
  for (const cell of shuffleArray(allCells)) {
    if (cell.shape === answerCell.shape && cell.color === answerCell.color) continue;
    if (wrong.some(w => w.shape === cell.shape && w.color === cell.color)) continue;
    wrong.push(cell);
    if (wrong.length === 3) break;
  }

  const answerIdx = randomIndex(4);
  const options: LogicCell[] = [...wrong];
  options.splice(answerIdx, 0, answerCell);

  return { grid: grid.slice(0, 8), options, answerIdx, ruleHint };
}

export function moveGridCursor(current: number, key: string, columns: number, itemCount: number): number {
  const row = Math.floor(current / columns);
  const column = current % columns;
  if (key === "ArrowUp") return Math.max(0, current - columns);
  if (key === "ArrowDown") return Math.min(itemCount - 1, current + columns);
  if (key === "ArrowLeft") return row * columns + Math.max(0, column - 1);
  if (key === "ArrowRight") return row * columns + Math.min(columns - 1, column + 1);
  return current;
}
