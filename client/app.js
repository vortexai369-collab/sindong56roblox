import { createMeadowWorldEngine } from "./voxel/meadow_engine.js";
import { createCharacterBuilderController } from "./character_builder.js";
import { createMultiplayerClient } from "./multiplayer_client.js";
import {
  BLOCK_COLORS,
  BLOCK_SHAPES,
  BLOCK_MATERIALS,
  BLOCK_STAMPS,
} from "./voxel/block_builder_3d.js";

const urlParams = new URLSearchParams(location.search);
const isOgCapture = urlParams.get("og") === "1";
if (isOgCapture) {
  document.body.dataset.ogCapture = "1";
}

const worldCanvas = document.getElementById("world-canvas");

const dockActionRow = document.getElementById("dock-action-row");
const blockModeBtn = document.getElementById("block-mode-btn");
const gotoPlazaBtn = document.getElementById("goto-plaza-btn");
const addBtn = document.getElementById("add-btn");
const pickSpotPill = document.getElementById("pick-spot-pill");
const cancelPickBtn = document.getElementById("cancel-pick-btn");

const blockStudio = document.getElementById("block-studio");
const blockCollapseBtn = document.getElementById("block-collapse-btn");
const blockCountText = document.getElementById("block-count-text");
const blockCloseBtn = document.getElementById("block-close-btn");
const blockToolsRow = document.getElementById("block-tools-row");
const blockRotateBtn = document.getElementById("block-rotate-btn");
const blockRotateLabel = document.getElementById("block-rotate-label");
const blockUndoBtn = document.getElementById("block-undo-btn");
const blockPlazaBtn = document.getElementById("block-plaza-btn");
const blockSoundBtn = document.getElementById("block-sound-btn");
const blockSoundOnIcon = document.getElementById("block-sound-on-icon");
const blockSoundOffIcon = document.getElementById("block-sound-off-icon");
const blockClearBtn = document.getElementById("block-clear-btn");
const blockOptionsRow = document.getElementById("block-options-row");
const blockShapesGroup = document.getElementById("block-shapes-group");
const blockShapesRow = document.getElementById("block-shapes-row");
const blockStampsGroup = document.getElementById("block-stamps-group");
const blockStampsRow = document.getElementById("block-stamps-row");
const blockMaterialsGroup = document.getElementById("block-materials-group");
const blockMaterialsRow = document.getElementById("block-materials-row");
const blockPaletteRow = document.getElementById("block-palette-row");
const blockColorsRow = document.getElementById("block-colors-row");
const studentNameInput = document.getElementById("student-name-input");

const bottomBuilder = document.getElementById("bottom-builder");
const moveSpotBtn = document.getElementById("move-spot-btn");
const closeBuilderBtn = document.getElementById("close-builder-btn");

const dropZone = document.getElementById("drop-zone");
const imageInput = document.getElementById("image-input");
const dropEmpty = document.getElementById("drop-empty");
const dropPreviewWrap = document.getElementById("drop-preview-wrap");
const dropPreviewImg = document.getElementById("drop-preview-img");
const clearImageBtn = document.getElementById("clear-image-btn");
const promptInput = document.getElementById("prompt-input");
const sculptBtn = document.getElementById("sculpt-btn");
const formError = document.getElementById("form-error");

const buildingPill = document.getElementById("building-pill");
const buildingPillLabel = document.getElementById("building-pill-label");
const buildingPillSub = document.getElementById("building-pill-sub");
const readyGotoBtn = document.getElementById("ready-goto-btn");
const readyGotoLabel = document.getElementById("ready-goto-label");
const locateMineBtn = document.getElementById("locate-mine-btn");
const locateMineLabel = document.getElementById("locate-mine-label");

const hoverCard = document.getElementById("hover-card");
const hoverName = document.getElementById("hover-name");
const hoverFeed = document.getElementById("hover-feed");
const hoverStatus = document.getElementById("hover-status");
const weaveToast = document.getElementById("weave-toast");

const camPanBtn = document.getElementById("cam-pan-btn");
const camOrbitBtn = document.getElementById("cam-orbit-btn");
const camWalkBtn = document.getElementById("cam-walk-btn");
const recenterBtn = document.getElementById("recenter-btn");
const recenterCompass = document.getElementById("recenter-compass");
const avatarBtn = document.getElementById("avatar-btn");
const avatarSwatchDot = document.getElementById("avatar-swatch-dot");
const onlinePill = document.getElementById("online-pill");
const onlineCountEl = document.getElementById("online-count");
const interactPromptBtn = document.getElementById("interact-prompt");
const interactKeyEl = document.getElementById("interact-key");
const interactLabelEl = document.getElementById("interact-label");
const walkEscHintBtn = document.getElementById("walk-esc-hint");
const avatarDialog = document.getElementById("avatar-dialog");

const walkJoystick = document.getElementById("walk-joystick");
const walkJoystickKnob = document.getElementById("walk-joystick-knob");
const walkJoyUp = document.getElementById("walk-joy-up");
const walkJoyDown = document.getElementById("walk-joy-down");
const walkJoyLeft = document.getElementById("walk-joy-left");
const walkJoyRight = document.getElementById("walk-joy-right");

// UI states: "idle" | "picking" | "composing" | "building" | "ready" | "placed"
let uiState = "idle";
let myCreationId = null;
let readyCreation = null;
let worldData = null;
let selectedImageDataUrl = null;
let chosenSpot = null;
let toastTimer = null;

// Live multi-user build queue state
let activeJob = null;
let jobPollInterval = null;
let jobPollInFlight = false;

// Collaborative Block Studio state
const STUDENT_NAME_STORAGE_KEY = "sindong_student_name_v1";
let blockModeActive = false;
let blockStudioCollapsed = false;
let blockSoundMuted = false;
let myBlockOwnerId = null;
let blockUndoStack = [];
let clearConfirmTimer = null;
let clearConfirmArmed = false;
let openedBlocksOnce = false;
let studentName = (() => {
  try {
    return typeof localStorage !== "undefined"
      ? (localStorage.getItem(STUDENT_NAME_STORAGE_KEY) || "").trim().slice(0, 16)
      : "";
  } catch {
    return "";
  }
})();

const VISITOR_STORAGE_KEY = "geminisland_visitor_token_v1";
let cachedVisitorToken = (() => {
  try {
    return typeof localStorage !== "undefined" ? localStorage.getItem(VISITOR_STORAGE_KEY) : null;
  } catch {
    return null;
  }
})();

const CLIENT_TIMEZONE = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
})();

function storeVisitorToken(token) {
  if (typeof token !== "string" || !token.includes(".")) return;
  cachedVisitorToken = token;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(VISITOR_STORAGE_KEY, token);
    }
  } catch {
    // Sandboxed iframes without storage access fall back to in-memory cachedVisitorToken
  }
}

