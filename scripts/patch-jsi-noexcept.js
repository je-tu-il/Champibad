const fs = require('fs');
const path = require('path');

function patchJsiFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Pattern to replace move constructor and move assignment operator without noexcept
    const types = ['PropNameID', 'Symbol', 'BigInt', 'String', 'Object', 'WeakObject'];
    for (const t of types) {
      // Move constructor: T(T&& other) = default; -> T(T&& other) noexcept = default;
      const ctorRegex = new RegExp(`(${t}\\s*\\(\\s*${t}\\s*&&\\s*\\w+\\s*\\))(?!\\s*noexcept)(\\s*=\\s*default\\s*;)`, 'g');
      if (ctorRegex.test(content)) {
        content = content.replace(ctorRegex, '$1 noexcept$2');
        modified = true;
      }

      // Move assignment: T& operator=(T&& other) = default; -> T& operator=(T&& other) noexcept = default;
      const assignRegex = new RegExp(`(${t}\\s*&\\s*operator=\\s*\\(\\s*${t}\\s*&&\\s*\\w+\\s*\\))(?!\\s*noexcept)(\\s*=\\s*default\\s*;)`, 'g');
      if (assignRegex.test(content)) {
        content = content.replace(assignRegex, '$1 noexcept$2');
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Patched jsi.h with noexcept move semantics: ${path.relative(path.join(__dirname, '..'), filePath)}`);
      return true;
    } else {
      console.log(`ℹ️ jsi.h already up to date or no change needed: ${path.relative(path.join(__dirname, '..'), filePath)}`);
      return true;
    }
  } catch (err) {
    console.error(`⚠️ Error processing ${filePath}:`, err.message);
    return false;
  }
}

// Find all jsi.h files in node_modules and ios
function findAndPatchJsiHeaders(rootDir) {
  if (!fs.existsSync(rootDir)) return;
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '.git' || entry.name === '.build' || entry.name === '.DerivedData') continue;
      findAndPatchJsiHeaders(fullPath);
    } else if (entry.name === 'jsi.h') {
      patchJsiFile(fullPath);
    }
  }
}

const baseDir = path.join(__dirname, '..');
const candidatePaths = [
  path.join(baseDir, 'node_modules', 'react-native', 'ReactCommon', 'jsi', 'jsi', 'jsi.h'),
  path.join(baseDir, 'ios', 'Pods', 'Headers', 'Public', 'React-jsi', 'jsi', 'jsi.h'),
  path.join(baseDir, 'ios', 'Pods', 'Headers', 'Private', 'React-jsi', 'jsi', 'jsi.h'),
  path.join(baseDir, 'ios', 'Pods', 'React-jsi', 'jsi', 'jsi.h')
];

for (const p of candidatePaths) {
  patchJsiFile(p);
  try {
    if (fs.existsSync(p)) {
      const real = fs.realpathSync(p);
      if (real !== p) patchJsiFile(real);
    }
  } catch (e) {}
}

const searchDirs = [
  path.join(baseDir, 'node_modules', 'react-native'),
  path.join(baseDir, 'ios', 'Pods')
];

for (const d of searchDirs) {
  findAndPatchJsiHeaders(d);
}
