import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));
let commit = process.env.VERCEL_GIT_COMMIT_SHA;
if (!commit) {
  try { commit = execFileSync('git', ['rev-parse', 'HEAD'], {encoding:'utf8'}).trim(); }
  catch { commit = 'local'; }
}
const release = { version, buildId: `${version}-${commit.slice(0,12)}-${Date.now()}`, builtAt: new Date().toISOString() };
export default defineConfig({
  define: { __APP_RELEASE__: JSON.stringify(release) },
  plugins: [{
    name: 'release-manifest',
    generateBundle() { this.emitFile({type:'asset',fileName:'version.json',source:JSON.stringify(release)}); },
    configureServer(server) {
      server.middlewares.use('/version.json', (_req,res)=>{
        res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(release));
      });
    }
  }]
});
