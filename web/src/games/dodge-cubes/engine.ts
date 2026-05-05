import type { GameEngine } from "../../shared/types/game";
import type { EngineCallbacks } from "../types";

export function createDodgeCubesEngine(canvas: HTMLCanvasElement, callbacks: EngineCallbacks): GameEngine {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context is unavailable");

  const player = { x: 230, y: 230, size: 22, speed: 4 };
  let keys: Record<string, boolean> = {};
  let obstacles: Array<{ x: number; y: number; size: number; vx: number; vy: number }> = [];
  let score = 0;
  let frame = 0;
  let gameOver = false;
  let rafId: number | null = null;

  const spawnObstacle = () => {
    const edge = Math.floor(Math.random() * 4);
    const size = 16 + Math.random() * 18;
    const speed = 1.4 + Math.random() * 1.6 + Math.min(score / 200, 2);
    let x = 0;
    let y = 0;
    let vx = 0;
    let vy = 0;

    if (edge === 0) {
      x = Math.random() * canvas.width;
      y = -size;
      vx = (Math.random() - 0.5) * 1.2;
      vy = speed;
    } else if (edge === 1) {
      x = canvas.width + size;
      y = Math.random() * canvas.height;
      vx = -speed;
      vy = (Math.random() - 0.5) * 1.2;
    } else if (edge === 2) {
      x = Math.random() * canvas.width;
      y = canvas.height + size;
      vx = (Math.random() - 0.5) * 1.2;
      vy = -speed;
    } else {
      x = -size;
      y = Math.random() * canvas.height;
      vx = speed;
      vy = (Math.random() - 0.5) * 1.2;
    }
    obstacles.push({ x, y, size, vx, vy });
  };

  const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(player.x, player.y, player.size, player.size);
    ctx.fillStyle = "#ef4444";
    obstacles.forEach((o) => ctx.fillRect(o.x, o.y, o.size, o.size));
    if (gameOver) {
      ctx.fillStyle = "rgba(2, 6, 23, 0.6)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 34px Arial";
      ctx.fillText("Game Over", 155, 230);
    }
  };

  const update = () => {
    if (gameOver) return;
    frame += 1;
    if (frame % 22 === 0) spawnObstacle();
    if (keys.ArrowLeft || keys.a) player.x -= player.speed;
    if (keys.ArrowRight || keys.d) player.x += player.speed;
    if (keys.ArrowUp || keys.w) player.y -= player.speed;
    if (keys.ArrowDown || keys.s) player.y += player.speed;
    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));
    obstacles.forEach((o) => {
      o.x += o.vx;
      o.y += o.vy;
    });
    obstacles = obstacles.filter(
      (o) => o.x > -40 && o.x < canvas.width + 40 && o.y > -40 && o.y < canvas.height + 40
    );
    for (const o of obstacles) {
      const hit =
        player.x < o.x + o.size &&
        player.x + player.size > o.x &&
        player.y < o.y + o.size &&
        player.y + player.size > o.y;
      if (hit) {
        gameOver = true;
        callbacks.onEvent?.("hit");
        callbacks.onGameOver();
        break;
      }
    }
    if (!gameOver) {
      score += 1;
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
      player.x = 230;
      player.y = 230;
      obstacles = [];
      score = 0;
      frame = 0;
      gameOver = false;
      keys = {};
      callbacks.onScoreChange(0);
      render();
    },
    setKey(key: string, pressed: boolean) {
      keys[key] = pressed;
    }
  };
}
