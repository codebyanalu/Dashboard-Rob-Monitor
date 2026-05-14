const fs = require('fs');

const fileContent = fs.readFileSync('c:/Users/ana.oliveira/Downloads/Códigos/Dashboard cent notas Robô/index.html', 'utf8');

const scriptMatch = fileContent.match(/<script>([\s\S]*?)<\/script>/);

if (scriptMatch) {
    const scriptContent = scriptMatch[1];
    try {
        new Function(scriptContent);
        console.log("No syntax errors found.");
    } catch (e) {
        console.error("Syntax Error found!");
        console.error(e);
    }
} else {
    console.log("No script tag found.");
}