function buildVisitorHeaders(extra = {}) {
  const headers = { ...extra };
  if (cachedVisitorToken) {
    headers["x-meadow-visitor"] = cachedVisitorToken;
  }
  if (CLIENT_TIMEZONE) {
    headers["x-meadow-tz"] = CLIENT_TIMEZONE;
  }
  return headers;
}
window.__geminIslandVisitorHeaders = buildVisitorHeaders;

function showToast(text, durationMs = 4200) {
  if (!text || isOgCapture) return;
  weaveToast.textContent = text;
  weaveToast.hidden = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    weaveToast.hidden = true;
  }, durationMs);
}

function renderActiveJobLabel() {
  if (buildingPillSub) {
    buildingPillSub.textContent = "Being built with Gemini 4 Hydrogen";
  }
  if (!activeJob) {
    buildingPillLabel.textContent = "Approving query…";
    return;
  }
  if (activeJob.status === "queued" && activeJob.position >= 1) {
    buildingPillLabel.textContent =
      activeJob.position === 1 ? "Next in queue…" : `Waiting in queue (#${activeJob.position})…`;
  } else if (activeJob.phase === "approving") {
    buildingPillLabel.textContent = "Approving query…";
  } else if (activeJob.phase === "reviewing") {
    buildingPillLabel.textContent = "Reviewing 3D model…";
  } else if (activeJob.phase === "refining") {
    buildingPillLabel.textContent = "Polishing details…";
  } else if (activeJob.phase === "placing") {
    buildingPillLabel.textContent = "Placing on island…";
  } else {
    buildingPillLabel.textContent = "Sculpting voxels…";
  }
}

function stopJobTracking() {
  activeJob = null;
  if (jobPollInterval) {
    clearInterval(jobPollInterval);
    jobPollInterval = null;
  }
}

let engine = null;
let characterBuilder = null;
let mpClient = null;
let activeInteractionPrompt = null;
let lastAvatarDialogCloseMs = -1000;
let currentCamMode = "pan";
let sawTouchInput = false;
let joyPointerId = null;

function syncAvatarSwatchDot(app) {
  if (!avatarSwatchDot || !app || typeof app !== "object") return;
  const swatchColor =
    (typeof app.topColor === "string" && app.topColor) ||
    (typeof app.hatColor === "string" && app.hatColor) ||
    "#4c82d4";
  avatarSwatchDot.style.backgroundColor = swatchColor;
}

function updateOnlinePill(count) {
  if (!onlinePill) return;
  if (isOgCapture || typeof count !== "number" || !Number.isFinite(count) || count < 1) {
    onlinePill.hidden = true;
    return;
  }
  const clean = Math.max(1, Math.trunc(count));
  if (onlineCountEl) {
    onlineCountEl.textContent = String(clean);
  }
  onlinePill.hidden = false;
}

function isMobileWalkViewport() {
  if (sawTouchInput) return true;
  if (window.matchMedia?.("(pointer: coarse)")?.matches) return true;
  return window.innerWidth <= 768;
}

function resetWalkJoystick() {
  joyPointerId = null;
  walkJoystick?.classList.remove("is-active");
  walkJoystickKnob?.setAttribute("transform", "translate(0 0)");
  walkJoyUp?.classList.remove("is-lit");
  walkJoyDown?.classList.remove("is-lit");
  walkJoyLeft?.classList.remove("is-lit");
  walkJoyRight?.classList.remove("is-lit");
  engine?.setJoystickInput(0, 0);
}

function syncWalkJoystickVisibility() {
  const show = !isOgCapture && currentCamMode === "walk" && isMobileWalkViewport();
  if (walkJoystick) {
    walkJoystick.hidden = !show;
  }
  if (show) {
    document.body.dataset.walkMobile = "1";
  } else {
    delete document.body.dataset.walkMobile;
    resetWalkJoystick();
  }
}

function syncCameraModeUI(mode) {
  currentCamMode = mode;
  const isPan = mode === "pan";
  const isOrbit = mode === "orbit";
  const isWalk = mode === "walk";
  if (camPanBtn) {
    camPanBtn.classList.toggle("is-active", isPan);
    camPanBtn.setAttribute("aria-pressed", isPan ? "true" : "false");
  }
  if (camOrbitBtn) {
    camOrbitBtn.classList.toggle("is-active", isOrbit);
    camOrbitBtn.setAttribute("aria-pressed", isOrbit ? "true" : "false");
  }
  if (camWalkBtn) {
    camWalkBtn.classList.toggle("is-active", isWalk);
    camWalkBtn.setAttribute("aria-pressed", isWalk ? "true" : "false");
  }
  syncWalkJoystickVisibility();
  if (walkEscHintBtn) {
    walkEscHintBtn.hidden = isOgCapture || !isWalk || isMobileWalkViewport();
  }
}

const demoClickTimers = new WeakMap();

function triggerCameraButtonClickFX(mode) {
  syncCameraModeUI(mode);
  const btn = mode === "walk" ? camWalkBtn : mode === "orbit" ? camOrbitBtn : camPanBtn;
  if (!btn || isOgCapture) return;
  const prevTimer = demoClickTimers.get(btn);
  if (prevTimer) clearTimeout(prevTimer);
  btn.classList.remove("is-demo-click");
  void btn.offsetWidth;
  btn.classList.add("is-demo-click");
  demoClickTimers.set(
    btn,
    setTimeout(() => {
      btn.classList.remove("is-demo-click");
    }, 740),
  );
}

const lastIncidentSentByVehicle = new Map();

async function reportTrafficIncidentToObserver(incident) {
  if (isOgCapture || !incident || typeof incident.vehicleId !== "string") return;
  const nowMs = Date.now();
  const prevMs = lastIncidentSentByVehicle.get(incident.vehicleId) || 0;
  if (nowMs - prevMs < 25_000) return;
  lastIncidentSentByVehicle.set(incident.vehicleId, nowMs);
  try {
    await fetch("/api/traffic-incident", {
      method: "POST",
      headers: buildVisitorHeaders({
        "content-type": "application/json",
        "x-meadow-client": "1",
      }),
      body: JSON.stringify({
        vehicleId: incident.vehicleId,
        peerVehicleId: incident.peerVehicleId || null,
        x: incident.x,
        z: incident.z,
        reason: incident.reason || "self_restored",
      }),
    });
  } catch {
    // Ignore transient network errors during background telemetry
  }
}

