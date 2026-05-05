import type {
  BrickObstacle,
  Creature,
  Debris,
  FlyingObstacle,
  FxParticle,
  GroundObstacle,
  ImpactRing,
  StarDrop
} from "./types";
import type { CityRunnerVisuals, RunnerPose, SpriteAnimator, SpriteStrip } from "./visuals";

const drawSprite = (
  ctx: CanvasRenderingContext2D,
  strip: SpriteStrip,
  frameIndex: number,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  const sx = frameIndex * strip.frameWidth;
  ctx.drawImage(strip.image, sx, 0, strip.frameWidth, strip.frameHeight, x, y, width, height);
};

const drawShadow = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  alpha: number
) => {
  const w = Math.max(10, width * 0.5);
  const h = 6;
  ctx.fillStyle = `rgba(15, 23, 42, ${alpha * 0.48})`;
  ctx.beginPath();
  ctx.ellipse(x + width / 2, y, w, h, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(15, 23, 42, ${alpha * 0.28})`;
  ctx.beginPath();
  ctx.ellipse(x + width / 2, y, w * 1.28, h * 1.35, 0, 0, Math.PI * 2);
  ctx.fill();
};

export function drawRunner(
  ctx: CanvasRenderingContext2D,
  player: { x: number; y: number; width: number; height: number; normalHeight: number },
  frame: number,
  gameOver: boolean,
  isOnGround: boolean,
  isStandingOnPlatform: boolean,
  lightPhase: boolean,
  visuals: CityRunnerVisuals,
  runAnimator: SpriteAnimator,
  jumpAnimator: SpriteAnimator,
  crouchAnimator: SpriteAnimator,
  scaleX: number,
  scaleY: number
) {
  const runnerColor = lightPhase ? "#0f172a" : "#f8fafc";
  const cx = player.x + player.width / 2;
  const top = player.y;
  const crouching = player.height < player.normalHeight - 1;
  const airborne = !isOnGround && !isStandingOnPlatform;
  const pose: RunnerPose = crouching ? "crouch" : airborne ? "jump" : "run";
  const strip =
    pose === "crouch"
      ? lightPhase
        ? visuals.runnerLightCrouch
        : visuals.runnerDarkCrouch
      : pose === "jump"
        ? lightPhase
          ? visuals.runnerLightJump
          : visuals.runnerDarkJump
        : lightPhase
          ? visuals.runnerLightRun
          : visuals.runnerDarkRun;
  const frameIndex =
    pose === "crouch" ? crouchAnimator.frameAt(frame) : pose === "jump" ? jumpAnimator.frameAt(frame) : runAnimator.frameAt(frame);
  const bob = airborne ? -1.5 : Math.sin(frame * 0.28) * 1.1;
  const drawW = (player.width + 8) * scaleX;
  const drawH = (player.height + 3) * scaleY;
  const lifeBob = Math.sin(frame * 0.12) * (pose === "crouch" ? 0.35 : 0.85);
  const drawX = player.x - 2 - (drawW - (player.width + 8)) / 2;
  const drawY = top - 2 + bob + lifeBob - (drawH - (player.height + 3)) / 2;
  const extPoseStrip = gameOver
    ? visuals.external.runnerDeath
    : pose === "run"
      ? visuals.external.runnerRun
      : pose === "jump"
        ? visuals.external.runnerJump
        : visuals.external.runnerCrouch;

  if (gameOver) {
    if (extPoseStrip || visuals.external.runnerStrip || visuals.external.runner) {
      const deathTilt = -0.62;
      const centerX = drawX + drawW * 0.52;
      const centerY = drawY + drawH * 0.62;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(deathTilt);
      ctx.translate(-centerX, -centerY);

      if (extPoseStrip) {
        drawSprite(ctx, extPoseStrip, 0, drawX - 1, drawY - 1, drawW + 2, drawH + 2);
      } else if (visuals.external.runnerStrip) {
        drawSprite(ctx, visuals.external.runnerStrip, 0, drawX - 1, drawY - 1, drawW + 2, drawH + 2);
      } else if (visuals.external.runner) {
        ctx.drawImage(visuals.external.runner, drawX - 1, drawY - 1, drawW + 2, drawH + 2);
      }

      // red X eyes overlay for death readability
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(centerX - 8, drawY + 11);
      ctx.lineTo(centerX - 4.6, drawY + 14.4);
      ctx.moveTo(centerX - 4.6, drawY + 11);
      ctx.lineTo(centerX - 8, drawY + 14.4);
      ctx.moveTo(centerX + 4.6, drawY + 11);
      ctx.lineTo(centerX + 8, drawY + 14.4);
      ctx.moveTo(centerX + 8, drawY + 11);
      ctx.lineTo(centerX + 4.6, drawY + 14.4);
      ctx.stroke();
      ctx.restore();
      return;
    }
    ctx.strokeStyle = runnerColor;
    ctx.fillStyle = runnerColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, top + 7, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx, top + 16);
    ctx.lineTo(cx, top + 33);
    ctx.moveTo(cx, top + 23);
    ctx.lineTo(cx - 12, top + 29);
    ctx.moveTo(cx, top + 23);
    ctx.lineTo(cx + 12, top + 29);
    ctx.moveTo(cx, top + 33);
    ctx.lineTo(cx - 10, top + player.height - 1);
    ctx.moveTo(cx, top + 33);
    ctx.lineTo(cx + 10, top + player.height - 1);
    ctx.stroke();
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(cx - 7, top + 4.6);
    ctx.lineTo(cx - 4.6, top + 7);
    ctx.moveTo(cx - 4.6, top + 4.6);
    ctx.lineTo(cx - 7, top + 7);
    ctx.moveTo(cx + 4.6, top + 4.6);
    ctx.lineTo(cx + 7, top + 7);
    ctx.moveTo(cx + 7, top + 4.6);
    ctx.lineTo(cx + 4.6, top + 7);
    ctx.stroke();
    return;
  }
  const groundY = player.y + player.height + 2;
  drawShadow(ctx, player.x - 2, groundY, player.width + 8, airborne ? 0.12 : 0.2);

  if (extPoseStrip) {
    const extFrame = frameIndex % extPoseStrip.frames;
    const rotation =
      pose === "run"
        ? Math.sin(frame * 0.22) * 0.05
        : pose === "jump"
          ? -0.08
          : pose === "crouch"
            ? -0.14
            : 0;
    const crouchForward = pose === "crouch" ? 3.2 : 0;
    ctx.save();
    ctx.translate(drawX + drawW * 0.5, drawY + drawH * 0.58);
    ctx.rotate(rotation);
    ctx.translate(-(drawX + drawW * 0.5), -(drawY + drawH * 0.58));
    drawSprite(ctx, extPoseStrip, extFrame, drawX - 1 + crouchForward, drawY - 1, drawW + 2, drawH + 2);
    ctx.restore();
  } else if (visuals.external.runnerStrip) {
    const extFrame = frameIndex % visuals.external.runnerStrip.frames;
    const rotation = Math.sin(frame * 0.2) * 0.045;
    ctx.save();
    ctx.translate(drawX + drawW * 0.52, drawY + drawH * 0.58);
    ctx.rotate(rotation);
    ctx.translate(-(drawX + drawW * 0.52), -(drawY + drawH * 0.58));
    drawSprite(ctx, visuals.external.runnerStrip, extFrame, drawX - 1, drawY - 1, drawW + 2, drawH + 2);
    ctx.restore();
  } else if (visuals.external.runner) {
    const runLift = Math.sin(frame * 0.45) * (pose === "run" ? 1.5 : 0.6);
    const runNudge = Math.sin(frame * 0.45) * (pose === "run" ? 1.2 : 0.35);
    const rotation = pose === "crouch" ? -0.12 : pose === "jump" ? -0.08 : Math.sin(frame * 0.24) * 0.05;
    ctx.save();
    ctx.translate(drawX + drawW * 0.52, drawY + drawH * 0.58);
    ctx.rotate(rotation);
    ctx.translate(-(drawX + drawW * 0.52), -(drawY + drawH * 0.58));
    ctx.drawImage(visuals.external.runner, drawX - 1 + runNudge, drawY - 1 - runLift, drawW + 2, drawH + 2);
    ctx.restore();
  } else {
    drawSprite(ctx, strip, frameIndex, drawX, drawY, drawW, drawH);
  }
}

export function drawGroundObstacle(
  ctx: CanvasRenderingContext2D,
  groundY: number,
  obstacle: GroundObstacle,
  lightPhase: boolean
) {
  const top = groundY - obstacle.height;
  if (obstacle.kind === "pipe") {
    drawShadow(ctx, obstacle.x, groundY + 2, obstacle.width, 0.2);
    ctx.fillStyle = "#15803d";
    ctx.fillRect(obstacle.x, top, obstacle.width, obstacle.height);
    ctx.fillStyle = "#166534";
    ctx.fillRect(obstacle.x - 4, top - 8, obstacle.width + 8, 10);
    return;
  }
  drawShadow(ctx, obstacle.x, groundY + 2, obstacle.width, 0.16);
  const stemW = Math.max(10, obstacle.width * 0.38);
  ctx.fillStyle = "#16a34a";
  ctx.fillRect(obstacle.x + obstacle.width / 2 - stemW / 2, top + 12, stemW, obstacle.height - 12);
  ctx.fillStyle = lightPhase ? "#60a5fa" : "#f8fafc";
  ctx.beginPath();
  ctx.arc(obstacle.x + obstacle.width / 2, top + 8, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#facc15";
  ctx.beginPath();
  ctx.arc(obstacle.x + obstacle.width / 2, top + 8, 6.5, 0, Math.PI * 2);
  ctx.fill();
}

export function drawBrick(ctx: CanvasRenderingContext2D, brick: BrickObstacle) {
  drawShadow(ctx, brick.x, brick.y + brick.height + 2, brick.width, 0.14);
  ctx.fillStyle = "#b45309";
  ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
  ctx.strokeStyle = "#7c2d12";
  ctx.lineWidth = 2;
  ctx.strokeRect(brick.x + 1, brick.y + 1, brick.width - 2, brick.height - 2);
  ctx.beginPath();
  ctx.moveTo(brick.x, brick.y + brick.height / 2);
  ctx.lineTo(brick.x + brick.width, brick.y + brick.height / 2);
  ctx.moveTo(brick.x + brick.width / 3, brick.y);
  ctx.lineTo(brick.x + brick.width / 3, brick.y + brick.height / 2);
  ctx.moveTo(brick.x + (2 * brick.width) / 3, brick.y + brick.height / 2);
  ctx.lineTo(brick.x + (2 * brick.width) / 3, brick.y + brick.height);
  ctx.stroke();
  ctx.fillStyle = "rgba(254, 215, 170, 0.24)";
  ctx.fillRect(brick.x + 2, brick.y + 2, brick.width - 4, 3);
}

export function drawCreature(ctx: CanvasRenderingContext2D, creature: Creature, frame: number) {
  const bodyY = creature.y + Math.sin(frame * 0.24 + creature.phase) * 1.3;
  const cx = creature.x + creature.width / 2;
  const cy = bodyY + creature.height / 2;
  drawShadow(ctx, creature.x, creature.y + creature.height + 2, creature.width, 0.17);
  ctx.fillStyle = "#c08457";
  ctx.beginPath();
  ctx.ellipse(cx, cy, creature.width / 2, creature.height / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#8b5a3c";
  ctx.beginPath();
  ctx.ellipse(cx - 3, cy - 2, creature.width * 0.36, creature.height * 0.31, -0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(creature.x + 9, bodyY + 8, 5, 3);
  ctx.fillRect(creature.x + 20, bodyY + 8, 5, 3);
  ctx.fillStyle = "#1f2937";
  ctx.fillRect(creature.x + 10, bodyY + 8, 2, 3);
  ctx.fillRect(creature.x + 22, bodyY + 8, 2, 3);
  ctx.strokeStyle = "#3f2a1d";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(creature.x + 8, bodyY + 8);
  ctx.lineTo(creature.x + 14, bodyY + 5);
  ctx.moveTo(creature.x + 20, bodyY + 5);
  ctx.lineTo(creature.x + 26, bodyY + 8);
  ctx.moveTo(creature.x + 11, bodyY + 17);
  ctx.lineTo(creature.x + 23, bodyY + 17);
  ctx.stroke();
}

export function drawFlyer(
  ctx: CanvasRenderingContext2D,
  flyer: FlyingObstacle,
  frame: number,
  visuals: CityRunnerVisuals,
  beeAnimator: SpriteAnimator,
  flyAnimator: SpriteAnimator
) {
  const y = flyer.y + Math.sin(frame * 0.38 + flyer.flap) * 3;
  const isBee = flyer.kind === "bee";
  const strip = isBee ? visuals.bee : visuals.fly;
  const anim = isBee ? beeAnimator : flyAnimator;
  const frameIndex = anim.frameAt(frame);
  drawShadow(ctx, flyer.x, y + flyer.height + 4, flyer.width, 0.12);
  drawSprite(ctx, strip, frameIndex, flyer.x, y - 2, flyer.width, flyer.height + 3);
  if (flyer.starCarrier) {
    ctx.fillStyle = "#fff7ed";
    ctx.font = "bold 14px Arial";
    ctx.fillText("*", flyer.x + flyer.width / 2 - 4, y + flyer.height - 2);
  }

  const ext = isBee ? visuals.external.bee : visuals.external.fly;
  if (ext) {
    ctx.globalAlpha = 0.35;
    ctx.drawImage(ext, flyer.x - 1, y - 6, flyer.width + 2, flyer.height + 8);
    ctx.globalAlpha = 1;
  }
}

export function drawStar(ctx: CanvasRenderingContext2D, star: StarDrop) {
  const cx = star.x + star.size / 2;
  const cy = star.y + star.size / 2;
  const outer = star.size / 2;
  const inner = outer * 0.45;
  const glow = star.kind === "invincible" ? "rgba(250, 204, 21, 0.32)" : "rgba(96, 165, 250, 0.32)";
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, outer + 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const radius = i % 2 === 0 ? outer : inner;
    const px = cx + Math.cos(angle) * radius;
    const py = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = star.kind === "invincible" ? "#facc15" : "#60a5fa";
  ctx.fill();
  ctx.strokeStyle = star.kind === "invincible" ? "#a16207" : "#1d4ed8";
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function drawDebris(ctx: CanvasRenderingContext2D, debris: Debris) {
  ctx.fillStyle = debris.color;
  ctx.fillRect(debris.x, debris.y, debris.size, debris.size);
}

export function drawFxParticle(ctx: CanvasRenderingContext2D, p: FxParticle) {
  const alpha = Math.max(0, p.life / p.maxLife);
  ctx.fillStyle = p.color.replace("__ALPHA__", alpha.toFixed(3));
  ctx.fillRect(p.x, p.y, p.size, p.size);
}

export function drawImpactRing(ctx: CanvasRenderingContext2D, ring: ImpactRing) {
  const alpha = Math.max(0, ring.life / ring.maxLife);
  ctx.strokeStyle = ring.color.replace("__ALPHA__", alpha.toFixed(3));
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawSpeedLines(
  ctx: CanvasRenderingContext2D,
  frame: number,
  width: number,
  height: number,
  strength: number
) {
  if (strength <= 0.01) return;
  const lines = 14;
  ctx.strokeStyle = `rgba(148,163,184,${Math.min(0.38, 0.12 + strength * 0.22)})`;
  ctx.lineWidth = 1.6;
  for (let i = 0; i < lines; i += 1) {
    const y = 30 + ((i * 34 + frame * 3.2) % (height - 80));
    const len = 16 + ((i * 7) % 22) + strength * 22;
    const x = width - ((frame * (6 + strength * 8) + i * 43) % (width + 100));
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y);
    ctx.stroke();
  }
}
