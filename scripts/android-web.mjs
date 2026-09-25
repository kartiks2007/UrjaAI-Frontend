import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {parseEnv} from 'node:util';
import {spawnSync} from 'node:child_process';
import {join} from 'node:path';
const file='.env.android.local';
const values=existsSync(file)?parseEnv(readFileSync(file,'utf8')):{};
const keys=['VITE_API_URL','VITE_SUPABASE_URL','VITE_SUPABASE_ANON_KEY','VITE_AUTH_REDIRECT_URL'];
for(const key of Object.keys(values))if(!keys.includes(key))throw Error('Unexpected Android configuration key: '+key);
const env={...process.env,NODE_ENV:'production'};
for(const key of Object.keys(env))if(key.startsWith('VITE_'))delete env[key];
for(const key of keys)env[key]=values[key]??'';
env.VITE_AUTH_REDIRECT_URL=values.VITE_AUTH_REDIRECT_URL||'com.urjaai.app://auth';
const required=keys.slice(0,3),configured=required.every(key=>env[key]);
if(required.some(key=>env[key])&&!configured)throw Error('Supply all three public API/Supabase settings or leave them all blank.');
if(process.argv.includes('--release')&&!configured)throw Error('Release requires real HTTPS API and Supabase public configuration.');
for(const key of ['VITE_API_URL','VITE_SUPABASE_URL'])if(env[key]){
 const url=new URL(env[key]);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||['localhost','127.0.0.1','::1','[::1]'].includes(url.hostname))throw Error(key+' requires a remote HTTPS URL without credentials.');
}
const key=env.VITE_SUPABASE_ANON_KEY;
let role='';try{role=JSON.parse(Buffer.from(key.split('.')[1]??'','base64url').toString()).role??'';}catch{/* Publishable keys need not be JWTs. */}
if(key.startsWith('sb_secret_')||role==='service_role')throw Error('Private Supabase keys cannot be bundled.');
const built=spawnSync(process.execPath,['node_modules/vite/bin/vite.js','build','--configLoader','native','--mode','android','--outDir','android-dist'],{env,stdio:'inherit',windowsHide:true});
if(built.status!==0)process.exit(built.status??1);
function scan(dir){for(const item of readdirSync(dir,{withFileTypes:true})){const path=join(dir,item.name);if(item.isDirectory())scan(path);else if(/\.(js|html|json|css)$/.test(item.name)){
 const text=readFileSync(path,'utf8');if(/TWILIO_AUTH_TOKEN|TWILIO_ACCOUNT_SID|postgres(?:ql)?:\/\/|sb_secret_[A-Za-z0-9_-]{10,}|-----BEGIN .*PRIVATE KEY-----/.test(text))throw Error('Potential server secret detected in '+path);
}}}
scan('android-dist');
console.log(configured?'Android web bundle checked: configured public endpoints.':'Android web bundle checked: UNCONFIGURED debug UI; no live login or API connectivity.');
