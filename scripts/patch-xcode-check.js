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

// 4. Patch Swift files: replace `weak let` with `nonisolated(unsafe) weak var` and add `@unchecked Sendable`
function patchSwiftSourcesInDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      patchSwiftSourcesInDir(fullPath);
    } else if (entry.name.endsWith('.swift')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      // 4a. Fix `weak let` or `weak var runtime` without nonisolated(unsafe)
      if (/(?<!nonisolated\(unsafe\)\s+)(private|internal)\s+weak\s+(let|var)\s+runtime/.test(content)) {
        content = content.replace(/(?<!nonisolated\(unsafe\)\s+)(private|internal)\s+weak\s+(let|var)\s+runtime/g, 'nonisolated(unsafe) $1 weak var runtime');
        modified = true;
      }

      // 4b. Fix `weak let` or `weak var appContext` without nonisolated(unsafe)
      if (/(?<!nonisolated\(unsafe\)\s+)(private|internal)\s+weak\s+(let|var)\s+appContext/.test(content)) {
        content = content.replace(/(?<!nonisolated\(unsafe\)\s+)(private|internal)\s+weak\s+(let|var)\s+appContext/g, 'nonisolated(unsafe) $1 weak var appContext');
        modified = true;
      }

      // 4c. Any remaining bare `weak let`
      if (content.includes('weak let')) {
        content = content.replace(/weak\s+let\b/g, 'weak var');
        modified = true;
      }

      // 4d. Add @unchecked Sendable to class definitions with weak stored properties
      if (entry.name === 'JavaScriptPropNameID.swift') {
        if (content.includes('class JavaScriptPropNameID: JavaScriptType {') && !content.includes('@unchecked Sendable')) {
          content = content.replace('class JavaScriptPropNameID: JavaScriptType {', 'class JavaScriptPropNameID: JavaScriptType, @unchecked Sendable {');
          modified = true;
        }
      }

      if (entry.name === 'JavaScriptError.swift') {
        if (content.includes('class JavaScriptError: Error, Sendable {')) {
          content = content.replace('class JavaScriptError: Error, Sendable {', 'class JavaScriptError: Error, @unchecked Sendable {');
          modified = true;
        }
      }

      if (entry.name === 'JavaScriptValue.swift') {
        if (content.includes('class JavaScriptValue: JavaScriptType, Equatable, Escapable {') && !content.includes('@unchecked Sendable')) {
          content = content.replace('class JavaScriptValue: JavaScriptType, Equatable, Escapable {', 'class JavaScriptValue: JavaScriptType, Equatable, Escapable, @unchecked Sendable {');
          modified = true;
        }
      }

      if (entry.name === 'SharedObjectRegistry.swift') {
        if (content.includes('class SharedObjectRegistry: Sendable {')) {
          content = content.replace('class SharedObjectRegistry: Sendable {', 'class SharedObjectRegistry: @unchecked Sendable {');
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Patched Swift concurrency in ${path.relative(path.join(__dirname, '..'), fullPath)}`);
      }
    }
  }
}

patchSwiftSourcesInDir(path.join(__dirname, '..', 'node_modules', 'expo-modules-jsi'));
patchSwiftSourcesInDir(path.join(__dirname, '..', 'node_modules', 'expo-modules-core'));

// 5. Patch trailing comma and vector.push_back in JavaScriptRuntime.swift
const jsRuntimePath = path.join(__dirname, '..', 'node_modules', 'expo-modules-jsi', 'apple', 'Sources', 'ExpoModulesJSI', 'Runtime', 'JavaScriptRuntime.swift');
if (fs.existsSync(jsRuntimePath)) {
  let content = fs.readFileSync(jsRuntimePath, 'utf8');
  let modified = false;

  if (content.includes('_ arguments: consuming JavaScriptValuesBuffer,')) {
    content = content.replace('_ arguments: consuming JavaScriptValuesBuffer,', '_ arguments: consuming JavaScriptValuesBuffer');
    modified = true;
    console.log('✅ Removed invalid trailing comma in JavaScriptRuntime.swift');
  }

  if (content.includes('vector.push_back(consuming: propNameId)')) {
    content = content.replace('vector.push_back(consuming: propNameId)', 'vector.push_back(propNameId)');
    modified = true;
    console.log('✅ Patched vector.push_back without consuming: label in JavaScriptRuntime.swift');
  }

  if (modified) {
    fs.writeFileSync(jsRuntimePath, content, 'utf8');
  }
}

// 6. Patch Task+immediate.swift (remove Task.immediate and unsupported name: label in Swift 6.1)
const taskImmediatePath = path.join(__dirname, '..', 'node_modules', 'expo-modules-jsi', 'apple', 'Sources', 'ExpoModulesJSI', 'Extensions', 'Task+immediate.swift');
if (fs.existsSync(taskImmediatePath)) {
  let content = fs.readFileSync(taskImmediatePath, 'utf8');
  if (content.includes('Task.immediate(') || content.includes('Task(name: name,')) {
    content = content.replace(/if\s+#available\(macOS[\s\S]*?\}\s*else\s*\{[\s\S]*?return Task\(name: name, priority: \.high, operation: operation\)[\s\S]*?\}/, 'return Task(priority: priority ?? .high, operation: operation)');
    fs.writeFileSync(taskImmediatePath, content, 'utf8');
    console.log('✅ Patched Task+immediate.swift for Swift 6.1 Task compatibility');
  }
}

// 7. Patch C++ headers: remove `explicit` constructors for Swift C++ interop
const cppHeaders = [
  path.join(__dirname, '..', 'node_modules', 'expo-modules-jsi', 'apple', 'Sources', 'ExpoModulesJSI-Cxx', 'include', 'HostFunctionClosure.h'),
  path.join(__dirname, '..', 'node_modules', 'expo-modules-jsi', 'apple', 'Sources', 'ExpoModulesJSI-Cxx', 'include', 'RetainedSwiftPointer.h'),
  path.join(__dirname, '..', 'node_modules', 'expo-modules-jsi', 'apple', 'Sources', 'ExpoModulesJSI-Cxx', 'include', 'HostObjectCallbacks.h')
];

for (const headerPath of cppHeaders) {
  if (fs.existsSync(headerPath)) {
    let content = fs.readFileSync(headerPath, 'utf8');
    if (content.includes('explicit ')) {
      content = content.replace(/explicit\s+/g, '');
      fs.writeFileSync(headerPath, content, 'utf8');
      console.log(`✅ Removed explicit constructor qualifier in ${path.relative(path.join(__dirname, '..'), headerPath)}`);
    }
  }
}
