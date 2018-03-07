const path = require('path');
const fs = require('fs-extra');
const log = console.log.bind(console);
const error = console.error.bind(console);

const htmlPaths = ['.deploy_git/index.html', 'public/index.html'];
const cssPaths = ['.deploy_git/css/style.css', 'public/css/style.css'];
const fileAmount = htmlPaths.length;

const styleReg = /<!-- %style% -->/;

const readHtmlPromises = htmlPaths.map(p => {
    const filePath = path.join(process.cwd(), p);
    return fs.readFile(filePath);
});

const readCssPromises = cssPaths.map(p => {
    const filePath = path.join(process.cwd(), p);
    return fs.readFile(filePath);
})

Promise.all([...readHtmlPromises, ...readCssPromises])
    .then(files => {
        const writeFilePromises = htmlPaths.map((p, i) => {
            const cssContent = `<style>${files[i + fileAmount].toString()}</style>`;
            const fileContent = files[i].toString()
                .replace(styleReg, cssContent);
            return fs.writeFile(p, fileContent);
        });
        return Promise.all(writeFilePromises);
    })
    .catch(error)