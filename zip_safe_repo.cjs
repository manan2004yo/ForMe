const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = process.cwd();
const tempDir = path.join(rootDir, 'FORME_TEMP_ZIP_BUILD_SAFE');
const zipFile = path.join(rootDir, 'FORME_VALIDATION_SNAPSHOT.zip');

const excludes = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.cache',
  'playwright-report',
  'test-results',
  'tests',
  'scratch',
  '.vscode',
  '.cursor',
  'FORME_TEMP_ZIP_BUILD_SAFE',
  '.env',
  '_historical_planning_non_authoritative'
];

const excludeExtensions = [
  '.zip'
];

const excludeFiles = [
  'FORME_CODEBASE_DUMP.txt',
  'FORME_CODEBASE_CURRENT.txt',
  'FORME_HANDOFF_TO_CLAUDE.txt',
  'excluded_paths.txt',
  'zip_repo.js',
  'zip_repo.cjs',
  'zip_repo.ps1',
  'extract_zip_files.ps1',
  'compare_zip.cjs',
  'zip_files.txt'
];

const sensitivePatterns = [
  /\.env.*/i,
  /\.pem/i
];

function shouldExclude(itemPath, isDir) {
  const name = path.basename(itemPath);
  if (excludes.includes(name)) return true;
  if (!isDir && excludeExtensions.includes(path.extname(name).toLowerCase())) return true;
  if (!isDir && excludeFiles.includes(name)) return true;
  for (const regex of sensitivePatterns) {
    if (!isDir && regex.test(name)) return true;
  }
  return false;
}

function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  const isDir = stats.isDirectory();
  
  if (shouldExclude(src, isDir)) return;

  if (isDir) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const items = fs.readdirSync(src);
    for (const item of items) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  if (fs.existsSync(zipFile)) fs.unlinkSync(zipFile);

  console.log('Copying files to temp directory...');
  copyRecursive(rootDir, tempDir);

  console.log('Zipping files safely...');
  execSync(`powershell -Command "Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${zipFile}'"`, { stdio: 'inherit' });

  console.log('Cleaning up temp directory...');
  fs.rmSync(tempDir, { recursive: true, force: true });
  
  console.log('Safe zip file created successfully at:', zipFile);
} catch (e) {
  console.error('Error creating safe zip:', e);
  process.exit(1);
}
