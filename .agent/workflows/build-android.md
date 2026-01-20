---
description: 构建 Android APK - 使用 Capacitor 将 React 应用打包为 Android APK
---

# 构建 Android APK 工作流

此工作流用于将 React + Vite 项目通过 Capacitor 打包成 Android APK。

## 环境要求

- **JDK**: 17 (必须)
- **Node.js**: 18+
- **Gradle**: 8.11.1 (自动下载)

## 构建步骤

### 1. 构建 Web 应用并同步到 Android

// turbo
```bash
npm run cap:sync
```

这会执行 `npm run build && npx cap sync android`。

### 2. 构建 Debug APK

// turbo
```bash
cd android && .\gradlew assembleDebug
```

或使用 npm 脚本：
// turbo
```bash
npm run cap:build
```

### 3. 定位 APK 文件

APK 生成位置：
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 可选：构建 Release APK

// turbo
```bash
cd android && .\gradlew assembleRelease
```

或：
// turbo
```bash
npm run cap:release
```

---

## 快速命令汇总

| 命令 | 说明 |
|------|------|
| `npm run cap:sync` | 构建 Web + 同步到 Android |
| `npm run cap:build` | 构建 Debug APK |
| `npm run cap:release` | 构建 Release APK |
| `npm run cap:open` | 在 Android Studio 中打开项目 |

---

## 如果遇到构建错误

1. **清理构建缓存**：
   ```bash
   cd android && .\gradlew clean
   ```

2. **重新同步**：
   ```bash
   npm run cap:sync
   ```

3. **查看详细 prompt.md 了解配置修正方法**。
