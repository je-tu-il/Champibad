const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const podfilePath = path.join(__dirname, '..', 'ios', 'Podfile');
if (!fs.existsSync(podfilePath)) {
  console.log('ℹ️ Podfile not found, skipping Podfile Swift patch.');
  process.exit(0);
}

let xcodeMajor = 16;
try {
  const versionOutput = execSync('xcodebuild -version', { encoding: 'utf8' });
  const match = versionOutput.match(/Xcode\s+(\d+)/i);
  if (match) {
    xcodeMajor = parseInt(match[1], 10);
  }
} catch (e) {
  // If xcodebuild is not available (e.g. running on Windows during build script checks)
}

console.log(`Detected Xcode major version: ${xcodeMajor}`);

if (xcodeMajor < 16) {
  console.log('⚡ Xcode < 16 detected: Patching Podfile to set SWIFT_VERSION = 5.0 for compatibility...');
  let content = fs.readFileSync(podfilePath, 'utf8');
  const swiftOverride = `
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        if config.build_settings['SWIFT_VERSION'] == '6.0' || target.name == 'Expo'
          config.build_settings['SWIFT_VERSION'] = '5.0'
        end
      end
    end
`;
  if (content.includes('post_install do |installer|')) {
    content = content.replace('post_install do |installer|', 'post_install do |installer|' + swiftOverride);
  } else {
    content += `\npost_install do |installer|\n${swiftOverride}\nend\n`;
  }
  fs.writeFileSync(podfilePath, content, 'utf8');
  console.log('✅ Podfile patched with SWIFT_VERSION 5.0 fallback.');
} else {
  console.log('✅ Xcode >= 16 detected: Swift 6.0 is natively supported.');
}
