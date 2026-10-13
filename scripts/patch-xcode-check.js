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
