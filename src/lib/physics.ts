import type RAPIER_NS from '@dimforge/rapier2d-compat'

export type Rapier = typeof RAPIER_NS

const STEP = 1 / 60
const MAX_STEPS_PER_FRAME = 5
const GRAVITY = 9.81
const WALL_THICKNESS = 1

/** A real football has a ~0.11 m radius; balls are sized around it. */
const BALL_RADIUS_MIN = 0.085
const BALL_RADIUS_MAX = 0.125
/** 2D density giving a 0.43 kg ball at the reference radius. */
const BALL_DENSITY = 0.43 / (Math.PI * 0.11 * 0.11)

const FILL_RATIO = 0.6
const MAX_BALLS = 800

const POP_DURATION = 0.14
const SHOCKWAVE_DURATION = 0.7
const SHARDS_PER_BALL = 7

export interface Ball {
  body: RAPIER_NS.RigidBody
  radius: number
  x: number
  y: number
  angle: number
  prevX: number
  prevY: number
  prevAngle: number
}

export interface Pop {
  x: number
  y: number
  angle: number
  radius: number
  t: number
}

export interface Shard {
  x: number
  y: number
  vx: number
  vy: number
  angle: number
  spin: number
  size: number
  life: number
  maxLife: number
  dark: boolean
}

interface PendingPop {
  ball: Ball
  delay: number
}

/**
 * Simulation in meters with y pointing down, so screen coordinates map
 * directly through `scale` (pixels per meter).
 */
export class Physics {
  readonly scale: number
  width = 0
  height = 0

  balls: Ball[] = []
  pops: Pop[] = []
  shards: Shard[] = []

  private R: Rapier
  private world: RAPIER_NS.World
  private walls: RAPIER_NS.RigidBody | null = null
  private accumulator = 0
  private filledArea = 0
  private gravityX = 0
  private gravityY = GRAVITY
  private explosion: { elapsed: number; pending: PendingPop[] } | null = null
  private scratch = { x: 0, y: 0 }

  constructor(R: Rapier, widthPx: number, heightPx: number) {
    this.R = R
    this.scale = Math.min(widthPx, heightPx) / 4
    this.world = new R.World({ x: 0, y: GRAVITY })
    this.world.timestep = STEP
    this.resize(widthPx, heightPx)
  }

  get exploding(): boolean {
    return this.explosion !== null
  }

  /** Interpolation factor between the last two physics steps. */
  get alpha(): number {
    return this.accumulator / STEP
  }

  resize(widthPx: number, heightPx: number) {
    this.width = widthPx / this.scale
    this.height = heightPx / this.scale

    if (this.walls) this.world.removeRigidBody(this.walls)
    const { R, width: w, height: h } = this
    const t = WALL_THICKNESS
    this.walls = this.world.createRigidBody(R.RigidBodyDesc.fixed())
    const sides: [number, number, number, number][] = [
      [w / 2, h + t, w / 2 + t, t],
      [w / 2, -t, w / 2 + t, t],
      [-t, h / 2, t, h / 2 + t],
      [w + t, h / 2, t, h / 2 + t],
    ]
    for (const [x, y, hx, hy] of sides) {
      this.world.createCollider(
        R.ColliderDesc.cuboid(hx, hy).setTranslation(x, y).setRestitution(0.4).setFriction(0.7),
        this.walls,
      )
    }

    for (const ball of this.balls) {
      const p = ball.body.translation()
      const x = clamp(p.x, ball.radius, w - ball.radius)
      const y = clamp(p.y, ball.radius, h - ball.radius)
      if (x !== p.x || y !== p.y) ball.body.setTranslation({ x, y }, true)
    }
  }

  /** Direction in screen space; magnitude 1 means full Earth gravity. */
  setGravity(x: number, y: number) {
    this.gravityX = x * GRAVITY
    this.gravityY = y * GRAVITY
    this.world.gravity = { x: this.gravityX, y: this.gravityY }
    for (const ball of this.balls) ball.body.wakeUp()
  }

