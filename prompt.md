# Prompt: 将 React 应用转换为 Android APK (使用 Capacitor)

你是一个移动开发专家，请协助我将现有的 React Web 应用打包成 Android APK。

## 任务目标
使用 Capacitor 将当前目录下的 React 项目转换为 Android 工程，并生成 debug 版 APK。

## 环境信息
- **OS**: Windows
- **Project Type**: React + Vite
- **Current JDK**: 17 (请确保配置兼容此版本)

## 执行步骤

### 1. 初始化与依赖安装
- 检查并安装 `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`。
- 初始化 Capacitor 项目 (`npx cap init`)。
- 添加 Android 平台 (`npx cap add android`)。

### 2. 构建与同步
- 运行 Web 构建 (`npm run build`)。
- 将构建产物同步到 Android (`npx cap sync android`)。

### 3. **关键配置修正 (必须执行)**
为避免构建失败，请预先修改 Gradle 配置：

#### A. 修复 JDK 版本不兼容 (无效的源发行版: 21)
在 `android/app/build.gradle` 和 `android/build.gradle` 中，强制设置 Java 兼容性为 1.8 或 17（取决于本地 JDK）：
```gradle
compileOptions {
    sourceCompatibility JavaVersion.VERSION_17
    targetCompatibility JavaVersion.VERSION_17
}
```

#### B. 修复 Kotlin 版本冲突 (Duplicate class errors)
在 `android/build.gradle` 的 `allprojects` 或根级别添加依赖解析策略，强制统一 Kotlin 标准库版本：
```gradle
allprojects {
    // ... repositories ...
    configurations.all {
        resolutionStrategy {
            force 'org.jetbrains.kotlin:kotlin-stdlib:1.8.22'
            force 'org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.8.22'
            force 'org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.8.22'
        }
    }
}
```

### 4. 构建 APK
- 进入 `android` 目录。
- 运行清理命令: `.\gradlew clean`。
- 运行构建命令: `.\gradlew assembleDebug`。

### 5. 输出
- 告知生成的 APK 路径 (通常在 `android/app/build/outputs/apk/debug/app-debug.apk`)。
- 在 `package.json` 中添加便捷脚本 (`cap:build`, `cap:sync` 等)。
