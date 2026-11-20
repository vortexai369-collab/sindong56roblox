import { getIslandInlandMargin } from "./town_planner";
import type { BlockMaterial, BlockOp, BlockShape, WorldBlock } from "./types";

export const BLOCK_SIZE = 0.75;
export const MAX_WORLD_BLOCKS = 12_000;
export const MAX_BLOCK_Y = 48;
export const MAX_BLOCK_GRID_XZ = 215;

// Spacious flat sunlit meadow directly south of town center (r ~ 20m clear lawn)
export const BLOCK_PLAZA_WORLD = { x: 0, z: 100 };
export const BLOCK_PLAZA_GRID = {
  x: Math.round(BLOCK_PLAZA_WORLD.x / BLOCK_SIZE),
  z: Math.round(BLOCK_PLAZA_WORLD.z / BLOCK_SIZE),
};

const VALID_SHAPES = new Set<BlockShape>(["cube", "slab", "slope", "cylinder", "dome"]);
const VALID_MATERIALS = new Set<BlockMaterial>(["matte", "wood", "brick", "glass", "glow"]);
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export function blockKey(x: number, y: number, z: number): string {
  return `${x},${y},${z}`;
}

export function isBlockCoordOnIsland(gx: number, gy: number, gz: number): boolean {
  if (!Number.isInteger(gx) || !Number.isInteger(gy) || !Number.isInteger(gz)) return false;
  if (gy < 0 || gy > MAX_BLOCK_Y) return false;
  if (Math.abs(gx) > MAX_BLOCK_GRID_XZ || Math.abs(gz) > MAX_BLOCK_GRID_XZ) return false;
  const wx = gx * BLOCK_SIZE;
  const wz = gz * BLOCK_SIZE;
  // Allow building across the flat island plateau and down to the sandy shoreline
  return getIslandInlandMargin(wx, wz) >= -4.5;
}

export function sanitizeBlockColor(raw: unknown, fallback = "#4c82d4"): string {
  if (typeof raw !== "string") return fallback;
  const trimmed = raw.trim();
  return HEX_COLOR_RE.test(trimmed) ? trimmed.toLowerCase() : fallback;
}

export function sanitizeBlockShape(raw: unknown): BlockShape {
  return typeof raw === "string" && VALID_SHAPES.has(raw as BlockShape)
    ? (raw as BlockShape)
    : "cube";
}

export function sanitizeBlockMaterial(raw: unknown): BlockMaterial {
  return typeof raw === "string" && VALID_MATERIALS.has(raw as BlockMaterial)
    ? (raw as BlockMaterial)
    : "matte";
}

export function sanitizeBlockRot(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return 0;
  return ((Math.trunc(raw) % 4) + 4) % 4;
}

export function sanitizeBlockOp(raw: unknown): BlockOp | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const op = obj.op;
  if (op !== "set" && op !== "del") return null;

  const x = typeof obj.x === "number" && Number.isFinite(obj.x) ? Math.round(obj.x) : NaN;
  const y = typeof obj.y === "number" && Number.isFinite(obj.y) ? Math.round(obj.y) : NaN;
  const z = typeof obj.z === "number" && Number.isFinite(obj.z) ? Math.round(obj.z) : NaN;
  if (!isBlockCoordOnIsland(x, y, z)) return null;

  if (op === "del") {
    return { op: "del", x, y, z };
  }

  return {
    op: "set",
    x,
    y,
    z,
    color: sanitizeBlockColor(obj.color),
    mat: sanitizeBlockMaterial(obj.mat),
    shape: sanitizeBlockShape(obj.shape),
    rot: sanitizeBlockRot(obj.rot),
  };
}

export function sanitizePersistedBlock(raw: unknown): WorldBlock | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const x = typeof obj.x === "number" && Number.isFinite(obj.x) ? Math.round(obj.x) : NaN;
  const y = typeof obj.y === "number" && Number.isFinite(obj.y) ? Math.round(obj.y) : NaN;
  const z = typeof obj.z === "number" && Number.isFinite(obj.z) ? Math.round(obj.z) : NaN;
  if (!isBlockCoordOnIsland(x, y, z)) return null;

  const by =
    typeof obj.by === "string"
      ? obj.by.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, 16)
      : undefined;
  const byId =
    typeof obj.byId === "string"
      ? obj.byId.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, 48)
      : undefined;

  return {
    k: blockKey(x, y, z),
    x,
    y,
    z,
    color: sanitizeBlockColor(obj.color),
    mat: sanitizeBlockMaterial(obj.mat),
    shape: sanitizeBlockShape(obj.shape),
    rot: sanitizeBlockRot(obj.rot),
    ...(by ? { by } : {}),
    ...(byId ? { byId } : {}),
    updatedAt:
      typeof obj.updatedAt === "number" && Number.isFinite(obj.updatedAt)
        ? obj.updatedAt
        : Date.now(),
  };
}