  /** Spawns a ball at the pointer, pushing aside whatever is already there. */
  spawn(xPx: number, yPx: number) {
    if (this.explosion) return
    const radius = BALL_RADIUS_MIN + Math.random() * (BALL_RADIUS_MAX - BALL_RADIUS_MIN)
    const x = clamp(xPx / this.scale, radius, this.width - radius)
    const y = clamp(yPx / this.scale, radius, this.height - radius)
    this.makeRoom(x, y, radius)
    this.createBall(x, y, radius)
  }

  /** Slides overlapping balls out of the spawn circle and gives them an outward shove. */
  private makeRoom(x: number, y: number, radius: number) {
    const shape = new this.R.Ball(radius)
    const hits: { body: RAPIER_NS.RigidBody; radius: number; x: number; y: number }[] = []
    const point = { x: 0, y: 0 }
    this.world.intersectionsWithShape({ x, y }, 0, shape, (collider) => {
      const body = collider.parent()
      if (!body || !body.isDynamic()) return true
      body.translation(point)
      hits.push({ body, radius: collider.radius(), x: point.x, y: point.y })
      return true
    })

    for (const hit of hits) {
      let dx = hit.x - x
      let dy = hit.y - y
      let dist = Math.hypot(dx, dy)
      if (dist < 1e-4) {
        const g = Math.hypot(this.gravityX, this.gravityY) || 1
        dx = -this.gravityY / g
        dy = this.gravityX / g
        dist = 1
      }
      const nx = dx / dist
      const ny = dy / dist
      const gap = radius + hit.radius - dist
      if (gap <= 0) continue
      const px = hit.x + nx * (gap + 0.004)
      const py = hit.y + ny * (gap + 0.004)
      hit.body.setTranslation({ x: px, y: py }, true)
      const speed = 0.8 + gap * 6
      const v = hit.body.linvel()
      hit.body.setLinvel({ x: v.x + nx * speed, y: v.y + ny * speed }, true)

      const ball = this.balls.find((b) => b.body === hit.body)
      if (ball) {
        ball.x = ball.prevX = px
        ball.y = ball.prevY = py
      }
    }
  }

