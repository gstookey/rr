// list distinct tarball URLs + sizes currently in an npm cacache
import fs from 'node:fs'; import path from 'node:path';
const root = process.argv[2]; const out = new Map();
function walk(d){ for(const e of fs.readdirSync(d,{withFileTypes:true})){ const p=path.join(d,e.name);
  if(e.isDirectory()) walk(p); else { for(const line of fs.readFileSync(p,'utf8').split('\n')){
    const i=line.indexOf('\t'); if(i<0) continue; let j; try{ j=JSON.parse(line.slice(i+1)); }catch{ continue; }
    if(!j||!j.key||typeof j.size!=='number') continue;
    const m=j.key.match(/request-cache:(https?:\/\/.*\.tgz)$/); if(m) out.set(m[1], j.size); } } } }
walk(path.join(root,'_cacache','index-v5'));
const rows=[...out.entries()].sort((a,b)=>a[0]<b[0]?-1:1);
let total=0; for(const [,s] of rows) total+=s;
for(const [u,s] of rows) console.log(`${s}\t${u}`);
console.error(JSON.stringify({distinctTarballs:rows.length,totalMB:+(total/1e6).toFixed(1)}));
