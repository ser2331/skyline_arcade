import type { GameEngine } from "../../shared/types/game";
import {
  drawBrick,
  drawCreature,
  drawDebris,
  drawFlyer,
  drawFxParticle,
  drawGroundObstacle,
  drawImpactRing,
  drawRunner,
  drawSpeedLines,
  drawStar
} from "./draw";
import type { BrickObstacle, Creature, Debris, FlyingObstacle, FxParticle, GroundObstacle, ImpactRing, StarDrop } from "./types";
import type { EngineCallbacks } from "../types";
import { createCityRunnerVisuals, drawParallaxBackground, preloadCityRunnerExternalAssets, SpriteAnimator } from "./visuals";
import { getCityRunnerActiveLevel } from "./levelStore";
import type { CityRunnerLevelEvent } from "./levelStore";

export function createCityRunnerEngine(canvas: HTMLCanvasElement, callbacks: EngineCallbacks): GameEngine {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context is unavailable");

  const groundY = canvas.height - 72;
  const gravity = 0.68;
  const jumpVelocity = -14.2;
  const maxJumpHoldFrames = 16;
  const jumpHoldBoost = -0.72;

  const player = {
    x: 110,
    y: groundY - 54,
    width: 26,
    height: 54,
    normalHeight: 54,
    crouchHeight: 34,
    velocityY: 0
  };

  let keys: Record<string, boolean> = {};
  let jumpPressed = false;
  let crouchPressed = false;
  let jumpConsumed = false;
  let jumpHoldFrames = 0;
  let score = 0;
  let frame = 0;
  let gameOver = false;
  let rafId: number | null = null;

  let groundObstacles: GroundObstacle[] = [];
  let bricks: BrickObstacle[] = [];
  let creatures: Creature[] = [];
  let flyers: FlyingObstacle[] = [];
  let stars: StarDrop[] = [];
  let debrisParts: Debris[] = [];
  let fxParticles: FxParticle[] = [];
  let impactRings: ImpactRing[] = [];

  let invincibleFrames = 0;
  let superJumpFrames = 0;
  let smashSfxCooldown = 0;

  let nextGroundSpawnIn = 100;
  let nextBrickSpawnIn = 150;
  let nextCreatureSpawnIn = 210;
  let nextFlyingSpawnIn = 185;
  const scripted = getCityRunnerActiveLevel();
  const scriptedDurationFrames = scripted ? Math.max(60, Math.floor(scripted.durationSec * 60)) : 0;
  const scriptedCheckpoints = scripted
    ? [...scripted.checkpointsSec]
        .filter((s) => Number.isFinite(s) && s > 0)
        .map((s) => Math.floor(s * 60))
        .sort((a, b) => a - b)
    : [];
  const scriptedEvents: CityRunnerLevelEvent[] = scripted
    ? [...scripted.events].filter((e) => typeof e?.at === "number" && Number.isFinite(e.at)).sort((a, b) => a.at - b.at)
    : [];
  let scriptedCursor = 0;
  let checkpointCursor = 0;
  let levelWon = false;
  let scoreRemainder = 0;
  let visualsReady = false;
  let visualsLoading = false;
  let cameraShakeFrames = 0;
  let hitFlashFrames = 0;
  let deathFlashFrames = 0;
  let hitStopFrames = 0;
  let motionVisualStrength = 0.25;
  let prevOnGround = true;
  let squashFrames = 0;
  let stretchFrames = 0;
  const visuals = createCityRunnerVisuals();
  const runnerRunAnimator = new SpriteAnimator(visuals.runnerLightRun.frames, 4);
  const runnerJumpAnimator = new SpriteAnimator(visuals.runnerLightJump.frames, 8);
  const runnerCrouchAnimator = new SpriteAnimator(visuals.runnerLightCrouch.frames, 5);
  const beeAnimator = new SpriteAnimator(visuals.bee.frames, 3);
  const flyAnimator = new SpriteAnimator(visuals.fly.frames, 3);

  const lastX = <T extends { x: number }>(items: T[]) => {
    if (items.length === 0) return 0;
    return items[items.length - 1].x;
  };

  const isOnGround = () => player.y >= groundY - player.height - 0.001;
  const isStandingOnPlatform = () =>
    bricks.some((b) => {
      const onTop = Math.abs(player.y + player.height - b.y) < 2.2;
      const overlap = player.x + player.width > b.x + 4 && player.x < b.x + b.width - 4;
      return onTop && overlap;
    });

  const spawnGroundObstacle = () => {
    const isFlower = Math.random() < 0.35;
    const height = 34 + Math.random() * 82;
    const width = isFlower ? 18 + Math.random() * 10 : 28 + Math.random() * 30;
    groundObstacles.push({
      x: canvas.width + width,
      width,
      height,
      speed: 3.45 + Math.min(score / 340, 2.35),
      kind: isFlower ? "flower" : "pipe"
    });
  };

  const spawnGroundObstacleScripted = (evt: Extract<CityRunnerLevelEvent, { type: "ground" }>) => {
    const kind = evt.kind;
    const height = evt.height ?? (34 + Math.random() * 82);
    const width =
      evt.width ??
      (kind === "flower"
        ? 18 + Math.random() * 10
        : 28 + Math.random() * 30);
    groundObstacles.push({
      x: canvas.width + width,
      width,
      height,
      speed: 3.45 + Math.min(score / 340, 2.35),
      kind
    });
  };

  const spawnBrick = () => {
    const width = 44 + Math.random() * 44;
    bricks.push({
      x: canvas.width + width,
      width,
      y: groundY - 62 - Math.random() * 22,
      height: 18 + Math.random() * 14,
      speed: 3.5 + Math.min(score / 340, 2.4)
    });
  };

  const spawnBrickScripted = (evt: Extract<CityRunnerLevelEvent, { type: "brick" }>) => {
    const width = evt.width ?? (44 + Math.random() * 44);
    const height = evt.height ?? (18 + Math.random() * 14);
    const y = evt.y ?? (groundY - 62 - Math.random() * 22);
    bricks.push({
      x: canvas.width + width,
      width,
      y,
      height,
      speed: 3.5 + Math.min(score / 340, 2.4)
    });
  };

  const spawnCreature = () => {
    creatures.push({
      x: canvas.width + 34,
      y: groundY - 24,
      width: 34,
      height: 24,
      speed: 3.25 + Math.min(score / 360, 2.2),
      phase: Math.random() * Math.PI * 2
    });
  };

  const spawnCreatureScripted = () => spawnCreature();

  const spawnFlyer = () => {
    const lowFlight = Math.random() < 0.42;
    flyers.push({
      x: canvas.width + 36,
      y: lowFlight ? groundY - player.normalHeight + 2 + Math.random() * 8 : 108 + Math.random() * 148,
      width: 30 + Math.random() * 10,
      height: 16 + Math.random() * 8,
      speed: 3.8 + Math.min(score / 320, 2.5),
      flap: Math.random() * Math.PI * 2,
      lowFlight,
      starCarrier: Math.random() < 0.3,
      kind: Math.random() < 0.5 ? "bee" : "fly"
    });
  };

  const spawnFlyerScripted = (evt: Extract<CityRunnerLevelEvent, { type: "flyer" }>) => {
    const lowFlight = evt.lowFlight ?? (Math.random() < 0.42);
    flyers.push({
      x: canvas.width + 36,
      y: lowFlight ? groundY - player.normalHeight + 2 + Math.random() * 8 : 108 + Math.random() * 148,
      width: 30 + Math.random() * 10,
      height: 16 + Math.random() * 8,
      speed: 3.8 + Math.min(score / 320, 2.5),
      flap: Math.random() * Math.PI * 2,
      lowFlight,
      starCarrier: evt.starCarrier ?? (Math.random() < 0.3),
      kind: evt.kind ?? (Math.random() < 0.5 ? "bee" : "fly")
    });
  };

  const spawnStar = (x: number, y: number, kind: "invincible" | "superJump", speedX: number) => {
    stars.push({ x, y, size: 18, speedX, speedY: -3.8, kind });
  };

  const spawnStarScripted = (evt: Extract<CityRunnerLevelEvent, { type: "star" }>) => {
    const y = evt.y ?? (groundY - 140);
    spawnStar(canvas.width + 40, y, evt.kind, 0.3);
  };

  const spawnBrickDebris = (brick: BrickObstacle) => {
    for (let i = 0; i < 6; i += 1) {
      debrisParts.push({
        x: brick.x + brick.width / 2,
        y: brick.y + brick.height / 2,
        vx: -2.6 + Math.random() * 5.2,
        vy: -4.2 + Math.random() * 1.8,
        size: 4 + Math.random() * 3,
        life: 42 + Math.random() * 16,
        color: i % 2 === 0 ? "#b45309" : "#7c2d12"
      });
    }
  };

  const spawnFlyerDebris = (flyer: FlyingObstacle, y: number) => {
    for (let i = 0; i < 5; i += 1) {
      debrisParts.push({
        x: flyer.x + flyer.width / 2,
        y: y + flyer.height / 2,
        vx: -2 + Math.random() * 4,
        vy: -3.6 + Math.random() * 2.2,
        size: 3 + Math.random() * 3,
        life: 34 + Math.random() * 14,
        color: flyer.kind === "bee" ? "#facc15" : "#9ca3af"
      });
    }
  };

  const spawnCreatureDebris = (creature: Creature) => {
    for (let i = 0; i < 6; i += 1) {
      debrisParts.push({
        x: creature.x + creature.width / 2,
        y: creature.y + creature.height / 2,
        vx: -2.2 + Math.random() * 4.4,
        vy: -3.8 + Math.random() * 2.2,
        size: 3 + Math.random() * 3,
        life: 32 + Math.random() * 14,
        color: i % 2 === 0 ? "#c08457" : "#8b5a3c"
      });
    }
  };

  const spawnStepDust = () => {
    const footY = groundY + 1;
    for (let i = 0; i < 2; i += 1) {
      fxParticles.push({
        x: player.x + 8 + i * 10,
        y: footY,
        vx: -0.8 - Math.random() * 1.6,
        vy: -0.5 - Math.random() * 0.8,
        size: 2 + Math.random() * 2,
        life: 14 + Math.random() * 8,
        maxLife: 22,
        color: "rgba(148,163,184,__ALPHA__)"
      });
    }
  };

  const spawnLandingDust = () => {
    for (let i = 0; i < 9; i += 1) {
      const dir = i < 5 ? -1 : 1;
      fxParticles.push({
        x: player.x + player.width / 2,
        y: groundY + 1,
        vx: dir * (0.6 + Math.random() * 2.1),
        vy: -0.3 - Math.random() * 1.6,
        size: 2 + Math.random() * 2.5,
        life: 22 + Math.random() * 10,
        maxLife: 32,
        color: "rgba(148,163,184,__ALPHA__)"
      });
    }
  };

  const spawnStarTrail = (star: StarDrop) => {
    const color = star.kind === "invincible" ? "rgba(250,204,21,__ALPHA__)" : "rgba(96,165,250,__ALPHA__)";
    fxParticles.push({
      x: star.x + star.size / 2 + (Math.random() - 0.5) * 6,
      y: star.y + star.size / 2 + (Math.random() - 0.5) * 6,
      vx: -0.6 - Math.random() * 0.9,
      vy: (Math.random() - 0.5) * 0.8,
      size: 1.8 + Math.random() * 2.2,
      life: 14 + Math.random() * 10,
      maxLife: 24,
      color
    });
  };

  const spawnImpactRing = (x: number, y: number, color: string) => {
    impactRings.push({
      x,
      y,
      radius: 6,
      growth: 1.9,
      life: 18,
      maxLife: 18,
      color
    });
  };

  const spawnStarCollectEffect = (star: StarDrop) => {
    if (star.kind === "invincible") {
      for (let i = 0; i < 16; i += 1) {
        const angle = (i / 16) * Math.PI * 2;
        fxParticles.push({
          x: star.x + star.size / 2,
          y: star.y + star.size / 2,
          vx: Math.cos(angle) * (1.6 + Math.random() * 1.9),
          vy: Math.sin(angle) * (1.2 + Math.random() * 1.6),
          size: 2.2 + Math.random() * 2.6,
          life: 20 + Math.random() * 12,
          maxLife: 30,
          color: "rgba(250,204,21,__ALPHA__)"
        });
      }
      spawnImpactRing(star.x + star.size / 2, star.y + star.size / 2, "rgba(250,204,21,__ALPHA__)");
      return;
    }

    for (let i = 0; i < 18; i += 1) {
      const t = i / 18;
      const angle = t * Math.PI * 4.4;
      const radius = 5 + t * 28;
      fxParticles.push({
        x: star.x + star.size / 2 + Math.cos(angle) * radius * 0.35,
        y: star.y + star.size / 2 + Math.sin(angle) * radius * 0.35,
        vx: Math.cos(angle) * 1.2,
        vy: Math.sin(angle) * 1.2,
        size: 1.8 + Math.random() * 2.4,
        life: 22 + Math.random() * 14,
        maxLife: 34,
        color: "rgba(96,165,250,__ALPHA__)"
      });
    }
    spawnImpactRing(star.x + star.size / 2, star.y + star.size / 2, "rgba(96,165,250,__ALPHA__)");
  };

  const render = () => {
    if (!visualsReady) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 22px Arial";
      ctx.fillText("Загрузка ассетов...", 145, 236);
      ctx.fillStyle = "#334155";
      ctx.fillRect(120, 260, 260, 10);
      ctx.fillStyle = "#60a5fa";
      const pulse = (Math.sin(frame * 0.15) + 1) * 0.5;
      ctx.fillRect(120, 260, 80 + pulse * 180, 10);
      return;
    }

    const lightPhase = Math.floor(score / 400) % 2 === 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const shakeX = cameraShakeFrames > 0 ? (Math.random() - 0.5) * 6 : 0;
    const shakeY = cameraShakeFrames > 0 ? (Math.random() - 0.5) * 4 : 0;
    if (cameraShakeFrames > 0) cameraShakeFrames -= 1;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    const speedStrength = motionVisualStrength;
    drawSpeedLines(ctx, frame, canvas.width, canvas.height, speedStrength);
    drawParallaxBackground(ctx, frame, canvas.width, canvas.height, groundY, lightPhase);
    ctx.fillStyle = lightPhase ? "#e2e8f0" : "#1e293b";
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

    groundObstacles.forEach((o) => drawGroundObstacle(ctx, groundY, o, lightPhase));
    bricks.forEach((b) => drawBrick(ctx, b));
    creatures.forEach((c) => drawCreature(ctx, c, frame));
    flyers.forEach((f) => drawFlyer(ctx, f, frame, visuals, beeAnimator, flyAnimator));
    stars.forEach((s) => drawStar(ctx, s));
    debrisParts.forEach((d) => drawDebris(ctx, d));
    fxParticles.forEach((p) => drawFxParticle(ctx, p));
    impactRings.forEach((r) => drawImpactRing(ctx, r));
    const scaleX = squashFrames > 0 ? 1.12 : stretchFrames > 0 ? 0.94 : 1;
    const scaleY = squashFrames > 0 ? 0.9 : stretchFrames > 0 ? 1.1 : 1;
    drawRunner(
      ctx,
      player,
      frame,
      gameOver,
      isOnGround(),
      isStandingOnPlatform(),
      lightPhase,
      visuals,
      runnerRunAnimator,
      runnerJumpAnimator,
      runnerCrouchAnimator,
      scaleX,
      scaleY
    );

    if (invincibleFrames > 0) {
      ctx.fillStyle = "#fde047";
      ctx.font = "bold 16px Arial";
      ctx.fillText(`Неуязвимость: ${Math.ceil(invincibleFrames / 60)}с`, 12, 28);
    }
    if (superJumpFrames > 0) {
      ctx.fillStyle = "#60a5fa";
      ctx.font = "bold 16px Arial";
      ctx.fillText(`Супер-прыжок: ${Math.ceil(superJumpFrames / 60)}с`, 12, 50);
    }
    if (scripted) {
      const elapsed = Math.floor(frame / 60);
      const total = Math.max(1, Math.floor(scriptedDurationFrames / 60));
      const remaining = Math.max(0, total - elapsed);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "bold 16px Arial";
      ctx.fillText(`Время: ${elapsed}/${total}с`, 12, 72);
      ctx.fillText(`До финиша: ${remaining}с`, 12, 94);
      ctx.fillText(`Чекпоинты: ${checkpointCursor}/${scriptedCheckpoints.length}`, 12, 116);
    }
    if (gameOver) {
      ctx.fillStyle = "rgba(2, 6, 23, 0.58)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 30px Arial";
      ctx.fillText("Поражение!", 162, 226);
    }
    if (levelWon) {
      ctx.fillStyle = "rgba(2, 6, 23, 0.58)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#86efac";
      ctx.font = "bold 30px Arial";
      ctx.fillText("Финиш! Победа!", 126, 226);
    }
    ctx.restore();

    if (hitFlashFrames > 0) {
      ctx.fillStyle = "rgba(248, 113, 113, 0.2)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      hitFlashFrames -= 1;
    }
    if (deathFlashFrames > 0) {
      const alpha = Math.min(0.34, deathFlashFrames / 26);
      ctx.fillStyle = `rgba(248, 113, 113, ${alpha})`;
      ctx.fillRect(2, 0, canvas.width - 2, canvas.height);
      ctx.fillStyle = `rgba(96, 165, 250, ${alpha * 0.9})`;
      ctx.fillRect(0, 0, canvas.width - 2, canvas.height);
      ctx.fillStyle = `rgba(248, 250, 252, ${alpha * 0.28})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      deathFlashFrames -= 1;
    }
  };

  const update = () => {
    if (gameOver || levelWon || !visualsReady) return;
    if (hitStopFrames > 0) {
      hitStopFrames -= 1;
      return;
    }
    frame += 1;
    const boostForward = Boolean(keys.ArrowRight || keys.d || keys.D);
    const slowBackward = Boolean(keys.ArrowLeft || keys.a || keys.A);
    const motionFactor = boostForward ? 1.35 : slowBackward ? 0.72 : 1;
    motionVisualStrength = boostForward ? 1 : slowBackward ? 0 : 0.25;

    if (scripted) {
      while (scriptedCursor < scriptedEvents.length && scriptedEvents[scriptedCursor].at <= frame) {
        const evt = scriptedEvents[scriptedCursor];
        if (evt.type === "ground") spawnGroundObstacleScripted(evt);
        if (evt.type === "brick") spawnBrickScripted(evt);
        if (evt.type === "creature") spawnCreatureScripted();
        if (evt.type === "flyer") spawnFlyerScripted(evt);
        if (evt.type === "star") spawnStarScripted(evt);
        scriptedCursor += 1;
      }
      while (checkpointCursor < scriptedCheckpoints.length && frame >= scriptedCheckpoints[checkpointCursor]) {
        callbacks.onEvent?.("collect");
        checkpointCursor += 1;
      }
      if (frame >= scriptedDurationFrames) {
        levelWon = true;
        callbacks.onLevelComplete?.();
        return;
      }
    } else {
      nextGroundSpawnIn -= motionFactor;
      nextBrickSpawnIn -= motionFactor;
      nextCreatureSpawnIn -= motionFactor;
      nextFlyingSpawnIn -= motionFactor;

      if (nextGroundSpawnIn <= 0) {
        // Keep ground obstacles away from bricks to avoid "unreactable" combos.
        const crowded =
          lastX(groundObstacles) > canvas.width - 190 ||
          lastX(creatures) > canvas.width - 250 ||
          lastX(bricks) > canvas.width - 240 ||
          lastX(flyers) > canvas.width - 170;
        if (!crowded) {
          spawnGroundObstacle();
          nextGroundSpawnIn = 150 + Math.floor(Math.random() * 50) - Math.min(12, Math.floor(score / 330));
        }
      }

      if (nextBrickSpawnIn <= 0) {
        // Keep bricks away from ground obstacles (pipes/flowers).
        const crowded =
          lastX(groundObstacles) > canvas.width - 250 ||
          lastX(bricks) > canvas.width - 140 ||
          lastX(creatures) > canvas.width - 250;
        if (!crowded) {
          spawnBrick();
          nextBrickSpawnIn = 165 + Math.floor(Math.random() * 50) - Math.min(16, Math.floor(score / 260));
        }
      }

      if (nextCreatureSpawnIn <= 0) {
        const crowded =
          lastX(groundObstacles) > canvas.width - 280 ||
          lastX(creatures) > canvas.width - 260 ||
          lastX(bricks) > canvas.width - 220 ||
          lastX(flyers) > canvas.width - 240;
        if (!crowded) {
          spawnCreature();
          nextCreatureSpawnIn = 260 + Math.floor(Math.random() * 110) - Math.min(12, Math.floor(score / 420));
        }
      }

      if (nextFlyingSpawnIn <= 0) {
        const crowded =
          lastX(flyers) > canvas.width - 170 ||
          lastX(bricks) > canvas.width - 140 ||
          lastX(creatures) > canvas.width - 240;
        if (!crowded) {
          spawnFlyer();
          nextFlyingSpawnIn = 190 + Math.floor(Math.random() * 95) - Math.min(22, Math.floor(score / 320));
        }
      }
    }

    const targetHeight = crouchPressed && isOnGround() ? player.crouchHeight : player.normalHeight;
    if (player.height !== targetHeight) {
      player.y += player.height - targetHeight;
      player.height = targetHeight;
    }

    const activeJumpVelocity = superJumpFrames > 0 ? jumpVelocity - 5.8 : jumpVelocity;
    const activeJumpHoldBoost = superJumpFrames > 0 ? jumpHoldBoost * 1.6 : jumpHoldBoost;
    if (jumpPressed && !jumpConsumed && (isOnGround() || isStandingOnPlatform())) {
      player.velocityY = activeJumpVelocity;
      jumpConsumed = true;
      jumpHoldFrames = 0;
      callbacks.onEvent?.("jump");
    }
    if (jumpPressed && jumpConsumed && jumpHoldFrames < maxJumpHoldFrames && player.velocityY < 0) {
      player.velocityY += activeJumpHoldBoost;
      jumpHoldFrames += 1;
    }
    if (!jumpPressed || isOnGround()) {
      jumpConsumed = false;
      if (!jumpPressed) jumpHoldFrames = maxJumpHoldFrames;
    }

    const previousY = player.y;
    player.velocityY += gravity;
    player.y += player.velocityY;
    if (player.y > groundY - player.height) {
      player.y = groundY - player.height;
      player.velocityY = 0;
    }
    const onGroundNow = isOnGround();
    if (!prevOnGround && onGroundNow) {
      spawnLandingDust();
      spawnImpactRing(player.x + player.width / 2, groundY + 2, "rgba(148,163,184,__ALPHA__)");
      squashFrames = 5;
    }
    if (onGroundNow && motionFactor > 1.05 && frame % 5 === 0) {
      spawnStepDust();
    }
    prevOnGround = onGroundNow;

    if (invincibleFrames > 0) invincibleFrames -= 1;
    if (superJumpFrames > 0) superJumpFrames -= 1;
    if (smashSfxCooldown > 0) smashSfxCooldown -= 1;
    if (squashFrames > 0) squashFrames -= 1;
    if (stretchFrames > 0) stretchFrames -= 1;

    groundObstacles.forEach((o) => (o.x -= o.speed * motionFactor));
    bricks.forEach((b) => (b.x -= b.speed * motionFactor));
    creatures.forEach((c) => (c.x -= c.speed * motionFactor));
    flyers.forEach((f) => (f.x -= f.speed * motionFactor));
    stars.forEach((s) => {
      s.x += s.speedX - 0.8 * motionFactor;
      s.speedY += 0.24;
      s.y += s.speedY;
      if (frame % 2 === 0) {
        spawnStarTrail(s);
      }
      if (s.y + s.size > groundY) {
        s.y = groundY - s.size;
        s.speedY *= -0.42;
      }
    });
    debrisParts.forEach((d) => {
      d.x += d.vx - 0.8 * motionFactor;
      d.y += d.vy;
      d.vy += 0.2;
      d.life -= 1;
    });
    fxParticles.forEach((p) => {
      p.x += p.vx - 0.5 * motionFactor;
      p.y += p.vy;
      p.vy += 0.08;
      p.life -= 1;
    });
    impactRings.forEach((r) => {
      r.radius += r.growth;
      r.life -= 1;
    });

    groundObstacles = groundObstacles.filter((o) => o.x + o.width > -60);
    bricks = bricks.filter((b) => b.x + b.width > -60);
    creatures = creatures.filter((c) => c.x + c.width > -50);
    flyers = flyers.filter((f) => f.x + f.width > -50);
    stars = stars.filter((s) => s.x + s.size > -40);
    debrisParts = debrisParts.filter((d) => d.life > 0 && d.y < canvas.height + 20);
    fxParticles = fxParticles.filter((p) => p.life > 0 && p.y < canvas.height + 30);
    impactRings = impactRings.filter((r) => r.life > 0);

    stars = stars.filter((s) => {
      const collected =
        player.x < s.x + s.size &&
        player.x + player.width > s.x &&
        player.y < s.y + s.size &&
        player.y + player.height > s.y;
      if (!collected) return true;
      spawnStarCollectEffect(s);
      if (s.kind === "invincible") invincibleFrames = 60 * 4;
      if (s.kind === "superJump") superJumpFrames = 60 * 3;
      callbacks.onEvent?.("collect");
      return false;
    });

    if (invincibleFrames > 0) {
      const destructionFront = player.x + player.width + 56;
      const before = groundObstacles.length + bricks.length + creatures.length + flyers.length;
      groundObstacles = groundObstacles.filter((o) => o.x >= destructionFront);
      bricks = bricks.filter((b) => b.x >= destructionFront);
      creatures = creatures.filter((c) => c.x >= destructionFront);
      flyers = flyers.filter((f) => f.x >= destructionFront);
      const after = groundObstacles.length + bricks.length + creatures.length + flyers.length;
      if (after < before && smashSfxCooldown <= 0) {
        callbacks.onEvent?.("smash");
        smashSfxCooldown = 7;
      }
    }

    for (const o of groundObstacles) {
      const top = groundY - o.height;
      const hit =
        player.x < o.x + o.width &&
        player.x + player.width > o.x &&
        player.y < groundY &&
        player.y + player.height > top;
      if (!hit) continue;
      if (invincibleFrames > 0) continue;
      const previousBottom = previousY + player.height;
      const currentBottom = player.y + player.height;
      const previousX = o.x + o.speed * motionFactor;
      const overlapNow = player.x + player.width > o.x + 2 && player.x < o.x + o.width - 2;
      const overlapBefore =
        player.x + player.width > previousX + 2 && player.x < previousX + o.width - 2;
      const landingFromTop =
        previousBottom <= top + 2 &&
        currentBottom >= top &&
        player.velocityY >= 0 &&
        (overlapNow || overlapBefore);
      const standingOnTopNow = Math.abs(currentBottom - top) < 4.2 && overlapNow;
      // Flowers are always lethal on contact, even when landing on top.
      if (o.kind !== "flower" && (landingFromTop || standingOnTopNow)) {
        player.y = top - player.height;
        player.velocityY = 0;
        continue;
      }
      cameraShakeFrames = 8;
      hitFlashFrames = 8;
      deathFlashFrames = 18;
      gameOver = true;
      callbacks.onEvent?.("hit");
      callbacks.onGameOver();
      break;
    }

    for (const b of bricks) {
      const hit =
        player.x < b.x + b.width &&
        player.x + player.width > b.x &&
        player.y < b.y + b.height &&
        player.y + player.height > b.y;
      if (!hit) continue;

      const previousBottom = previousY + player.height;
      const currentBottom = player.y + player.height;
      const previousBrickX = b.x + b.speed * motionFactor;
      const overlapNow = player.x + player.width > b.x + 2 && player.x < b.x + b.width - 2;
      const overlapBefore = player.x + player.width > previousBrickX + 2 && player.x < previousBrickX + b.width - 2;
      const overlapDuringStep = overlapNow || overlapBefore;
      const landingFromTop = previousBottom <= b.y + 2 && currentBottom >= b.y && player.velocityY >= 0 && overlapDuringStep;
      const standingOnTopNow = Math.abs(currentBottom - b.y) < 4.2 && overlapNow;
      if (landingFromTop || standingOnTopNow) {
        player.y = b.y - player.height;
        player.velocityY = 0;
        continue;
      }
      const blockBottom = b.y + b.height;
      const hitFromBelow =
        player.velocityY < 0 &&
        previousY >= blockBottom - 2 &&
        player.y <= blockBottom + 2 &&
        overlapDuringStep;
      if (hitFromBelow) {
        bricks = bricks.filter((it) => it !== b);
        spawnBrickDebris(b);
        player.y = blockBottom + 0.5;
        player.velocityY = Math.max(1.2, gravity * 2.2);
        stretchFrames = 4;
        hitStopFrames = 7;
        spawnImpactRing(player.x + player.width / 2, blockBottom + 2, "rgba(251,146,60,__ALPHA__)");
        callbacks.onEvent?.("smash");
        if (Math.random() < 0.35) {
          spawnStar(b.x + b.width / 2 - 9, b.y, "invincible", 0.3);
        }
        continue;
      }

      cameraShakeFrames = 8;
      hitFlashFrames = 8;
      deathFlashFrames = 18;
      gameOver = true;
      callbacks.onEvent?.("hit");
      callbacks.onGameOver();
      break;
    }

    for (const c of creatures) {
      const hit =
        player.x < c.x + c.width &&
        player.x + player.width > c.x &&
        player.y < c.y + c.height &&
        player.y + player.height > c.y;
      if (!hit) continue;
      if (invincibleFrames > 0) {
        creatures = creatures.filter((it) => it !== c);
        spawnCreatureDebris(c);
        continue;
      }
      const creatureTop = c.y;
      const previousBottom = previousY + player.height;
      const currentBottom = player.y + player.height;
      const previousCreatureX = c.x + c.speed * motionFactor;
      const overlapNow = player.x + player.width > c.x + 2 && player.x < c.x + c.width - 2;
      const overlapBefore =
        player.x + player.width > previousCreatureX + 2 &&
        player.x < previousCreatureX + c.width - 2;
      const stomp =
        previousBottom <= creatureTop + 3 &&
        currentBottom >= creatureTop &&
        player.velocityY >= 0 &&
        (overlapNow || overlapBefore);
      if (stomp) {
        creatures = creatures.filter((it) => it !== c);
        spawnCreatureDebris(c);
        player.y = creatureTop - player.height;
        player.velocityY = Math.min(player.velocityY, -5.5);
        stretchFrames = 5;
        hitStopFrames = 7;
        spawnImpactRing(c.x + c.width / 2, c.y + c.height / 2, "rgba(239,68,68,__ALPHA__)");
        callbacks.onEvent?.("smash");
        continue;
      }
      cameraShakeFrames = 8;
      hitFlashFrames = 8;
      deathFlashFrames = 18;
      gameOver = true;
      callbacks.onEvent?.("hit");
      callbacks.onGameOver();
      break;
    }

    for (const f of flyers) {
      const y = f.y + Math.sin(frame * 0.38 + f.flap) * 3;
      const hit =
        player.x < f.x + f.width &&
        player.x + player.width > f.x &&
        player.y < y + f.height &&
        player.y + player.height > y;
      if (!hit) continue;

      const flyerBottom = y + f.height;
      const flyerTop = y;
      const prevFlyerX = f.x + f.speed * motionFactor;
      const overlapNow = player.x + player.width > f.x + 2 && player.x < f.x + f.width - 2;
      const overlapBefore = player.x + player.width > prevFlyerX + 2 && player.x < prevFlyerX + f.width - 2;
      const previousBottom = previousY + player.height;
      const currentBottom = player.y + player.height;
      const stomp =
        previousBottom <= flyerTop + 3 &&
        currentBottom >= flyerTop &&
        player.velocityY >= 0 &&
        (overlapNow || overlapBefore);
      if (stomp) {
        flyers = flyers.filter((it) => it !== f);
        spawnFlyerDebris(f, y);
        player.y = flyerTop - player.height;
        player.velocityY = Math.min(player.velocityY, -5.8);
        stretchFrames = 5;
        hitStopFrames = 7;
        spawnImpactRing(f.x + f.width / 2, y + f.height / 2, "rgba(96,165,250,__ALPHA__)");
        callbacks.onEvent?.("smash");
        continue;
      }
      const hitFromBelow =
        player.velocityY < 0 &&
        previousY >= flyerBottom - 2 &&
        player.y <= flyerBottom + 2 &&
        (overlapNow || overlapBefore);

      if (hitFromBelow) {
        flyers = flyers.filter((it) => it !== f);
        spawnFlyerDebris(f, y);
        player.y = flyerBottom + 0.5;
        player.velocityY = Math.max(1.2, gravity * 2.2);
        stretchFrames = 4;
        hitStopFrames = 7;
        spawnImpactRing(player.x + player.width / 2, flyerBottom + 2, "rgba(96,165,250,__ALPHA__)");
        callbacks.onEvent?.("smash");
        if (f.starCarrier && Math.random() < 0.75) {
          spawnStar(f.x + f.width / 2 - 9, y, "superJump", 0.5);
        }
        continue;
      }

      if (invincibleFrames > 0) continue;
      cameraShakeFrames = 8;
      hitFlashFrames = 8;
      deathFlashFrames = 18;
      gameOver = true;
      callbacks.onEvent?.("hit");
      callbacks.onGameOver();
      break;
    }

    if (!gameOver) {
      scoreRemainder += motionFactor;
      const scoreGain = Math.floor(scoreRemainder);
      if (scoreGain > 0) {
        if (scripted) score = Math.floor(frame / 60);
        else score += scoreGain;
        scoreRemainder -= scoreGain;
        callbacks.onScoreChange(score);
      }
    }
  };

  const loop = () => {
    update();
    render();
    rafId = requestAnimationFrame(loop);
  };

  return {
    start() {
      if (rafId) return;
      if (!visualsReady) {
        if (!visualsLoading) {
          visualsLoading = true;
          void preloadCityRunnerExternalAssets(visuals).finally(() => {
            visualsReady = true;
          });
        }
        const loadingLoop = () => {
          frame += 1;
          render();
          if (!visualsReady) {
            rafId = requestAnimationFrame(loadingLoop);
            return;
          }
          loop();
        };
        loadingLoop();
        return;
      }
      loop();
    },
    stop() {
      if (!rafId) return;
      cancelAnimationFrame(rafId);
      rafId = null;
    },
    reset() {
      keys = {};
      jumpPressed = false;
      crouchPressed = false;
      jumpConsumed = false;
      jumpHoldFrames = 0;
      score = 0;
      scoreRemainder = 0;
      frame = 0;
      gameOver = false;
      levelWon = false;
      player.velocityY = 0;
      player.height = player.normalHeight;
      player.y = groundY - player.normalHeight;
      groundObstacles = [];
      bricks = [];
      creatures = [];
      flyers = [];
      stars = [];
      debrisParts = [];
      fxParticles = [];
      impactRings = [];
      invincibleFrames = 0;
      superJumpFrames = 0;
      smashSfxCooldown = 0;
      cameraShakeFrames = 0;
      hitFlashFrames = 0;
      deathFlashFrames = 0;
      hitStopFrames = 0;
      motionVisualStrength = 0.25;
      prevOnGround = true;
      squashFrames = 0;
      stretchFrames = 0;
      nextGroundSpawnIn = 100;
      nextBrickSpawnIn = 150;
      nextCreatureSpawnIn = 210;
      nextFlyingSpawnIn = 185;
      scriptedCursor = 0;
      checkpointCursor = 0;
      callbacks.onScoreChange(0);
      render();
    },
    setKey(key: string, pressed: boolean) {
      keys[key] = pressed;
      if (key === "ArrowUp" || key === "w" || key === "W" || key === " ") jumpPressed = pressed;
      if (key === "ArrowDown" || key === "s" || key === "S") crouchPressed = pressed;
    }
  };
}
