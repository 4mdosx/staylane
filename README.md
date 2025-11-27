# StayLane

## 核心功能

- **垂直标签页**: 支持 Chrome 标签页分组，已分组的标签页显示在可折叠列表中
- **恢复已关闭标签页**: 快速恢复最近关闭的标签页
- **书签快捷入口**: 一键打开 Chrome 书签管理器

## 技术栈

- React 18
- TypeScript
- Vite
- Chrome Extension Manifest V3

## 开发

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

这会启动Vite的watch模式，自动构建项目。

### 构建生产版本

```bash
npm run build
```

构建产物会输出到 `dist` 目录。

## 安装插件

1. 运行 `npm run build` 构建项目
2. 打开Chrome浏览器，进入 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目的 `dist` 目录

## 项目结构

```
staylane/
├── src/
│   ├── sidepanel/      # 侧边栏面板页面
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.html
│   ├── options/        # 设置页面
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.html
│   └── background/     # 后台脚本
│       └── index.ts
├── manifest.json       # 插件配置文件
├── vite.config.ts      # Vite配置
└── package.json
```

## 许可证

MIT

