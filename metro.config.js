const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Expo SDK 57 / Metro package-exports can pick the wrong @supabase/auth-js
// build (missing ./base64url). Prefer the CJS/browser entry.
config.resolver.unstable_enablePackageExports = false;
config.resolver.unstable_conditionNames = ['browser', 'require', 'react-native'];

module.exports = config;