engine = createMeadowWorldEngine(
  worldCanvas,
  {
    onHoverCreation(creation, clientX, clientY, reading) {
      if (
        !creation ||
        uiState === "picking" ||
        isOgCapture ||
        (activeInteractionPrompt && engine?.isFirstPerson?.())
      ) {
        hoverCard.hidden = true;
        return;
      }
      hoverName.textContent = creation.name;
      if (reading?.summary) {
        hoverFeed.textContent = reading.summary;
        hoverFeed.hidden = false;
      } else {
        hoverFeed.hidden = true;
      }
      hoverStatus.textContent = creation.description || creation.behavior?.statusLine || "";
      hoverCard.style.left = `${clientX}px`;
      hoverCard.style.top = `${clientY}px`;
      hoverCard.hidden = false;
    },
    onSelectCreation(creation, reading) {
      if (!creation || isOgCapture) return;
      const baseDesc = creation.description || creation.behavior?.statusLine || "";
      const detail = reading?.summary
        ? baseDesc
          ? `${reading.summary} · ${baseDesc}`
          : reading.summary
        : baseDesc;
      showToast(detail ? `${creation.name} — ${detail}` : creation.name);
    },
    onInteractiveEvent(_creation, message) {
      if (!message || isOgCapture) return;
      showToast(message);
    },
    onPickGroundSpot(x, z) {
      chosenSpot = { x, z };
      uiState = "composing";
      syncDockUI();
      if (window.innerWidth > 640) {
        promptInput.focus({ preventScroll: true });
      }
    },
    onAutoNudgeSpot(x, z) {
      if (chosenSpot) {
        chosenSpot = { x, z };
      }
    },
    onDragModeChange(mode) {
      syncCameraModeUI(mode);
    },
    onIntroDemoStep(mode) {
      triggerCameraButtonClickFX(mode);
    },
    onCameraChange(camState) {
      if (recenterCompass && typeof camState?.azDeltaFromHome === "number") {
        const deg = ((camState.azDeltaFromHome * 180) / Math.PI).toFixed(1);
        recenterCompass.setAttribute("transform", `rotate(${deg} 12 12)`);
      }
    },
    onInteractionPromptChange(promptInfo) {
      activeInteractionPrompt = promptInfo || null;
      if (!interactPromptBtn) return;
      if (!promptInfo || isOgCapture) {
        interactPromptBtn.hidden = true;
        return;
      }
      if (interactKeyEl) {
        interactKeyEl.textContent = promptInfo.keyHint || "E";
      }
      if (interactLabelEl) {
        interactLabelEl.textContent = promptInfo.label || "Interact";
      }
      interactPromptBtn.hidden = false;
      if (engine?.isFirstPerson?.()) {
        hoverCard.hidden = true;
      }
    },
    onLocalEmote(kind) {
      mpClient?.sendEmote(kind);
    },
    onInteriorChange(roomInfo) {
      if (roomInfo) {
        document.body.dataset.inInterior = "1";
        if (blockModeActive) {
          setBlockModeActive(false);
        }
        if (uiState === "picking" || uiState === "composing") {
          hideError();
          chosenSpot = null;
          uiState = "idle";
          syncDockUI();
        }
      } else {
        delete document.body.dataset.inInterior;
      }
      hoverCard.hidden = true;
      mpClient?.forcePoseSync();
    },
    onTrafficIncident(incident) {
      void reportTrafficIncidentToObserver(incident);
    },
    onBlockBuildAction(result) {
      handleBlockBuildAction(result);
    },
    onBlocksCountChange(count) {
      updateBlockCountLabel(count);
    },
  },
  { ogMode: isOgCapture },
);

window.__geminIslandCam = () => engine.getCameraState();
window.__geminIslandEngine = engine;

interactPromptBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  engine?.triggerActiveInteraction?.();
  interactPromptBtn.blur();
});

characterBuilder = createCharacterBuilderController({
  dialogEl: avatarDialog,
  onChange(app) {
    engine?.setLocalAppearance?.(app);
    syncAvatarSwatchDot(app);
    if (typeof app?.name === "string" && app.name.trim()) {
      syncStudentNameValue(app.name.trim(), false);
    }
  },
  onSave(app) {
    engine?.setLocalAppearance?.(app);
    syncAvatarSwatchDot(app);
    if (typeof app?.name === "string" && app.name.trim()) {
      syncStudentNameValue(app.name.trim(), false);
    }
    mpClient?.sendProfile(app);
  },
});

avatarDialog?.addEventListener("close", () => {
  lastAvatarDialogCloseMs = performance.now();
  avatarBtn?.blur();
  queueMicrotask(() => avatarBtn?.blur());
});

avatarDialog?.querySelector('[data-cb-action="wave"]')?.addEventListener("click", () => {
  engine?.triggerLocalWave?.();
  mpClient?.sendEmote("wave");
});

syncAvatarSwatchDot(engine?.getLocalAppearance?.() || characterBuilder?.getAppearance?.());

avatarBtn?.addEventListener("click", () => {
  if (isOgCapture) return;
  avatarBtn?.blur();
  hoverCard.hidden = true;
  resetWalkJoystick();
  engine?.releaseWalkPointerLock?.();
  characterBuilder?.open(engine?.getLocalAppearance?.());
});

walkEscHintBtn?.addEventListener("click", () => {
  hoverCard.hidden = true;
  engine?.setDragMode("pan");
  walkEscHintBtn.blur();
});

window.__geminIslandCharacterBuilder = characterBuilder;

camPanBtn?.addEventListener("click", () => {
  engine.setDragMode("pan");
});

camOrbitBtn?.addEventListener("click", () => {
  engine.setDragMode("orbit");
});

camWalkBtn?.addEventListener("click", () => {
  hoverCard.hidden = true;
  if (engine.isFirstPerson()) {
    engine.setDragMode("pan");
    return;
  }
  if (uiState === "picking" || uiState === "composing") {
    hideError();
    chosenSpot = null;
    uiState = "idle";
    syncDockUI();
  }
  engine.setDragMode("walk");
  camWalkBtn.blur();
});

recenterBtn?.addEventListener("click", () => {
  engine.recenterCamera();
  engine.setDragMode("pan");
});

window.addEventListener(
  "pointerdown",
  (e) => {
    if (e.pointerType === "touch" && !sawTouchInput) {
      sawTouchInput = true;
      syncWalkJoystickVisibility();
    }
  },
  { passive: true },
);

window.addEventListener("resize", () => {
  syncWalkJoystickVisibility();
  if (walkEscHintBtn) {
    walkEscHintBtn.hidden = isOgCapture || currentCamMode !== "walk" || isMobileWalkViewport();
  }
});

window.addEventListener("blur", () => {
  if (joyPointerId !== null) resetWalkJoystick();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible" && joyPointerId !== null) {
    resetWalkJoystick();
  }
});

