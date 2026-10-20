import { stepToss } from './delight.mjs'

type Pose = { x: number; y: number; r: number; vx: number; vy: number; vr: number }

const IGNORE = 'a, button, input, textarea, select, label'

function tiltOf(card: HTMLElement) {
  const raw = getComputedStyle(card).getPropertyValue('--tilt').trim()
  const value = Number.parseFloat(raw)
  return Number.isFinite(value) ? value : 0
}

function paint(card: HTMLElement, pose: Pick<Pose, 'x' | 'y' | 'r'>) {
  const tilt = tiltOf(card) + pose.r
  card.style.transform = `translate(${pose.x}px, ${pose.y}px) rotate(${tilt}deg)`
}

export function attachToss(grid: HTMLElement, onMessy: (messy: boolean) => void) {
  const poses = new Map<HTMLElement, Pose>()
  let frame = 0
  let drag: {
    card: HTMLElement
    pointer: number
    x: number
    y: number
    lastX: number
    lastY: number
    moved: boolean
    stamp: number
  } | null = null

  function settle() {
    cancelAnimationFrame(frame)
    const moving = [...poses.values()].some((pose) => Math.abs(pose.vx) > 0.15 || Math.abs(pose.vy) > 0.15)
    if (!moving) return
    const tick = () => {
      let any = false
      for (const [card, pose] of poses) {
        if (Math.abs(pose.vx) < 0.15 && Math.abs(pose.vy) < 0.15 && Math.abs(pose.vr) < 0.1) continue
        const stepped = stepToss(pose)
        poses.set(card, { ...stepped.pose, vx: stepped.settled ? 0 : stepped.pose.vx, vy: stepped.settled ? 0 : stepped.pose.vy, vr: stepped.settled ? 0 : stepped.pose.vr })
        paint(card, stepped.pose)
        if (!stepped.settled) any = true
      }
      if (any) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
  }

  function onDown(event: PointerEvent) {
    if (event.pointerType === 'touch') return
    const target = event.target
    if (!(target instanceof Element)) return
    if (target.closest(IGNORE)) return
    const card = target.closest('.polaroid')
    if (!(card instanceof HTMLElement) || !grid.contains(card)) return
    drag = {
      card,
      pointer: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      moved: false,
      stamp: performance.now(),
    }
    card.setPointerCapture(event.pointerId)
  }

  function onMove(event: PointerEvent) {
    if (!drag || event.pointerId !== drag.pointer) return
    const dx = event.clientX - drag.x
    const dy = event.clientY - drag.y
    if (!drag.moved && Math.hypot(dx, dy) < 8) return
    drag.moved = true
    const pose = poses.get(drag.card) ?? { x: 0, y: 0, r: 0, vx: 0, vy: 0, vr: 0 }
    const next = { ...pose, x: pose.x + (event.clientX - drag.lastX), y: pose.y + (event.clientY - drag.lastY) }
    const dt = Math.max(16, performance.now() - drag.stamp)
    next.vx = ((event.clientX - drag.lastX) / dt) * 16
    next.vy = ((event.clientY - drag.lastY) / dt) * 16
    next.vr = next.vx * 0.08
    poses.set(drag.card, next)
    drag.lastX = event.clientX
    drag.lastY = event.clientY
    drag.stamp = performance.now()
    drag.card.classList.add('is-dragging')
    paint(drag.card, next)
    onMessy(true)
  }

  function onUp(event: PointerEvent) {
    if (!drag || event.pointerId !== drag.pointer) return
    const card = drag.card
    card.classList.remove('is-dragging')
    if (drag.moved) settle()
    drag = null
  }

  grid.addEventListener('pointerdown', onDown)
  grid.addEventListener('pointermove', onMove)
  grid.addEventListener('pointerup', onUp)
  grid.addEventListener('pointercancel', onUp)

  return {
    stop() {
      cancelAnimationFrame(frame)
      grid.removeEventListener('pointerdown', onDown)
      grid.removeEventListener('pointermove', onMove)
      grid.removeEventListener('pointerup', onUp)
      grid.removeEventListener('pointercancel', onUp)
    },
    reset() {
      cancelAnimationFrame(frame)
      for (const card of poses.keys()) {
        card.classList.remove('is-dragging')
        card.classList.add('is-tidy')
        card.style.transform = ''
        window.setTimeout(() => card.classList.remove('is-tidy'), 500)
      }
      poses.clear()
      onMessy(false)
    },
  }
}
