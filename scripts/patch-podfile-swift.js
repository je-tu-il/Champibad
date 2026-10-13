const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const podfilePath = path.join(__dirname, '..', 'ios', 'Podfile');
if (!fs.existsSync(podfilePath)) {
  console.log('ℹ️ Podfile not found, skipping Podfile compatibility patch.');
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

let content = fs.readFileSync(podfilePath, 'utf8');

// Always enforce C++17 and libc++ on all Pods targets to avoid std::__construct_at issues with jsi types
const cxxAndSwiftFixes = `
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
        config.build_settings['CLANG_CXX_LIBRARY'] = 'libc++'
        ${xcodeMajor < 16 ? `
        if config.build_settings['SWIFT_VERSION'] == '6.0' || target.name == 'Expo'
          config.build_settings['SWIFT_VERSION'] = '5.0'
        end` : ''}
      end
    end
`;

if (content.includes('post_install do |installer|')) {
  content = content.replace('post_install do |installer|', 'post_install do |installer|' + cxxAndSwiftFixes);
} else {
  content += `\npost_install do |installer|\n${cxxAndSwiftFixes}\nend\n`;
}

fs.writeFileSync(podfilePath, content, 'utf8');
console.log('✅ Podfile patched with C++17 standard and compiler settings.');
