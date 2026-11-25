import type { Audio } from '../engine/audio'
import type { I18n } from '../engine/i18n'
import type { Input } from '../engine/input'
import { type Quality, type SaveData, type SaveStore } from '../engine/save'
import type { Caption } from '../game/game'
import { LANDMARKS, PROFILE, landmark, type Landmark, type LandmarkId } from '../game/portfolio'
import { personalize, type Line, type Target } from '../game/story'

export type Screen = 'boot' | 'title' | 'hud' | 'pause' | 'settings'
export type UiActions = {
  play: () => void
  resume: () => void
  quit: () => void
  settings: (patch: Partial<SaveData>) => void
  /** The portfolio panel closed (gesture = closed by the visitor, so the pointer may relock). */
  panelClosed: (gesture: boolean) => void
  retry: () => void
}
/** One compass pip: bearing from the view (radians, 0 = ahead, + = right). */
export type CompassPip = { id: LandmarkId; angle: number; dist: number; done: boolean }
type ToggleKey = 'muted' | 'invertY' | 'reducedMotion'

const LINKEDIN_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.2 8h4.6v14H.2V8zm7.5 0h4.4v1.9h.06c.62-1.15 2.12-2.37 4.37-2.37 4.67 0 5.53 3.07 5.53 7.07V22h-4.6v-6.5c0-1.55-.03-3.55-2.17-3.55-2.17 0-2.5 1.7-2.5 3.44V22H7.7V8z"/></svg>'

/**
 * DOM overlay for the scene. Screens are <section data-screen> blocks toggled with `is-active`;
 * every fixed string goes through i18n (`data-i18n`); portfolio content comes from portfolio.ts.
 * The HUD carries the chapter tracker, the compass, the LinkedIn button and the detail panel.
 */
export class Ui {
  screen: Screen = 'boot'
  private readonly root: HTMLElement
  private stack: Screen[] = []
  private lastMethod = ''
  private navRepeat = 0
  private hintTimer = 0
  private captionTimer = 0
  private talk: { lines: Line[]; i: number; shown: number; done: () => void } | null = null
  private focusKey = ''
  private panelId: LandmarkId | null = null
  private compassKey = ''

  constructor(
    private readonly i18n: I18n,
    private readonly save: SaveStore,
    private readonly audio: Audio,
    private readonly input: Input,
    private readonly actions: UiActions,
  ) {
    this.root = document.getElementById('ui')!
    this.root.innerHTML = this.template()
    this.root.addEventListener('click', e => this.onClick(e))
    this.root.addEventListener('input', e => this.onInput(e))
    window.addEventListener('keydown', e => this.onKey(e))
    this.refreshSettings()
  }

  // ─── screens ────────────────────────────────────────────────────────────
  show(screen: Screen): void {
    this.stack = []
    this.activate(screen)
  }
  push(screen: Screen): void {
    this.stack.push(this.screen)
    this.activate(screen)
  }
  back(): void {
    const prev = this.stack.pop()
    if (prev) this.activate(prev)
    else if (this.screen === 'pause') this.actions.resume()
  }
  private activate(screen: Screen): void {
    this.screen = screen
    for (const el of this.qa('[data-screen]')) {
      const active = el.dataset.screen === screen
      el.classList.toggle('is-active', active)
      el.toggleAttribute('inert', !active)
    }
    document.body.dataset.screen = screen
    if (screen === 'settings') this.refreshSettings()
    if (screen === 'hud') this.showHint()
    requestAnimationFrame(() => {
      const first = this.navItems()[0]
      if (first && screen !== 'hud' && this.input.method !== 'touch') first.focus({ preventScroll: true })
      else (document.activeElement as HTMLElement | null)?.blur?.()
    })
  }

  // ─── boot ───────────────────────────────────────────────────────────────
  setBootProgress(progress: number): void {
    const p = Math.max(0, Math.min(1, progress))
    this.q('.boot-bar i').style.transform = `scaleX(${Math.max(0.02, p)})`
    this.q('.boot-pct').textContent = `${Math.round(p * 100)}%`
  }
  bootFailed(message: string): void {
    const el = this.q('.screen-boot')
    el.classList.add('is-failed')
    this.q('.boot-label').textContent = this.i18n.t('boot.failed')
    this.q('.boot-error').textContent = message
  }

