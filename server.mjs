import http from 'node:http';
import { readFile } from 'node:fs/promises';

const files = { '/intro.js': ['intro.js', 'text/javascript'], '/dinosaur.js': ['dinosaur.js', 'text/javascript'], '/vendor/three.module.js': ['node_modules/three/build/three.module.js', 'text/javascript'], '/vendor/three.core.js': ['node_modules/three/build/three.core.js', 'text/javascript'], '/': ['index.html', 'text/html'], '/game.js': ['game.js', 'text/javascript'], '/style.css': ['style.css', 'text/css'] };
const server = http.createServer(async (req, res) => {
  const file = files[new URL(req.url, 'http://localhost').pathname];
  if (!file) { res.writeHead(404); res.end('Not found'); return; }
  try {
    const body = await readFile(new URL(file[0], import.meta.url));
    res.writeHead(200, { 'Content-Type': `${file[1]}; charset=utf-8`, 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(500); res.end('Unable to load game');
  }
});
server.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log('PlushRush listening on port', server.address().port));