  private createBall(x: number, y: number, radius: number) {
    const { R } = this
    const rotation = Math.random() * Math.PI * 2
    const body = this.world.createRigidBody(
      R.RigidBodyDesc.dynamic()
        .setTranslation(x, y)
        .setRotation(rotation)
        .setLinvel((Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.2)
        .setAngvel((Math.random() - 0.5) * 6)
        .setLinearDamping(0.05)
        .setAngularDamping(0.25),
    )
    this.world.createCollider(
      R.ColliderDesc.ball(radius).setDensity(BALL_DENSITY).setRestitution(0.6).setFriction(0.5),
      body,
    )
    this.balls.push({ body, radius, x, y, angle: rotation, prevX: x, prevY: y, prevAngle: rotation })
    this.filledArea += Math.PI * radius * radius
  }

  update(dt: number) {
    this.accumulator += Math.min(dt, STEP * MAX_STEPS_PER_FRAME)
    while (this.accumulator >= STEP) {
      this.world.step()
      this.syncBalls()
      this.accumulator -= STEP
    }

    if (!this.explosion && this.isFull()) this.startExplosion()
    if (this.explosion) this.advanceExplosion(dt)
    this.advanceEffects(dt)
  }

  dispose() {
    this.world.free()
    this.balls = []
    this.pops = []
    this.shards = []
  }

  private syncBalls() {
    const p = this.scratch
    for (const ball of this.balls) {
      ball.body.translation(p)
      ball.prevX = ball.x
      ball.prevY = ball.y
      ball.prevAngle = ball.angle
      ball.x = p.x
      ball.y = p.y
      ball.angle = ball.body.rotation()
    }
  }

  private isFull(): boolean {
    return this.balls.length >= MAX_BALLS || this.filledArea >= this.width * this.height * FILL_RATIO
  }

  private startExplosion() {
    let cx = 0
    let cy = 0
    for (const ball of this.balls) {
      cx += ball.x
      cy += ball.y
    }
    cx /= this.balls.length
    cy /= this.balls.length

    let maxDist = 0
    const dists = this.balls.map((ball) => {
      const d = Math.hypot(ball.x - cx, ball.y - cy)
      maxDist = Math.max(maxDist, d)
      return d
    })

    const pending = this.balls.map((ball, i) => {
      const d = dists[i] || 1e-6
      const nx = (ball.x - cx) / d
      const ny = (ball.y - cy) / d
      const speed = 2 + Math.random() * 3
      const mass = ball.body.mass()
      ball.body.applyImpulse({ x: nx * speed * mass, y: (ny * speed - 1.5) * mass }, true)
      ball.body.applyTorqueImpulse((Math.random() - 0.5) * mass * 0.05, true)
      return { ball, delay: (dists[i] / (maxDist || 1)) * SHOCKWAVE_DURATION * 0.8 + Math.random() * 0.1 }
    })
    pending.sort((a, b) => a.delay - b.delay)
    this.explosion = { elapsed: 0, pending }
  }

  private advanceExplosion(dt: number) {
    const explosion = this.explosion!
    explosion.elapsed += dt

    let popped = 0
    while (popped < explosion.pending.length && explosion.pending[popped].delay <= explosion.elapsed) {
      this.popBall(explosion.pending[popped].ball)
      popped++
    }
    if (popped) {
      explosion.pending.splice(0, popped)
      const remaining = new Set(explosion.pending.map((p) => p.ball))
      this.balls = this.balls.filter((b) => remaining.has(b))
    }

    if (!explosion.pending.length) {
      this.explosion = null
      this.balls = []
      this.filledArea = 0
    }
  }

  private popBall(ball: Ball) {
    const v = ball.body.linvel()
    this.world.removeRigidBody(ball.body)
    this.pops.push({ x: ball.x, y: ball.y, angle: ball.angle, radius: ball.radius, t: 0 })

    for (let i = 0; i < SHARDS_PER_BALL; i++) {
      const a = (i / SHARDS_PER_BALL) * Math.PI * 2 + Math.random() * 0.6
      const speed = 2 + Math.random() * 3.5
      const maxLife = 0.5 + Math.random() * 0.45
      this.shards.push({
        x: ball.x + Math.cos(a) * ball.radius * 0.5,
        y: ball.y + Math.sin(a) * ball.radius * 0.5,
        vx: v.x * 0.5 + Math.cos(a) * speed,
        vy: v.y * 0.5 + Math.sin(a) * speed,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 20,
        size: ball.radius * (0.25 + Math.random() * 0.2),
        life: maxLife,
        maxLife,
        dark: i % 3 === 0,
      })
    }
  }

  private advanceEffects(dt: number) {
    for (const pop of this.pops) pop.t += dt / POP_DURATION
    this.pops = this.pops.filter((p) => p.t < 1)

    const drag = Math.exp(-1.5 * dt)
    for (const s of this.shards) {
      s.vx = (s.vx + this.gravityX * dt) * drag
      s.vy = (s.vy + this.gravityY * dt) * drag
      s.x += s.vx * dt
      s.y += s.vy * dt
      s.angle += s.spin * dt
      s.life -= dt
    }
    this.shards = this.shards.filter((s) => s.life > 0)
  }
}

export async function loadRapier(): Promise<Rapier> {
  if (typeof WebAssembly !== 'object' || typeof WebAssembly.instantiate !== 'function') {
    throw new Error('WebAssembly is not available')
  }
  const { default: R } = await import('@dimforge/rapier2d-compat')
  await R.init()
  return R
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max)
}
