// Exercises the actual production bundle and HTTP server against disposable data.
import { mkdtempSync, rmSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const dependencies=resolve(import.meta.dirname,'../app/node_modules/.bun');
const serovalPackage=readdirSync(dependencies).find(name=>name.startsWith('seroval@'));
const {toJSON}=createRequire(join(dependencies,serovalPackage,'node_modules/seroval/package.json'))('seroval');
const release=resolve(process.argv[2] || '');
const temp=mkdtempSync(join(tmpdir(),'snaperp-smoke-'));
const port=Number(process.env.SMOKE_PORT || 3197);
const origin=`http://127.0.0.1:${port}`;
const env={...process.env,SNAPERP_DATABASE:join(temp,'demo.sqlite'),PORT:String(port),SITE_ORIGIN:origin};
let server;
try {
 for(let i=0;i<2;i++) {
  const migrated=spawnSync(process.execPath,[join(release,'runtime/migrate.mjs')],{env,encoding:'utf8'});
  assert.equal(migrated.status,0,migrated.stderr);
 }
 server=spawn(process.execPath,[join(release,'runtime/server.mjs')],{env,stdio:['ignore','ignore','pipe']});
 let logs='';server.stderr.on('data',data=>{logs+=data;});
 let ready=false;
 for(let i=0;i<50;i++) {try{const r=await fetch(origin+'/healthz');if(r.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}
 assert.ok(ready,logs);
 for(const route of ['/','/features','/integrations','/pricing','/journey.html','/theme.js','/theme.css']) {
  const response=await fetch(origin+route);assert.equal(response.status,200,`${route}: ${await response.clone().text()}\n${logs}`);
  if(['/', '/features','/integrations','/pricing'].includes(route)) assert.match(await response.text(),/SnapERP/);
 }
 const asset=readdirSync(join(release,'dist/server/assets')).find(name=>name.startsWith('demo.functions-'));
 const code=readFileSync(join(release,'dist/server/assets',asset),'utf8');
 const id=code.match(/id: "([a-f0-9]+)"/)[1];
 const data={requestId:crypto.randomUUID(),name:'Deployment test',business:'Test company',email:'test@example.com',phone:'',workflow:'Verify deployment demo request persistence.',website:'',consent:true};
 const submit=async (payload,requestOrigin=origin)=>fetch(`${origin}/_serverFn/${id}`,{method:'POST',headers:{'content-type':'application/json','origin':requestOrigin,'x-tsr-serverFn':'true'},body:JSON.stringify(toJSON({data:payload}))});
 const response=await submit(data);const body=await response.text();
 assert.equal(response.status,200,body);assert.match(body,/DEMO-/);
 const duplicate=await submit(data);assert.equal(duplicate.status,200);assert.match(await duplicate.text(),/DEMO-/);
 const foreign=await submit({...data,requestId:crypto.randomUUID()},'https://untrusted.example');
 assert.ok(foreign.status===403 || !(await foreign.text()).includes('DEMO-'));
 for(let i=0;i<4;i++) {const accepted=await submit({...data,requestId:crypto.randomUUID()});assert.match(await accepted.text(),/DEMO-/);}
 const limited=await submit({...data,requestId:crypto.randomUUID()});assert.match(await limited.text(),/Too many requests/);
 const {DatabaseSync}=await import('node:sqlite');const db=new DatabaseSync(env.SNAPERP_DATABASE);
 assert.equal(db.prepare('SELECT count(*) as n FROM demo_requests').get().n,5);
 db.close();
 assert.equal((await fetch(origin+'/.env')).status,404);
 assert.equal((await fetch(origin+'/not-a-page')).status,404);
 console.log('PASS: routes, assets, repeatable migrations, persisted demo request, duplicate protection, rate limiting and foreign-origin rejection.');
} finally {
 if(server&&server.exitCode===null){server.kill('SIGTERM');await new Promise(resolve=>server.once('exit',resolve));}
 rmSync(temp,{recursive:true,force:true});
}