  // ─── HUD: control hints and discovery captions ──────────────────────────
  private showHint(): void {
    this.hintTimer = 10
    this.renderHint()
    this.q('.hint').classList.add('is-active')
  }
  caption(caption: Caption): void {
    this.note(this.i18n.t(`caption.${caption}`))
  }
  /** A quiet line of text under the reticle for a few seconds. */
  note(text: string): void {
    const el = this.q('.caption')
    el.querySelector('span')!.textContent = text
    el.classList.remove('is-active')
    void el.offsetWidth
    el.classList.add('is-active')
    this.captionTimer = 6.5
  }

  // ─── talks and the interaction prompt ───────────────────────────────────
  get talking(): boolean {
    return this.talk !== null
  }
  /** Show "E  Talk to the fox" / "E  Open the project laptop" for whatever is in focus. */
  setFocus(target: Target | LandmarkId | null): void {
    const key = target ? `${target}:${this.input.method}` : ''
    if (key === this.focusKey) return
    this.focusKey = key
    document.body.toggleAttribute('data-focus', !!target)
    const el = this.q('.prompt')
    if (!target) {
      el.classList.remove('is-active')
      return
    }
    const l = LANDMARKS.find(x => x.id === target)
    el.querySelector('kbd')!.textContent = this.input.method === 'gamepad' ? 'Y' : 'E'
    el.querySelector('span')!.textContent = l ? l.verb : this.i18n.t(`prompt.${target}`)
    el.style.setProperty('--accent', l ? l.color : 'var(--ribbon)')
    el.classList.add('is-active')
  }
  playerName(): string {
    return this.save.data.name || this.i18n.t('name.default')
  }
  private setOff(): void {
    this.actions.play()
  }
  openTalk(lines: Line[], done: () => void): void {
    if (!lines.length) return done()
    const name = this.playerName()
    this.talk = { lines: lines.map(([who, text]): Line => [who, personalize(text, name)]), i: 0, shown: 0, done }
    document.body.toggleAttribute('data-talking', true)
    this.q('.talk').classList.add('is-active')
    this.renderLine()
  }
  advanceTalk(): void {
    const t = this.talk
    if (!t) return
    const len = t.lines[t.i][1].length
    if (t.shown < len) {
      t.shown = len
      this.renderLine()
      return
    }
    t.i += 1
    if (t.i >= t.lines.length) return this.closeTalk()
    t.shown = 0
    this.audio.play('talk')
    this.renderLine()
  }
  closeTalk(): void {
    const t = this.talk
    if (!t) return
    this.talk = null
    document.body.toggleAttribute('data-talking', false)
    this.q('.talk').classList.remove('is-active')
    t.done()
  }
  private renderLine(): void {
    const t = this.talk!
    const [who, text] = t.lines[t.i]
    const el = this.q('.talk')
    el.classList.toggle('is-narration', who === '')
    el.querySelector('.talk-name')!.textContent = who === 'you' ? this.playerName() : who ? this.i18n.t(`speaker.${who}`) : ''
    el.querySelector('.talk-text')!.textContent = text.slice(0, Math.floor(t.shown))
    el.classList.toggle('is-done', t.shown >= text.length)
  }

  // ─── chapters, compass and the portfolio panel ──────────────────────────
  setChapters(opened: readonly string[]): void {
    for (const el of this.qa('[data-chapter]')) el.classList.toggle('is-lit', opened.includes(el.dataset.chapter!))
    const n = LANDMARKS.filter(l => opened.includes(l.id)).length
    this.q('.chapters-count').textContent = this.i18n.t('chapters.count', { n, total: LANDMARKS.length })
  }
  /** Pips within ±100° of the view; the nearest unread chapter ahead gets its name shown. */
  setCompass(pips: CompassPip[] | null): void {
    const el = this.q('.compass')
    el.classList.toggle('is-active', !!pips)
    if (!pips) return
    const half = (100 * Math.PI) / 180
    let label = ''
    let best = Infinity
    for (const p of pips) {
      const dot = this.q(`[data-pip="${p.id}"]`)
      const visible = Math.abs(p.angle) < half
      dot.hidden = !visible
      if (!visible) continue
      dot.style.left = `${50 + (p.angle / half) * 50}%`
      dot.classList.toggle('is-done', p.done)
      if (!p.done && Math.abs(p.angle) < 0.35 && p.dist < best) {
        best = p.dist
        label = `${landmark(p.id).label} · ${Math.round(p.dist)} m`
      }
    }
    if (label !== this.compassKey) {
      this.compassKey = label
      this.q('.compass-label').textContent = label
    }
  }
  get panelOpen(): boolean {
    return this.panelId !== null
  }
  openPanel(id: LandmarkId): void {
    const l = landmark(id)
    this.panelId = id
    const el = this.q('.panel')
    el.style.setProperty('--accent', l.color)
    el.querySelector('.panel-body')!.innerHTML = renderPanel(l)
    el.classList.add('is-active')
    el.removeAttribute('inert')
    document.body.toggleAttribute('data-panel', true)
    const scroller = el.querySelector<HTMLElement>('.panel-scroll')!
    scroller.scrollTop = 0
    requestAnimationFrame(() => scroller.focus({ preventScroll: true }))
  }
  closePanel(gesture = true): void {
    if (!this.panelId) return
    this.panelId = null
    const el = this.q('.panel')
    el.classList.remove('is-active')
    el.setAttribute('inert', '')
    document.body.toggleAttribute('data-panel', false)
    ;(document.activeElement as HTMLElement | null)?.blur?.()
    this.actions.panelClosed(gesture)
  }
  /** Gamepad/keys scroll the panel. */
  scrollPanel(dy: number): void {
    const s = this.root.querySelector<HTMLElement>('.panel-scroll')
    if (s) s.scrollTop += dy
  }

