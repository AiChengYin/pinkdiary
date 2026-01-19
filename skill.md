---
name: build_input_apk
description: Utilizes Capacitor to wrap a React web application into an Android APK, automatically handling JDK 17 compatibility and Kotlin version conflicts.
---

# React to Android APK Build Skill

此 Skill用于一步步将 React 应用转换为 Android APK。

## Prerequisites
- Node.js installed
- JDK 17 installed and `JAVA_HOME` set
- Android SDK installed (path set in `ANDROID_HOME`)

## Workflow Instructions

### 1. Setup Capacitor
Run the following commands to install dependencies and initialize resources:
```powershell
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "[AppName]" "[com.example.app]" --web-dir=dist
npx cap add android
```

### 2. Build & Sync
Ensure the web assets are built and copied to the Android project:
```powershell
npm run build
npx cap sync android
```

### 3. Apply Fixes (Critical)

#### Fix 1: Force Java 17 Compatibility
Edit `android/app/build.gradle`. Inside the `android { ... }` block, add:
```gradle
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
```
*Also apply this logic to `android/build.gradle` inside `allprojects { ... }` if necessary.*

#### Fix 2: Resolve Kotlin Version Conflicts
Edit `android/build.gradle` (Project level). Inside `allprojects { ... }`, add a resolution strategy to force a specific Kotlin version:
```gradle
    configurations.all {
        resolutionStrategy {
            force 'org.jetbrains.kotlin:kotlin-stdlib:1.8.22'
            force 'org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.8.22'
            force 'org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.8.22'
        }
    }
```

#### Fix 3: Inconsistent JVM Target (Java 17 vs Kotlin 21)
In `android/build.gradle` (allprojects > afterEvaluate), add this dynamic task configuration to match Kotlin tasks without explicit class references:
```gradle
        // Fix for Kotlin version conflict using dynamic task configuration
        project.tasks.matching { it.name.startsWith('compile') && it.name.endsWith('Kotlin') }.configureEach {
            kotlinOptions {
                jvmTarget = "17"
            }
        }
```

### 4. Build APK
Navigate to the android folder and build using Gradle wrapper:
```powershell
cd android
.\gradlew clean
.\gradlew assembleDebug
```

### 5. Verify Output
Locate the APK at:
`android/app/build/outputs/apk/debug/app-debug.apk`

## Common Errors & Solutions

| Error Message | Solution |
|---------------|----------|
| `invalid source release: 21` | Ensure `compileOptions` in build.gradle is set to `JavaVersion.VERSION_17`. |
| `Duplicate class kotlin...` | Add the `resolutionStrategy` block to force unified Kotlin versions. |
| `Inconsistent JVM Target` | Use the dynamic task configuration block to force `jvmTarget = "17"`. |
| `SDK location not found` | Set `ANDROID_HOME` or create `local.properties` with `sdk.dir=...`. |
