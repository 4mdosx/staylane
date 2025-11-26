// 简单的图标生成脚本（生成SVG占位图标）

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 创建简单的SVG图标作为占位符
const createIcon = (size) => {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#4a90e2" rx="${size * 0.2}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${
    size * 0.5
  }"
        font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">SL</text>
</svg>`
}

const iconsDir = path.join(__dirname, '..', 'icons')
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

// 生成SVG图标（Chrome扩展也支持SVG）
const sizes = [16, 48, 128]
sizes.forEach((size) => {
  const svg = createIcon(size)
  fs.writeFileSync(path.join(iconsDir, `icon${size}.svg`), svg)
  console.log(`Created icon${size}.svg`)
})

console.log('Icons generated successfully!')
