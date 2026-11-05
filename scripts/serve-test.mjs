/**
 * Regression test for tools/serve.mjs — the dev/preview server.
 *
 * It exists because of a real outage: a single malformed percent-escape in a URL
 * threw from decodeURIComponent inside an async handler. That becomes an
 * unhandled rejection, and Node 22 kills the process. The preview went dark
 * repeatedly with an empty log, and the platform wrapper only restarted it so it
 * could crash again on the next bad request.
 *
 * This test starts the server on a free port, hammers it with the requests that
 * used to be fatal, and asserts:
 *   1. malformed URLs get a clean 400,
 *   2. the process is still the SAME process afterwards (no restart),
 *   3. normal routes still work,
 *   4. the path-traversal guard returns the app shell, never a system file.
 *
 * Usage: node scripts/serve-test.mjs
 */
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';

const PORT = Number(process.env.TEST_PORT || 8123);
const BASE = `http://127.0.0.1:${PORT}`;

let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Read the kernel start time of a PID; a change means the process restarted. */
function startTime(pid) {
  try {
    const stat = readFileSync(`/proc/${pid}/stat`, 'utf8');
    // field 22 (1-indexed) is starttime; the comm field may contain spaces
    return stat.slice(stat.lastIndexOf(')') + 2).split(' ')[19];
  } catch {
    return null;
  }
}

const server = spawn(process.execPath, ['tools/serve.mjs'], {
  cwd: new URL('..', import.meta.url).pathname,
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let stderr = '';
server.stderr.on('data', (d) => (stderr += d.toString()));

// Wait for the port to accept connections.
let up = false;
for (let i = 0; i < 40 && !up; i++) {
  await sleep(150);
  try {
    const r = await fetch(`${BASE}/`, { signal: AbortSignal.timeout(1500) });
    up = r.ok;
  } catch {
    /* not yet */
  }
}
check('le serveur démarre', up, up ? '' : stderr.slice(0, 300));
if (!up) {
  server.kill('SIGKILL');
  process.exit(1);
}

/** fetch that never throws: a dead server is a result, not a crash. */
async function probe(url, opts = {}) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), ...opts });
    return { status: res.status, body: await res.text() };
  } catch (e) {
    return { status: -1, body: '', error: String(e.cause?.code || e.name) };
  }
}

const pid = server.pid;
const before = startTime(pid);
check('PID et date de démarrage lisibles', !!before && before !== null, `pid ${pid}`);

/* ---------------------------------------------------------- normal routes */
const routes = ['/', '/data/core.json', '/assets/js/app.js', '/assets/css/app.css'];
for (const r of routes) {
  const res = await probe(BASE + r);
  check(`route normale ${r}`, res.status === 200, `HTTP ${res.status}${res.error ? ' ' + res.error : ''}`);
}

/* ------------------------------------------- the requests that used to kill */
const malformed = ['/%E0%A4%A', '/%zz', '/%C0%AF', '/%ED%A0%80', '/%'];
for (const p of malformed) {
  const res = await probe(BASE + p);
  check(`URL malformée ${p} : réponse propre`, res.status === 400,
    `HTTP ${res.status}${res.error ? ' ' + res.error : ''}`);
}

/* --------------------------------------------------- the process must survive */
await sleep(400);
const after = startTime(pid);
const alive = server.exitCode === null;
check('le processus est toujours vivant', alive, `exitCode=${server.exitCode}`);
check(
  'aucun redémarrage (même PID, même starttime)',
  before === after && alive,
  `${before} -> ${after}`
);

/* ------------------------------------------------------ safety of the server */
const rc = await probe(`${BASE}/`);
check(
  'le serveur répond encore normalement après les requêtes hostiles',
  rc.status === 200 && rc.body.includes('<html'),
  `HTTP ${rc.status}${rc.error ? ' ' + rc.error : ''}, ${rc.body.length} octets`
);

const trav = await probe(`${BASE}/../../etc/passwd`);
check(
  'traversée de chemin : renvoie l’application, jamais un fichier système',
  !trav.body.includes('root:x:') && trav.body.includes('<html'),
  `HTTP ${trav.status}`
);

/* ------------------------------------------------------------- no crash noise */
check(
  'aucune exception non gérée dans la sortie d’erreur',
  !/uncaughtException|unhandled rejection/i.test(stderr),
  stderr.trim().slice(0, 200) || 'silencieux'
);

server.kill('SIGTERM');
await sleep(300);
if (server.exitCode === null) server.kill('SIGKILL');

console.log(`\n${failures === 0 ? 'OK' : failures + ' FAIL'}`);
process.exit(failures === 0 ? 0 : 1);
