import type { GameEngine } from "../../shared/types/game";
import type { EngineCallbacks } from "../types";

type Obstacle = {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
};

export function createCarRideEngine(canvas: HTMLCanvasElement, callbacks: EngineCallbacks): GameEngine {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context is unavailable");

  const roadLeft = 80;
  const roadRight = canvas.width - 80;
  const player = { x: canvas.width / 2 - 18, y: canvas.height - 110, width: 36, height: 66 };

  let keys: Record<string, boolean> = {};
  let obstacles: Obstacle[] = [];
  let score = 0;
  let frame = 0;
  let gameOver = false;
  let rafId: number | null = null;
  let speed = 4.2;
  let laneStripeOffset = 0;
  let accelPressed = false;

  const spawnObstacle = () => {
    const width = 30 + Math.random() * 22;
    const height = 34 + Math.random() * 30;
    const x = roadLeft + 8 + Math.random() * (roadRight - roadLeft - width - 16);
    obstacles.push({ x, y: -height - 10, width, height, speed: speed + Math.random() * 1.6 });
  };

  const drawCar = () => {
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillStyle = "#93c5fd";
    ctx.fillRect(player.x + 7, player.y + 10, player.width - 14, 16);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(player.x + 3, player.y + 8, 6, 10);
    ctx.fillRect(player.x + player.width - 9, player.y + 8, 6, 10);
    ctx.fillRect(player.x + 3, player.y + player.height - 16, 6, 12);
    ctx.fillRect(player.x + player.width - 9, player.y + player.height - 16, 6, 12);
  };

  const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#111827";
    ctx.fillRect(roadLeft, 0, roadRight - roadLeft, canvas.height);

    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(roadLeft, 0);
    ctx.lineTo(roadLeft, canvas.height);
    ctx.moveTo(roadRight, 0);
    ctx.lineTo(roadRight, canvas.height);
    ctx.stroke();

    ctx.fillStyle = "#f8fafc";
    for (let y = -24 + laneStripeOffset; y < canvas.height; y += 44) {
      ctx.fillRect(canvas.width / 2 - 3, y, 6, 24);
    }

    ctx.fillStyle = "#ef4444";
    obstacles.forEach((obs) => {
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      ctx.fillStyle = "#fecaca";
      ctx.fillRect(obs.x + 6, obs.y + 6, obs.width - 12, 8);
      ctx.fillStyle = "#ef4444";
    });

    drawCar();

    if (gameOver) {
      ctx.fillStyle = "rgba(2, 6, 23, 0.55)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 32px Arial";
      ctx.fillText("Авария!", 186, 240);
    }
  };

  const update = () => {
    if (gameOver) return;
    frame += 1;

    const accelerating = Boolean(keys.ArrowUp || keys.w || keys.W);
    if (accelerating && !accelPressed) {
      callbacks.onEvent?.("jump");
    }
    accelPressed = accelerating;

    if (accelerating) {
      speed = Math.min(8.4, speed + 0.05);
    } else {
      speed = Math.max(4.2, speed - 0.03);
    }

    if (keys.ArrowLeft || keys.a || keys.A) player.x -= 4.7;
    if (keys.ArrowRight || keys.d || keys.D) player.x += 4.7;
    player.x = Math.max(roadLeft + 6, Math.min(roadRight - player.width - 6, player.x));

    laneStripeOffset = (laneStripeOffset + speed) % 44;

    if (frame % Math.max(20, 42 - Math.floor(score / 180)) === 0) {
      spawnObstacle();
    }

    obstacles.forEach((obs) => {
      obs.y += obs.speed;
    });
    obstacles = obstacles.filter((obs) => obs.y < canvas.height + 40);

    for (const obs of obstacles) {
      const hit =
        player.x < obs.x + obs.width &&
        player.x + player.width > obs.x &&
        player.y < obs.y + obs.height &&
        player.y + player.height > obs.y;
      if (hit) {
        gameOver = true;
        callbacks.onEvent?.("hit");
        callbacks.onGameOver();
        break;
      }
    }

    if (!gameOver) {
      score += Math.round(speed * 0.9);
      callbacks.onScoreChange(score);
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
      loop();
    },
    stop() {
      if (!rafId) return;
      cancelAnimationFrame(rafId);
      rafId = null;
    },
    reset() {
      keys = {};
      obstacles = [];
      score = 0;
      frame = 0;
      gameOver = false;
      speed = 4.2;
      laneStripeOffset = 0;
      accelPressed = false;
      player.x = canvas.width / 2 - 18;
      callbacks.onScoreChange(0);
      render();
    },
    setKey(key: string, pressed: boolean) {
      keys[key] = pressed;
    }
  };
}
