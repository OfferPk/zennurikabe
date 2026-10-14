const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '../../zenslither/package-lock.json');
const dest = path.join(__dirname, '../package-lock.json');

const content = fs.readFileSync(src, 'utf8').split('zenslither').join('zennurikabe');
fs.writeFileSync(dest, content);
console.log('package-lock.json created successfully!');
