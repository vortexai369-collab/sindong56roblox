// Collaborative 3D Voxel Block Builder for Sindong Island.
// Features:
//  - 5 block shapes (cube, slab, slope, cylinder, dome) x 5 procedural PBR materials (matte, wood, brick, glass, glow)
//  - Batched THREE.InstancedMesh rendering with exact face-normal raycasting & pop-in spring animation
//  - 8 rotatable multi-block Shape Stamps (floor, stairs, arch, heart, star, house, tree, tower)
//  - Dynamic cursor-following alignment grid & ghost preview (works in Pan, Orbit, and Walk modes)
//  - Walkable surface height queries so students can climb and stand on their creations
//  - Procedural Web Audio API tactile block sounds (zero external assets)

import * as THREE from "three";

export const BLOCK_SIZE = 0.75;
export const MAX_BLOCK_Y = 48;
export const MAX_BLOCK_GRID_XZ = 215;
export const BLOCK_PLAZA_WORLD = { x: 0, z: 100 };

export const BLOCK_COLORS = [
  { hex: "#ef4444", label: "빨강" },
  { hex: "#f97316", label: "주황" },
  { hex: "#facc15", label: "노랑" },
  { hex: "#84cc16", label: "연두" },
  { hex: "#22c55e", label: "초록" },
  { hex: "#14b8a6", label: "청록" },
  { hex: "#38bdf8", label: "하늘" },
  { hex: "#3b82f6", label: "파랑" },
  { hex: "#6366f1", label: "남색" },
  { hex: "#a855f7", label: "보라" },
  { hex: "#ec4899", label: "분홍" },
  { hex: "#faf3e3", label: "크림" },
  { hex: "#e8dfc8", label: "모래" },
  { hex: "#c9935b", label: "나무" },
  { hex: "#94a3b8", label: "회색" },
  { hex: "#27272a", label: "검정" },
];

export const BLOCK_SHAPES = [
  { id: "cube", label: "큐브" },
  { id: "slab", label: "반블록" },
  { id: "slope", label: "지붕" },
  { id: "cylinder", label: "기둥" },
  { id: "dome", label: "돔" },
];

export const BLOCK_MATERIALS = [
  { id: "matte", label: "기본" },
  { id: "wood", label: "원목" },
  { id: "brick", label: "벽돌" },
  { id: "glass", label: "유리" },
  { id: "glow", label: "조명" },
];

