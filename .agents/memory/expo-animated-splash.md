---
name: Expo animated splash
description: Pattern for animated launch branding in the Expo artifact
---

The native Expo splash screen is static. Animated launch branding must run as a full-screen app overlay after the static splash is hidden, then dismiss itself after the complete sequence.

**Why:** Native splash configuration cannot render a multi-step tile animation, while an overlay can use React Native Animated and works in the web preview as well.

**How to apply:** Keep the system splash as a simple fallback image, mount the animated overlay after fonts/providers are ready, and use a deterministic completion callback so the app is revealed only after the final branding frame.