/**
 * Rasterizes the ball artwork once per device-pixel diameter so drawing stays
 * a cheap `drawImage` per frame. Smoothing is off so pixel art stays crisp.
 */
export class SpriteCache {
  private image: HTMLImageElement
  private sprites = new Map<number, HTMLCanvasElement>()

  private constructor(image: HTMLImageElement) {
    this.image = image
  }

  static async load(url: string): Promise<SpriteCache> {
    const image = new Image()
    image.decoding = 'async'
    image.src = url
    await image.decode()
    return new SpriteCache(image)
  }

  ball(diameterDevicePx: number): HTMLCanvasElement {
    const size = Math.max(1, Math.round(diameterDevicePx))
    let canvas = this.sprites.get(size)
    if (!canvas) {
      canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')!
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(this.image, 0, 0, size, size)
      this.sprites.set(size, canvas)
    }
    return canvas
  }

  clear() {
    this.sprites.clear()
  }
}
