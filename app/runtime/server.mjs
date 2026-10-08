import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { stat, readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { resolve, sep, extname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import app from '../dist/server/server.js';

process.umask(0o077);
const origin = new URL(process.env.SITE_ORIGIN || 'https://bentito.com').origin;
const root = resolve(import.meta.dirname, '../dist/client');
const revision = (await readFile(resolve(import.meta.dirname, '../REVISION'), 'utf8')).trim();
const database = new DatabaseSync(process.env.SNAPERP_DATABASE, {readOnly: true});
const types = {'.js':'text/javascript', '.css':'text/css', '.html':'text/html', '.json':'application/json', '.webmanifest':'application/manifest+json', '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp', '.gif':'image/gif', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.ico':'image/x-icon', '.woff2':'font/woff2', '.ttf':'font/ttf', '.mp4':'video/mp4', '.txt':'text/plain'};
const server = createServer(async (incoming, outgoing) => {
  try {
    const url = new URL(incoming.url, origin);
    if (url.pathname === '/healthz') {
      database.prepare('SELECT id FROM demo_requests LIMIT 1').get();
      outgoing.writeHead(200, {'content-type':'application/json', 'cache-control':'no-store'});
      outgoing.end(JSON.stringify({status:'ok', revision})); return;
    }
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); } catch { outgoing.writeHead(400); outgoing.end(); return; }
    const filename = resolve(root, `.${pathname}`);
    if ((filename !== root && !filename.startsWith(root + sep)) || pathname.split('/').some(part => part.startsWith('.'))) {
      outgoing.writeHead(404); outgoing.end(); return;
    }
    if (incoming.method === 'GET' || incoming.method === 'HEAD') {
      const info = await stat(filename).catch(() => null);
      if (info?.isFile()) {
        outgoing.writeHead(200, {'content-type': types[extname(filename)] || 'application/octet-stream', 'content-length':info.size, 'x-content-type-options':'nosniff', 'cache-control':'public, max-age=0, must-revalidate'});
        if (incoming.method === 'HEAD') outgoing.end();
        else await pipeline(createReadStream(filename), outgoing);
        return;
      }
    }
    const headers = new Headers();
    for (const [key, value] of Object.entries(incoming.headers)) if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
    // Nginx overwrites X-Real-IP. Never trust a public CF-Connecting-IP header.
    headers.set('cf-connecting-ip', headers.get('x-real-ip') || incoming.socket.remoteAddress || 'unknown');
    headers.set('host', new URL(origin).host);
    headers.set('x-forwarded-host', new URL(origin).host);
    headers.set('x-forwarded-proto', new URL(origin).protocol.slice(0,-1));
    const request = new Request(new URL(url.pathname + url.search, origin), {
      method: incoming.method, headers,
      ...(incoming.method !== 'GET' && incoming.method !== 'HEAD' ? {body:Readable.toWeb(incoming), duplex:'half'} : {}),
    });
    const response = await app.fetch(request, {}, {});
    outgoing.statusCode = response.status;
    for (const [key, value] of response.headers) if (key !== 'set-cookie') outgoing.setHeader(key, value);
    const cookies = response.headers.getSetCookie();
    if (cookies.length) outgoing.setHeader('set-cookie', cookies);
    if (!response.body || incoming.method === 'HEAD') outgoing.end();
    else await pipeline(Readable.fromWeb(response.body), outgoing);
  } catch (error) {
    console.error(error);
    if (!outgoing.headersSent) outgoing.writeHead(500, {'content-type':'text/plain'});
    outgoing.end('Service temporarily unavailable');
  }
});
server.maxHeadersCount = 100;
server.requestTimeout = 30000;
server.listen(Number(process.env.PORT || 3100), '127.0.0.1', () => console.log(`SnapERP ${revision} listening on loopback`));
for (const signal of ['SIGTERM','SIGINT']) process.on(signal, () => {server.close(() => {database.close();process.exit(0);});setTimeout(() => process.exit(1),10000).unref();});
