# SatsKeeper Mobile App (Flutter.)

This repo compiles a native Android APK and an unsigned iOS IPA entirely on GitHub Actions. No local Android Studio or Xcode required.

## 1. Edit your config
Open `lib/config.dart` and replace the placeholders with your Vercel URL and APP_KEY.

## 2. Push to GitHub
Upload this entire folder to a new GitHub repository.

## 3. Wait for the build
1. Go to the **Actions** tab in your GitHub repo.
2. You will see a workflow running called "Build Native Apps".
3. Wait about 3-5 minutes.

## 4. Download your apps
1. Click on the completed workflow run.
2. Scroll down to the **Artifacts** section.
3. Download `SatsKeeper-Android-APK` (install directly on Android).
4. Download `SatsKeeper-iOS-IPA` (install on iOS using AltStore or Sideloadly).

## Note for iOS
Because we are not using a $99 Apple Developer account, the iOS app is unsigned. You must use a free tool like [AltStore](https://altstore.io/) or [Sideloadly](https://sideloadly.io/) to sign and install the `.ipa` file on your iPhone.
