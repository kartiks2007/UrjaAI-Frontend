import { spawnSync,spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const vite=fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url));
// Portable real-app server; separate from the read-only design-review bundle.
const build=spawnSync(process.execPath,[vite,'build','--configLoader','native','--outDir','local-dist'],{cwd:root,env:{...process.env,NODE_ENV:'production'},stdio:'inherit',windowsHide:true});
if(build.status!==0)process.exit(build.status??1);
const child=spawn(process.execPath,[vite,'preview','--configLoader','native','--outDir','local-dist','--host','127.0.0.1','--port','5173','--strictPort'],{cwd:root,stdio:'inherit',windowsHide:true});
child.on('exit',code=>{process.exitCode=code??1;});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill());
