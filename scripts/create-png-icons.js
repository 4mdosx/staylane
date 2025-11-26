// 创建PNG图标文件
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const iconsDir = path.join(__dirname, '..', 'icons')
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

// 创建简单的蓝色图标，带有"SL"文字
const createIcon = async (size) => {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#4a90e2" rx="${size * 0.2}"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${
        size * 0.5
      }"
            font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">SL</text>
    </svg>
  `

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(iconsDir, `icon${size}.png`))

  console.log(`Created icon${size}.png`)
}

const sizes = [16, 48, 128]
await Promise.all(sizes.map((size) => createIcon(size)))

console.log('All PNG icons generated successfully!')
