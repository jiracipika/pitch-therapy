const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all packages in the monorepo
config.watchFolders = [monorepoRoot];

// Resolve modules from both project and monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Ensure Metro resolves platform-specific extensions (.native.ts, .android.ts)
// from symlinked/hoisted monorepo packages
config.resolver.platforms = ['android', 'native', 'web'];

// Make sure source resolution works for monorepo packages
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
