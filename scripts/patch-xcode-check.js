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
