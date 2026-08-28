import fs from "node:fs"

const darkPath = new URL("../file-icons/verdant-phosphor-dark-icon-theme.json", import.meta.url)
const lightPath = new URL("../file-icons/verdant-phosphor-light-icon-theme.json", import.meta.url)
const outputPath = new URL("../file-icons/verdant-phosphor-icon-theme.json", import.meta.url)

const dark = JSON.parse(fs.readFileSync(darkPath, "utf8"))
const light = JSON.parse(fs.readFileSync(lightPath, "utf8"))
const associations = [
  "file",
  "folder",
  "folderExpanded",
  "rootFolder",
  "rootFolderExpanded",
  "fileExtensions",
  "fileNames",
  "folderNames",
  "folderNamesExpanded",
  "languageIds"
]

const lightId = (id) => `${id}-light`
const remap = (value) => {
  if (typeof value === "string") return lightId(value)
  return Object.fromEntries(Object.entries(value).map(([key, id]) => [key, lightId(id)]))
}

dark.iconDefinitions = {
  ...dark.iconDefinitions,
  ...Object.fromEntries(
    Object.entries(light.iconDefinitions).map(([id, definition]) => [lightId(id), definition])
  )
}
dark.light = Object.fromEntries(associations.map((key) => [key, remap(light[key])]))

fs.writeFileSync(outputPath, `${JSON.stringify(dark, null, 2)}\n`)