function updateWalkJoystickFromPoint(clientX, clientY) {
  if (!walkJoystick) return;
  const rect = walkJoystick.getBoundingClientRect();
  const cx = rect.left + rect.width * 0.5;
  const cy = rect.top + rect.height * 0.5;
  const maxPx = Math.max(24, rect.width * 0.31);
  const dx = clientX - cx;
  const dy = clientY - cy;
  const dist = Math.hypot(dx, dy);
  const clampedPx = Math.min(maxPx, dist);
  const ux = dist > 1e-4 ? dx / dist : 0;
  const uy = dist > 1e-4 ? dy / dist : 0;

  const maxSvg = 34;
  const svgX = ux * (clampedPx / maxPx) * maxSvg;
  const svgY = uy * (clampedPx / maxPx) * maxSvg;
  walkJoystickKnob?.setAttribute("transform", `translate(${svgX.toFixed(1)} ${svgY.toFixed(1)})`);

  const rawMag = clampedPx / maxPx;
  const deadzone = 0.08;
  const eff = rawMag <= deadzone ? 0 : (rawMag - deadzone) / (1 - deadzone);
  const moveRight = ux * eff;
  const moveFwd = -uy * eff;

  walkJoyUp?.classList.toggle("is-lit", moveFwd > 0.28);
  walkJoyDown?.classList.toggle("is-lit", moveFwd < -0.28);
  walkJoyLeft?.classList.toggle("is-lit", moveRight < -0.28);
  walkJoyRight?.classList.toggle("is-lit", moveRight > 0.28);

  engine?.setJoystickInput(moveRight, moveFwd);
}

if (walkJoystick) {
  walkJoystick.addEventListener("contextmenu", (e) => e.preventDefault());

  walkJoystick.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (joyPointerId !== null) return;
    joyPointerId = e.pointerId;
    walkJoystick.classList.add("is-active");
    hoverCard.hidden = true;
    try {
      walkJoystick.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic pointer events in tests may omit active capture handles
    }
    updateWalkJoystickFromPoint(e.clientX, e.clientY);
  });

  walkJoystick.addEventListener("pointermove", (e) => {
    if (joyPointerId !== e.pointerId) return;
    e.stopPropagation();
    e.preventDefault();
    updateWalkJoystickFromPoint(e.clientX, e.clientY);
  });

  const endJoystickGesture = (e) => {
    if (joyPointerId !== e.pointerId) return;
    e.stopPropagation();
    resetWalkJoystick();
  };

  walkJoystick.addEventListener("pointerup", endJoystickGesture);
  walkJoystick.addEventListener("pointercancel", endJoystickGesture);
  walkJoystick.addEventListener("lostpointercapture", endJoystickGesture);
}

function updateBlockCountLabel(count) {
  if (!blockCountText) return;
  const total = typeof count === "number" ? count : engine?.getBlockCount?.() || 0;
  blockCountText.textContent = `블록 ${total.toLocaleString()}개`;
}

function getEffectiveStudentName() {
  const fromInput = studentNameInput?.value?.trim().slice(0, 16);
  if (fromInput) return fromInput;
  if (studentName) return studentName;
  const appName = engine?.getLocalAppearance?.()?.name;
  if (typeof appName === "string" && appName.trim()) {
    return appName.trim().slice(0, 16);
  }
  return "신동 학생";
}

