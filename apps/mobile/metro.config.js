const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Keep Expo defaults and add monorepo root.
config.watchFolders = Array.from(
  new Set([...(config.watchFolders ?? []), monorepoRoot])
);

// Resolve modules from both project and monorepo root, without dropping defaults.
config.resolver.nodeModulesPaths = [
  ...new Set([
    ...(config.resolver.nodeModulesPaths ?? []),
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(monorepoRoot, 'node_modules'),
  ]),
];

// Make sure source resolution works for monorepo packages
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
