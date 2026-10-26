plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "il.captainfoody.app"
    // Google Play requires new apps and updates to target Android 16 (API 36) from 31 Aug 2026.
    compileSdk = 36

    defaultConfig {
        applicationId = "il.captainfoody.app"
        minSdk = 26
        targetSdk = 36
        // On GitHub every build gets the next number automatically (Play requires a new number per upload).
        versionCode = System.getenv("VERSION_CODE")?.toIntOrNull() ?: 1
        versionName = "1.0.${System.getenv("VERSION_CODE") ?: "0"}"
    }

    // The upload key comes only from encrypted GitHub secrets (see GITHUB-GUIDE.md).
    // It is never stored in the project.
    val ciKeystore = System.getenv("SIGNING_STORE_FILE")
    signingConfigs {
        if (ciKeystore != null) {
            create("release") {
                storeFile = file(ciKeystore)
                storePassword = System.getenv("SIGNING_STORE_PASSWORD")
                keyAlias = System.getenv("SIGNING_KEY_ALIAS")
                keyPassword = System.getenv("SIGNING_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            // R8: shrink, optimize and obfuscate the Kotlin code; drop unused resources.
            isMinifyEnabled = true
            isShrinkResources = true
            isDebuggable = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            // Signed with the upload key on GitHub; Google re-signs with the app key (Play App Signing).
            signingConfig = signingConfigs.findByName("release")
        }
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        buildConfig = true
    }

    packaging {
        resources.excludes += setOf("META-INF/*.kotlin_module", "DebugProbesKt.bin")
    }

    dependenciesInfo {
        // Keep the dependency metadata block for Play's SDK index checks,
        // but do not embed it in APKs installed outside Play.
        includeInApk = false
        includeInBundle = true
    }
}

kotlin {
    jvmToolchain(17)
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.activity.ktx)
    implementation(libs.androidx.webkit)
}