export const BLOCK_STAMPS = [
  {
    id: "floor3",
    label: "3×3 바닥",
    blocks: [
      [-1, 0, -1], [0, 0, -1], [1, 0, -1],
      [-1, 0, 0], [0, 0, 0], [1, 0, 0],
      [-1, 0, 1], [0, 0, 1], [1, 0, 1],
    ].map(([dx, dy, dz]) => ({ dx, dy, dz, shape: "slab" })),
  },
  {
    id: "stairs",
    label: "계단",
    blocks: [
      { dx: -1, dy: 0, dz: 1, shape: "cube" },
      { dx: 0, dy: 0, dz: 1, shape: "cube" },
      { dx: 1, dy: 0, dz: 1, shape: "cube" },
      { dx: -1, dy: 0, dz: 0, shape: "cube" },
      { dx: 0, dy: 0, dz: 0, shape: "cube" },
      { dx: 1, dy: 0, dz: 0, shape: "cube" },
      { dx: -1, dy: 1, dz: 0, shape: "cube" },
      { dx: 0, dy: 1, dz: 0, shape: "cube" },
      { dx: 1, dy: 1, dz: 0, shape: "cube" },
      { dx: -1, dy: 0, dz: -1, shape: "cube" },
      { dx: 0, dy: 0, dz: -1, shape: "cube" },
      { dx: 1, dy: 0, dz: -1, shape: "cube" },
      { dx: -1, dy: 1, dz: -1, shape: "cube" },
      { dx: 0, dy: 1, dz: -1, shape: "cube" },
      { dx: 1, dy: 1, dz: -1, shape: "cube" },
      { dx: -1, dy: 2, dz: -1, shape: "cube" },
      { dx: 0, dy: 2, dz: -1, shape: "cube" },
      { dx: 1, dy: 2, dz: -1, shape: "cube" },
    ],
  },
  {
    id: "arch",
    label: "아치문",
    blocks: [
      { dx: -2, dy: 0, dz: 0, shape: "cube" },
      { dx: -2, dy: 1, dz: 0, shape: "cube" },
      { dx: -2, dy: 2, dz: 0, shape: "cube" },
      { dx: -1, dy: 3, dz: 0, shape: "cube" },
      { dx: 0, dy: 3, dz: 0, shape: "cube", mat: "glow", color: "#ffe29a" },
      { dx: 1, dy: 3, dz: 0, shape: "cube" },
      { dx: 2, dy: 0, dz: 0, shape: "cube" },
      { dx: 2, dy: 1, dz: 0, shape: "cube" },
      { dx: 2, dy: 2, dz: 0, shape: "cube" },
    ],
  },
  {
    id: "heart",
    label: "하트",
    blocks: [
      [0, 0],
      [-1, 1], [0, 1], [1, 1],
      [-2, 2], [-1, 2], [0, 2], [1, 2], [2, 2],
      [-2, 3], [-1, 3], [1, 3], [2, 3],
    ].map(([dx, dy]) => ({ dx, dy, dz: 0, shape: "cube" })),
  },
  {
    id: "star",
    label: "별",
    blocks: [
      [0, 0],
      [-1, 1], [0, 1], [1, 1],
      [-2, 2], [-1, 2], [0, 2], [1, 2], [2, 2],
      [-1, 3], [0, 3], [1, 3],
      [0, 4],
    ].map(([dx, dy]) => ({ dx, dy, dz: 0, shape: "cube", mat: "glow" })),
  },
  {
    id: "house",
    label: "미니 집",
    blocks: [
      // walls
      { dx: -1, dy: 0, dz: -1, shape: "cube" },
      { dx: 0, dy: 0, dz: -1, shape: "cube" },
      { dx: 1, dy: 0, dz: -1, shape: "cube" },
      { dx: -1, dy: 0, dz: 0, shape: "cube" },
      { dx: 1, dy: 0, dz: 0, shape: "cube" },
      { dx: -1, dy: 0, dz: 1, shape: "cube" },
      { dx: 1, dy: 0, dz: 1, shape: "cube" },
      // second layer with glass windows
      { dx: -1, dy: 1, dz: -1, shape: "cube" },
      { dx: 0, dy: 1, dz: -1, shape: "cube", mat: "glass", color: "#38bdf8" },
      { dx: 1, dy: 1, dz: -1, shape: "cube" },
      { dx: -1, dy: 1, dz: 0, shape: "cube", mat: "glass", color: "#38bdf8" },
      { dx: 1, dy: 1, dz: 0, shape: "cube", mat: "glass", color: "#38bdf8" },
      { dx: -1, dy: 1, dz: 1, shape: "cube" },
      { dx: 0, dy: 1, dz: 1, shape: "cube" },
      { dx: 1, dy: 1, dz: 1, shape: "cube" },
      // roof
      { dx: -1, dy: 2, dz: -1, shape: "slope", rot: 1, color: "#ef4444", mat: "brick" },
      { dx: -1, dy: 2, dz: 0, shape: "slope", rot: 1, color: "#ef4444", mat: "brick" },
      { dx: -1, dy: 2, dz: 1, shape: "slope", rot: 1, color: "#ef4444", mat: "brick" },
      { dx: 0, dy: 2, dz: -1, shape: "cube", color: "#ef4444", mat: "brick" },
      { dx: 0, dy: 2, dz: 0, shape: "cube", color: "#ef4444", mat: "brick" },
      { dx: 0, dy: 2, dz: 1, shape: "cube", color: "#ef4444", mat: "brick" },
      { dx: 1, dy: 2, dz: -1, shape: "slope", rot: 3, color: "#ef4444", mat: "brick" },
      { dx: 1, dy: 2, dz: 0, shape: "slope", rot: 3, color: "#ef4444", mat: "brick" },
      { dx: 1, dy: 2, dz: 1, shape: "slope", rot: 3, color: "#ef4444", mat: "brick" },
    ],
  },
  {
    id: "tree",
    label: "나무",
    blocks: [
      { dx: 0, dy: 0, dz: 0, shape: "cylinder", color: "#c9935b", mat: "wood" },
      { dx: 0, dy: 1, dz: 0, shape: "cylinder", color: "#c9935b", mat: "wood" },
      { dx: -1, dy: 2, dz: 0, shape: "cube", color: "#22c55e", mat: "matte" },
      { dx: 1, dy: 2, dz: 0, shape: "cube", color: "#22c55e", mat: "matte" },
      { dx: 0, dy: 2, dz: -1, shape: "cube", color: "#22c55e", mat: "matte" },
      { dx: 0, dy: 2, dz: 1, shape: "cube", color: "#22c55e", mat: "matte" },
      { dx: 0, dy: 2, dz: 0, shape: "cube", color: "#22c55e", mat: "matte" },
      { dx: 0, dy: 3, dz: 0, shape: "dome", color: "#84cc16", mat: "matte" },
    ],
  },
  {
    id: "tower",
    label: "전망 탑",
    blocks: [
      { dx: 0, dy: 0, dz: 0, shape: "cube" },
      { dx: 0, dy: 1, dz: 0, shape: "cylinder" },
      { dx: 0, dy: 2, dz: 0, shape: "cylinder" },
      { dx: 0, dy: 3, dz: 0, shape: "cube" },
      { dx: 0, dy: 4, dz: 0, shape: "dome", mat: "glow", color: "#ffe29a" },
    ],
  },
];

export function blockKey(x, y, z) {
  return `${x},${y},${z}`;
}

function rotateOffset(dx, dz, rot) {
  const r = ((rot % 4) + 4) % 4;
  if (r === 1) return [-dz, dx];
  if (r === 2) return [-dx, -dz];
  if (r === 3) return [dz, -dx];
  return [dx, dz];
}

// Reusable scratch math objects (zero per-frame GC)
const _mat4 = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _col = new THREE.Color();
const _upAxis = new THREE.Vector3(0, 1, 0);
const _normalTmp = new THREE.Vector3();
const _rotQuat = new THREE.Quaternion();
const _hitPt = new THREE.Vector3();
const _groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

// ---- Procedural Block Textures (100% Canvas, SRGBColorSpace, High Anisotropy) ----
function makeProceduralBlockTexture(kind, maxAniso = 4) {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");

  if (kind === "matte") {
    ctx.fillStyle = "#f4f4f4";
    ctx.fillRect(0, 0, size, size);
    // Subtle chamfer highlight & shadow edge so stacked blocks stay readable
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, size - 8, size - 8);
    ctx.strokeStyle = "rgba(20,28,22,0.16)";
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, size - 3, size - 3);
    // Faint playful stud ring in center
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.2, 0, Math.PI * 2);
    ctx.stroke();
  } else if (kind === "wood") {
    ctx.fillStyle = "#e8e3dc";
    ctx.fillRect(0, 0, size, size);
    for (let y = 0; y < size; y += 4) {
      const shade = 226 + Math.round(Math.sin(y * 0.25) * 14 + ((y * 17) % 9) - 4);
      ctx.fillStyle = `rgb(${shade},${shade - 4},${shade - 10})`;
      ctx.fillRect(0, y, size, 4);
    }
    ctx.fillStyle = "rgba(70,44,20,0.2)";
    ctx.fillRect(0, 0, size, 3);
    ctx.fillRect(0, 62, size, 2);
    ctx.fillRect(0, size - 3, size, 3);
    ctx.fillRect(62, 0, 2, 62);
    ctx.fillRect(28, 64, 2, 64);
  } else if (kind === "brick") {
    ctx.fillStyle = "#d9d4cb";
    ctx.fillRect(0, 0, size, size);
    const rows = 4;
    const rowH = size / rows;
    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * (size * 0.25);
      for (let col = -1; col <= 2; col++) {
        const bx = col * (size * 0.5) + off + 3;
        const by = r * rowH + 3;
        const bw = size * 0.5 - 6;
        const bh = rowH - 6;
        const v = 236 + ((r * 11 + col * 7) % 15) - 7;
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(bx, by, bw, bh);
      }
    }
  } else if (kind === "glass") {
    ctx.fillStyle = "#eef9ff";
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, size - 8, size - 8);
    ctx.strokeStyle = "rgba(255,255,255,0.65)";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(22, size - 22);
    ctx.lineTo(size - 22, 22);
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(46, size - 18);
    ctx.lineTo(size - 18, 46);
    ctx.stroke();
  } else {
    // glow
    const grad = ctx.createRadialGradient(size / 2, size / 2, 6, size / 2, size / 2, size * 0.65);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.65, "#f3f3f3");
    grad.addColorStop(1, "#d8d8d8");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 5;
    ctx.strokeRect(3, 3, size - 6, size - 6);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, maxAniso);
  tex.needsUpdate = true;
  return tex;
}

