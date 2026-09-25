import os from 'node:os';
// Some restricted Windows runners cannot perform account lookup. The CLI only
// needs shell information; fall back to existing process metadata, without a lookup.
const userInfo=os.userInfo;
os.userInfo=(...args)=>{try{return userInfo(...args);}catch(error){if(process.platform!=='win32'||error.code!=='ERR_SYSTEM_ERROR')throw error;return {username:process.env.USERNAME??'local',homedir:os.homedir(),shell:process.env.COMSPEC??'cmd.exe',uid:-1,gid:-1};}};
await import('../node_modules/@capacitor/cli/bin/capacitor');
