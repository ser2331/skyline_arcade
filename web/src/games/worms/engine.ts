import type { GameEngine } from "../../shared/types/game";
import type { EngineCallbacks } from "../types";

type Vec = { x: number; y: number };

export function createWormsEngine(canvas: HTMLCanvasElement, callbacks: EngineCallbacks): GameEngine {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context is unavailable");

  const cell = 12;
  const cols = Math.floor(canvas.width / cell);
  const rows = Math.floor(canvas.height / cell);
  const maxBodyCells = cols * rows - 1;

  let keys: Record<string, boolean> = {};
  let playerHead: Vec = { x: Math.floor(cols / 2), y: Math.floor(rows / 2) };
  let playerBody: Vec[] = [];
  let playerDir: Vec = { x: 1, y: 0 };
  let desiredDir: Vec = { x: 1, y: 0 };
  let playerLength = 9;
  let apples: Vec[] = [];
  let score = 0;
  let tick = 0;
  let gameOver = false;
  let win = false;
  let rafId: number | null = null;

  const randCell = (): Vec => ({
    x: Math.floor(Math.random() * cols),
    y: Math.floor(Math.random() * rows)
  });

  const sameCell = (a: Vec, b: Vec) => a.x === b.x && a.y === b.y;

  const wrap = (v: Vec): Vec => ({
    x: (v.x + cols) % cols,
    y: (v.y + rows) % rows
  });

  const spawnApple = () => {
    for (let i = 0; i < 40; i += 1) {
      const p = randCell();
      if (sameCell(p, playerHead)) continue;
      if (playerBody.some((b) => sameCell(b, p))) continue;
      if (apples.some((f) => sameCell(f, p))) continue;
      apples.push(p);
      return;
    }
  };

  const drawCell = (c: Vec, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(c.x * cell + 1, c.y * cell + 1, cell - 2, cell - 2);
  };

  const drawWorm = (head: Vec, body: Vec[], headColor: string, bodyColor: string) => {
    body.forEach((s) => drawCell(s, bodyColor));
    drawCell(head, headColor);
  };

  const render = () => {
    const dayPhase = Math.floor(score / 400) % 2 === 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = dayPhase ? "#93c5fd" : "#020617";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = dayPhase ? "#7dd3fc" : "#0f172a";
    ctx.lineWidth = 1;
    for (let x = 0; x <= cols; x += 1) {
      ctx.beginPath();
      ctx.moveTo(x * cell, 0);
      ctx.lineTo(x * cell, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= rows; y += 1) {
      ctx.beginPath();
      ctx.moveTo(0, y * cell);
      ctx.lineTo(canvas.width, y * cell);
      ctx.stroke();
    }

    apples.forEach((f) => drawCell(f, "#ef4444"));
    drawWorm(playerHead, playerBody, "#38bdf8", "#0284c7");

    ctx.fillStyle = dayPhase ? "#0f172a" : "#e2e8f0";
    ctx.font = "bold 16px Arial";
    ctx.fillText(`Length: ${playerLength}`, 10, 20);
    const percent = Math.floor((playerLength / maxBodyCells) * 100);
    ctx.fillText(`Goal: fill map (${percent}%)`, 10, 40);
    ctx.fillText(dayPhase ? "Day" : "Night", 10, 60);

    if (gameOver) {
      ctx.fillStyle = "rgba(2, 6, 23, 0.65)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 30px Arial";
      ctx.fillText(win ? "Greatest worm!" : "Worm defeated", 145, 240);
    }
  };

  const update = () => {
    if (gameOver) return;
    tick += 1;

    if (keys.ArrowLeft || keys.a || keys.A) desiredDir = { x: -1, y: 0 };
    if (keys.ArrowRight || keys.d || keys.D) desiredDir = { x: 1, y: 0 };
    if (keys.ArrowUp || keys.w || keys.W) desiredDir = { x: 0, y: -1 };
    if (keys.ArrowDown || keys.s || keys.S) desiredDir = { x: 0, y: 1 };

    if (!(desiredDir.x === -playerDir.x && desiredDir.y === -playerDir.y)) {
      playerDir = desiredDir;
    }

    if (tick % 6 !== 0) return;

    playerBody.unshift({ ...playerHead });
    playerHead = wrap({ x: playerHead.x + playerDir.x, y: playerHead.y + playerDir.y });

    apples = apples.filter((f) => {
      if (!sameCell(f, playerHead)) return true;
      playerLength += 1;
      score += 12;
      callbacks.onEvent?.("collect");
      callbacks.onScoreChange(score);
      return false;
    });
    while (apples.length < 16) spawnApple();

    if (playerBody.some((s) => sameCell(s, playerHead))) {
      gameOver = true;
      callbacks.onEvent?.("hit");
      callbacks.onGameOver();
      return;
    }

    if (playerLength >= maxBodyCells) {
      gameOver = true;
      win = true;
      callbacks.onEvent?.("collect");
      callbacks.onGameOver();
      return;
    }

    while (playerBody.length > playerLength - 1) playerBody.pop();
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
      playerHead = { x: Math.floor(cols / 2), y: Math.floor(rows / 2) };
      playerBody = [];
      playerDir = { x: 1, y: 0 };
      desiredDir = { x: 1, y: 0 };
      playerLength = 9;
      apples = [];
      score = 0;
      tick = 0;
      gameOver = false;
      win = false;
      for (let i = 0; i < 16; i += 1) spawnApple();
      callbacks.onScoreChange(0);
      render();
    },
    setKey(key: string, pressed: boolean) {
      keys[key] = pressed;
    }
  };
}