  private renderHint(): void {
    const m = this.input.method === 'gamepad' ? 'gamepad' : this.input.method === 'touch' ? 'touch' : 'keyboard'
    const parts = m === 'touch' ? ['move', 'look', 'interact'] : m === 'gamepad' ? ['move', 'look', 'sprint', 'jump', 'interact', 'pause'] : ['move', 'look', 'sprint', 'jump', 'interact', 'linkedin', 'pause']
    this.q('.hint').innerHTML = parts.map(k => `<span>${escapeHtml(this.i18n.t(`hint.${k}.${m}`))}</span>`).join('')
  }

  // ─── settings ───────────────────────────────────────────────────────────
  refreshSettings(): void {
    const d = this.save.data
    this.q<HTMLInputElement>('[name="musicVolume"]').value = String(d.musicVolume)
    this.q<HTMLInputElement>('[name="sfxVolume"]').value = String(d.sfxVolume)
    this.q<HTMLInputElement>('[name="sensitivity"]').value = String(d.sensitivity)
    for (const t of this.qa<HTMLButtonElement>('.toggle')) {
      const on = d[t.dataset.setting as ToggleKey] === true
      t.setAttribute('aria-pressed', String(on))
      t.querySelector('span')!.setAttribute('data-i18n', on ? 'settings.on' : 'settings.off')
    }
    for (const b of this.qa<HTMLButtonElement>('.seg button')) b.setAttribute('aria-pressed', String(b.dataset.value === d.quality))
    for (const r of this.qa<HTMLInputElement>('input[type="range"]')) setFill(r)
    this.translate()
  }

