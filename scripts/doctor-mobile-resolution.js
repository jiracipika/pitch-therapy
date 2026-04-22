const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const mobileRoot = path.join(repoRoot, 'apps', 'mobile');
const mobilePackageJsonPath = path.join(mobileRoot, 'package.json');

if (!fs.existsSync(mobilePackageJsonPath)) {
  console.error(`Missing mobile package at ${mobilePackageJsonPath}`);
  process.exit(1);
}

const mobilePackageJson = JSON.parse(fs.readFileSync(mobilePackageJsonPath, 'utf8'));
const expectedReact = mobilePackageJson.dependencies?.react;
const expectedReactNative = mobilePackageJson.dependencies?.['react-native'];

function getHermescPlatformExecutable() {
  switch (process.platform) {
    case 'darwin':
      return 'osx-bin/hermesc';
    case 'linux':
      return 'linux64-bin/hermesc';
    case 'win32':
      return 'win64-bin/hermesc.exe';
    default:
      throw new Error(`Unsupported platform for Hermes compiler: ${process.platform}`);
  }
}

function isInRepo(resolvedPath) {
  const relativePath = path.relative(repoRoot, resolvedPath);
  return !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
}

function resolvePackageJson(packageName, searchPaths, options = {}) {
  const { optional = false, label = packageName } = options;
  const lookup = `${packageName}/package.json`;
  let lastError = null;

  for (const searchPath of searchPaths) {
    try {
      const resolvedPath = require.resolve(lookup, { paths: [searchPath] });
      if (!isInRepo(resolvedPath)) {
        lastError = new Error(`${label} resolved outside repo root: ${resolvedPath}`);
        continue;
      }
      const packageJson = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
      return { version: packageJson.version, path: resolvedPath };
    } catch (error) {
      if (error.code !== 'MODULE_NOT_FOUND') {
        throw error;
      }
      lastError = error;
    }
  }

  if (optional) {
    return null;
  }

  throw lastError || new Error(`Could not resolve ${lookup}`);
}

function resolveModulePath(moduleId, searchPaths, options = {}) {
  const { optional = false, label = moduleId } = options;
  let lastError = null;

  for (const searchPath of searchPaths) {
    try {
      const resolvedPath = require.resolve(moduleId, { paths: [searchPath] });
      if (!isInRepo(resolvedPath)) {
        lastError = new Error(`${label} resolved outside repo root: ${resolvedPath}`);
        continue;
      }
      return resolvedPath;
    } catch (error) {
      if (error.code !== 'MODULE_NOT_FOUND') {
        throw error;
      }
      lastError = error;
    }
  }

  if (optional) {
    return null;
  }

  throw lastError || new Error(`Could not resolve ${moduleId}`);
}

function printResolved(name, resolved) {
  if (!resolved) {
    console.log(`${name}: (not installed)`);
    return;
  }
  console.log(`${name}: ${resolved.version} (${resolved.path})`);
}

function printResolvedPath(name, resolvedPath) {
  if (!resolvedPath) {
    console.log(`${name}: (not installed)`);
    return;
  }
  console.log(`${name}: ${resolvedPath}`);
}

const mobileReact = resolvePackageJson('react', [mobileRoot], { label: 'mobile react' });
const mobileReactNative = resolvePackageJson('react-native', [mobileRoot], {
  label: 'mobile react-native',
});
const mobileExpo = resolvePackageJson('expo', [mobileRoot], { label: 'mobile expo' });
const mobileExpoRouter = resolvePackageJson('expo-router', [mobileRoot], {
  label: 'mobile expo-router',
});
const expoReact = resolvePackageJson('react', [path.dirname(mobileExpo.path), mobileRoot], {
  label: 'expo react',
});
const expoRouterReact = resolvePackageJson(
  'react',
  [path.dirname(mobileExpoRouter.path), mobileRoot],
  { label: 'expo-router react' },
);
const rootReact = resolvePackageJson('react', [repoRoot], { label: 'root react', optional: true });
const rootReactNative = resolvePackageJson('react-native', [repoRoot], {
  label: 'root react-native',
  optional: true,
});
const hermescModuleId = `react-native/sdks/hermesc/${getHermescPlatformExecutable()}`;
const mobileHermesc = resolveModulePath(hermescModuleId, [mobileRoot], { label: 'mobile hermesc' });
const rootHermesc = resolveModulePath(hermescModuleId, [repoRoot], {
  label: 'root hermesc',
  optional: true,
});

printResolved('mobile react', mobileReact);
printResolved('expo react', expoReact);
printResolved('expo-router react', expoRouterReact);
printResolved('mobile react-native', mobileReactNative);
printResolved('root react', rootReact);
printResolved('root react-native', rootReactNative);
printResolvedPath('mobile hermesc', mobileHermesc);
printResolvedPath('root hermesc', rootHermesc);
printResolved('mobile expo', mobileExpo);
printResolved('mobile expo-router', mobileExpoRouter);

const errors = [];

if (expectedReact && mobileReact.version !== expectedReact) {
  errors.push(`mobile react expected ${expectedReact} but resolved ${mobileReact.version}`);
}
if (expectedReact && expoReact.version !== expectedReact) {
  errors.push(`expo resolved react ${expoReact.version}, expected ${expectedReact}`);
}
if (expectedReact && expoRouterReact.version !== expectedReact) {
  errors.push(`expo-router resolved react ${expoRouterReact.version}, expected ${expectedReact}`);
}
if (expectedReactNative && mobileReactNative.version !== expectedReactNative) {
  errors.push(
    `mobile react-native expected ${expectedReactNative} but resolved ${mobileReactNative.version}`,
  );
}
if (rootReact && expectedReact && rootReact.version !== expectedReact) {
  errors.push(
    `root react is ${rootReact.version} while mobile expects ${expectedReact} (hoisted Expo modules may bind to the wrong React)`,
  );
}
if (rootReactNative && expectedReactNative && rootReactNative.version !== expectedReactNative) {
  errors.push(
    `root react-native is ${rootReactNative.version} while mobile expects ${expectedReactNative}`,
  );
}

if (errors.length > 0) {
  console.error('\nMobile dependency resolution check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('\nMobile dependency resolution check passed.');