function syncStudentNameValue(rawName, pushToAvatar = true) {
  const clean = String(rawName || "").trim().slice(0, 16);
  studentName = clean;
  if (studentNameInput && studentNameInput.value !== clean) {
    studentNameInput.value = clean;
  }
  try {
    if (typeof localStorage !== "undefined") {
      if (clean) localStorage.setItem(STUDENT_NAME_STORAGE_KEY, clean);
      else localStorage.removeItem(STUDENT_NAME_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors inside restricted iframes
  }
  if (pushToAvatar && clean && engine?.getLocalAppearance && engine?.setLocalAppearance) {
    const cur = engine.getLocalAppearance();
    if (cur && cur.name !== clean) {
      const nextApp = { ...cur, name: clean };
      engine.setLocalAppearance(nextApp);
      mpClient?.sendProfile?.(nextApp);
    }
  }
}

function syncBlockStudioControls() {
  const st = engine?.getBlockBuildState?.();
  if (!st) return;

  blockToolsRow?.querySelectorAll("[data-bs-tool]").forEach((btn) => {
    const active = btn.dataset.bsTool === st.tool;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });

  blockShapesRow?.querySelectorAll("[data-bs-shape]").forEach((btn) => {
    const active = btn.dataset.bsShape === st.shape;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });

  blockStampsRow?.querySelectorAll("[data-bs-stamp]").forEach((btn) => {
    const active = btn.dataset.bsStamp === st.stampId;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });

  blockMaterialsRow?.querySelectorAll("[data-bs-mat]").forEach((btn) => {
    const active = btn.dataset.bsMat === st.mat;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });

  blockColorsRow?.querySelectorAll("[data-bs-color]").forEach((btn) => {
    const active = btn.dataset.bsColor?.toLowerCase() === String(st.color || "").toLowerCase();
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });

  if (blockRotateLabel) {
    blockRotateLabel.textContent = `${((st.rot || 0) % 4) * 90}°`;
  }
  if (blockUndoBtn) {
    blockUndoBtn.disabled = blockUndoStack.length === 0;
  }

  const showShapes = st.tool === "place";
  const showStamps = st.tool === "stamp";
  const showMaterials = st.tool === "place" || st.tool === "paint" || st.tool === "stamp";
  const showPalette = st.tool !== "erase" && st.tool !== "eyedropper";

  if (blockShapesGroup) blockShapesGroup.hidden = !showShapes;
  if (blockStampsGroup) blockStampsGroup.hidden = !showStamps;
  if (blockMaterialsGroup) blockMaterialsGroup.hidden = !showMaterials;
  if (blockOptionsRow) blockOptionsRow.hidden = !showShapes && !showStamps && !showMaterials;
  if (blockPaletteRow) blockPaletteRow.hidden = !showPalette;

  if (blockStudio) {
    blockStudio.classList.toggle("is-collapsed", blockStudioCollapsed);
  }
  if (blockCollapseBtn) {
    blockCollapseBtn.setAttribute("aria-expanded", blockStudioCollapsed ? "false" : "true");
  }
  updateBlockCountLabel();
}

function setBlockModeActive(active, { focusPlaza = false } = {}) {
  const next = Boolean(active);
  if (next && document.body.dataset.inInterior === "1") {
    showToast("실내에서는 블록을 쌓을 수 없어요. 밖으로 나와서 쌓아보세요!", 3200);
    return;
  }
  blockModeActive = next;
  if (next) {
    hoverCard.hidden = true;
    if (uiState === "picking" || uiState === "composing") {
      hideError();
      chosenSpot = null;
      uiState = myCreationId ? "placed" : "idle";
    }
    engine?.setBlockBuildState?.({ active: true });
    if (focusPlaza) {
      engine?.focusBlockPlaza?.();
    } else if (!openedBlocksOnce) {
      openedBlocksOnce = true;
      engine?.focusBlockPlaza?.();
      showToast("신동 블록 광장으로 이동했어요! 클릭해서 블록을 쌓아보세요.", 4200);
    }
  } else {
    disarmClearConfirm();
    engine?.setBlockBuildState?.({ active: false });
  }
  syncDockUI();
  syncBlockStudioControls();
}

function disarmClearConfirm() {
  clearConfirmArmed = false;
  if (clearConfirmTimer) {
    clearTimeout(clearConfirmTimer);
    clearConfirmTimer = null;
  }
  if (blockClearBtn) {
    blockClearBtn.classList.remove("is-confirming");
    blockClearBtn.textContent = "내 블록 정리";
  }
}

async function sendBlockOpsToServer(ops) {
  if (!Array.isArray(ops) || !ops.length) return;
  try {
    const res = await fetch("/api/blocks/batch", {
      method: "POST",
      headers: buildVisitorHeaders({
        "content-type": "application/json",
        "x-meadow-client": "1",
      }),
      body: JSON.stringify({
        ops,
        builderName: getEffectiveStudentName(),
      }),
    });
    const data = await res.json();
    if (data?.visitorToken) storeVisitorToken(data.visitorToken);
    if (typeof data?.selfId === "string" && data.selfId) {
      myBlockOwnerId = data.selfId;
    }
    if (typeof data?.totalBlocks === "number") {
      updateBlockCountLabel(data.totalBlocks);
    }
    if (!res.ok || !data?.ok) {
      showToast(data?.error || "블록 저장 중 오류가 발생했어요.", 3200);
    }
  } catch {
    showToast("네트워크 연결이 잠시 불안정해요.", 2800);
  }
}

function handleBlockBuildAction(result) {
  if (!result || typeof result !== "object") return;
  if (result.action === "eyedropper") {
    syncBlockStudioControls();
    if (result.pickedBlock) {
      showToast("블록 색상과 모양을 가져왔어요!", 2000);
    }
    return;
  }
  if (!Array.isArray(result.ops) || result.ops.length === 0) return;

  if (Array.isArray(result.undoOps) && result.undoOps.length > 0) {
    blockUndoStack.push({ ops: result.ops, undoOps: result.undoOps });
    if (blockUndoStack.length > 40) {
      blockUndoStack.shift();
    }
  }
  disarmClearConfirm();
  syncBlockStudioControls();
  void sendBlockOpsToServer(result.ops);
}

function handleUndoBlock() {
  const entry = blockUndoStack.pop();
  if (!entry || !Array.isArray(entry.undoOps) || !entry.undoOps.length) {
    syncBlockStudioControls();
    return;
  }
  engine?.applyLocalBlockOps?.(entry.undoOps, {
    byId: myBlockOwnerId || "me",
    byName: getEffectiveStudentName(),
  });
  syncBlockStudioControls();
  void sendBlockOpsToServer(entry.undoOps);
}

async function handleClearMyBlocks() {
  if (!clearConfirmArmed) {
    clearConfirmArmed = true;
    if (blockClearBtn) {
      blockClearBtn.classList.add("is-confirming");
      blockClearBtn.textContent = "정말 지울까요?";
    }
    clearConfirmTimer = setTimeout(disarmClearConfirm, 4000);
    return;
  }

  disarmClearConfirm();
  try {
    const res = await fetch("/api/blocks/clear-mine", {
      method: "POST",
      headers: buildVisitorHeaders({
        "content-type": "application/json",
        "x-meadow-client": "1",
      }),
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (data?.visitorToken) storeVisitorToken(data.visitorToken);
    if (typeof data?.selfId === "string" && data.selfId) {
      myBlockOwnerId = data.selfId;
    }
    if (data?.ok) {
      if (Array.isArray(data.removedOps) && data.removedOps.length > 0) {
        engine?.applyBlocksDelta?.(data.removedOps);
        blockUndoStack = [];
        syncBlockStudioControls();
        showToast(`내가 쌓은 블록 ${data.removed}개를 정리했어요.`, 3000);
      } else {
        showToast("정리할 내 블록이 아직 없어요.", 2600);
      }
      if (typeof data.totalBlocks === "number") {
        updateBlockCountLabel(data.totalBlocks);
      }
    }
  } catch {
    showToast("블록을 정리하는 중 오류가 발생했어요.", 3000);
  }
}

function initBlockStudioUI() {
  if (studentNameInput) {
    const initialName = studentName || engine?.getLocalAppearance?.()?.name || "";
    studentNameInput.value = initialName;
    studentNameInput.addEventListener("change", () => {
      syncStudentNameValue(studentNameInput.value, true);
    });
    studentNameInput.addEventListener("blur", () => {
      syncStudentNameValue(studentNameInput.value, true);
    });
    studentNameInput.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        studentNameInput.blur();
      }
    });
  }

  if (blockShapesRow) {
    blockShapesRow.innerHTML = "";
    for (const s of BLOCK_SHAPES) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "bs-chip";
      btn.dataset.bsShape = s.id;
      btn.textContent = s.label;
      btn.addEventListener("click", () => {
        engine?.setBlockBuildState?.({ shape: s.id, tool: "place" });
        syncBlockStudioControls();
      });
      blockShapesRow.appendChild(btn);
    }
  }

  if (blockStampsRow) {
    blockStampsRow.innerHTML = "";
    for (const st of BLOCK_STAMPS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "bs-chip";
      btn.dataset.bsStamp = st.id;
      btn.textContent = st.label;
      btn.addEventListener("click", () => {
        engine?.setBlockBuildState?.({ stampId: st.id, tool: "stamp" });
        syncBlockStudioControls();
      });
      blockStampsRow.appendChild(btn);
    }
  }

  if (blockMaterialsRow) {
    blockMaterialsRow.innerHTML = "";
    for (const m of BLOCK_MATERIALS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "bs-chip";
      btn.dataset.bsMat = m.id;
      btn.textContent = m.label;
      btn.addEventListener("click", () => {
        engine?.setBlockBuildState?.({ mat: m.id });
        syncBlockStudioControls();
      });
      blockMaterialsRow.appendChild(btn);
    }
  }

  if (blockColorsRow) {
    blockColorsRow.innerHTML = "";
    BLOCK_COLORS.forEach((c, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "bs-swatch";
      btn.dataset.bsColor = c.hex;
      btn.style.backgroundColor = c.hex;
      btn.title = idx < 9 ? `${c.label} (${idx + 1})` : c.label;
      btn.setAttribute("aria-label", c.label);
      btn.addEventListener("click", () => {
        const cur = engine?.getBlockBuildState?.();
        const nextTool = cur?.tool === "erase" || cur?.tool === "eyedropper" ? "place" : cur?.tool || "place";
        engine?.setBlockBuildState?.({ color: c.hex, tool: nextTool });
        syncBlockStudioControls();
      });
      blockColorsRow.appendChild(btn);
    });
  }

  blockToolsRow?.querySelectorAll("[data-bs-tool]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tool = btn.dataset.bsTool;
      if (!tool) return;
      engine?.setBlockBuildState?.({ tool });
      syncBlockStudioControls();
    });
  });

  blockModeBtn?.addEventListener("click", () => {
    setBlockModeActive(true);
  });

  gotoPlazaBtn?.addEventListener("click", () => {
    hoverCard.hidden = true;
    openedBlocksOnce = true;
    engine?.focusBlockPlaza?.();
    showToast("신동 블록 광장에 도착했어요! '블록 쌓기'를 눌러 자유롭게 만들어보세요.", 3800);
  });

  blockPlazaBtn?.addEventListener("click", () => {
    engine?.focusBlockPlaza?.();
    showToast("신동 블록 광장으로 이동했어요!", 2400);
  });

  blockCloseBtn?.addEventListener("click", () => {
    setBlockModeActive(false);
  });

  blockCollapseBtn?.addEventListener("click", () => {
    blockStudioCollapsed = !blockStudioCollapsed;
    syncBlockStudioControls();
  });

  blockRotateBtn?.addEventListener("click", () => {
    engine?.rotateBlockClockwise?.();
    syncBlockStudioControls();
  });

  blockUndoBtn?.addEventListener("click", () => {
    handleUndoBlock();
  });

  blockSoundBtn?.addEventListener("click", () => {
    blockSoundMuted = !blockSoundMuted;
    engine?.setBlockAudioMuted?.(blockSoundMuted);
    blockSoundBtn.setAttribute("aria-pressed", blockSoundMuted ? "false" : "true");
    if (blockSoundOnIcon) blockSoundOnIcon.hidden = blockSoundMuted;
    if (blockSoundOffIcon) blockSoundOffIcon.hidden = !blockSoundMuted;
  });

  blockClearBtn?.addEventListener("click", () => {
    void handleClearMyBlocks();
  });

  syncBlockStudioControls();
}

