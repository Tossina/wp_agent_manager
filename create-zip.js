const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

const base = process.cwd();
const output = fs.createWriteStream(path.join(base, 'public', 'wp-mngr-bridge.zip'));
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log('ZIP cree: ' + archive.pointer() + ' bytes');
});

archive.on('error', (err) => { throw err; });
archive.pipe(output);

archive.directory(
  path.join(base, 'wordpress-plugin', 'wp-agent-bridge'),
  'wp-agent-bridge'
);

archive.finalize();