  // ─── events ─────────────────────────────────────────────────────────────
  private onClick(e: MouseEvent): void {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-action], .toggle, .seg button')
    if (!target) return
    this.audio.unlock()
    if (target.matches('.toggle')) {
      const key = target.dataset.setting as ToggleKey
      this.actions.settings({ [key]: !this.save.data[key] })
      this.refreshSettings()
      this.audio.play('ui')
      return
    }
    if (target.matches('.seg button')) {
      this.actions.settings({ quality: target.dataset.value as Quality })
      this.refreshSettings()
      this.audio.play('ui')
      return
    }
    const action = target.dataset.action
    if (action === 'talk') return this.advanceTalk()
    if (action === 'panel-backdrop' && e.target !== target) return
    this.audio.play('ui')
    switch (action) {
      case 'play': this.setOff(); break
      case 'resume': this.actions.resume(); break
      case 'quit': this.actions.quit(); break
      case 'settings': this.push('settings'); break
      case 'back': this.back(); break
      case 'retry': this.actions.retry(); break
      case 'close-panel':
      case 'panel-backdrop': this.closePanel(true); break
      case 'pause': window.dispatchEvent(new CustomEvent('game:pause')); break
    }
  }
  private onInput(e: Event): void {
    const el = e.target as HTMLInputElement
    if (el.type !== 'range') return
    setFill(el)
    this.actions.settings({ [el.name]: Number(el.value) } as Partial<SaveData>)
  }
  private onKey(e: KeyboardEvent): void {
    // L opens Ali's LinkedIn from anywhere in play (a real key press, so the new tab is allowed).
    if (e.code === 'KeyL' && !e.repeat && (this.screen === 'hud' || this.screen === 'pause') && !(e.target as HTMLElement)?.matches?.('input')) {
      openLinkedIn()
      return
    }
    if (e.code === 'KeyG' && !e.repeat && (this.screen === 'hud' || this.screen === 'pause') && !(e.target as HTMLElement)?.matches?.('input')) {
      window.open(PROFILE.github, '_blank', 'noopener')
      return
    }
    if (this.screen === 'hud' || this.screen === 'boot') return
    if ((e.code === 'Escape' || e.code === 'Backspace') && this.screen === 'settings') {
      e.preventDefault()
      this.input.consume('pause')
      this.back()
      return
    }
    if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
      e.preventDefault()
      this.moveFocus(e.code === 'ArrowDown' ? 1 : -1)
    }
  }
  /** Per-frame: HUD timers and gamepad menu navigation (keyboard uses native focus + onKey). */
  frame(frameSeconds: number): void {
    if (this.input.method !== this.lastMethod) {
      this.lastMethod = this.input.method
      document.body.dataset.input = this.input.method
      this.renderHint()
    }
    if (this.screen === 'hud') {
      const t = this.talk
      if (t && t.shown < t.lines[t.i][1].length) {
        const len = t.lines[t.i][1].length
        t.shown = this.save.data.reducedMotion ? len : Math.min(len, t.shown + frameSeconds * 52)
        this.renderLine()
      }
      if (this.panelId && this.input.method === 'gamepad') this.scrollPanel(this.input.move.y * -900 * frameSeconds)
      if (this.hintTimer > 0) {
        const moving = Math.hypot(this.input.move.x, this.input.move.y) > 0.1
        this.hintTimer -= frameSeconds * (moving ? 1.6 : 1)
        if (this.hintTimer <= 0) this.q('.hint').classList.remove('is-active')
      }
      if (this.captionTimer > 0) {
        this.captionTimer -= frameSeconds
        if (this.captionTimer <= 0) this.q('.caption').classList.remove('is-active')
      }
      return
    }
    if (this.screen === 'boot') return
    if (this.input.method !== 'gamepad') {
      this.input.consume('confirm')
      this.input.consume('back')
      return
    }
    const y = this.input.move.y
    const x = this.input.move.x
    this.navRepeat = Math.max(0, this.navRepeat - frameSeconds)
    const active = document.activeElement as HTMLElement | null
    if (Math.abs(y) > 0.6 && this.navRepeat <= 0) {
      this.moveFocus(y < 0 ? 1 : -1)
      this.navRepeat = 0.22
    } else if (Math.abs(x) > 0.6 && this.navRepeat <= 0 && active?.matches('input[type="range"]')) {
      const r = active as HTMLInputElement
      r.value = String(Number(r.value) + Math.sign(x) * Number(r.step || 0.1))
      r.dispatchEvent(new Event('input', { bubbles: true }))
      this.navRepeat = 0.12
    } else if (Math.abs(x) > 0.6 && this.navRepeat <= 0 && active?.parentElement?.matches('.seg')) {
      const sib = (Math.sign(x) > 0 ? active.nextElementSibling : active.previousElementSibling) as HTMLElement | null
      sib?.focus()
      this.navRepeat = 0.22
    } else if (Math.abs(y) < 0.3 && Math.abs(x) < 0.3) {
      this.navRepeat = 0
    }
    if (this.input.consume('confirm')) active?.click()
    if (this.input.consume('back') && this.screen !== 'title') this.back()
  }
  private navItems(): HTMLElement[] {
    const screen = this.root.querySelector<HTMLElement>(`[data-screen="${this.screen}"]`)
    if (!screen) return []
    return [...screen.querySelectorAll<HTMLElement>('[data-nav]')].filter(el => el.offsetParent !== null)
  }
  private moveFocus(dir: 1 | -1): void {
    const items = this.navItems()
    if (items.length === 0) return
    const rows: HTMLElement[][] = []
    for (const el of items) {
      const seg = el.parentElement?.matches('.seg') ? el.parentElement : null
      const last = rows[rows.length - 1]
      if (seg && last && last[0].parentElement === seg) last.push(el)
      else rows.push([el])
    }
    const current = rows.findIndex(r => r.includes(document.activeElement as HTMLElement))
    const next = rows[(current + dir + rows.length) % rows.length]
    ;(next.find(el => el.getAttribute('aria-pressed') === 'true') ?? next[0]).focus()
  }

  // ─── helpers ────────────────────────────────────────────────────────────
  private translate(): void {
    for (const el of this.root.querySelectorAll<HTMLElement>('[data-i18n]')) el.textContent = this.i18n.t(el.dataset.i18n!)
    for (const el of this.root.querySelectorAll<HTMLElement>('[data-i18n-label]')) el.setAttribute('aria-label', this.i18n.t(el.dataset.i18nLabel!))
    this.renderHint()
    this.focusKey = ''
    document.title = this.i18n.t('game.title')
  }
  private q<T extends HTMLElement = HTMLElement>(sel: string): T {
    return this.root.querySelector<T>(sel)!
  }
  private qa<T extends HTMLElement = HTMLElement>(sel: string): T[] {
    return [...this.root.querySelectorAll<T>(sel)]
  }
  private template(): string {
    const range = (name: string, label: string, min: number, max: number, step: number) =>
      `<label class="row"><span data-i18n="${label}"></span><input data-nav type="range" name="${name}" min="${min}" max="${max}" step="${step}"></label>`
    const toggle = (setting: string, label: string) =>
      `<div class="row"><span data-i18n="${label}"></span><button data-nav class="toggle" data-setting="${setting}" aria-pressed="false"><i></i><span></span></button></div>`
    const linkedinLink = (cls: string) =>
      `<a data-nav class="linkedin ${cls}" href="${PROFILE.linkedin}" target="_blank" rel="noopener noreferrer">${LINKEDIN_SVG}<span data-i18n="linkedin.label"></span></a>`
    const github = `<a data-nav class="linkedin github" href="${PROFILE.github}" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg><span>GitHub</span></a>`
    const linkedin = (cls: string) => `<div class="social ${cls}">${linkedinLink('')}${github}</div>`
    return /* html */ `
<section class="screen screen-boot is-active" data-screen="boot">
  <img class="boot-icon" src="/favicon.png" alt="" width="72" height="72">
  <div class="boot-title" data-i18n="game.title"></div>
  <div class="boot-bar"><i></i></div>
  <div class="boot-meta"><span class="boot-label" data-i18n="boot.loading"></span><span class="boot-pct">0%</span></div>
  <p class="boot-error"></p>
  <button class="btn btn-primary boot-retry" data-action="retry"><span data-i18n="boot.retry"></span></button>
</section>
<section class="screen screen-title" data-screen="title">
  <div class="title-shade"></div>
  ${linkedin('linkedin-corner')}
  <div class="title-block">
    <div class="title-mark" aria-hidden="true"><i></i></div>
    <h1 class="title-name" data-i18n="game.title"></h1>
    <p class="title-sub" data-i18n="game.subtitle"></p>
    <p class="title-tagline" data-i18n="game.tagline"></p>
    <nav class="menu">
      <button data-nav class="btn btn-primary" data-action="play"><span data-i18n="menu.play"></span></button>
    </nav>
  </div>
  <footer class="title-foot"><small data-i18n="credits.fonts"></small></footer>
</section>
<section class="screen screen-hud" data-screen="hud">
  <div class="reticle" aria-hidden="true"></div>
  <div class="hint"></div>
  <div class="caption"><span></span></div>
  <div class="chapters" role="img">
    <div class="chapters-pips">${LANDMARKS.map(l => `<i data-chapter="${l.id}" style="--c:${l.color}" title="${escapeHtml(l.label)}"></i>`).join('')}</div>
    <small class="chapters-count"></small>
  </div>
  <div class="compass" aria-hidden="true">
    <div class="compass-track">${LANDMARKS.map(l => `<i data-pip="${l.id}" style="--c:${l.color}" hidden></i>`).join('')}<b class="compass-tick"></b></div>
    <small class="compass-label"></small>
  </div>
  ${linkedin('linkedin-hud')}
  <div class="prompt"><kbd>E</kbd><span></span></div>
  <div class="talk" data-action="talk" role="dialog" aria-live="polite"><div class="talk-name"></div><p class="talk-text"></p><i class="talk-next" aria-hidden="true"></i></div>
  <div class="panel" data-action="panel-backdrop" inert>
    <article class="panel-card" role="dialog" aria-modal="true">
      <button class="panel-close" data-action="close-panel" data-i18n-label="panel.close"><kbd>E</kbd><span data-i18n="panel.close"></span></button>
      <div class="panel-scroll" tabindex="-1"><div class="panel-body"></div></div>
    </article>
  </div>
  <button class="hud-pause" data-action="pause" data-i18n-label="touch.pause"><i></i><i></i></button>
  <div class="touch">
    <div class="touch-stick"><i></i></div>
    <button class="touch-btn touch-sprint" data-touch="sprint"><span data-i18n="touch.sprint"></span></button>
    <button class="touch-btn touch-jump" data-touch="jump"><span data-i18n="touch.jump"></span></button>
    <button class="touch-btn touch-talk" data-touch="interact"><span data-i18n="touch.interact"></span></button>
  </div>
</section>
<section class="screen screen-pause screen-modal" data-screen="pause">
  <div class="modal">
    <h2 class="modal-title" data-i18n="pause.title"></h2>
    <p class="modal-sub" data-i18n="pause.sub"></p>
    <nav class="menu">
      <button data-nav class="btn btn-primary" data-action="resume"><span data-i18n="menu.continue"></span></button>
      <button data-nav class="btn" data-action="settings"><span data-i18n="menu.settings"></span></button>
      <button data-nav class="btn" data-action="quit"><span data-i18n="menu.quit"></span></button>
    </nav>
    ${linkedin('linkedin-inline')}
  </div>
</section>
<section class="screen screen-settings screen-modal" data-screen="settings">
  <div class="modal modal-wide">
    <h2 class="modal-title" data-i18n="settings.title"></h2>
    <div class="settings-grid">
      <fieldset><legend data-i18n="settings.audio"></legend>
        ${range('musicVolume', 'settings.music', 0, 1, 0.05)}
        ${range('sfxVolume', 'settings.sfx', 0, 1, 0.05)}
        ${toggle('muted', 'settings.mute')}
      </fieldset>
      <fieldset><legend data-i18n="settings.controls"></legend>
        ${range('sensitivity', 'settings.sensitivity', 0.2, 3, 0.1)}
        ${toggle('invertY', 'settings.invertY')}
      </fieldset>
      <fieldset><legend data-i18n="settings.display"></legend>
        <div class="row"><span data-i18n="settings.quality"></span><div class="seg" data-setting="quality">
          <button data-nav data-value="low" data-i18n="settings.quality.low"></button><button data-nav data-value="medium" data-i18n="settings.quality.medium"></button><button data-nav data-value="high" data-i18n="settings.quality.high"></button>
        </div></div>
        ${toggle('reducedMotion', 'settings.reducedMotion')}
      </fieldset>
    </div>
    <nav class="menu menu-row"><button data-nav class="btn" data-action="back"><span data-i18n="menu.back"></span></button></nav>
  </div>
</section>`
  }
}

