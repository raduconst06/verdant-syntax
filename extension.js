const vscode = require("vscode")

const SNAPSHOT_KEY = "verdantSyntax.acrylic.previousCustomizations"
const DARK_THEME = "[Verdant Syntax Dark]"
const LIGHT_THEME = "[Verdant Syntax Light]"

const transparentSurfaces = {
  [DARK_THEME]: {
    "editor.background": "#101714",
    "editorGutter.background": "#101714",
    "sideBar.background": "#181D1A",
    "activityBar.background": "#111512",
    "titleBar.activeBackground": "#4F665A",
    "titleBar.inactiveBackground": "#405248",
    "statusBar.background": "#4F665A",
    "statusBar.noFolderBackground": "#4F665A",
    "panel.background": "#171C19",
    "terminal.background": "#101714",
    "editorGroupHeader.tabsBackground": "#111512",
    "tab.activeBackground": "#101714",
    "tab.inactiveBackground": "#1C221E",
    "menu.background": "#1B211D",
    "dropdown.background": "#1B211D",
    "input.background": "#171C19",
    "editorWidget.background": "#1B211D",
    "editorHoverWidget.background": "#1B211D"
  },
  [LIGHT_THEME]: {
    "editor.background": "#DDDDDD",
    "editorGutter.background": "#DDDDDD",
    "sideBar.background": "#DDDDDD",
    "activityBar.background": "#DDDDDD",
    "titleBar.activeBackground": "#AABDB1",
    "titleBar.inactiveBackground": "#BCCAC2",
    "statusBar.background": "#AABDB1",
    "statusBar.noFolderBackground": "#AABDB1",
    "panel.background": "#DDDDDD",
    "terminal.background": "#DDDDDD",
    "editorGroupHeader.tabsBackground": "#DDDDDD",
    "tab.activeBackground": "#DDDDDD",
    "tab.inactiveBackground": "#DDDDDD",
    "menu.background": "#DDDDDD",
    "dropdown.background": "#DDDDDD",
    "input.background": "#DDDDDD",
    "editorWidget.background": "#DDDDDD",
    "editorHoverWidget.background": "#DDDDDD"
  }
}

function withOpacity(color, opacity) {
  const alpha = Math.round(Math.max(0.35, Math.min(0.98, opacity)) * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase()
  return `${color}${alpha}`
}

async function applyAcrylic(context) {
  const acrylic = vscode.workspace.getConfiguration("verdantSyntax.acrylic")
  const enabled = acrylic.get("enabled", false)
  const opacity = acrylic.get("opacity", 0.78)
  const root = vscode.workspace.getConfiguration()
  const current = root.get("workbench.colorCustomizations", {})
  const snapshot = context.globalState.get(SNAPSHOT_KEY)

  if (enabled) {
    if (!snapshot) {
      await context.globalState.update(SNAPSHOT_KEY, {
        dark: current[DARK_THEME],
        light: current[LIGHT_THEME]
      })
    }

    const next = { ...current }
    for (const [theme, surfaces] of Object.entries(transparentSurfaces)) {
      next[theme] = {
        ...(current[theme] || {}),
        ...Object.fromEntries(
          Object.entries(surfaces).map(([key, color]) => [key, withOpacity(color, opacity)])
        )
      }
    }
    await root.update("workbench.colorCustomizations", next, vscode.ConfigurationTarget.Global)
    return
  }

  if (snapshot) {
    const next = { ...current }
    if (snapshot.dark === undefined) delete next[DARK_THEME]
    else next[DARK_THEME] = snapshot.dark
    if (snapshot.light === undefined) delete next[LIGHT_THEME]
    else next[LIGHT_THEME] = snapshot.light
    await root.update("workbench.colorCustomizations", next, vscode.ConfigurationTarget.Global)
    await context.globalState.update(SNAPSHOT_KEY, undefined)
  }
}

async function setAcrylicEnabled(context, enabled) {
  await vscode.workspace
    .getConfiguration("verdantSyntax.acrylic")
    .update("enabled", enabled, vscode.ConfigurationTarget.Global)
  await applyAcrylic(context)

  if (enabled && !vscode.extensions.getExtension("illixion.vscode-vibrancy-continued")) {
    const choice = await vscode.window.showInformationMessage(
      "Verdant transparency is enabled. Native Acrylic blur requires Vibrancy Continued or another Windows backdrop provider.",
      "View provider"
    )
    if (choice === "View provider") {
      await vscode.commands.executeCommand(
        "extension.open",
        "illixion.vscode-vibrancy-continued"
      )
    }
  }
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand("verdantSyntax.enableAcrylic", () =>
      setAcrylicEnabled(context, true)
    ),
    vscode.commands.registerCommand("verdantSyntax.disableAcrylic", () =>
      setAcrylicEnabled(context, false)
    ),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("verdantSyntax.acrylic")) {
        applyAcrylic(context)
      }
    })
  )
  applyAcrylic(context)
}

function deactivate() {}

module.exports = { activate, deactivate }
