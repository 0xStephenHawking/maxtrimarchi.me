<script lang="ts">
  import type { Attachment } from 'svelte/attachments'
  import ballUrl from '../assets/ball.svg'
  import { Gravity } from './gravity'
  import { Physics, type Rapier } from './physics'
  import { SpriteCache } from './sprite'

  let { rapier }: { rapier: Rapier } = $props()

  const SPAWN_RATE = 3

  const pointer = { active: false, x: 0, y: 0 }
  const gravity = new Gravity()
  let focused = document.hasFocus() && document.visibilityState === 'visible'

  function updateFocus() {
    focused = document.hasFocus() && document.visibilityState === 'visible'
  }

  function track(event: PointerEvent) {
    pointer.x = event.clientX
    pointer.y = event.clientY
  }

  function onpointerdown(event: PointerEvent) {
    if (!event.isPrimary) return
    gravity.enable(true)
    if (event.pointerType === 'mouse') return
    pointer.active = true
    track(event)
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  }

  function onpointermove(event: PointerEvent) {
    if (!event.isPrimary) return
    if (event.pointerType === 'mouse') pointer.active = true
    if (pointer.active) track(event)
  }

  function release(event: PointerEvent) {
    if (event.isPrimary && event.pointerType !== 'mouse') pointer.active = false
  }

  function onpointerleave(event: PointerEvent) {
    if (event.pointerType === 'mouse') pointer.active = false
  }

  const simulation: Attachment<HTMLCanvasElement> = (canvas) => {
    const ctx = canvas.getContext('2d')!
    let width = canvas.clientWidth || window.innerWidth
    let height = canvas.clientHeight || window.innerHeight
    let dpr = window.devicePixelRatio || 1

    const physics = new Physics(rapier, width, height)
    let sprites: SpriteCache | null = null
    let disposed = false
    SpriteCache.load(ballUrl).then((loaded) => {
      if (!disposed) sprites = loaded
    })

    gravity.enable()

    function resize() {
      width = canvas.clientWidth
      height = canvas.clientHeight
      const nextDpr = window.devicePixelRatio || 1
      if (nextDpr !== dpr) {
        dpr = nextDpr
        sprites?.clear()
      }
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      physics.resize(width, height)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    let spawnBudget = 0
    let last = performance.now()
    let frame = requestAnimationFrame(tick)

    function tick(now: number) {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now

      if (gravity.update()) physics.setGravity(gravity.x, gravity.y)

      if (focused && pointer.active && !physics.exploding) {
        spawnBudget += dt * SPAWN_RATE
        while (spawnBudget >= 1) {
          physics.spawn(pointer.x, pointer.y)
          spawnBudget -= 1
        }
      } else {
        spawnBudget = 0
      }

      physics.update(dt)
      if (sprites) draw(sprites)
      frame = requestAnimationFrame(tick)
    }

    function draw(sprites: SpriteCache) {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const s = physics.scale
      const alpha = physics.alpha

      for (const ball of physics.balls) {
        const x = lerp(ball.prevX, ball.x, alpha) * s
        const y = lerp(ball.prevY, ball.y, alpha) * s
        const angle = lerpAngle(ball.prevAngle, ball.angle, alpha)
        drawBall(sprites, x, y, angle, ball.radius * s)
      }

      for (const pop of physics.pops) {
        ctx.globalAlpha = 1 - pop.t
        drawBall(sprites, pop.x * s, pop.y * s, pop.angle, pop.radius * s * (1 + 0.45 * pop.t))
      }

      for (const shard of physics.shards) {
        const size = shard.size * s
        const cos = Math.cos(shard.angle) * dpr
        const sin = Math.sin(shard.angle) * dpr
        ctx.setTransform(cos, sin, -sin, cos, shard.x * s * dpr, shard.y * s * dpr)
        ctx.globalAlpha = Math.min(1, (shard.life / shard.maxLife) * 1.5)
        ctx.fillStyle = shard.dark ? '#16181c' : '#f7f7f5'
        ctx.beginPath()
        ctx.moveTo(size, 0)
        ctx.lineTo(-size * 0.6, size * 0.7)
        ctx.lineTo(-size * 0.4, -size * 0.8)
        ctx.closePath()
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    function drawBall(sprites: SpriteCache, x: number, y: number, angle: number, r: number) {
      const d = r * 2 * dpr
      const cos = Math.cos(angle) * dpr
      const sin = Math.sin(angle) * dpr
      ctx.setTransform(cos, sin, -sin, cos, x * dpr, y * dpr)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(sprites.ball(d), -r, -r, r * 2, r * 2)
    }

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      gravity.dispose()
      physics.dispose()
    }
  }

  function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t
  }

  function lerpAngle(a: number, b: number, t: number) {
    let delta = b - a
    if (delta > Math.PI) delta -= Math.PI * 2
    else if (delta < -Math.PI) delta += Math.PI * 2
    return a + delta * t
  }
</script>

<svelte:window onfocus={updateFocus} onblur={updateFocus} />
<svelte:document onvisibilitychange={updateFocus} />

<canvas
  {@attach simulation}
  {onpointerdown}
  {onpointermove}
  onpointerup={release}
  onpointercancel={release}
  {onpointerleave}
  oncontextmenu={(event) => event.preventDefault()}
  aria-label="Football playground"
></canvas>

<style>
  canvas {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }
</style>
