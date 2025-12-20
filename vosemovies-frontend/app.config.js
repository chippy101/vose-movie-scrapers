module.exports = {
  expo: {
    name: "Popcorn Pal",
    slug: "popcornpal",
    version: "1.1.0",
    orientation: "default",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#1a1d3a"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.popcornpal.app",
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "Popcorn Pal needs your location to show nearby cinemas and sort them by distance.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "Popcorn Pal needs your location to show nearby cinemas and sort them by distance."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#1a1d3a"
      },
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION"
      ],
      usesCleartextTraffic: true,
      edgeToEdgeEnabled: false,
      predictiveBackGestureEnabled: false,
      package: "com.popcornpal.app",
      versionCode: 3
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "your-project-id-will-be-added-by-eas"
      },
      // Inject environment variables at build time
      EXPO_PUBLIC_BACKEND_URL: process.env.EXPO_PUBLIC_BACKEND_URL || "http://192.168.50.138:8000",
      EXPO_PUBLIC_TMDB_API_KEY: process.env.EXPO_PUBLIC_TMDB_API_KEY || "0cd89e13a33c9f826727e1e8484fcb2b"
    }
  }
};