/**
 * Welcoming Sindong Block Plaza starter blocks at (0, 100):
 * A colorful arch gate with glowing lanterns + small corner garden sculptures,
 * leaving a generous open lawn in the middle for students to build shapes together.
 */
export function buildStarterPlazaBlocks(): WorldBlock[] {
  const cx = BLOCK_PLAZA_GRID.x;
  const cz = BLOCK_PLAZA_GRID.z;
  const now = Date.now();
  const map = new Map<string, WorldBlock>();

  const put = (
    dx: number,
    y: number,
    dz: number,
    color: string,
    mat: BlockMaterial = "matte",
    shape: BlockShape = "cube",
    rot = 0,
  ) => {
    const x = cx + dx;
    const z = cz + dz;
    if (!isBlockCoordOnIsland(x, y, z)) return;
    const k = blockKey(x, y, z);
    map.set(k, {
      k,
      x,
      y,
      z,
      color,
      mat,
      shape,
      rot,
      by: "Sindong Plaza",
      byId: "seed-plaza",
      updatedAt: now,
    });
  };

  // 1. North Entrance Rainbow Archway (dz = -7)
  const archZ = -7;
  // Stone pedestals
  put(-4, 0, archZ, "#e8dfc8", "brick", "cube");
  put(4, 0, archZ, "#e8dfc8", "brick", "cube");
  put(-5, 0, archZ, "#d8c6a1", "matte", "slab");
  put(5, 0, archZ, "#d8c6a1", "matte", "slab");
  // Vertical rainbow pillars
  const leftCols = ["#ef4444", "#f97316", "#facc15", "#22c55e"];
  const rightCols = ["#8b5cf6", "#3b82f6", "#06b6d4", "#22c55e"];
  for (let y = 1; y <= 4; y++) {
    put(-4, y, archZ, leftCols[y - 1], "matte", "cube");
    put(4, y, archZ, rightCols[y - 1], "matte", "cube");
  }
  // Curved arch crown
  put(-3, 5, archZ, "#22c55e", "matte", "cube");
  put(-2, 5, archZ, "#06b6d4", "matte", "cube");
  put(-1, 6, archZ, "#3b82f6", "matte", "cube");
  put(0, 6, archZ, "#ffe29a", "glow", "cube");
  put(1, 6, archZ, "#8b5cf6", "matte", "cube");
  put(2, 5, archZ, "#ec4899", "matte", "cube");
  put(3, 5, archZ, "#ef4444", "matte", "cube");
  // Warm glowing lanterns flanking the gate
  put(-5, 1, archZ, "#c9935b", "wood", "cylinder");
  put(-5, 2, archZ, "#ffe29a", "glow", "dome");
  put(5, 1, archZ, "#c9935b", "wood", "cylinder");
  put(5, 2, archZ, "#ffe29a", "glow", "dome");

  // 2. Corner low wooden benches / markers outlining the generous open build courtyard
  for (const [sx, sz] of [
    [-8, -5],
    [8, -5],
    [-8, 7],
    [8, 7],
  ]) {
    put(sx, 0, sz, "#c9935b", "wood", "cube");
    put(sx, 1, sz, "#ffe29a", "glow", "slab");
  }

  // 3. Cute starter voxel Heart sculpture on the west side (dx = -7, dz = 1)
  const heartPts: [number, number][] = [
    [0, 1],
    [-1, 2],
    [0, 2],
    [1, 2],
    [-2, 3],
    [-1, 3],
    [0, 3],
    [1, 3],
    [2, 3],
    [-2, 4],
    [-1, 4],
    [1, 4],
    [2, 4],
  ];
  put(-8, 0, 1, "#f2eadb", "matte", "slab");
  for (const [hz, hy] of heartPts) {
    put(-8, hy, 1 + hz, "#ec4899", "matte", "cube");
  }

  // 4. Cute starter stepped miniature house example on the east side (dx = 8, dz = 1)
  for (let x = 7; x <= 9; x++) {
    for (let z = 0; z <= 2; z++) {
      put(x, 0, z, "#e8dfc8", "brick", "cube");
      if (x === 7 || x === 9 || z === 0 || z === 2) {
        if (!(x === 7 && z === 1)) {
          put(x, 1, z, x === 8 && (z === 0 || z === 2) ? "#b8e4f2" : "#faf3e3", x === 8 && (z === 0 || z === 2) ? "glass" : "matte", "cube");
        }
      }
      put(x, 2, z, "#cc7a57", "brick", "cube");
    }
  }
  put(8, 3, 1, "#cc7a57", "brick", "dome");

  return [...map.values()];
}
