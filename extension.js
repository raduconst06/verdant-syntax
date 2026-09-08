const vscode = require("vscode")

const DARK_THEME = "[Verdant Syntax Dark]"
const LIGHT_THEME = "[Verdant Syntax Light]"
const SNAPSHOT_KEY = "verdantSyntax.accent.previousValues"
const DEFAULT_ACCENT = "#6F887A"

const ownedKeys = [
  "focusBorder",
  "inputOption.activeBorder",
  "progressBar.background",
  "button.background",
  "button.foreground",
  "badge.background",
  "badge.foreground",
  "editorCursor.foreground",
  "editorBracketMatch.border",
  "peekView.border",
  "activityBar.activeBorder",
  "activityBarBadge.background",
  "activityBarBadge.foreground",
  "list.focusOutline",
  "list.highlightForeground",
  "tab.activeBorderTop",
  "panelTitle.activeBorder",
  "titleBar.activeBackground",
  "titleBar.activeForeground",
  "titleBar.inactiveBackground",
  "statusBar.background",
  "statusBar.foreground",
  "statusBar.noFolderBackground",
  "commandCenter.border"
]

function normalizeHex(value) {
  if (typeof value !== "string") return undefined
  const match = value.trim().match(/^#?([0-9a-f]{6})$/i)
  return match ? `#${match[1].toUpperCase()}` : undefined
}

function hexToRgb(hex) {
  return [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16))
}

function rgbToHex(rgb) {
  return `#${rgb.map((value) => Math.round(value).toString(16).padStart(2, "0")).join("")}`.toUpperCase()
}

function mix(first, second, amount) {
  const a = hexToRgb(first)
  const b = hexToRgb(second)
  return rgbToHex(a.map((value, index) => value * (1 - amount) + b[index] * amount))
}

