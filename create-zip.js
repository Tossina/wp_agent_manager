const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const base = process.cwd();
const srcDir = path.join(base, 'wordpress-plugin', 'wp-agent-bridge');
const outFile = path.join(base, 'public', 'wp-mngr-bridge.zip');

const output = fs.createWriteStream(outFile);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log('ZIP créé: ' + archive.pointer() + ' bytes → ' + outFile);
});

archive.on('error', (err) => { throw err; });
archive.pipe(output);

// Parcourir récursivement le dossier et forcer les chemins Unix
function addDir(dir, prefix) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    // Toujours utiliser "/" comme séparateur dans le ZIP (standard ZIP)
    const zipPath = prefix + '/' + entry.name;
    if (entry.isDirectory()) {
      addDir(fullPath, zipPath);
    } else {
      archive.file(fullPath, { name: zipPath });
    }
  }
}

addDir(srcDir, 'wp-agent-bridge');
archive.finalize();