/** The detail panel's inner HTML for one chapter (pure; content is escaped). */
export function renderPanel(l: Landmark): string {
  const e = escapeHtml
  const stats = l.stats?.length
    ? `<ul class="panel-stats">${l.stats.map(s => `<li><b>${e(s.value)}</b><small>${e(s.label)}</small></li>`).join('')}</ul>`
    : ''
  const roles = l.roles
    .map(r => {
      const meta = [r.org, r.dates, r.place].filter((x): x is string => !!x).map(e).join(' · ')
      return `<section class="panel-role"><h3>${e(r.title)}</h3>${meta ? `<p class="panel-meta">${meta}</p>` : ''}<ul>${r.points.map(p => `<li>${e(p)}</li>`).join('')}</ul></section>`
    })
    .join('')
  const skills = `<div class="panel-skills">${l.skills.map(s => `<span>${e(s)}</span>`).join('')}</div>`
  const links = [...(l.links ?? []), ...(l.links?.some(x => x.url === PROFILE.linkedin) ? [] : [{ label: 'LinkedIn profile', url: PROFILE.linkedin }])]
  const foot = `<footer class="panel-links">${links
    .map(x => `<a href="${e(x.url)}" target="_blank" rel="noopener noreferrer">${e(x.label)}</a>`)
    .join('')}</footer>`
  const story = l.story
    ? `<aside class="panel-story"><p class="panel-story-tale"><b>The story</b>${e(l.story.tale)}</p><p class="panel-story-learned"><b>What Ali learned</b>${e(l.story.learned)}</p></aside>`
    : ''
  return `<p class="panel-kicker">${e(l.kicker)}</p><h2 class="panel-heading">${e(l.heading)}</h2><p class="panel-intro">${e(l.intro)}</p>${story}${stats}${roles}${skills}${foot}`
}

export function openLinkedIn(): void {
  window.open(PROFILE.linkedin, '_blank', 'noopener,noreferrer')
}

function setFill(r: HTMLInputElement): void {
  r.style.setProperty('--fill', `${((Number(r.value) - Number(r.min)) / (Number(r.max) - Number(r.min))) * 100}%`)
}
export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}
