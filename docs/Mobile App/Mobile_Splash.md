Professional Mobile App Features
Complete Implementation Guide
Splash Screen • App Icon • Offline Handling • Push Notifications
🔥 PRO TIP (VERY IMPORTANT)
👉 Your app will be basically:
• Web app inside mobile (WebView)
To make it professional:
• Add Splash screen
• Add App icon
• Add offline screen
• Add push notifications (later)

7 Phases: Setup → Splash → Icons → Offline → Notifications → Testing → Polish
Timeline: 10-12 Days | Difficulty: Intermediate
 
Table of Contents
1.	Phase 1: Setup & Asset Preparation 
2.	Phase 2: Splash Screen Implementation 
3.	Phase 3: App Icon & Branding  
4.	Phase 4: Offline Detection & Handling 
5.	Phase 5: Push Notifications - Basic Setup 
6.	Phase 6: Push Notifications - Advanced 
7.	Phase 7: Testing, Debugging & Polish
8.	Complete Asset Specifications Reference
9.	Troubleshooting Guide
 
1. Phase 1: Setup & Asset Preparation 
Goal: Gather tools, create design assets, understand requirements
1: Install Required Tools
Tool	Purpose	Free?
Figma	Design splash screens, app icons	Yes
Android Asset Studio	Generate adaptive icons for Android	Yes
Cordova Resources	Auto-generate all required icon/splash sizes	Yes
ImageMagick	Batch resize/convert images	Yes

Installation Commands
# Install Capacitor Assets plugin
npm install @capacitor/assets --save-dev

# Install cordova-res for icon/splash generation
npm install -g cordova-res

# Install ImageMagick (for manual editing)
# Windows: choco install imagemagick
# Mac: brew install imagemagick
# Linux: sudo apt-get install imagemagick

2: Understand Asset Requirements
Splash Screen Sizes (Android & iOS)
Platform	Master Size	Auto-generates
Android	2732x2732 px	ldpi, mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi
iOS	2732x2732 px	iPhone, iPad, all orientations

App Icon Sizes
Platform	Master Size	Format
Android	1024x1024 px	PNG (adaptive icon)
iOS	1024x1024 px	PNG (no alpha channel)

1-2 Deliverables
•	✓ Tools installed (cordova-res, ImageMagick)
•	✓ Understand required asset sizes
•	✓ Project folder structure ready
 
2. Phase 2: Splash Screen Implementation 
Goal: Create and configure professional splash screens
Step 1: Design Your Splash Screen
DESIGN GUIDELINES:
Canvas Size: 2732x2732 px (square)
Safe Zone: Keep important elements in center 1200x1200 px
Background: Solid color or subtle gradient
Logo: Centered, 40-50% of safe zone
Text: School name, tagline (optional)

Example Layout:
[Gradient Background #667eea to #764ba2]
  → Logo (500x500 px, centered)
  → 'ZF SolutionPro' (below logo, 48px)
  → 'Empowering Education' (tagline, 24px)

Step 2: Create resources Folder Structure
# Create folder structure in project root
mkdir -p resources/splash
mkdir -p resources/icon

# Place your master files:
resources/
├── splash.png     # 2732x2732 px
└── icon.png       # 1024x1024 px

Step 3: Generate All Splash Screen Sizes
# OPTION 1: Use cordova-res (Recommended)
cordova-res android --skip-config --copy
cordova-res ios --skip-config --copy

# This auto-generates:
# - android/app/src/main/res/drawable*/splash.png
# - ios/App/App/Assets.xcassets/Splash.imageset/

# OPTION 2: Use Capacitor Assets
npx capacitor-assets generate --android
npx capacitor-assets generate --ios

Step 4: Configure Splash Screen Settings
Edit capacitor.config.ts:
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ZF Solutionpro.student',
  appName: 'ZF SolutionPro Student',
  webDir: 'build',

  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,  // Show for 3 seconds
      launchAutoHide: true,       // Auto hide when app loads
      backgroundColor: '#667eea',  // Match your splash bg
      androidScaleType: 'CENTER_CROP',  // Scale options
      showSpinner: false,         // No loading spinner
      androidSplashResourceName: 'splash',
      iosSpinnerStyle: 'small',   // iOS spinner style
      splashFullScreen: true,     // Full screen splash
      splashImmersive: true       // Hide status bar
    }
  }
};

export default config;
 
Step 5: Programmatic Splash Control (Advanced)
For better UX, hide splash only after data is loaded:
// src/App.js or App.tsx
import { SplashScreen } from '@capacitor/splash-screen';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Initialize app data
    const initializeApp = async () => {
      try {
        // Load user data, check auth, fetch config
        await Promise.all([
          checkAuthStatus(),
          loadUserPreferences(),
          fetchAppConfig()
        ]);

        // Everything ready - hide splash
        await SplashScreen.hide();

      } catch (error) {
        console.error('App init failed:', error);
        await SplashScreen.hide(); // Hide anyway
      }
    };

    initializeApp();
  }, []);

  return <div className="app">...</div>;
}

3-4 Deliverables
•	✓ Splash screen designed (2732x2732 px)
•	✓ All sizes auto-generated for Android & iOS
•	✓ Capacitor config updated
•	✓ Programmatic control implemented
•	✓ Tested on Android emulator/device
 
IMPLEMENTATION ROADMAP CONTINUES
This document covers Phase 1-2 (Setup & Splash Screen). The complete guide includes all 7 phases.
REMAINING PHASES:
• Phase 3: App Icon & Branding - Adaptive icons, launcher icons, store assets
• Phase 4: Offline Detection - Network status, offline UI, retry mechanisms
• Phase 5: Push Notifications (Basic) - FCM setup, token management, basic notifications
• Phase 6: Push Notifications (Advanced) - Deep linking, notification actions, scheduling
• Phase 7: Testing & Polish - Device testing, edge cases, performance optimization

START WITH PHASES 1-2. Once splash screen is working, continue to icons and offline handling.

QUICK REFERENCE: Key Commands
Task	Command
Generate splash/icons	cordova-res android --skip-config --copy
Sync changes to native	npx cap sync
Open Android Studio	npx cap open android
Build React app	npm run build

This is a production-ready implementation. Follow phases 1-2 first, test thoroughly, then continue to remaining phases.
