# Prompt: 将 React 应用转换为 Android APK (使用 Capacitor)

你是一个移动开发专家，请协助我将现有的 React Web 应用打包成 Android APK。

## 任务目标
使用 Capacitor 将当前目录下的 React 项目转换为 Android 工程，并生成 debug 版 APK。

## 环境信息
- **OS**: Windows
- **Project Type**: React + Vite
- **JDK Version**: 17 (必须使用)
- **Gradle Version**: 8.11.1
- **Android Gradle Plugin**: 8.7.2
- **Kotlin Version**: 1.9.24

---

## 一、初始化 Capacitor 项目

### 1. 安装依赖
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
```

### 2. 初始化 Capacitor
```bash
npx cap init [AppName] [AppId] --web-dir dist
```
例如：`npx cap init PinkDiary com.pinkdiary.app --web-dir dist`

### 3. 添加 Android 平台
```bash
npx cap add android
```

---

## 二、构建与同步

### 1. 构建 Web 应用
```bash
npm run build
```

### 2. 同步到 Android
```bash
npx cap sync android
```

---

## 三、关键配置修正 ⚠️ 必须执行

### A. 修改 `android/build.gradle`

确保配置如下：

```gradle
// Top-level build file where you can add configuration options common to all sub-projects/modules.

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
    afterEvaluate { project ->
        if (project.hasProperty('android')) {
            project.android {
                compileOptions {
                    sourceCompatibility JavaVersion.VERSION_17
                    targetCompatibility JavaVersion.VERSION_17
                }
            }
        }
        // Fix for Kotlin version conflict using dynamic task configuration
        project.tasks.matching { it.name.startsWith('compile') && it.name.endsWith('Kotlin') }.configureEach {
            kotlinOptions {
                jvmTarget = "17"
            }
        }
    }
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

### B. 修改 `android/app/build.gradle`

在 `android {}` 块中确保有：
```gradle
compileOptions {
    sourceCompatibility JavaVersion.VERSION_17
    targetCompatibility JavaVersion.VERSION_17
}
```

在 `dependencies {}` 中添加 Kotlin 协程：
```gradle
// Kotlin coroutines dependencies for Capacitor plugins (Geolocation, Filesystem, etc.)
implementation "org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1"
implementation "org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.1"
```

### C. 修改 `android/gradle/wrapper/gradle-wrapper.properties`

```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.11.1-all.zip
```

### D. 确认 `android/variables.gradle`

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

---

## 四、构建 APK

### 方法一：命令行构建

```bash
cd android
.\gradlew clean
.\gradlew assembleDebug
```

### 方法二：使用 npm 脚本

在 `package.json` 中添加脚本后：
```bash
npm run cap:sync    # 构建 + 同步
npm run cap:build   # 构建 Debug APK
npm run cap:release # 构建 Release APK
```

---

## 五、输出位置

生成的 APK 位于：
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 六、常见问题解决

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `无效的源发行版: 21` | JDK 版本不匹配 | 设置 `JavaVersion.VERSION_17` |
| `Duplicate class kotlin.xxx` | Kotlin 版本冲突 | 使用 `resolutionStrategy.force` 统一版本到 `1.9.24` |
| `Unresolved reference: async` | 缺少协程依赖 | 添加 `kotlinx-coroutines-android:1.8.1` |
| `Could not resolve kotlin-stdlib-jdk8` | Kotlin stdlib 版本冲突 | 强制统一所有 kotlin-stdlib 版本 |

---

## 七、版本兼容表 (已验证)

| 组件 | 版本 |
|------|------|
| JDK | 17 |
| Gradle | 8.11.1 |
| Android Gradle Plugin | 8.7.2 |
| Kotlin | 1.9.24 |
| Capacitor | 6.2.0 |
| compileSdkVersion | 35 |
| targetSdkVersion | 35 |
| minSdkVersion | 23 |
