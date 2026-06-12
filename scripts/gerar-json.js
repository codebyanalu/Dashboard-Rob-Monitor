const vm = require('vm');
const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '..');
const dataDir = path.join(baseDir, 'data', '2026');

const months = ['may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const files = [];

months.forEach(function(month) {
  var monthDir = path.join(dataDir, month);
  var weekFiles = fs.readdirSync(monthDir).filter(function(f) {
    return f.startsWith('week-') && f.endsWith('.js');
  }).sort(function(a, b) {
    var na = parseInt(a.match(/\d+/)[0]);
    var nb = parseInt(b.match(/\d+/)[0]);
    return na - nb;
  });
  weekFiles.forEach(function(wf) {
    files.push(path.join(monthDir, wf));
  });
  files.push(path.join(monthDir, 'index.js'));
});

files.push(path.join(baseDir, 'data', 'index.js'));

var sandbox = {};
var context = vm.createContext(sandbox);

files.forEach(function(file) {
  var code = fs.readFileSync(file, 'utf8');
  try {
    vm.runInContext(code, context, { filename: file });
  } catch (e) {
    console.error('Erro em', file, ':', e.message);
  }
});

var registry = context.DATA_REGISTRY;
if (!registry) {
  console.error('DATA_REGISTRY nao encontrado');
  process.exit(1);
}

var json = JSON.stringify(registry, null, 2);
fs.writeFileSync(path.join(baseDir, 'data', 'dados.json'), json, 'utf8');
console.log('OK: data/dados.json gerado (' + (json.length / 1024 / 1024).toFixed(2) + ' MB)');