// ---- Custom Geometries for Block Shapes ----
function buildSlopeGeometry(S) {
  const h = S * 0.5;
  // Wedge rising from -Z (bottom edge) to +Z (full height back wall)
  const positions = new Float32Array([
    // Bottom face (y = -h)
    -h, -h, -h,   h, -h, -h,   h, -h,  h,
    -h, -h, -h,   h, -h,  h,  -h, -h,  h,
    // Back face (z = +h)
    -h, -h,  h,   h, -h,  h,   h,  h,  h,
    -h, -h,  h,   h,  h,  h,  -h,  h,  h,
    // Sloped top ramp (-h,-h,-h -> h,-h,-h -> h,h,h -> -h,h,h)
    -h, -h, -h,  -h,  h,  h,   h,  h,  h,
    -h, -h, -h,   h,  h,  h,   h, -h, -h,
    // Left triangle (x = -h)
    -h, -h, -h,  -h, -h,  h,  -h,  h,  h,
    // Right triangle (x = +h)
     h, -h, -h,   h,  h,  h,   h, -h,  h,
  ]);

  const invSqrt2 = Math.SQRT1_2;
  const normals = new Float32Array([
    // Bottom
    0, -1, 0,  0, -1, 0,  0, -1, 0,
    0, -1, 0,  0, -1, 0,  0, -1, 0,
    // Back
    0, 0, 1,   0, 0, 1,   0, 0, 1,
    0, 0, 1,   0, 0, 1,   0, 0, 1,
    // Slope
    0, invSqrt2, -invSqrt2,  0, invSqrt2, -invSqrt2,  0, invSqrt2, -invSqrt2,
    0, invSqrt2, -invSqrt2,  0, invSqrt2, -invSqrt2,  0, invSqrt2, -invSqrt2,
    // Left
    -1, 0, 0,  -1, 0, 0,  -1, 0, 0,
    // Right
    1, 0, 0,   1, 0, 0,   1, 0, 0,
  ]);

  const uvs = new Float32Array([
    0, 0, 1, 0, 1, 1,  0, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1,  0, 0, 1, 1, 0, 1,
    0, 0, 0, 1, 1, 1,  0, 0, 1, 1, 1, 0,
    0, 0, 1, 0, 1, 1,
    0, 0, 1, 1, 1, 0,
  ]);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

function buildDomeGeometry(S) {
  const geo = new THREE.SphereGeometry(S * 0.495, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5);
  geo.translate(0, -S * 0.5, 0);
  // Add slight base collar so dome sits solidly on blocks below
  const baseGeo = new THREE.CylinderGeometry(S * 0.495, S * 0.495, S * 0.14, 16);
  baseGeo.translate(0, -S * 0.5 + S * 0.07, 0);
  // Keep hemisphere only cleanly shifted slightly up by collar
  geo.translate(0, S * 0.14, 0);
  // Merge hemisphere and collar into one indexed BufferGeometry
  const g1 = geo.toNonIndexed();
  const g2 = baseGeo.toNonIndexed();
  const p1 = g1.attributes.position.array;
  const p2 = g2.attributes.position.array;
  const n1 = g1.attributes.normal.array;
  const n2 = g2.attributes.normal.array;
  const u1 = g1.attributes.uv.array;
  const u2 = g2.attributes.uv.array;

  const pos = new Float32Array(p1.length + p2.length);
  pos.set(p1, 0);
  pos.set(p2, p1.length);
  const norm = new Float32Array(n1.length + n2.length);
  norm.set(n1, 0);
  norm.set(n2, n1.length);
  const uv = new Float32Array(u1.length + u2.length);
  uv.set(u1, 0);
  uv.set(u2, u1.length);

  geo.dispose();
  baseGeo.dispose();
  g1.dispose();
  g2.dispose();

  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  merged.setAttribute("normal", new THREE.BufferAttribute(norm, 3));
  merged.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  merged.computeBoundingBox();
  merged.computeBoundingSphere();
  return merged;
}

// ---- Subtle Procedural Web Audio Sound Effects ----
function createBlockAudio() {
  let ctx = null;
  let muted = false;

  function ensureCtx() {
    if (muted || typeof window === "undefined") return null;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try {
        ctx = new AC();
      } catch {
        return null;
      }
    }
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function playTone(freq, dur, gainPeak, type = "triangle", slideTo = null, delay = 0) {
    const ac = ensureCtx();
    if (!ac) return;
    const t0 = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    }
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(gainPeak, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  return {
    playPlace(heightY = 0) {
      const base = 340 + Math.min(24, heightY) * 18;
      playTone(base, 0.075, 0.08, "triangle", base * 1.18);
    },
    playErase() {
      playTone(260, 0.07, 0.07, "sine", 140);
    },
    playPaint() {
      playTone(520, 0.06, 0.06, "sine", 660);
    },
    playStamp() {
      playTone(392, 0.09, 0.07, "triangle", null, 0);
      playTone(494, 0.09, 0.07, "triangle", null, 0.045);
      playTone(587, 0.13, 0.08, "triangle", null, 0.09);
    },
    setMuted(m) {
      muted = Boolean(m);
    },
    isMuted() {
      return muted;
    },
  };
}

// ---- Main 3D Collaborative Block World Manager ----
export function createBlockWorldManager({
  getInlandMargin,
  getGroundHeight,
  maxAniso = 4,
  isSoftwareGpu = false,
}) {
  const root = new THREE.Group();
  root.name = "StudentBlocksRoot";

  const blocksGroup = new THREE.Group();
  root.add(blocksGroup);

  const audio = createBlockAudio();

  // Shared geometries per shape
  const S = BLOCK_SIZE;
  const slabGeo = new THREE.BoxGeometry(S, S * 0.5, S);
  slabGeo.translate(0, -S * 0.25, 0);

  const geometries = {
    cube: new THREE.BoxGeometry(S, S, S),
    slab: slabGeo,
    slope: buildSlopeGeometry(S),
    cylinder: new THREE.CylinderGeometry(S * 0.47, S * 0.47, S, 16),
    dome: buildDomeGeometry(S),
  };

  // Shared materials per material kind
  const textures = {
    matte: makeProceduralBlockTexture("matte", maxAniso),
    wood: makeProceduralBlockTexture("wood", maxAniso),
    brick: makeProceduralBlockTexture("brick", maxAniso),
    glass: makeProceduralBlockTexture("glass", maxAniso),
    glow: makeProceduralBlockTexture("glow", maxAniso),
  };

  const glowMat = new THREE.MeshStandardMaterial({
    map: textures.glow,
    roughness: 0.35,
    metalness: 0.04,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.45,
  });
  // Tint emissive by per-instance color so every colored glow block emits its own hue!
  glowMat.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>
      #ifdef USE_INSTANCING_COLOR
        totalEmissiveRadiance *= vColor.rgb;
      #endif`,
    );
  };

  const materials = {
    matte: new THREE.MeshStandardMaterial({
      map: textures.matte,
      roughness: 0.62,
      metalness: 0.04,
    }),
    wood: new THREE.MeshStandardMaterial({
      map: textures.wood,
      roughness: 0.78,
      metalness: 0.02,
    }),
    brick: new THREE.MeshStandardMaterial({
      map: textures.brick,
      roughness: 0.86,
      metalness: 0.02,
    }),
    glass: new THREE.MeshStandardMaterial({
      map: textures.glass,
      roughness: 0.14,
      metalness: 0.12,
      transparent: true,
      opacity: isSoftwareGpu ? 0.58 : 0.52,
      depthWrite: false,
    }),
    glow: glowMat,
  };

  // Authoritative client-side block mirror: Map<key, WorldBlock>
  const blocks = new Map();
  // Column index for fast O(1) walk surface height lookup: Map<"x,z", Set<y>>
  const columnHeights = new Map();
  // Active pop-in animations: Map<key, { startMs: number }>
  const popAnims = new Map();

  // InstancedMesh buckets keyed by `${shape}:${mat}`
  const buckets = new Map();
  let dirtyBuckets = new Set();
  let activeRayMeshes = [];

  function bucketKey(shape, mat) {
    const s = geometries[shape] ? shape : "cube";
    const m = materials[mat] ? mat : "matte";
    return `${s}:${m}`;
  }

  function ensureBucket(bKey, minCap = 64) {
    let b = buckets.get(bKey);
    if (b && b.capacity >= minCap) return b;

    const [shape, mat] = bKey.split(":");
    const nextCap = b ? Math.max(minCap, b.capacity * 2) : Math.max(64, minCap);
    if (b && b.mesh) {
      blocksGroup.remove(b.mesh);
      b.mesh.dispose();
    }

    const mesh = new THREE.InstancedMesh(geometries[shape], materials[mat], nextCap);
    mesh.castShadow = mat !== "glass";
    mesh.receiveShadow = true;
    mesh.count = 0;
    mesh.frustumCulled = false;
    mesh.userData.isStudentBlockBucket = true;
    mesh.userData.bucketKey = bKey;
    // Ensure instanceColor buffer exists immediately
    mesh.setColorAt(0, _col.set("#ffffff"));
    mesh.instanceColor.needsUpdate = true;

    blocksGroup.add(mesh);
    b = {
      key: bKey,
      shape,
      mat,
      mesh,
      capacity: nextCap,
      keys: [],
      keyToIndex: new Map(),
    };
    buckets.set(bKey, b);
    rebuildActiveRayMeshes();
    return b;
  }

  function rebuildActiveRayMeshes() {
    const arr = [];
    for (const b of buckets.values()) {
      if (b.mesh && b.mesh.count > 0) arr.push(b.mesh);
    }
    activeRayMeshes = arr;
  }

  function blockCenterWorld(x, y, z, out = _pos) {
    const wx = x * S;
    const wz = z * S;
    const baseY = getGroundHeight ? Math.max(-2.6, Math.min(0, getGroundHeight(wx, wz))) : 0;
    // On the flat island plateau baseY === 0 so adjacent blocks align seamlessly
    const snappedBase = Math.abs(baseY) < 0.04 ? 0 : baseY;
    out.set(wx, snappedBase + (y + 0.5) * S, wz);
    return out;
  }

  function writeInstanceTransform(b, idx, blk, scaleMult = 1) {
    blockCenterWorld(blk.x, blk.y, blk.z, _pos);
    if (scaleMult !== 1) {
      // Scale anchored to bottom center of cell so blocks sprout cleanly upward
      _pos.y -= (1 - scaleMult) * S * 0.5;
    }
    _quat.setFromAxisAngle(_upAxis, (blk.rot || 0) * (Math.PI * 0.5));
    _scale.setScalar(scaleMult);
    _mat4.compose(_pos, _quat, _scale);
    b.mesh.setMatrixAt(idx, _mat4);
    _col.set(blk.color || "#4c82d4");
    b.mesh.setColorAt(idx, _col);
  }

  function rebuildBucket(bKey) {
    const matching = [];
    for (const blk of blocks.values()) {
      if (bucketKey(blk.shape, blk.mat) === bKey) {
        matching.push(blk);
      }
    }

    if (matching.length === 0) {
      const existing = buckets.get(bKey);
      if (existing) {
        existing.keys.length = 0;
        existing.keyToIndex.clear();
        existing.mesh.count = 0;
        existing.mesh.instanceMatrix.needsUpdate = true;
      }
      return;
    }

    const b = ensureBucket(bKey, matching.length);
    b.keys.length = matching.length;
    b.keyToIndex.clear();
    const now = performance.now();

    for (let i = 0; i < matching.length; i++) {
      const blk = matching[i];
      b.keys[i] = blk.k;
      b.keyToIndex.set(blk.k, i);
      const anim = popAnims.get(blk.k);
      let sMult = 1;
      if (anim) {
        const p = Math.min(1, (now - anim.startMs) / 140);
        // Snappy overshoot spring curve
        sMult = p < 1 ? 0.35 + 0.65 * (1 - Math.pow(1 - p, 3)) : 1;
      }
      writeInstanceTransform(b, i, blk, sMult);
    }

    b.mesh.count = matching.length;
    b.mesh.instanceMatrix.needsUpdate = true;
    if (b.mesh.instanceColor) b.mesh.instanceColor.needsUpdate = true;
    b.mesh.computeBoundingSphere();
  }

  function flushDirtyBuckets() {
    if (dirtyBuckets.size === 0) return;
    for (const bk of dirtyBuckets) {
      rebuildBucket(bk);
    }
    dirtyBuckets.clear();
    rebuildActiveRayMeshes();
  }

  function indexAdd(blk) {
    const ck = `${blk.x},${blk.z}`;
    let set = columnHeights.get(ck);
    if (!set) {
      set = new Set();
      columnHeights.set(ck, set);
    }
    set.add(blk.y);
  }

  function indexRemove(blk) {
    const ck = `${blk.x},${blk.z}`;
    const set = columnHeights.get(ck);
    if (set) {
      set.delete(blk.y);
      if (set.size === 0) columnHeights.delete(ck);
    }
  }

  function setLocalBlock(blk, animate = false) {
    const prev = blocks.get(blk.k);
    if (prev) {
      dirtyBuckets.add(bucketKey(prev.shape, prev.mat));
      indexRemove(prev);
    }
    blocks.set(blk.k, blk);
    indexAdd(blk);
    dirtyBuckets.add(bucketKey(blk.shape, blk.mat));
    if (animate) {
      popAnims.set(blk.k, { startMs: performance.now() });
    }
  }

  function deleteLocalBlock(k) {
    const prev = blocks.get(k);
    if (!prev) return false;
    blocks.delete(k);
    indexRemove(prev);
    popAnims.delete(k);
    dirtyBuckets.add(bucketKey(prev.shape, prev.mat));
    return true;
  }

  // ---- Build Mode State & 3D Cursor / Ghost Preview ----
  const buildState = {
    active: false,
    tool: "place", // "place" | "erase" | "paint" | "eyedropper" | "stamp"
    color: "#3b82f6",
    shape: "cube",
    mat: "matte",
    rot: 0,
    stampId: "house",
  };

  const ghostGroup = new THREE.Group();
  ghostGroup.visible = false;
  root.add(ghostGroup);

  const ghostMat = new THREE.MeshStandardMaterial({
    color: 0x3b82f6,
    roughness: 0.45,
    metalness: 0.05,
    transparent: true,
    opacity: 0.56,
    depthWrite: false,
  });

  const ghostEdgeMat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.92,
  });

  const eraseEdgeMat = new THREE.LineBasicMaterial({
    color: 0xef4444,
    transparent: true,
    opacity: 0.96,
  });

  const paintEdgeMat = new THREE.LineBasicMaterial({
    color: 0xfacc15,
    transparent: true,
    opacity: 0.96,
  });

  const cubeEdgesGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(S * 1.02, S * 1.02, S * 1.02));
  const highlightBox = new THREE.LineSegments(cubeEdgesGeo, eraseEdgeMat);
  highlightBox.visible = false;
  highlightBox.renderOrder = 25;
  root.add(highlightBox);

  // Subtle floating snapping grid (9x9 cells around hovered cell)
  const buildGrid = (() => {
    const cells = 9;
    const half = (cells * S) * 0.5;
    const verts = [];
    for (let i = 0; i <= cells; i++) {
      const p = -half + i * S;
      verts.push(-half, 0, p, half, 0, p);
      verts.push(p, 0, -half, p, 0, half);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    });
    const lines = new THREE.LineSegments(geo, mat);
    lines.visible = false;
    lines.renderOrder = 15;
    return lines;
  })();
  root.add(buildGrid);

  // Ghost pool for multi-block stamps (max 36 cells per stamp)
  const ghostPool = [];
  function ensureGhostPool(count) {
    while (ghostPool.length < count) {
      const m = new THREE.Mesh(geometries.cube, ghostMat);
      m.renderOrder = 20;
      const e = new THREE.LineSegments(cubeEdgesGeo, ghostEdgeMat);
      e.renderOrder = 21;
      m.add(e);
      ghostGroup.add(m);
      ghostPool.push({ mesh: m, edge: e });
    }
  }

  let currentHover = null; // { placePos, hitBlock, isGround }

  function isCoordValid(gx, gy, gz) {
    if (!Number.isInteger(gx) || !Number.isInteger(gy) || !Number.isInteger(gz)) return false;
    if (gy < 0 || gy > MAX_BLOCK_Y) return false;
    if (Math.abs(gx) > MAX_BLOCK_GRID_XZ || Math.abs(gz) > MAX_BLOCK_GRID_XZ) return false;
    const wx = gx * S;
    const wz = gz * S;
    return getInlandMargin ? getInlandMargin(wx, wz) >= -4.5 : true;
  }

  function getActiveStampSpec() {
    return BLOCK_STAMPS.find((s) => s.id === buildState.stampId) || BLOCK_STAMPS[0];
  }

  function resolveStampCells(origin) {
    const spec = getActiveStampSpec();
    const out = [];
    for (const item of spec.blocks) {
      const [rx, rz] = rotateOffset(item.dx, item.dz, buildState.rot);
      const x = origin.x + rx;
      const y = origin.y + item.dy;
      const z = origin.z + rz;
      if (!isCoordValid(x, y, z)) continue;
      const itemRot = (((item.rot || 0) + buildState.rot) % 4 + 4) % 4;
      out.push({
        x,
        y,
        z,
        color: item.color || buildState.color,
        mat: item.mat || buildState.mat,
        shape: item.shape || "cube",
        rot: itemRot,
      });
    }
    return out;
  }

  function hidePreview() {
    ghostGroup.visible = false;
    highlightBox.visible = false;
    buildGrid.visible = false;
    currentHover = null;
  }

  function refreshGhostVisual() {
    if (!buildState.active || !currentHover) {
      ghostGroup.visible = false;
      highlightBox.visible = false;
      buildGrid.visible = false;
      return;
    }

    const { placePos, hitBlock } = currentHover;

    if (buildState.tool === "erase" || buildState.tool === "paint" || buildState.tool === "eyedropper") {
      ghostGroup.visible = false;
      buildGrid.visible = false;
      if (hitBlock) {
        blockCenterWorld(hitBlock.x, hitBlock.y, hitBlock.z, _pos);
        highlightBox.position.copy(_pos);
        highlightBox.material = buildState.tool === "erase" ? eraseEdgeMat : paintEdgeMat;
        highlightBox.visible = true;
      } else {
        highlightBox.visible = false;
      }
      return;
    }

    highlightBox.visible = false;

    if (!placePos || !isCoordValid(placePos.x, placePos.y, placePos.z)) {
      ghostGroup.visible = false;
      buildGrid.visible = false;
      return;
    }

    // Position alignment grid on the target Y plane
    blockCenterWorld(placePos.x, placePos.y, placePos.z, _pos);
    buildGrid.position.set(placePos.x * S, _pos.y - S * 0.5 + 0.025, placePos.z * S);
    buildGrid.visible = true;

    if (buildState.tool === "stamp") {
      const cells = resolveStampCells(placePos);
      ensureGhostPool(cells.length);
      for (let i = 0; i < ghostPool.length; i++) {
        const slot = ghostPool[i];
        if (i < cells.length) {
          const c = cells[i];
          slot.mesh.geometry = geometries[c.shape] || geometries.cube;
          blockCenterWorld(c.x, c.y, c.z, slot.mesh.position);
          slot.mesh.rotation.set(0, c.rot * (Math.PI * 0.5), 0);
          slot.mesh.visible = true;
        } else {
          slot.mesh.visible = false;
        }
      }
      ghostMat.color.set(buildState.color);
      ghostGroup.visible = cells.length > 0;
      return;
    }

    // Single block ghost preview
    ensureGhostPool(1);
    for (let i = 1; i < ghostPool.length; i++) {
      ghostPool[i].mesh.visible = false;
    }
    const slot = ghostPool[0];
    slot.mesh.geometry = geometries[buildState.shape] || geometries.cube;
    blockCenterWorld(placePos.x, placePos.y, placePos.z, slot.mesh.position);
    slot.mesh.rotation.set(0, (buildState.rot || 0) * (Math.PI * 0.5), 0);
    slot.mesh.visible = true;
    ghostMat.color.set(buildState.color);
    ghostGroup.visible = true;
  }

  function raycastTarget(raycaster, maxDist = 280) {
    const prevFar = raycaster.far;
    raycaster.far = maxDist;

    let bestBlockHit = null;
    if (activeRayMeshes.length > 0) {
      const hits = raycaster.intersectObjects(activeRayMeshes, false);
      if (hits.length > 0) {
        bestBlockHit = hits[0];
      }
    }

    let groundDist = Infinity;
    let groundHit = null;
    if (raycaster.ray.direction.y < -0.005 || raycaster.ray.origin.y > 0.01) {
      if (raycaster.ray.intersectPlane(_groundPlane, _hitPt)) {
        const d = raycaster.ray.origin.distanceTo(_hitPt);
        if (d <= maxDist) {
          groundDist = d;
          groundHit = _hitPt.clone();
        }
      }
    }

    raycaster.far = prevFar;

    if (bestBlockHit && bestBlockHit.distance <= groundDist + 0.05) {
      const bKey = bestBlockHit.object.userData.bucketKey;
      const b = buckets.get(bKey);
      const key = b?.keys?.[bestBlockHit.instanceId];
      const hitBlock = key ? blocks.get(key) : null;
      if (hitBlock) {
        // Compute world face normal accounting for block's Y rotation
        _normalTmp.copy(bestBlockHit.face.normal);
        _rotQuat.setFromAxisAngle(_upAxis, (hitBlock.rot || 0) * (Math.PI * 0.5));
        _normalTmp.applyQuaternion(_rotQuat);
        // Snap normal to dominant cardinal direction
        const ax = Math.abs(_normalTmp.x);
        const ay = Math.abs(_normalTmp.y);
        const az = Math.abs(_normalTmp.z);
        let nx = 0;
        let ny = 0;
        let nz = 0;
        if (ay >= ax && ay >= az) {
          ny = _normalTmp.y >= 0 ? 1 : -1;
        } else if (ax >= az) {
          nx = _normalTmp.x >= 0 ? 1 : -1;
        } else {
          nz = _normalTmp.z >= 0 ? 1 : -1;
        }
        const px = hitBlock.x + nx;
        const py = Math.max(0, hitBlock.y + ny);
        const pz = hitBlock.z + nz;
        return {
          hitBlock,
          placePos: isCoordValid(px, py, pz) ? { x: px, y: py, z: pz } : null,
          isGround: false,
        };
      }
    }

    if (groundHit) {
      const gx = Math.round(groundHit.x / S);
      const gz = Math.round(groundHit.z / S);
      if (isCoordValid(gx, 0, gz)) {
        return {
          hitBlock: null,
          placePos: { x: gx, y: 0, z: gz },
          isGround: true,
        };
      }
    }

    return null;
  }

  function updateHoverFromRay(raycaster, maxDist = 280) {
    if (!buildState.active) {
      hidePreview();
      return null;
    }
    currentHover = raycastTarget(raycaster, maxDist);
    refreshGhostVisual();
    return currentHover;
  }

  function pickBlockInfoFromRay(raycaster, maxDist = 280) {
    if (activeRayMeshes.length === 0) return null;
    const prevFar = raycaster.far;
    raycaster.far = maxDist;
    const hits = raycaster.intersectObjects(activeRayMeshes, false);
    raycaster.far = prevFar;
    if (hits.length === 0) return null;
    const hit = hits[0];
    const b = buckets.get(hit.object.userData.bucketKey);
    const key = b?.keys?.[hit.instanceId];
    return key ? blocks.get(key) || null : null;
  }

  /**
   * Executes the current build tool (or quickErase if right-clicked) at the given ray.
   * Returns { ops, undoOps, pickedBlock, action } for optimistic server sync & undo history!
   */
  function executeActionAtRay(raycaster, { quickErase = false, maxDist = 280, actorName = "", actorId = "" } = {}) {
    const hit = raycastTarget(raycaster, maxDist);
    currentHover = hit;
    if (!hit) {
      refreshGhostVisual();
      return null;
    }

    const effectiveTool = quickErase ? "erase" : buildState.tool;
    const ops = [];
    const undoOps = [];
    const now = Date.now();

    if (effectiveTool === "eyedropper") {
      if (!hit.hitBlock) return null;
      buildState.color = hit.hitBlock.color;
      buildState.shape = hit.hitBlock.shape;
      buildState.mat = hit.hitBlock.mat;
      buildState.rot = hit.hitBlock.rot || 0;
      buildState.tool = "place";
      audio.playPaint();
      refreshGhostVisual();
      return { ops: [], undoOps: [], pickedBlock: hit.hitBlock, action: "eyedropper" };
    }

    if (effectiveTool === "erase") {
      if (!hit.hitBlock) return null;
      const prev = hit.hitBlock;
      deleteLocalBlock(prev.k);
      ops.push({ op: "del", x: prev.x, y: prev.y, z: prev.z });
      undoOps.push({
        op: "set",
        x: prev.x,
        y: prev.y,
        z: prev.z,
        color: prev.color,
        mat: prev.mat,
        shape: prev.shape,
        rot: prev.rot,
      });
      flushDirtyBuckets();
      audio.playErase();
      currentHover = raycastTarget(raycaster, maxDist);
      refreshGhostVisual();
      return { ops, undoOps, action: "erase" };
    }

    if (effectiveTool === "paint") {
      if (!hit.hitBlock) return null;
      const prev = hit.hitBlock;
      const next = {
        ...prev,
        color: buildState.color,
        mat: buildState.mat,
        by: actorName || prev.by,
        byId: actorId || prev.byId,
        updatedAt: now,
      };
      setLocalBlock(next, false);
      ops.push({
        op: "set",
        x: next.x,
        y: next.y,
        z: next.z,
        color: next.color,
        mat: next.mat,
        shape: next.shape,
        rot: next.rot,
      });
      undoOps.push({
        op: "set",
        x: prev.x,
        y: prev.y,
        z: prev.z,
        color: prev.color,
        mat: prev.mat,
        shape: prev.shape,
        rot: prev.rot,
      });
      flushDirtyBuckets();
      audio.playPaint();
      refreshGhostVisual();
      return { ops, undoOps, action: "paint" };
    }

    if (effectiveTool === "stamp") {
      if (!hit.placePos) return null;
      const cells = resolveStampCells(hit.placePos);
      if (cells.length === 0) return null;
      for (const c of cells) {
        const k = blockKey(c.x, c.y, c.z);
        const prev = blocks.get(k);
        if (prev) {
          undoOps.push({
            op: "set",
            x: prev.x,
            y: prev.y,
            z: prev.z,
            color: prev.color,
            mat: prev.mat,
            shape: prev.shape,
            rot: prev.rot,
          });
        } else {
          undoOps.push({ op: "del", x: c.x, y: c.y, z: c.z });
        }
        const blk = {
          k,
          x: c.x,
          y: c.y,
          z: c.z,
          color: c.color,
          mat: c.mat,
          shape: c.shape,
          rot: c.rot,
          by: actorName || undefined,
          byId: actorId || undefined,
          updatedAt: now,
        };
        setLocalBlock(blk, true);
        ops.push({
          op: "set",
          x: c.x,
          y: c.y,
          z: c.z,
          color: c.color,
          mat: c.mat,
          shape: c.shape,
          rot: c.rot,
        });
      }
      flushDirtyBuckets();
      audio.playStamp();
      currentHover = raycastTarget(raycaster, maxDist);
      refreshGhostVisual();
      return { ops, undoOps, action: "stamp" };
    }

    // Default: single block placement
    if (!hit.placePos) return null;
    const { x, y, z } = hit.placePos;
    const k = blockKey(x, y, z);
    const prev = blocks.get(k);
    if (prev) {
      undoOps.push({
        op: "set",
        x: prev.x,
        y: prev.y,
        z: prev.z,
        color: prev.color,
        mat: prev.mat,
        shape: prev.shape,
        rot: prev.rot,
      });
    } else {
      undoOps.push({ op: "del", x, y, z });
    }
    const blk = {
      k,
      x,
      y,
      z,
      color: buildState.color,
      mat: buildState.mat,
      shape: buildState.shape,
      rot: buildState.rot,
      by: actorName || undefined,
      byId: actorId || undefined,
      updatedAt: now,
    };
    setLocalBlock(blk, true);
    ops.push({
      op: "set",
      x,
      y,
      z,
      color: blk.color,
      mat: blk.mat,
      shape: blk.shape,
      rot: blk.rot,
    });
    flushDirtyBuckets();
    audio.playPlace(y);
    currentHover = raycastTarget(raycaster, maxDist);
    refreshGhostVisual();
    return { ops, undoOps, action: "place" };
  }

  function applyLocalOps(ops, { actorName = "", actorId = "", animate = false } = {}) {
    if (!Array.isArray(ops) || ops.length === 0) return;
    const now = Date.now();
    for (const op of ops) {
      if (!op) continue;
      if (op.op === "del") {
        deleteLocalBlock(op.k || blockKey(op.x, op.y, op.z));
      } else if (op.op === "set") {
        const src = op.block || op;
        const k = src.k || blockKey(src.x, src.y, src.z);
        setLocalBlock(
          {
            k,
            x: src.x,
            y: src.y,
            z: src.z,
            color: src.color || "#3b82f6",
            mat: src.mat || "matte",
            shape: src.shape || "cube",
            rot: src.rot || 0,
            by: src.by || actorName || undefined,
            byId: src.byId || actorId || undefined,
            updatedAt: src.updatedAt || now,
          },
          animate,
        );
      }
    }
    flushDirtyBuckets();
    refreshGhostVisual();
  }

  function syncAll(blockList) {
    if (!Array.isArray(blockList)) return;
    for (const b of buckets.values()) {
      dirtyBuckets.add(b.key);
    }
    blocks.clear();
    columnHeights.clear();
    popAnims.clear();

    for (const raw of blockList) {
      if (!raw || typeof raw.x !== "number") continue;
      const k = raw.k || blockKey(raw.x, raw.y, raw.z);
      const blk = {
        k,
        x: raw.x,
        y: raw.y,
        z: raw.z,
        color: raw.color || "#3b82f6",
        mat: raw.mat || "matte",
        shape: raw.shape || "cube",
        rot: raw.rot || 0,
        by: raw.by,
        byId: raw.byId,
        updatedAt: raw.updatedAt || 0,
      };
      blocks.set(k, blk);
      indexAdd(blk);
      dirtyBuckets.add(bucketKey(blk.shape, blk.mat));
    }
    flushDirtyBuckets();
  }

  function applyRemoteDelta(ops) {
    if (!Array.isArray(ops) || ops.length === 0) return;
    applyLocalOps(ops, { animate: true });
  }

  function step() {
    if (popAnims.size === 0) return;
    const now = performance.now();
    const touchedBuckets = new Set();

    for (const [k, anim] of popAnims.entries()) {
      const blk = blocks.get(k);
      if (!blk) {
        popAnims.delete(k);
        continue;
      }
      const p = (now - anim.startMs) / 145;
      const done = p >= 1;
      const t = Math.min(1, p);
      // Slight elastic bounce settle
      const sMult = done ? 1 : 0.35 + 0.65 * (1 - Math.pow(1 - t, 3)) + Math.sin(t * Math.PI) * 0.08;

      const bk = bucketKey(blk.shape, blk.mat);
      const b = buckets.get(bk);
      if (b) {
        const idx = b.keyToIndex.get(k);
        if (idx !== undefined) {
          writeInstanceTransform(b, idx, blk, sMult);
          touchedBuckets.add(b);
        }
      }
      if (done) {
        popAnims.delete(k);
      }
    }

    for (const b of touchedBuckets) {
      b.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  /**
   * Lets students in Walk mode climb onto and walk across stacked blocks & stairs!
   */
  function getWalkSurfaceHeight(px, pz, curFeetY = 0) {
    if (columnHeights.size === 0) return -Infinity;
    const gx = Math.round(px / S);
    const gz = Math.round(pz / S);
    const col = columnHeights.get(`${gx},${gz}`);
    if (!col) return -Infinity;

    // Only allow stepping onto blocks within reasonable step-up reach (+0.85m above feet)
    const maxStepY = (curFeetY ?? 0) + 0.85;
    let bestY = -Infinity;
    for (const gy of col) {
      const blk = blocks.get(blockKey(gx, gy, gz));
      if (!blk) continue;
      const topOffset = blk.shape === "slab" ? 0.5 : 1.0;
      const topY = (gy + topOffset) * S;
      if (topY <= maxStepY && topY > bestY) {
        bestY = topY;
      }
    }
    return bestY;
  }

  function setBuildState(patch = {}) {
    if (typeof patch.active === "boolean") buildState.active = patch.active;
    if (typeof patch.tool === "string") buildState.tool = patch.tool;
    if (typeof patch.color === "string") buildState.color = patch.color;
    if (typeof patch.shape === "string") buildState.shape = patch.shape;
    if (typeof patch.mat === "string") buildState.mat = patch.mat;
    if (typeof patch.rot === "number") buildState.rot = ((Math.trunc(patch.rot) % 4) + 4) % 4;
    if (typeof patch.stampId === "string") buildState.stampId = patch.stampId;
    if (!buildState.active) {
      hidePreview();
    } else {
      refreshGhostVisual();
    }
  }

  function rotateClockwise() {
    buildState.rot = (buildState.rot + 1) % 4;
    refreshGhostVisual();
    return buildState.rot;
  }

  return {
    root,
    audio,
    syncAll,
    applyRemoteDelta,
    applyLocalOps,
    step,
    setBuildState,
    getBuildState: () => ({ ...buildState }),
    rotateClockwise,
    updateHoverFromRay,
    hidePreview,
    pickBlockInfoFromRay,
    executeActionAtRay,
    getWalkSurfaceHeight,
    getBlockCount: () => blocks.size,
    getOwnBlockCount: (byId) => {
      if (!byId) return 0;
      let n = 0;
      for (const blk of blocks.values()) {
        if (blk.byId === byId) n++;
      }
      return n;
    },
  };
}