function luminance(hex) {
  const channels = hexToRgb(hex).map((value) => {
    const channel = value / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrast(first, second) {
  const a = luminance(first)
  const b = luminance(second)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

function foregroundFor(background) {
  if (contrast(background, "#FFFFFF") >= 4.5) return "#FFFFFF"
  if (contrast(background, "#101714") >= 4.5) return "#101714"
  return "#000000"
}

function buildThemeAccents(accent) {
  const darkSurface = mix(accent, "#101714", 0.38)
  const darkMuted = mix(accent, "#101714", 0.55)
  const darkFocus = mix(accent, "#FFFFFF", 0.24)
  const lightSurface = mix(accent, "#DDDDDD", 0.58)
  const lightMuted = mix(accent, "#DDDDDD", 0.72)
  const lightFocus = mix(accent, "#18221D", 0.1)

  const common = (focus, surface, muted) => ({
    "focusBorder": focus,
    "inputOption.activeBorder": focus,
    "progressBar.background": focus,
    "button.background": surface,
    "button.foreground": foregroundFor(surface),
    "badge.background": surface,
    "badge.foreground": foregroundFor(surface),
    "editorCursor.foreground": focus,
    "editorBracketMatch.border": focus,
    "peekView.border": focus,
    "activityBar.activeBorder": focus,
    "activityBarBadge.background": surface,
    "activityBarBadge.foreground": foregroundFor(surface),
    "list.focusOutline": focus,
    "list.highlightForeground": focus,
    "tab.activeBorderTop": focus,
    "panelTitle.activeBorder": focus,
    "titleBar.activeBackground": surface,
    "titleBar.activeForeground": foregroundFor(surface),
    "titleBar.inactiveBackground": muted,
    "statusBar.background": surface,
    "statusBar.foreground": foregroundFor(surface),
    "statusBar.noFolderBackground": surface,
    "commandCenter.border": focus
  })

  return {
    [DARK_THEME]: common(darkFocus, darkSurface, darkMuted),
    [LIGHT_THEME]: common(lightFocus, lightSurface, lightMuted)
  }
}

function captureOwnedValues(customizations) {
  return Object.fromEntries(
    [DARK_THEME, LIGHT_THEME].map((theme) => [
      theme,
      Object.fromEntries(
        ownedKeys
          .filter((key) => Object.prototype.hasOwnProperty.call(customizations[theme] || {}, key))
          .map((key) => [key, customizations[theme][key]])
      )
    ])
  )
}

async function applyAccent(context) {
  const accent = normalizeHex(
    vscode.workspace.getConfiguration("verdantSyntax").get("accentColor", "")
  )
  const root = vscode.workspace.getConfiguration()
  const current = root.get("workbench.colorCustomizations", {})
  const snapshot = context.globalState.get(SNAPSHOT_KEY)

  if (!accent) {
    if (!snapshot) return
    const restored = { ...current }
    for (const theme of [DARK_THEME, LIGHT_THEME]) {
      const section = { ...(current[theme] || {}) }
      for (const key of ownedKeys) delete section[key]
      Object.assign(section, snapshot[theme] || {})
      if (Object.keys(section).length) restored[theme] = section
      else delete restored[theme]
    }
    await root.update("workbench.colorCustomizations", restored, vscode.ConfigurationTarget.Global)
    await context.globalState.update(SNAPSHOT_KEY, undefined)
    return
  }

  if (!snapshot) {
    await context.globalState.update(SNAPSHOT_KEY, captureOwnedValues(current))
  }

  const next = { ...current }
  for (const [theme, values] of Object.entries(buildThemeAccents(accent))) {
    next[theme] = { ...(current[theme] || {}), ...values }
  }
  await root.update("workbench.colorCustomizations", next, vscode.ConfigurationTarget.Global)
}

function nonce() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  return Array.from({ length: 24 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("")
}

function pickerHtml(webview, initial) {
  const token = nonce()
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${token}'; script-src 'nonce-${token}';">
  <style nonce="${token}">
    :root { color-scheme: light dark; }
    body { max-width: 680px; margin: 0 auto; padding: 32px; color: var(--vscode-foreground); font-family: var(--vscode-font-family); }
    h1 { font-size: 22px; margin: 0 0 8px; }
    p { color: var(--vscode-descriptionForeground); line-height: 1.5; }
    .picker { display: flex; align-items: center; gap: 16px; margin: 24px 0; }
    input[type="color"] { width: 72px; height: 48px; padding: 3px; border: 1px solid var(--vscode-input-border); background: var(--vscode-input-background); border-radius: 6px; }
    input[type="text"] { width: 110px; padding: 8px 10px; color: var(--vscode-input-foreground); background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border); border-radius: 4px; font-family: var(--vscode-editor-font-family); }
    .presets { display: flex; flex-wrap: wrap; gap: 10px; margin: 16px 0 24px; }
    .swatch { width: 34px; height: 34px; border: 2px solid var(--vscode-contrastBorder, transparent); border-radius: 50%; cursor: pointer; }
    .preview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 20px 0 28px; }
    .preview { overflow: hidden; border: 1px solid var(--vscode-widget-border); border-radius: 8px; }
    .bar { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; }
    .canvas { min-height: 86px; padding: 14px; }
    .line { height: 8px; margin: 8px 0; border-radius: 4px; opacity: .7; }
    .actions { display: flex; gap: 10px; }
    button { padding: 8px 14px; border: 1px solid var(--vscode-button-border, transparent); border-radius: 4px; cursor: pointer; }
    #apply { color: var(--vscode-button-foreground); background: var(--vscode-button-background); }
    #reset { color: var(--vscode-button-secondaryForeground); background: var(--vscode-button-secondaryBackground); }
  </style>
</head>
<body>
  <h1>Verdant accent color</h1>
  <p>Choose one color. Verdant derives accessible Dark and Light variants automatically.</p>
  <div class="picker">
    <input id="color" type="color" value="${initial}">
    <input id="hex" type="text" value="${initial}" maxlength="7" aria-label="Hex color">
  </div>
  <div class="presets" aria-label="Accent presets">
    <button class="swatch" data-color="#6F887A" title="Wallpaper Sage"></button>
    <button class="swatch" data-color="#91A99C" title="Mist"></button>
    <button class="swatch" data-color="#416052" title="Forest"></button>
    <button class="swatch" data-color="#B59A55" title="Warm Star"></button>
    <button class="swatch" data-color="#687E91" title="Nebula Blue"></button>
  </div>
  <div class="preview-grid">
    <div class="preview" id="dark"><div class="bar"><span>Dark</span><span>●</span></div><div class="canvas"><div class="line"></div><div class="line"></div><div class="line"></div></div></div>
    <div class="preview" id="light"><div class="bar"><span>Light</span><span>●</span></div><div class="canvas"><div class="line"></div><div class="line"></div><div class="line"></div></div></div>
  </div>
  <div class="actions"><button id="apply">Apply accent</button><button id="reset">Reset to theme default</button></div>
  <script nonce="${token}">
    const vscode = acquireVsCodeApi()
    const color = document.getElementById('color')
    const hex = document.getElementById('hex')
    const normalize = value => /^#[0-9a-f]{6}$/i.test(value) ? value.toUpperCase() : null
    const rgb = value => [1, 3, 5].map(i => parseInt(value.slice(i, i + 2), 16))
    const toHex = values => '#' + values.map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase()
    const mix = (a, b, amount) => { const x=rgb(a), y=rgb(b); return toHex(x.map((v,i)=>v*(1-amount)+y[i]*amount)) }
    const luminance = value => rgb(value).map(v => { v/=255; return v<=.04045 ? v/12.92 : ((v+.055)/1.055)**2.4 }).reduce((sum,v,i) => sum + v*[.2126,.7152,.0722][i], 0)
    const contrast = (a,b) => { const x=luminance(a), y=luminance(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05) }
    const foreground = value => contrast(value,'#FFFFFF')>=4.5 ? '#FFFFFF' : contrast(value,'#101714')>=4.5 ? '#101714' : '#000000'
    function preview(value) {
      const normalized = normalize(value)
      if (!normalized) return
      color.value = normalized
      hex.value = normalized
      const dark = mix(normalized, '#101714', .38)
      const light = mix(normalized, '#DDDDDD', .58)
      document.querySelector('#dark .bar').style.background = dark
      document.querySelector('#dark .bar').style.color = foreground(dark)
      document.querySelector('#dark .canvas').style.background = '#101714'
      document.querySelectorAll('#dark .line').forEach(line => line.style.background = mix(normalized, '#FFFFFF', .24))
      document.querySelector('#light .bar').style.background = light
      document.querySelector('#light .bar').style.color = foreground(light)
      document.querySelector('#light .canvas').style.background = '#DDDDDD'
      document.querySelectorAll('#light .line').forEach(line => line.style.background = mix(normalized, '#18221D', .1))
    }
    color.addEventListener('input', event => preview(event.target.value))
    hex.addEventListener('input', event => { const value=normalize(event.target.value); if(value) preview(value) })
    document.querySelectorAll('.swatch').forEach(button => {
      button.style.background = button.dataset.color
      button.addEventListener('click', () => preview(button.dataset.color))
    })
    document.getElementById('apply').addEventListener('click', () => vscode.postMessage({ type: 'apply', color: color.value }))
    document.getElementById('reset').addEventListener('click', () => vscode.postMessage({ type: 'reset' }))
    preview('${initial}')
  </script>
</body>
</html>`
}

function openAccentPicker(context) {
  const configured = normalizeHex(
    vscode.workspace.getConfiguration("verdantSyntax").get("accentColor", "")
  )
  const panel = vscode.window.createWebviewPanel(
    "verdantAccentPicker",
    "Verdant Accent Color",
    vscode.ViewColumn.Active,
    { enableScripts: true, retainContextWhenHidden: true }
  )
  panel.webview.html = pickerHtml(panel.webview, configured || DEFAULT_ACCENT)
  panel.webview.onDidReceiveMessage(async (message) => {
    const configuration = vscode.workspace.getConfiguration("verdantSyntax")
    if (message.type === "apply") {
      const color = normalizeHex(message.color)
      if (!color) return
      await configuration.update("accentColor", color, vscode.ConfigurationTarget.Global)
      await applyAccent(context)
      vscode.window.showInformationMessage(`Verdant accent set to ${color}.`)
    } else if (message.type === "reset") {
      await configuration.update("accentColor", "", vscode.ConfigurationTarget.Global)
      await applyAccent(context)
      vscode.window.showInformationMessage("Verdant accent reset to the theme default.")
    }
  }, undefined, context.subscriptions)
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand("verdantSyntax.pickAccentColor", () => openAccentPicker(context)),
    vscode.commands.registerCommand("verdantSyntax.resetAccentColor", async () => {
      await vscode.workspace
        .getConfiguration("verdantSyntax")
        .update("accentColor", "", vscode.ConfigurationTarget.Global)
      await applyAccent(context)
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("verdantSyntax.accentColor")) applyAccent(context)
    })
  )
  applyAccent(context)
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
  __test: { normalizeHex, mix, foregroundFor, buildThemeAccents }
}
