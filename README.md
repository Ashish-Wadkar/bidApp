This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

## USB device not connecting properly

If your phone is plugged in via USB but `yarn android` says **No online devices** or the device shows **offline** or **unauthorized** in `adb devices`:

### 1. On the phone

- **Enable Developer options**: Settings → About phone → tap **Build number** 7 times.
- **Enable USB debugging**: Settings → Developer options → **USB debugging** → ON.
- **Use a data cable**: Some cables are charge-only; try another cable or port.
- **Choose “File transfer” (MTP)** when the USB notification appears (not “Charging only”).
- **Accept the “Allow USB debugging?”** popup and check “Always allow from this computer” if you see it.

### 2. On Windows (PC)

- **Install/update USB driver**:
  - Install [Google USB Driver](https://developer.android.com/studio/run/win-usb) or use your phone’s official USB driver (Samsung, Xiaomi, etc.).
  - Or in Android Studio: **Settings → Appearance & Behavior → System Settings → Android SDK → SDK Tools** → check **Google USB Driver** → Apply.
- **Try another USB port**: Prefer a direct port on the PC (not through a hub).
- **Unplug and plug again** after changing settings; wait for the “USB debugging” prompt on the phone.

### 3. Reset ADB and check devices

Run from the project root:

```sh
# See current status
yarn android:devices

# If device is offline/unauthorized: restart ADB, then list again
yarn android:reconnect
```

Or run manually:

```sh
adb kill-server
adb start-server
adb devices
```

You want one line like `XXXXXXXX    device` (not `offline` or `unauthorized`).

### 4. If it still shows “unauthorized”

- Unplug the USB cable.
- On the phone: Settings → Developer options → **Revoke USB debugging authorizations**.
- Plug the cable back in and accept the “Allow USB debugging?” dialog again.
- Run `yarn android:devices` (or `adb devices`) and check for `device`.

### 5. Run the app

When `adb devices` shows your device as `device`, run:

```sh
yarn android
```

---

## "No online devices found" or "Failed to launch emulator"

When `yarn android` fails with **No online devices found** or **The emulator (Pixel_7) quit before it finished opening**:

1. **Build the APK without a device** (no emulator or USB device needed):
   ```sh
   yarn build:android
   ```
   The debug APK is created at `android/app/build/outputs/apk/debug/app-debug.apk`. You can install it later when a device or emulator is available.

2. **To run on a device or emulator**, ensure one is online first:
   - **Emulator**: Start it manually from Android Studio (Device Manager) or run:
     ```sh
     C:\Users\<You>\AppData\Local\Android\Sdk\emulator\emulator -avd Pixel_7
     ```
   - **Physical device**: Follow the **USB device not connecting properly** steps above, then run `yarn android:devices` to confirm it shows `device`.

3. Then run:
   ```sh
   yarn android
   ```

If you're having other issues, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
