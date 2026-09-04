# Verdant Syntax

A calm, precise VS Code theme with dark and light variants. Syntax uses a
focused green-and-neutral palette; borders remain visible throughout the
workbench without making the editor feel noisy.

The extension also includes **Verdant Phosphor**, an adaptive duotone file icon
theme built from [Phosphor Icons](https://phosphoricons.com/). It switches its
contrast automatically when the active color theme changes between dark and
light. **Verdant Phosphor Product Icons** brings the same visual language to
the VS Code interface using the official Phosphor icon font.

## Try it locally

1. In VS Code, use **File → Open Folder…** and open the `vscode-theme`
   folder itself (not only the parent repository).
2. Press `F5` and choose **Preview Verdant Syntax** to launch an Extension
   Development Host.
3. Run **Preferences: Color Theme** and select **Verdant Syntax Dark** or
   **Verdant Syntax Light**.
4. Run **Preferences: File Icon Theme** and select **Verdant Phosphor**.
5. Optionally run **Preferences: Product Icon Theme** and select
   **Verdant Phosphor Product Icons**.

## Acrylic compatibility

Set `verdantSyntax.acrylic.enabled` to `true` to make the editor, sidebars,
panels, tabs, title bar, status bar, menus and terminal transparent. Adjust
`verdantSyntax.acrylic.opacity` between `0.35` and `0.98` to control how much
of the backdrop is visible.

VS Code does not expose native Windows Acrylic or Mica through its extension
API. The setting prepares Verdant's surfaces for a backdrop provider such as
Vibrancy Continued, but deliberately does not install or activate an invasive
provider automatically. The same toggle is available through the commands
**Verdant Syntax: Enable Acrylic Compatibility** and **Disable Acrylic
Compatibility**.

To package it, run `npx @vscode/vsce package` from this folder. Change the
`publisher` field before publishing to the Marketplace.

## Design notes

- Crisp borders separate the sidebar, editor groups, panels, tabs and inputs.
- Selection and focus states use a restrained forest green.
- Comments are italic and deliberately quiet.
- Syntax is limited to green, neutral foreground shades and quiet comments;
  font weight and italics provide the remaining hierarchy.
- Semantic highlighting complements TextMate scopes for TypeScript, JavaScript,
  Python, Rust, Go, HTML/CSS, JSON, Markdown and other common languages.
- File and folder icons use the Phosphor `duotone` family under its MIT license.
- Product icons use the single-color Phosphor `regular` font and inherit colors
  from the active VS Code color theme.
