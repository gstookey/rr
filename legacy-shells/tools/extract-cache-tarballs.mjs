// Extract every tarball from an npm cacache into <out>/ as <scope>__<name>-<ver>.tgz
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const [root, out] = process.argv.slice(2);
const entries = new Map(); // url -> integrity
function walk(d){ for(const e of fs.readdirSync(d,{withFileTypes:true})){ const p=path.join(d,e.name);
  if(e.isDirectory()) walk(p); else for(const line of fs.readFileSync(p,'utf8').split('\n')){
    const i=line.indexOf('\t'); if(i<0) continue; let j; try{ j=JSON.parse(line.slice(i+1)); }catch{ continue; }
    if(!j||!j.key||!j.integrity) continue;
    const m=j.key.match(/request-cache:(https?:\/\/.*\.tgz)$/); if(m) entries.set(m[1], j.integrity); } } }
walk(path.join(root,'_cacache','index-v5'));
function contentPath(integrity){
  const m=integrity.match(/^sha512-(.+)$/); if(!m) throw new Error('not sha512: '+integrity);
  const hex=Buffer.from(m[1],'base64').toString('hex');
  return path.join(root,'_cacache','content-v2','sha512',hex.slice(0,2),hex.slice(2,4),hex.slice(4));
}
let n=0, bytes=0; const rows=[];
for(const [url, integrity] of [...entries].sort()){
  // url: .../(@scope/)?name/-/file-ver.tgz
  const m=url.match(/\/((@[^/]+)\/)?([^/]+)\/-\/([^/]+\.tgz)$/);
  if(!m){ console.error('SKIP unparsed', url); continue; }
  const scope=m[2]||'', file=m[4];
  const dest=path.join(out,(scope?scope.replace('@','')+'__':'')+file);
  const src=contentPath(integrity.split(' ')[0]);
  fs.copyFileSync(src,dest);
  const buf=fs.readFileSync(dest);
  const sha256=crypto.createHash('sha256').update(buf).digest('hex');
  const sha512='sha512-'+crypto.createHash('sha512').update(buf).digest('base64');
  if(sha512!==integrity.split(' ')[0]) { console.error('INTEGRITY MISMATCH', url); process.exit(1); }
  rows.push({file:path.basename(dest), bytes:buf.length, sha256, integrity:sha512, url});
  n++; bytes+=buf.length;
}
fs.writeFileSync(path.join(out,'..','MANIFEST.json'), JSON.stringify({created:new Date().toISOString(),count:n,totalBytes:bytes,tarballs:rows},null,1));
fs.writeFileSync(path.join(out,'..','SHA256SUMS'), rows.map(r=>`${r.sha256}  tarballs/${r.file}`).join('\n')+'\n');
console.log(JSON.stringify({extracted:n,totalMB:+(bytes/1e6).toFixed(1)}));
