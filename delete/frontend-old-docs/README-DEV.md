# VOSE Movies - Development Build

This is the development build of VOSE Movies, configured to work with Expo's development client.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

This will start the Expo dev client server. You can then:
- Press `a` to open on Android
- Press `i` to open on iOS
- Scan the QR code with Expo Go (development build)

## Key Differences from Production

- **App Name**: "VOSE Movies DEV" (vs "VOSE Movies")
- **Slug**: `vose-movies-dev` (vs `vose-movies`)
- **Version**: `1.0.0-dev`
- **Dev Client**: Uses `--dev-client` flag for development builds
- **Separate Installation**: Can be installed alongside production version

## Building

To create a development build:
```bash
# Android
eas build --profile development --platform android

# iOS
eas build --profile development --platform ios
```

## Folder Structure

- `/home/squareyes/VOSEMovies` - Production version
- `/home/squareyes/VOSEMovies-dev` - Development version (this folder)
