const fs = require('fs');

const files = [
    'components/login-screen.tsx'
];

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\\`/g, '`');
    content = content.replace(/\\\$/g, '$');
    fs.writeFileSync(file, content);
}
console.log('Fixed syntax errors.');
