---
name: React to Android APK (Capacitor)
description: 使用 Capacitor 将 React Web 应用打包为 Android APK 的完整技能指南
---

# React to Android APK 技能指南

## 概述

本技能用于将 React + Vite Web 应用通过 Capacitor 框架打包为 Android APK。包含了解决常见构建问题的完整配置。

---

## 前置条件

| 组件 | 版本 | 说明 |
|------|------|------|
| JDK | 17 | **必须**，不支持 21 |
| Node.js | 18+ | 推荐 LTS 版本 |
| Android SDK | API 35 | 通过 Android Studio 安装 |

---

## 核心文件结构

```
project/
├── capacitor.config.ts      # Capacitor 配置
├── android/
│   ├── build.gradle         # 根 Gradle 配置 ⚠️ 关键
│   ├── variables.gradle     # SDK 版本变量
│   ├── gradle/wrapper/
│   │   └── gradle-wrapper.properties  # Gradle 版本
│   └── app/
│       └── build.gradle     # App 模块配置 ⚠️ 关键
└── dist/                    # Web 构建输出
```

---

## 完整配置流程

### 步骤 1: 安装 Capacitor

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init [AppName] [AppId] --web-dir dist
npx cap add android
```

### 步骤 2: 配置 Gradle (⚠️ 关键)

#### 2.1 `android/build.gradle`

必须包含以下配置来解决 JDK 和 Kotlin 版本冲突：

```gradle
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.7.2'
        classpath 'com.google.gms:google-services:4.4.2'
    }
}

apply from: "variables.gradle"

allprojects {
    repositories {
        google()
        mavenCentral()
    }
    
    // 强制所有模块使用 JDK 17
    afterEvaluate { project ->
        if (project.hasProperty('android')) {
            project.android {
                compileOptions {
                    sourceCompatibility JavaVersion.VERSION_17
                    targetCompatibility JavaVersion.VERSION_17
                }
            }
        }
        project.tasks.matching { 
            it.name.startsWith('compile') && it.name.endsWith('Kotlin') 
        }.configureEach {
            kotlinOptions {
                jvmTarget = "17"
            }
        }
    }
    
    // 强制统一 Kotlin 版本，解决重复类错误
    configurations.all {
        resolutionStrategy {
            force 'org.jetbrains.kotlin:kotlin-stdlib:1.9.24'
            force 'org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.9.24'
            force 'org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.9.24'
            force 'org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.1'
            force 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1'
        }
    }
}

task clean(type: Delete) {
    delete rootProject.buildDir
}
```

#### 2.2 `android/app/build.gradle`

确保包含：

```gradle
android {
    // ...
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    // ... 其他依赖
    
    // Kotlin 协程依赖（Geolocation、Filesystem 等插件需要）
    implementation "org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1"
    implementation "org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.1"
}
```

#### 2.3 `android/gradle/wrapper/gradle-wrapper.properties`

```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.11.1-all.zip
```

#### 2.4 `android/variables.gradle`

```gradle
ext {
    minSdkVersion = 23
    compileSdkVersion = 35
    targetSdkVersion = 35
    androidxActivityVersion = '1.9.2'
    androidxAppCompatVersion = '1.7.0'
    androidxCoordinatorLayoutVersion = '1.2.0'
    androidxCoreVersion = '1.15.0'
    androidxFragmentVersion = '1.8.4'
    coreSplashScreenVersion = '1.0.1'
    androidxWebkitVersion = '1.12.1'
    junitVersion = '4.13.2'
    androidxJunitVersion = '1.2.1'
    androidxEspressoCoreVersion = '3.6.1'
    cordovaAndroidVersion = '10.1.1'
}
```

### 步骤 3: package.json 脚本

```json
{
  "scripts": {
    "cap:sync": "npm run build && npx cap sync android",
    "cap:open": "npx cap open android",
    "cap:build": "cd android && .\\gradlew assembleDebug",
    "cap:release": "cd android && .\\gradlew assembleRelease"
  }
}
```

---

## 构建命令

```bash
# 1. 构建并同步
npm run cap:sync

# 2. 构建 APK
npm run cap:build

# 3. APK 位置
# android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 常见错误及解决方案

### 错误 1: 无效的源发行版: 21

**原因**: Capacitor 插件默认使用 JDK 21，但本地只有 JDK 17。

**解决**: 在 `android/build.gradle` 的 `allprojects.afterEvaluate` 中强制设置 `JavaVersion.VERSION_17`。

### 错误 2: Duplicate class kotlin.xxx

**原因**: 不同依赖引用了不同版本的 Kotlin stdlib。

**解决**: 使用 `resolutionStrategy.force` 强制所有模块使用 Kotlin `1.9.24`。

### 错误 3: Unresolved reference: async

**原因**: 缺少 Kotlin 协程依赖。

**解决**: 在 `app/build.gradle` 中添加 `kotlinx-coroutines-android:1.8.1`。

### 错误 4: Could not resolve kotlin-stdlib-jdk8

**原因**: Kotlin 版本冲突导致依赖解析失败。

**解决**: 在 `resolutionStrategy` 中强制所有 `kotlin-stdlib-*` 使用相同版本。

### 错误 5: SDK location not found

**原因**: 未设置 Android SDK 路径。

**解决**: 设置 `ANDROID_HOME` 环境变量，或在 `android/local.properties` 中添加 `sdk.dir=C:\\Users\\[用户名]\\AppData\\Local\\Android\\Sdk`。

---

## 版本兼容矩阵 (已验证 ✅)

| 组件 | 版本 |
|------|------|
| JDK | 17 |
| Gradle | 8.11.1 |
| Android Gradle Plugin | 8.7.2 |
| Kotlin | 1.9.24 |
| Kotlinx Coroutines | 1.8.1 |
| Capacitor | 6.2.0 |
| compileSdkVersion | 35 |
| targetSdkVersion | 35 |
| minSdkVersion | 23 |

---

## 使用的 Capacitor 插件

本项目使用的插件及其配置：

| 插件 | 版本 | 用途 |
|------|------|------|
| @capacitor/core | 6.2.0 | 核心框架 |
| @capacitor/android | 6.2.0 | Android 平台 |
| @capacitor/filesystem | 6.0.0 | 文件系统访问 |
| @capacitor/geolocation | 6.0.0 | 地理位置 |
| @capacitor-community/media | 6.0.0 | 媒体库访问 |

---

## 参考链接

- [Capacitor 官方文档](https://capacitorjs.com/docs)
- [Capacitor Android 配置](https://capacitorjs.com/docs/android/configuration)
- [Gradle 兼容性矩阵](https://developer.android.com/studio/releases/gradle-plugin#compatibility)
