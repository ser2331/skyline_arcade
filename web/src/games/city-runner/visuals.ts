export type SpriteStrip = {
  image: HTMLCanvasElement | HTMLImageElement;
  frameWidth: number;
  frameHeight: number;
  frames: number;
};

export class SpriteAnimator {
  constructor(private readonly frames: number, private readonly ticksPerFrame: number) {}

  frameAt(globalTick: number): number {
    return Math.floor(globalTick / this.ticksPerFrame) % this.frames;
  }
}

export type RunnerPose = "run" | "jump" | "crouch";

export type CityRunnerVisuals = {
  runnerLightRun: SpriteStrip;
  runnerDarkRun: SpriteStrip;
  runnerLightJump: SpriteStrip;
  runnerDarkJump: SpriteStrip;
  runnerLightCrouch: SpriteStrip;
  runnerDarkCrouch: SpriteStrip;
  bee: SpriteStrip;
  fly: SpriteStrip;
  externalReady: boolean;
  external: {
    runner?: HTMLImageElement;
    runnerStrip?: SpriteStrip;
    runnerRun?: SpriteStrip;
    runnerJump?: SpriteStrip;
    runnerCrouch?: SpriteStrip;
    runnerDeath?: SpriteStrip;
    bee?: HTMLImageElement;
    fly?: HTMLImageElement;
  };
};

const createStripCanvas = (frameWidth: number, frameHeight: number, frames: number): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = frameWidth * frames;
  canvas.height = frameHeight;
  return canvas;
};

