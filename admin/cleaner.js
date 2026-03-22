const fs = require('fs');

function clean(file, keepList) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\{\/\*([\s\S]*?)\*\/\}/g, (match, p1) => {
        const text = p1.toLowerCase().trim();
        if (keepList.some(k => text.includes(k))) return match;
        return '';
    });
    // clean up empty lines
    content = content.replace(/\n\s*\n/g, '\n');
    fs.writeFileSync(file, content);
}

clean('src/pages/content/qrscanner.jsx', ['qr code', 'qr screen', 'result', 'notice for release', 'tip', 'how to use', 'main', 'header']);
clean('src/pages/content/released.jsx', ['control', 'table area', 'main', 'header']);

console.log('Clean completed');
