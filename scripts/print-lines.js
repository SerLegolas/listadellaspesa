const fs=require('fs');
const lines=fs.readFileSync('src/app/elenco-ricette/page.js','utf8').split('\n');
for(let i=0;i<lines.length;i++){
  if(i>=200&&i<=240)console.log(i+1,lines[i]);
}
