export type GroundObstacle = {
  x: number;
  width: number;
  height: number;
  speed: number;
  kind: "pipe" | "flower";
};

export type BrickObstacle = {
  x: number;
  width: number;
  y: number;
  height: number;
  speed: number;
};

export type Creature = {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  phase: number;
};

export type FlyingObstacle = {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  flap: number;
  lowFlight: boolean;
  starCarrier: boolean;
  kind: "bee" | "fly";
};

export type StarDrop = {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  kind: "invincible" | "superJump";
};

export type Debris = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  color: string;
};

export type FxParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
};

export type ImpactRing = {
  x: number;
  y: number;
  radius: number;
  growth: number;
  life: number;
  maxLife: number;
  color: string;
};