initBlockStudioUI();

function syncDockUI() {
  if (isOgCapture) return;

  if (dockActionRow) dockActionRow.hidden = true;
  if (blockStudio) blockStudio.hidden = true;
  addBtn.hidden = true;
  pickSpotPill.hidden = true;
  bottomBuilder.hidden = true;
  buildingPill.hidden = true;
  readyGotoBtn.hidden = true;
  locateMineBtn.hidden = true;

  if (myCreationId && uiState !== "ready") {
    uiState = "placed";
  }

  if (blockModeActive && uiState !== "building" && uiState !== "ready") {
    if (blockStudio) blockStudio.hidden = false;
    engine.setSpotPickerState({ mode: "hidden" });
    return;
  }

  switch (uiState) {
    case "picking":
      pickSpotPill.hidden = false;
      engine.setSpotPickerState({
        mode: "picking",
        ...(chosenSpot ? { x: chosenSpot.x, z: chosenSpot.z } : {}),
      });
      break;
    case "composing":
      bottomBuilder.hidden = false;
      engine.setPreviewPrompt(promptInput.value);
      engine.setSpotPickerState({
        mode: "staked",
        x: chosenSpot?.x ?? 16,
        z: chosenSpot?.z ?? 10,
      });
      break;
    case "building":
      buildingPill.hidden = false;
      renderActiveJobLabel();
      engine.setSpotPickerState({
        mode: "building",
        x: chosenSpot?.x ?? 16,
        z: chosenSpot?.z ?? 10,
      });
      break;
    case "ready": {
      readyGotoBtn.hidden = false;
      const name = readyCreation?.name || "your creation";
      readyGotoLabel.textContent = `Ready · Go to ${name}`;
      engine.setSpotPickerState({ mode: "hidden" });
      break;
    }
    case "placed": {
      if (dockActionRow) dockActionRow.hidden = false;
      locateMineBtn.hidden = false;
      const mine = worldData?.creations?.find((c) => c.id === myCreationId);
      locateMineLabel.textContent = mine ? `Locate · ${mine.name}` : "Locate yours";
      engine.setSpotPickerState({ mode: "hidden" });
      break;
    }
    default:
      if (dockActionRow) dockActionRow.hidden = false;
      addBtn.hidden = false;
      engine.setSpotPickerState({ mode: "hidden" });
      break;
  }
}