const drawRunnerStrip = (
  bodyColor: string,
  eyeColor: string,
  pose: RunnerPose
): SpriteStrip => {
  const frameWidth = pose === "crouch" ? 34 : 32;
  const frameHeight = pose === "crouch" ? 44 : 56;
  const frames = pose === "jump" ? 2 : 6;
  const image = createStripCanvas(frameWidth, frameHeight, frames);
  const ctx = image.getContext("2d");
  if (!ctx) return { image, frameWidth, frameHeight, frames };

  for (let i = 0; i < frames; i += 1) {
    const ox = i * frameWidth;
    const phase = (i / frames) * Math.PI * 2;
    const legShift = pose === "run" ? Math.sin(phase) * 3.2 : pose === "jump" ? 1 : 0.9;
    const armShift = pose === "run" ? -legShift * 0.8 : pose === "jump" ? 2 : 0.6;
    const bob = pose === "run" ? Math.sin(phase) * 1.4 : pose === "jump" ? -1.2 : 0.3;
    const torsoTop = pose === "crouch" ? 14 : 17;
    const torsoBottom = pose === "crouch" ? 27 : 34;
    const headY = pose === "crouch" ? 9 : 8;

    ctx.strokeStyle = bodyColor;
    ctx.fillStyle = bodyColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ox + 16, headY + bob, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(ox + 16, torsoTop + bob);
    ctx.lineTo(ox + 16, torsoBottom + bob);
    ctx.moveTo(ox + 16, torsoTop + 6 + bob);
    ctx.lineTo(ox + 6, torsoTop + 11 + bob + armShift);
    ctx.moveTo(ox + 16, torsoTop + 6 + bob);
    ctx.lineTo(ox + 26, torsoTop + 11 + bob - armShift);
    ctx.moveTo(ox + 16, torsoBottom + bob);
    ctx.lineTo(ox + 9, (pose === "crouch" ? 38 : 50) + legShift * 0.5);
    ctx.moveTo(ox + 16, torsoBottom + bob);
    ctx.lineTo(ox + 23, (pose === "crouch" ? 38 : 50) - legShift * 0.5);
    ctx.stroke();

    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(ox + 18.3, headY - 0.3 + bob, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  return { image, frameWidth, frameHeight, frames };
};

const drawBeeStrip = (): SpriteStrip => {
  const frameWidth = 34;
  const frameHeight = 22;
  const frames = 4;
  const image = createStripCanvas(frameWidth, frameHeight, frames);
  const ctx = image.getContext("2d");
  if (!ctx) return { image, frameWidth, frameHeight, frames };
  for (let i = 0; i < frames; i += 1) {
    const ox = i * frameWidth;
    const wingY = i % 2 === 0 ? -5 : -8;
    ctx.fillStyle = "#facc15";
    ctx.fillRect(ox + 5, 7, 24, 12);
    ctx.fillStyle = "#111827";
    ctx.fillRect(ox + 10, 7, 3, 12);
    ctx.fillRect(ox + 18, 7, 3, 12);
    ctx.fillStyle = "#bfdbfe";
    ctx.fillRect(ox + 7, 7 + wingY, 8, 5);
    ctx.fillRect(ox + 19, 7 + wingY, 8, 5);
  }
  return { image, frameWidth, frameHeight, frames };
};

const drawFlyStrip = (): SpriteStrip => {
  const frameWidth = 30;
  const frameHeight = 20;
  const frames = 4;
  const image = createStripCanvas(frameWidth, frameHeight, frames);
  const ctx = image.getContext("2d");
  if (!ctx) return { image, frameWidth, frameHeight, frames };
  for (let i = 0; i < frames; i += 1) {
    const ox = i * frameWidth;
    const wingY = i % 2 === 0 ? -4 : -7;
    ctx.fillStyle = "#6b7280";
    ctx.fillRect(ox + 4, 7, 20, 10);
    ctx.fillStyle = "#d1d5db";
    ctx.fillRect(ox + 7, 7 + wingY, 6, 4);
    ctx.fillRect(ox + 17, 7 + wingY, 6, 4);
  }
  return { image, frameWidth, frameHeight, frames };
};

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed loading ${url}`));
    image.src = url;
  });

const resolveAssetUrl = (value: string): string => {
  const base = import.meta.env.BASE_URL || "/";
  if (/^(https?:)?\/\//.test(value)) return value;
  if (value.startsWith("/")) return `${base}${value.slice(1)}`;
  return `${base}${value}`;
};

const buildStripFromImages = (images: HTMLImageElement[]): SpriteStrip | undefined => {
  if (images.length === 0) return undefined;
  const frameWidth = images[0].naturalWidth || images[0].width;
  const frameHeight = images[0].naturalHeight || images[0].height;
  if (!frameWidth || !frameHeight) return undefined;
  const canvas = createStripCanvas(frameWidth, frameHeight, images.length);
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;
  images.forEach((img, i) => {
    ctx.drawImage(img, i * frameWidth, 0, frameWidth, frameHeight);
  });
  return { image: canvas, frameWidth, frameHeight, frames: images.length };
};

export async function preloadCityRunnerExternalAssets(
  visuals: CityRunnerVisuals
): Promise<void> {
  const envRunner = import.meta.env.VITE_CITY_RUNNER_RUNNER_SVG as string | undefined;
  const runnerFile = envRunner && envRunner.trim().length > 0
    ? resolveAssetUrl(envRunner.trim())
    : resolveAssetUrl("/assets/city-runner/runners/default.svg");
  const runnerPattern = (import.meta.env.VITE_CITY_RUNNER_RUNNER_SVG_PATTERN as string | undefined)?.trim();
  const runnerFramesRaw = Number(import.meta.env.VITE_CITY_RUNNER_RUNNER_SVG_FRAMES ?? 0);
  const runnerFrames = Number.isFinite(runnerFramesRaw) ? Math.max(0, Math.floor(runnerFramesRaw)) : 0;
  const runPattern = (import.meta.env.VITE_CITY_RUNNER_RUN_PATTERN as string | undefined)?.trim();
  const jumpPattern = (import.meta.env.VITE_CITY_RUNNER_JUMP_PATTERN as string | undefined)?.trim();
  const crouchPattern = (import.meta.env.VITE_CITY_RUNNER_CROUCH_PATTERN as string | undefined)?.trim();
  const deathPattern = (import.meta.env.VITE_CITY_RUNNER_DEATH_PATTERN as string | undefined)?.trim();
  const runFrames = Number(import.meta.env.VITE_CITY_RUNNER_RUN_FRAMES ?? 0);
  const jumpFrames = Number(import.meta.env.VITE_CITY_RUNNER_JUMP_FRAMES ?? 0);
  const crouchFrames = Number(import.meta.env.VITE_CITY_RUNNER_CROUCH_FRAMES ?? 0);
  const deathFrames = Number(import.meta.env.VITE_CITY_RUNNER_DEATH_FRAMES ?? 0);

  const [runner, bee, fly] = await Promise.allSettled([
    loadImage(runnerFile),
    loadImage(resolveAssetUrl("/assets/city-runner/bee.svg")),
    loadImage(resolveAssetUrl("/assets/city-runner/fly.svg"))
  ]);

  visuals.external.runner = runner.status === "fulfilled" ? runner.value : undefined;
  visuals.external.bee = bee.status === "fulfilled" ? bee.value : undefined;
  visuals.external.fly = fly.status === "fulfilled" ? fly.value : undefined;

  if (runnerPattern && runnerFrames > 1) {
    const frameLoads = await Promise.allSettled(
      Array.from({ length: runnerFrames }, (_, i) => loadImage(resolveAssetUrl(runnerPattern.replace("{n}", String(i + 1)))))
    );
    const loadedFrames = frameLoads
      .filter((r): r is PromiseFulfilledResult<HTMLImageElement> => r.status === "fulfilled")
      .map((r) => r.value);
    visuals.external.runnerStrip = buildStripFromImages(loadedFrames);
  }

  const loadPatternStrip = async (pattern: string | undefined, frames: number): Promise<SpriteStrip | undefined> => {
    if (!pattern || frames <= 0) return undefined;
    const frameLoads = await Promise.allSettled(
      Array.from({ length: frames }, (_, i) => loadImage(resolveAssetUrl(pattern.replace("{n}", String(i + 1)))))
    );
    const loadedFrames = frameLoads
      .filter((r): r is PromiseFulfilledResult<HTMLImageElement> => r.status === "fulfilled")
      .map((r) => r.value);
    return buildStripFromImages(loadedFrames);
  };

  visuals.external.runnerRun = await loadPatternStrip(runPattern, runFrames);
  visuals.external.runnerJump = await loadPatternStrip(jumpPattern, jumpFrames);
  visuals.external.runnerCrouch = await loadPatternStrip(crouchPattern, crouchFrames);
  visuals.external.runnerDeath = await loadPatternStrip(deathPattern, deathFrames);

  visuals.externalReady = true;
}

export function createCityRunnerVisuals(): CityRunnerVisuals {
  return {
    runnerLightRun: drawRunnerStrip("#0f172a", "#f8fafc", "run"),
    runnerDarkRun: drawRunnerStrip("#f8fafc", "#0f172a", "run"),
    runnerLightJump: drawRunnerStrip("#0f172a", "#f8fafc", "jump"),
    runnerDarkJump: drawRunnerStrip("#f8fafc", "#0f172a", "jump"),
    runnerLightCrouch: drawRunnerStrip("#0f172a", "#f8fafc", "crouch"),
    runnerDarkCrouch: drawRunnerStrip("#f8fafc", "#0f172a", "crouch"),
    bee: drawBeeStrip(),
    fly: drawFlyStrip(),
    externalReady: false,
    external: {}
  };
}

export function drawParallaxBackground(
  ctx: CanvasRenderingContext2D,
  frame: number,
  width: number,
  height: number,
  groundY: number,
  lightPhase: boolean
) {
  const sky = lightPhase ? "#f8fafc" : "#020617";
  const far = lightPhase ? "#dbeafe" : "#0f172a";
  const mid = lightPhase ? "#bfdbfe" : "#1e293b";
  const near = lightPhase ? "#93c5fd" : "#334155";

  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const celestialX = width - 70;
  const celestialY = 62;
  if (lightPhase) {
    ctx.fillStyle = "#fde68a";
    ctx.beginPath();
    ctx.arc(celestialX, celestialY, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(253, 230, 138, 0.25)";
    ctx.beginPath();
    ctx.arc(celestialX, celestialY, 26, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.arc(celestialX, celestialY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#020617";
    ctx.beginPath();
    ctx.arc(celestialX + 6, celestialY - 3, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(226, 232, 240, 0.2)";
    ctx.beginPath();
    ctx.arc(celestialX - 2, celestialY, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  const cloudColor = lightPhase ? "rgba(148, 163, 184, 0.28)" : "rgba(100, 116, 139, 0.2)";
  const cloudOffset = (frame * 0.18) % (width + 160);
  ctx.fillStyle = cloudColor;
  for (let i = 0; i < 4; i += 1) {
    const baseX = i * 170 - cloudOffset + 40;
    const baseY = 68 + (i % 2) * 26;
    ctx.beginPath();
    ctx.arc(baseX, baseY, 16, 0, Math.PI * 2);
    ctx.arc(baseX + 18, baseY - 6, 14, 0, Math.PI * 2);
    ctx.arc(baseX + 34, baseY, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  const drawLayer = (color: string, speed: number, baseY: number, blockWidth: number, minH: number, maxH: number) => {
    const offset = (frame * speed) % blockWidth;
    ctx.fillStyle = color;
    for (let x = -blockWidth; x < width + blockWidth; x += blockWidth) {
      const seed = Math.abs(Math.sin((x + 37) * 0.013)) % 1;
      const h = minH + seed * (maxH - minH);
      ctx.fillRect(x - offset, baseY - h, blockWidth - 8, h);
    }
  };

  drawLayer(far, 0.22, groundY - 6, 86, 35, 78);
  drawLayer(mid, 0.44, groundY - 4, 68, 24, 62);
  drawLayer(near, 0.72, groundY - 2, 52, 16, 42);
}
