# MuckAway.ai Mobile App Build Guide

This guide explains how to build native iOS and Android apps from the MuckAway.ai PWA using Capacitor.

## Prerequisites

### For iOS Development (Mac only)
- macOS 12+ (Monterey or later)
- Xcode 14+ (from Mac App Store)
- Xcode Command Line Tools: `xcode-select --install`
- CocoaPods: `sudo gem install cocoapods`
- Apple Developer Account ($99/year) for App Store submission

### For Android Development (Windows/Mac/Linux)
- Android Studio (latest stable version)
- Java Development Kit (JDK) 17+
- Android SDK (installed via Android Studio)
- Google Play Developer Account ($25 one-time) for Play Store submission

## Step 1: Export Project to GitHub

1. In Lovable, click **Settings** → **GitHub**
2. Click **Connect to GitHub** and authorize
3. Click **Create Repository** to push code to your GitHub account

## Step 2: Clone and Setup Locally

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/muckaway-ai.git
cd muckaway-ai

# Install dependencies
npm install

# Build the web app
npm run build
```

## Step 3: Add Native Platforms

```bash
# Add iOS platform (Mac only)
npx cap add ios

# Add Android platform
npx cap add android

# Sync web assets to native projects
npx cap sync
```

## Step 4: Configure App Icons & Splash Screens

### iOS Icons
Place icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`:
- 1024x1024 (App Store)
- 180x180, 167x167, 152x152, 120x120, 87x87, 80x80, 76x76, 60x60, 58x58, 40x40, 29x29, 20x20

### Android Icons
Place adaptive icons in `android/app/src/main/res/`:
- `mipmap-xxxhdpi` (192x192)
- `mipmap-xxhdpi` (144x144)
- `mipmap-xhdpi` (96x96)
- `mipmap-hdpi` (72x72)
- `mipmap-mdpi` (48x48)

### Splash Screens
Configure in `capacitor.config.json` (already done):
```json
{
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#000000",
      "showSpinner": true,
      "spinnerColor": "#FFD700"
    }
  }
}
```

## Step 5: Build for iOS

```bash
# Open iOS project in Xcode
npx cap open ios
```

In Xcode:
1. Select your Apple Developer Team in **Signing & Capabilities**
2. Set Bundle Identifier to `ai.muckaway.app`
3. Select target device or simulator
4. Click **Product** → **Build** (⌘B)
5. For App Store: **Product** → **Archive**

### iOS Info.plist Keys
Add to `ios/App/App/Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>MuckAway.ai needs camera access to photograph waste materials for AI classification</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>MuckAway.ai needs photo library access to upload images for waste analysis</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>MuckAway.ai uses your location to provide accurate local pricing and regulations</string>
<key>NSMicrophoneUsageDescription</key>
<string>MuckAway.ai uses the microphone for voice-activated quoting with MuckBot Pro</string>
```

## Step 6: Build for Android

```bash
# Open Android project in Android Studio
npx cap open android
```

In Android Studio:
1. Wait for Gradle sync to complete
2. Set Application ID to `ai.muckaway.app` in `build.gradle`
3. Select device/emulator
4. Click **Run** (▶️)
5. For Play Store: **Build** → **Generate Signed Bundle/APK**

### Android Permissions
Already configured in `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
```

## Step 7: Generate Signing Keys

### iOS
1. Create App ID in Apple Developer Portal
2. Create Provisioning Profile (Distribution)
3. Create Signing Certificate
4. Import into Xcode Keychain

### Android
```bash
# Generate release keystore
keytool -genkey -v -keystore muckaway-release.keystore -alias muckaway -keyalg RSA -keysize 2048 -validity 10000

# Store securely - you need this for ALL future updates!
```

Configure in `android/app/build.gradle`:
```groovy
android {
    signingConfigs {
        release {
            storeFile file('muckaway-release.keystore')
            storePassword 'YOUR_STORE_PASSWORD'
            keyAlias 'muckaway'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

## Step 8: App Store Submission

### Apple App Store
1. Create app in App Store Connect
2. Fill in app metadata:
   - **Name**: MuckAway.ai
   - **Subtitle**: AI Waste Management Platform
   - **Category**: Business / Productivity
   - **Keywords**: waste management, muckaway, spoil removal, construction, AI, compliance
3. Upload screenshots (6.7", 6.5", 5.5" sizes)
4. Upload app from Xcode Organizer
5. Submit for review

### Google Play Store
1. Create app in Google Play Console
2. Fill in store listing:
   - **Title**: MuckAway.ai - AI Waste Management
   - **Short description**: Smart waste management with AI classification
   - **Category**: Business
3. Upload screenshots (phone and tablet)
4. Upload AAB from Android Studio
5. Submit for review

## App Store Descriptions

### Short Description (80 chars)
```
AI-powered waste management: instant quotes, compliance automation, GPS tracking
```

### Full Description
```
MuckAway.ai is the world's leading AI-powered waste management platform, trusted by construction companies across 11 countries.

🤖 REVOLUTIONARY AI FEATURES
• Voice AI (MuckBot Pro) - Book jobs hands-free from your excavator cab
• Image Analysis - Upload photos for instant AI spoil classification
• Weighbridge OCR - Automatic data extraction from tickets
• Smart Chatbot - Get instant answers and generate quotes

📱 COMPLETE OPERATIONS MANAGEMENT
• Real-time GPS fleet tracking with route optimization
• Gantt chart job scheduling
• Subcontractor management with ratings
• Customer credit limits and payment tracking
• Environmental sustainability reports

✅ AUTOMATED COMPLIANCE
• Region-specific waste regulations (UK, US, EU, AU, CA, NZ)
• EWC codes and duty of care documentation
• Automated landfill tax calculations
• Digital consignment notes

💰 INSTANT PRICING
• AI-powered spoil classification
• Real-time quotes in your local currency
• Multi-tier subscription plans
• Transparent pricing with no hidden fees

🌍 GLOBAL COVERAGE
Operating in United Kingdom, United States, European Union, Australia, Canada, New Zealand, Brazil, India, Singapore, UAE, and South Africa.

Download now and transform your waste management operations with AI!
```

## Troubleshooting

### iOS Build Errors
- **Signing error**: Ensure correct provisioning profile is selected
- **Pod install failed**: Run `cd ios/App && pod install --repo-update`
- **Minimum deployment**: Set iOS deployment target to 13.0+

### Android Build Errors
- **Gradle sync failed**: Update Android Gradle Plugin in Android Studio
- **SDK not found**: Install required SDK via SDK Manager
- **Keystore issues**: Verify keystore path and passwords

### General Issues
- **White screen**: Run `npx cap sync` after any code changes
- **Plugin not working**: Verify plugin is listed in `capacitor.config.json`
- **Hot reload not working**: Check `server.url` in config

## Updating the App

After making changes in Lovable:

```bash
# Pull latest changes
git pull origin main

# Rebuild and sync
npm run build
npx cap sync

# Open and rebuild in IDE
npx cap open ios   # or android
```

## Support

- Documentation: https://capacitorjs.com/docs
- MuckAway.ai Support: support@muckaway.ai
- Lovable Docs: https://docs.lovable.dev/tips-tricks/native-mobile-development
