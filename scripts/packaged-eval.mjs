/**
 * Read and drive the PACKAGED app's window from a script.
 *
 * The shipped build ignores synthetic events on the board, which is right and
 * is what makes it safe. It does not follow that the shipped build cannot be
 * checked at all: its window is a WebView2, and WebView2 honours
 * WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS, so the page can be inspected over the
 * DevTools protocol like any other page. That is how phase 7 found a
 * capability fault that had silently destroyed a progress file.
 *
 *   WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS="--remote-debugging-port=9333"
 *   ./src-tauri/target/release/repertoire-trainer.exe &
 *   node scripts/packaged-eval.mjs "document.body.innerText"
 *   node scripts/packaged-eval.mjs @probe.js
 *
 * An argument starting with @ names a file holding the expression, which is
 * how to pass anything with Windows paths or quotes in it without fighting the
 * shell. The expression is awaited, so it may be an async function call.
 *
 * Enough of a WebSocket client to send one request and read one reply. No
 * dependencies on purpose: this has to work against a build, not a dev server,
 * and adding a package to do it would be a strange thing to ship.
 *
 * It can read anything on the page and click anything on it. It cannot make a
 * move on the board - that needs a trusted event, and a human.
 */
import http from 'node:http'
import crypto from 'node:crypto'

const PORT = Number(process.env.CDP_PORT ?? 9333)
import fs from 'node:fs'
// An expression starting with @ names a file, so nothing has to survive shell
// quoting - which mangled backslashes in Windows paths the first time round.
const arg = process.argv[2]
const EXPRESSION = arg?.startsWith('@') ? fs.readFileSync(arg.slice(1), 'utf8') : arg
if (!EXPRESSION) {
  console.error('usage: node cdp.mjs "<javascript expression>"')
  process.exit(2)
}

const get = (path) =>
  new Promise((resolve, reject) => {
    http
      .get({ host: '127.0.0.1', port: PORT, path }, (res) => {
        let body = ''
        res.on('data', (c) => (body += c))
        res.on('end', () => resolve(JSON.parse(body)))
      })
      .on('error', reject)
  })

/** Masked client text frame. */
function frame(text) {
  const payload = Buffer.from(text, 'utf8')
  const mask = crypto.randomBytes(4)
  let header
  if (payload.length < 126) {
    header = Buffer.from([0x81, 0x80 | payload.length])
  } else if (payload.length < 65536) {
    header = Buffer.alloc(4)
    header[0] = 0x81
    header[1] = 0x80 | 126
    header.writeUInt16BE(payload.length, 2)
  } else {
    header = Buffer.alloc(10)
    header[0] = 0x81
    header[1] = 0x80 | 127
    header.writeBigUInt64BE(BigInt(payload.length), 2)
  }
  const masked = Buffer.alloc(payload.length)
  for (let i = 0; i < payload.length; i++) masked[i] = payload[i] ^ mask[i % 4]
  return Buffer.concat([header, mask, masked])
}

/** Pulls whole text frames out of a growing buffer. Server frames are unmasked. */
function* frames(state, chunk) {
  state.buffer = Buffer.concat([state.buffer, chunk])
  for (;;) {
    const b = state.buffer
    if (b.length < 2) return
    const opcode = b[0] & 0x0f
    let length = b[1] & 0x7f
    let offset = 2
    if (length === 126) {
      if (b.length < 4) return
      length = b.readUInt16BE(2)
      offset = 4
    } else if (length === 127) {
      if (b.length < 10) return
      length = Number(b.readBigUInt64BE(2))
      offset = 10
    }
    if (b.length < offset + length) return
    const payload = b.subarray(offset, offset + length)
    state.buffer = b.subarray(offset + length)
    if (opcode === 1) yield payload.toString('utf8')
    if (opcode === 8) return
  }
}

const pages = await get('/json')
const page = pages.find((p) => p.type === 'page')
if (!page) throw new Error('no page target: is the app running?')
const path = new URL(page.webSocketDebuggerUrl).pathname

const key = crypto.randomBytes(16).toString('base64')
const request = http.request({
  host: '127.0.0.1',
  port: PORT,
  path,
  headers: {
    Connection: 'Upgrade',
    Upgrade: 'websocket',
    'Sec-WebSocket-Key': key,
    'Sec-WebSocket-Version': '13',
  },
})
request.end()

const socket = await new Promise((resolve, reject) => {
  request.on('upgrade', (_res, sock) => resolve(sock))
  request.on('error', reject)
  setTimeout(() => reject(new Error('the websocket upgrade timed out')), 5000)
})

const state = { buffer: Buffer.alloc(0) }
const done = new Promise((resolve, reject) => {
  socket.on('data', (chunk) => {
    for (const text of frames(state, chunk)) {
      const message = JSON.parse(text)
      if (message.id !== 1) continue
      if (message.error) return reject(new Error(JSON.stringify(message.error)))
      const result = message.result?.result
      if (message.result?.exceptionDetails) {
        return reject(new Error(JSON.stringify(message.result.exceptionDetails)))
      }
      resolve(result?.value ?? result?.description ?? null)
    }
  })
  socket.on('error', reject)
  setTimeout(() => reject(new Error('no reply from the page')), 20000)
})

socket.write(
  frame(
    JSON.stringify({
      id: 1,
      method: 'Runtime.evaluate',
      params: { expression: EXPRESSION, returnByValue: true, awaitPromise: true },
    }),
  ),
)

const value = await done
console.log(typeof value === 'string' ? value : JSON.stringify(value, null, 2))
socket.destroy()
process.exit(0)
