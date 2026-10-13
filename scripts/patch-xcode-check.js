const fs = require('fs');
const path = require('path');

// 1. Patch helpers.rb (lower minimum Xcode requirement to 15.0)
const helpersPath = path.join(__dirname, '..', 'node_modules', 'react-native', 'scripts', 'cocoapods', 'helpers.rb');
if (fs.existsSync(helpersPath)) {
  let content = fs.readFileSync(helpersPath, 'utf8');
  content = content.replace(/return ['"]16\.\d+['"]/g, "return '15.0'");
  fs.writeFileSync(helpersPath, content, 'utf8');
  console.log('✅ helpers.rb patched: min_xcode_version set to 15.0');
}

// 2. Patch utils.rb (bypass strict raise "Please upgrade XCode")
const utilsPath = path.join(__dirname, '..', 'node_modules', 'react-native', 'scripts', 'cocoapods', 'utils.rb');
if (fs.existsSync(utilsPath)) {
  let content = fs.readFileSync(utilsPath, 'utf8');
  if (content.includes('raise "Please upgrade XCode"')) {
    content = content.replace(/raise\s+["']Please upgrade XCode["']/g, '# raise "Please upgrade XCode" (bypassed for CI)');
    fs.writeFileSync(utilsPath, content, 'utf8');
    console.log('✅ utils.rb patched: Xcode version check bypassed');
  } else {
    console.log('ℹ️ utils.rb already patched or check not present');
  }
}

// 3. Patch Swift Package Manager tools version (downgrade swift-tools-version 6.2 to 6.0 for Swift 6.1 compatibility)
const packageSwiftFiles = [
  path.join(__dirname, '..', 'node_modules', 'expo-modules-jsi', 'apple', 'Package.swift'),
  path.join(__dirname, '..', 'node_modules', '@expo', 'expo-modules-macros-plugin', 'apple', 'Package.swift')
];

for (const pkgPath of packageSwiftFiles) {
  if (fs.existsSync(pkgPath)) {
    let content = fs.readFileSync(pkgPath, 'utf8');
    let modified = false;

    if (content.includes('swift-tools-version: 6.2')) {
      content = content.replace(/swift-tools-version:\s*6\.2/g, 'swift-tools-version: 6.0');
      modified = true;
    }

    if (content.includes('602.0.0-latest')) {
      content = content.replace(/602\.0\.0-latest/g, '600.0.0');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(pkgPath, content, 'utf8');
      console.log(`✅ Patched Package.swift in ${path.relative(path.join(__dirname, '..'), pkgPath)} (swift-tools-version set to 6.0)`);
    } else {
      console.log(`ℹ️ Package.swift in ${path.relative(path.join(__dirname, '..'), pkgPath)} already up to date`);
    }
  }
}

// 4. Patch Swift files: replace invalid `weak let` with `weak var` (Swift < 6.2 compatibility)
function patchWeakLetInDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      patchWeakLetInDir(fullPath);
    } else if (entry.name.endsWith('.swift')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('weak let')) {
        content = content.replace(/weak\s+let\b/g, 'weak var');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Patched weak let -> weak var in ${path.relative(path.join(__dirname, '..'), fullPath)}`);
      }
    }
  }
}

patchWeakLetInDir(path.join(__dirname, '..', 'node_modules', 'expo-modules-jsi'));
patchWeakLetInDir(path.join(__dirname, '..', 'node_modules', 'expo-modules-core'));

// 5. Patch trailing comma before closing parenthesis in JavaScriptRuntime.swift
const jsRuntimePath = path.join(__dirname, '..', 'node_modules', 'expo-modules-jsi', 'apple', 'Sources', 'ExpoModulesJSI', 'Runtime', 'JavaScriptRuntime.swift');
if (fs.existsSync(jsRuntimePath)) {
  let content = fs.readFileSync(jsRuntimePath, 'utf8');
  // Match `_ arguments: consuming JavaScriptValuesBuffer,` followed by newline and `)`
  if (content.includes('_ arguments: consuming JavaScriptValuesBuffer,')) {
    content = content.replace('_ arguments: consuming JavaScriptValuesBuffer,', '_ arguments: consuming JavaScriptValuesBuffer');
    fs.writeFileSync(jsRuntimePath, content, 'utf8');
    console.log('✅ Removed invalid trailing comma in JavaScriptRuntime.swift');
  } else {
    console.log('ℹ️ JavaScriptRuntime.swift trailing comma already fixed');
  }
}
