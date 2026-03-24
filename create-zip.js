const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const base = process.cwd();
const srcDir = path.join(base, 'wordpress-plugin', 'wp-agent-bridge');
const outFile = path.join(base, 'public', 'wp-mngr-bridge.zip');

// Supprimer l'ancien ZIP
if (fs.existsSync(outFile)) fs.unlinkSync(outFile);

// PowerShell Compress-Archive : crée un ZIP compatible WordPress
// On crée un dossier temporaire pour avoir le bon nom de dossier racine dans le ZIP
const tmpDir = path.join(base, '_tmp_plugin');
const tmpPlugin = path.join(tmpDir, 'wp-agent-bridge');

if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });
fs.mkdirSync(tmpPlugin, { recursive: true });

// Copier les fichiers dans le dossier temporaire
execSync(`xcopy /E /I /Q "${srcDir}" "${tmpPlugin}"`, { stdio: 'pipe' });

// Compresser avec PowerShell
execSync(
  `powershell -Command "Compress-Archive -Path '${tmpPlugin}' -DestinationPath '${outFile}' -Force"`,
  { stdio: 'inherit' }
);

// Nettoyer
fs.rmSync(tmpDir, { recursive: true });

const size = fs.statSync(outFile).size;
console.log(`ZIP créé: ${size} bytes → ${outFile}`);
