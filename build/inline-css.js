const path = require('path');
const fs = require('fs-extra');
const log = console.log.bind(console);
const error = console.error.bind(console);
const glob = require('glob');

const htmlPaths = [
    ...glob.sync('.deploy_git/**/*.html'),
    ...glob.sync('public/**/*.html')
]
const cssPaths = ['.deploy_git/css/style.css', 'public/css/style.css'];
const fileAmount = htmlPaths.length;

const styleReg = /<!-- %style% -->/;

const readHtmlPromises = htmlPaths.map(p => {
    const filePath = path.join(process.cwd(), p);
    return fs.readFile(filePath);
});

const cssFiles = cssPaths.map(p => {
    const filePath = path.join(process.cwd(), p);
    try {
        return fs.readFileSync(filePath);
    } catch (e) {}
});

const cssBuffer = cssFiles[0] || cssFiles[1];
const cssContent = `<style>${cssBuffer.toString()}</style>`;

Promise.all(readHtmlPromises)
    .then(files => {
        const writeFilePromises = htmlPaths.map((p, i) => {
            const fileContent = files[i].toString()
                .replace(styleReg, cssContent);
            return fs.writeFile(p, fileContent);
        });
        return Promise.all(writeFilePromises);
    })
    .catch(error);