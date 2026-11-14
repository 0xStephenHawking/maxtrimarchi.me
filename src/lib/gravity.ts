type PermissionAware = {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

const SMOOTHING = 0.15
/** Below this in-plane tilt the phone is nearly flat; keep the last direction. */
const FLAT_THRESHOLD = 0.08
const MIN_STRENGTH = 0.5

/**
 * Tracks which screen edge points towards the ground, using the device tilt
 * and the current screen orientation. Defaults to screen-down.
 */
export class Gravity {
  x = 0
  y = 1

  private targetX = 0
  private targetY = 1
  private listening = false
  private permissionAsked = false

  /** On iOS the permission prompt only works when called from a user gesture. */
  async enable(fromGesture = false) {
    if (this.listening || typeof DeviceOrientationEvent === 'undefined') return

    const ctor = DeviceOrientationEvent as unknown as PermissionAware
    if (typeof ctor.requestPermission === 'function') {
      if (!fromGesture || this.permissionAsked) return
      this.permissionAsked = true
      try {
        if ((await ctor.requestPermission()) !== 'granted') return
      } catch {
        return
      }
    }

    window.addEventListener('deviceorientation', this.onOrientation)
    this.listening = true
  }

  /** Eases the current vector towards the sensor reading. Returns true if it changed. */
  update(): boolean {
    const dx = this.targetX - this.x
    const dy = this.targetY - this.y
    if (Math.abs(dx) < 1e-4 && Math.abs(dy) < 1e-4) return false
    this.x += dx * SMOOTHING
    this.y += dy * SMOOTHING
    return true
  }

  dispose() {
    window.removeEventListener('deviceorientation', this.onOrientation)
    this.listening = false
  }

  private onOrientation = (event: DeviceOrientationEvent) => {
    if (event.beta == null || event.gamma == null) return

    const beta = (event.beta * Math.PI) / 180
    const gamma = (event.gamma * Math.PI) / 180

    // Direction of the ground in device coordinates (x right, y up), projected on the screen plane.
    const dx = Math.sin(gamma) * Math.cos(beta)
    const dy = -Math.sin(beta)
    const strength = Math.hypot(dx, dy)
    if (strength < FLAT_THRESHOLD) return

    // Natural screen space (y down), then rotate by how the UI is oriented.
    const u = dx / strength
    const v = -dy / strength
    const angle = (screenAngle() * Math.PI) / 180
    const scale = Math.max(strength, MIN_STRENGTH)
    this.targetX = (u * Math.cos(angle) + v * Math.sin(angle)) * scale
    this.targetY = (-u * Math.sin(angle) + v * Math.cos(angle)) * scale
  }
}

function screenAngle(): number {
  if (screen.orientation && typeof screen.orientation.angle === 'number') return screen.orientation.angle
  const legacy = (window as unknown as { orientation?: number }).orientation
  return typeof legacy === 'number' ? legacy : 0
}