async function pollActiveJob() {
  if (!activeJob || jobPollInFlight) return;
  jobPollInFlight = true;
  try {
    const res = await fetch(`/api/job?id=${encodeURIComponent(activeJob.jobId)}`, {
      headers: buildVisitorHeaders(),
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data?.visitorToken) storeVisitorToken(data.visitorToken);
    if (!data.ok || !data.job) return;

    const job = data.job;
    if (job.status === "done") {
      stopJobTracking();
      sculptBtn.disabled = false;
      if (data.world) {
        worldData = data.world;
        engine.applyWorldSnapshot(worldData);
      }
      if (data.feeds) {
        engine.applyLiveFeeds(data.feeds);
      }
      myCreationId = job.creationId || data.world?.myCreationId || myCreationId;
      readyCreation =
        job.creation || worldData?.creations?.find((c) => c.id === myCreationId) || null;
      uiState = "ready";
      syncDockUI();
      return;
    }

    if (job.status === "failed") {
      stopJobTracking();
      sculptBtn.disabled = false;
      if (job.creationId) {
        myCreationId = job.creationId;
        uiState = "placed";
        syncDockUI();
        return;
      }
      uiState = "composing";
      syncDockUI();
      showFormError(job.error || "Could not build that right now — try again.");
      return;
    }

    activeJob = { ...job };
    renderActiveJobLabel();
  } catch {
    // ignore transient poll hiccups; next tick or WS broadcast will recover
  } finally {
    jobPollInFlight = false;
  }
}

function startTrackingJob(jobInfo) {
  stopJobTracking();
  activeJob = { ...jobInfo };
  uiState = "building";
  syncDockUI();

  jobPollInterval = setInterval(() => {
    if (uiState === "building" && activeJob) {
      pollActiveJob();
    }
  }, 2500);
}

// Dynamically resize the 3D staked plot on the island as the visitor describes tiny vs colossal subjects!
promptInput.addEventListener("input", () => {
  engine.setPreviewPrompt(promptInput.value);
});

// 1. Click "+ Add" -> pick where on the island it will go
addBtn.addEventListener("click", () => {
  if (blockModeActive) {
    setBlockModeActive(false);
  }
  if (engine.isFirstPerson()) {
    engine.setDragMode("pan");
  }
  if (myCreationId) {
    uiState = "placed";
    syncDockUI();
    return;
  }
  hoverCard.hidden = true;
  engine.setPreviewPrompt(promptInput.value);
  uiState = "picking";
  syncDockUI();
});

cancelPickBtn.addEventListener("click", () => {
  chosenSpot = null;
  uiState = "idle";
  syncDockUI();
});

moveSpotBtn.addEventListener("click", () => {
  uiState = "picking";
  syncDockUI();
});

closeBuilderBtn.addEventListener("click", () => {
  hideError();
  chosenSpot = null;
  uiState = "idle";
  syncDockUI();
});

window.addEventListener("keydown", (e) => {
  const inTextField =
    e.target instanceof HTMLElement &&
    (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable);
  const dialogOpen =
    characterBuilder?.isOpen?.() ||
    (avatarDialog &&
      (avatarDialog.open || (e.target instanceof Node && avatarDialog.contains(e.target))));

  if (blockModeActive && !inTextField && !dialogOpen) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      handleUndoBlock();
      return;
    }
    if (!e.metaKey && !e.ctrlKey && !e.altKey) {
      const lower = e.key.toLowerCase();
      if (lower === "r") {
        e.preventDefault();
        engine?.rotateBlockClockwise?.();
        syncBlockStudioControls();
        return;
      }
      if (lower === "h") {
        e.preventDefault();
        blockStudioCollapsed = !blockStudioCollapsed;
        syncBlockStudioControls();
        return;
      }
      if (e.key >= "1" && e.key <= "9") {
        const idx = Number(e.key) - 1;
        if (BLOCK_COLORS[idx]) {
          e.preventDefault();
          const cur = engine?.getBlockBuildState?.();
          const nextTool =
            cur?.tool === "erase" || cur?.tool === "eyedropper" ? "place" : cur?.tool || "place";
          engine?.setBlockBuildState?.({ color: BLOCK_COLORS[idx].hex, tool: nextTool });
          syncBlockStudioControls();
          return;
        }
      }
    }
  }

  if (e.key === "Escape") {
    if (dialogOpen || performance.now() - lastAvatarDialogCloseMs < 80) {
      return;
    }
    if (blockModeActive) {
      e.preventDefault();
      setBlockModeActive(false);
    } else if (uiState === "picking" || uiState === "composing") {
      e.preventDefault();
      hideError();
      chosenSpot = null;
      uiState = "idle";
      syncDockUI();
    } else if (engine.isFirstPerson()) {
      e.preventDefault();
      hoverCard.hidden = true;
      engine.setDragMode("pan");
    }
  }
});

worldCanvas.addEventListener("pointerleave", () => {
  hoverCard.hidden = true;
});

readyGotoBtn.addEventListener("click", () => {
  if (!myCreationId) return;
  hoverCard.hidden = true;
  uiState = "placed";
  syncDockUI();
  engine.focusCreationById(myCreationId);
  const mine = worldData?.creations?.find((c) => c.id === myCreationId) || readyCreation;
  if (mine) {
    const desc = mine.description || mine.behavior?.statusLine || "";
    showToast(desc ? `${mine.name} — ${desc}` : mine.name, 4600);
  }
});

locateMineBtn.addEventListener("click", () => {
  if (!myCreationId) return;
  hoverCard.hidden = true;
  engine.focusCreationById(myCreationId);
  const mine = worldData?.creations?.find((c) => c.id === myCreationId);
  if (mine) {
    const desc = mine.description || mine.behavior?.statusLine || "";
    showToast(desc ? `${mine.name} — ${desc}` : mine.name);
  }
});

async function resizeImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Unsupported image format"));
      img.onload = () => {
        const maxSide = 960;
        let { width, height } = img;
        if (width > maxSide || height > maxSide) {
          if (width >= height) {
            height = Math.round((height * maxSide) / width);
            width = maxSide;
          } else {
            width = Math.round((width * maxSide) / height);
            height = maxSide;
          }
        }
        const c = document.createElement("canvas");
        c.width = Math.max(1, width);
        c.height = Math.max(1, height);
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.86));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function showFormError(msg) {
  formError.textContent = msg;
  formError.hidden = false;
}

function hideError() {
  formError.hidden = true;
}

async function handleSelectedFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    showFormError("Choose a PNG, JPG, or WebP image.");
    return;
  }
  hideError();
  try {
    selectedImageDataUrl = await resizeImageFile(file);
    dropPreviewImg.src = selectedImageDataUrl;
    dropEmpty.hidden = true;
    dropPreviewWrap.hidden = false;
  } catch (err) {
    showFormError(err.message || "Could not process that image.");
  }
}

imageInput.addEventListener("change", () => {
  const file = imageInput.files?.[0];
  if (file) handleSelectedFile(file);
});

clearImageBtn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  selectedImageDataUrl = null;
  imageInput.value = "";
  dropPreviewImg.removeAttribute("src");
  dropPreviewWrap.hidden = true;
  dropEmpty.hidden = false;
});

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});
dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  const file = e.dataTransfer?.files?.[0];
  if (file) handleSelectedFile(file);
});

window.addEventListener("paste", (e) => {
  if (uiState !== "composing") return;
  const items = e.clipboardData?.items || [];
  for (const item of items) {
    if (item.type.startsWith("image/")) {
      const f = item.getAsFile();
      if (f) handleSelectedFile(f);
      break;
    }
  }
});

// Enqueue build into the multi-user workshop queue -> close builder immediately so visitor can explore while watching live build stages!
sculptBtn.addEventListener("click", async () => {
  if (uiState === "building") return;
  hideError();
  const prompt = promptInput.value.trim();
  if (!prompt && !selectedImageDataUrl) {
    showFormError("Add a photo or short description first.");
    return;
  }

  engine.setPreviewPrompt(prompt);
  const spotX = chosenSpot?.x ?? null;
  const spotZ = chosenSpot?.z ?? null;

  uiState = "building";
  sculptBtn.disabled = true;
  buildingPillLabel.textContent = "Approving query…";
  if (buildingPillSub) {
    buildingPillSub.textContent = "Being built with Gemini 4 Hydrogen";
  }
  syncDockUI();

  try {
    const res = await fetch("/api/build", {
      method: "POST",
      headers: buildVisitorHeaders({
        "content-type": "application/json",
        "x-meadow-client": "1",
      }),
      body: JSON.stringify({
        prompt,
        imageDataUrl: selectedImageDataUrl || undefined,
        x: spotX,
        z: spotZ,
      }),
    });
    const data = await res.json();
    if (data?.visitorToken) storeVisitorToken(data.visitorToken);

    if (!res.ok || !data.ok) {
      sculptBtn.disabled = false;
      if (data.alreadyPlaced && data.myCreationId) {
        myCreationId = data.myCreationId;
        uiState = "placed";
        syncDockUI();
        return;
      }
      uiState = "composing";
      syncDockUI();
      showFormError(data.error || "Could not build that right now — try again.");
      return;
    }

    if (data.job) {
      startTrackingJob(data.job);
      return;
    }

    // Direct synchronous fallback if ever returned
    sculptBtn.disabled = false;
    worldData = data.world;
    myCreationId = data.creation.id;
    readyCreation = data.creation;
    if (data.feeds) engine.applyLiveFeeds(data.feeds);
    engine.applyWorldSnapshot(worldData);
    uiState = "ready";
    syncDockUI();
  } catch {
    sculptBtn.disabled = false;
    uiState = "composing";
    syncDockUI();
    showFormError("Network hiccup while building — try again.");
  }
});

promptInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sculptBtn.click();
  }
});

async function refreshLiveFeeds() {
  try {
    const res = await fetch("/api/feeds");
    if (!res.ok) return;
    const data = await res.json();
    if (data.ok && data.feeds) {
      engine.applyLiveFeeds(data.feeds);
    }
  } catch {
    // ignore transient feed errors
  }
}

async function refreshDailyEligibility() {
  if (isOgCapture || uiState === "building" || uiState === "ready") return;
  try {
    const res = await fetch("/api/world", {
      headers: buildVisitorHeaders(),
    });
    if (!res.ok) return;
    const latest = await res.json();
    if (latest?.visitorToken) storeVisitorToken(latest.visitorToken);
    worldData = latest;
    myCreationId = latest.myCreationId || null;
    engine.applyWorldSnapshot(worldData);
    if (latest.myActiveJob && !myCreationId) {
      startTrackingJob(latest.myActiveJob);
    } else if (!myCreationId && uiState === "placed") {
      uiState = "idle";
      syncDockUI();
    }
  } catch {
    // ignore transient network errors
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    if (uiState === "building" && activeJob) {
      pollActiveJob();
    } else {
      refreshDailyEligibility();
    }
  }
});

function handleWorldMessage(msg) {
  if (!msg || typeof msg !== "object") return;
  if (msg.type === "blocks_delta" && Array.isArray(msg.ops)) {
    if (typeof msg.totalBlocks === "number") {
      updateBlockCountLabel(msg.totalBlocks);
    }
    if (!myBlockOwnerId || msg.byId !== myBlockOwnerId) {
      engine?.applyBlocksDelta?.(msg.ops);
    }
    return;
  }
  if (msg.type === "queue_tick" && activeJob && uiState === "building") {
    const qIdx = Array.isArray(msg.queuedIds) ? msg.queuedIds.indexOf(activeJob.jobId) : -1;
    const activeEntry = Array.isArray(msg.sculpting)
      ? msg.sculpting.find((s) => s.jobId === activeJob.jobId)
      : null;
    if (qIdx >= 0) {
      activeJob.status = "queued";
      activeJob.phase = "queued";
      activeJob.position = qIdx + 1;
      renderActiveJobLabel();
    } else if (activeEntry) {
      activeJob.status = "sculpting";
      if (activeEntry.phase) {
        activeJob.phase = activeEntry.phase;
      } else if (activeJob.phase === "queued") {
        activeJob.phase = "sculpting";
      }
      activeJob.position = 0;
      renderActiveJobLabel();
    }
    pollActiveJob();
    return;
  }

  if ((msg.type === "creation_placed" || msg.type === "world_updated") && msg.world) {
    worldData = {
      ...msg.world,
      myCreationId,
    };
    engine.applyWorldSnapshot(worldData);
    if (uiState === "building" && activeJob) {
      pollActiveJob();
    } else if (uiState === "placed" || uiState === "ready") {
      syncDockUI();
    }
    refreshLiveFeeds();

    if (
      msg.type === "creation_placed" &&
      msg.creation &&
      msg.creation.id !== myCreationId &&
      uiState !== "building"
    ) {
      showToast(`Someone added "${msg.creation.name}" to Sindong Island!`, 4200);
    }
  }
}

if (!isOgCapture) {
  mpClient = createMultiplayerClient({
    multiplayerEnabled: !isOgCapture,
    getLocalPose: () => engine?.getLocalMultiplayerPose?.(),
    getLocalProfile: () => engine?.getLocalAppearance?.(),
    getExtraHeaders: () => buildVisitorHeaders(),
    onWorldMessage: handleWorldMessage,
    onWelcome(msg) {
      engine?.syncMultiplayerWelcome?.(msg?.players || []);
      if (typeof msg?.onlineCount === "number") {
        updateOnlinePill(msg.onlineCount);
      }
    },
    onPeerJoin(player, msg) {
      engine?.upsertRemotePlayer?.(player);
      if (typeof msg?.onlineCount === "number") {
        updateOnlinePill(msg.onlineCount);
      }
    },
    onPeerPose(poseMsg) {
      engine?.updateRemotePlayerPose?.(poseMsg);
    },
    onPeerProfile(profileMsg) {
      engine?.updateRemotePlayerProfile?.(profileMsg);
    },
    onPeerEmote(emoteMsg) {
      engine?.triggerRemotePlayerEmote?.(emoteMsg);
    },
    onPeerLeave(id, msg) {
      engine?.removeRemotePlayer?.(id);
      if (typeof msg?.onlineCount === "number") {
        updateOnlinePill(msg.onlineCount);
      }
    },
    onOnlineCountChange(count) {
      updateOnlinePill(count);
    },
  });
}

window.__geminIslandMp = mpClient;

async function initWorld() {
  try {
    const res = await fetch("/api/world", {
      headers: buildVisitorHeaders(),
    });
    if (res.ok) {
      worldData = await res.json();
      if (worldData?.visitorToken) storeVisitorToken(worldData.visitorToken);
      myCreationId = worldData.myCreationId || myCreationId || null;
      engine.applyWorldSnapshot(worldData);
      updateBlockCountLabel(Array.isArray(worldData.blocks) ? worldData.blocks.length : engine.getBlockCount());
      if (studentName) {
        syncStudentNameValue(studentName, true);
      }
      if (!isOgCapture) {
        if (myCreationId) {
          uiState = "placed";
          syncDockUI();
        } else if (worldData.myActiveJob) {
          startTrackingJob(worldData.myActiveJob);
        } else {
          uiState = "idle";
          syncDockUI();
        }
      }
    }
  } catch (err) {
    console.error("Failed to fetch initial world:", err);
  }

  refreshLiveFeeds();
  if (!isOgCapture) {
    setInterval(refreshLiveFeeds, 90_000);
    setInterval(refreshDailyEligibility, 10 * 60_000);
  }
}

initWorld();
