import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { readFileSync, writeFileSync, existsSync, rmSync } from 'fs'

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'manifest.json',
          dest: '.',
        },
        {
          src: 'icons/*',
          dest: 'icons',
        },
      ],
    }),
    // 移动 HTML 文件到根目录并修复路径
    {
      name: 'move-html-files',
      closeBundle() {
        const distDir = resolve(__dirname, 'dist')

        // 处理 options.html
        const optionsSrc = resolve(distDir, 'src', 'options', 'index.html')
        const optionsDest = resolve(distDir, 'options.html')
        if (existsSync(optionsSrc)) {
          let content = readFileSync(optionsSrc, 'utf-8')
          // 修复所有绝对路径为相对路径
          content = content.replace(/src="\/assets\//g, 'src="./assets/')
          content = content.replace(/href="\/assets\//g, 'href="./assets/')
          writeFileSync(optionsDest, content)
          rmSync(resolve(distDir, 'src', 'options'), { recursive: true, force: true })
        }

        // 处理 sidepanel.html
        const sidepanelSrc = resolve(distDir, 'src', 'sidepanel', 'index.html')
        const sidepanelDest = resolve(distDir, 'sidepanel.html')
        if (existsSync(sidepanelSrc)) {
          let content = readFileSync(sidepanelSrc, 'utf-8')
          // 修复所有绝对路径为相对路径
          content = content.replace(/src="\/assets\//g, 'src="./assets/')
          content = content.replace(/href="\/assets\//g, 'href="./assets/')
          writeFileSync(sidepanelDest, content)
          rmSync(resolve(distDir, 'src', 'sidepanel'), { recursive: true, force: true })
        }

        // 清理空的 src 目录
        try {
          rmSync(resolve(distDir, 'src'), { recursive: true, force: true })
        } catch (e) {
          // 忽略错误
        }
      },
    },
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        options: resolve(__dirname, 'src/options/index.html'),
        sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'background'
            ? 'background.js'
            : 'assets/[name].js'
        },
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
})
