/**
 * Local preview proxy: serves the Vite frontend and Express API from one origin.
 * Used by the self-healing public preview setup (see docs/DEPLOYMENT.md).
 */
const http = require('http')
const net = require('net')

const PORT = Number(process.env.PREVIEW_PROXY_PORT || 4000)
const API = { host: '127.0.0.1', port: 5000 }
const WEB = { host: '127.0.0.1', port: 5173 }

function targetFor(url) {
  return /^\/(api|socket\.io)(\/|$)/.test(url) ? API : WEB
}

const server = http.createServer((req, res) => {
  const target = targetFor(req.url)
  const upstream = http.request(
    {
      host: target.host,
      port: target.port,
      method: req.method,
      path: req.url,
      headers: { ...req.headers, host: `${target.host}:${target.port}` },
    },
    (response) => {
      res.writeHead(response.statusCode || 502, response.headers)
      response.pipe(res)
    },
  )

  upstream.on('error', (error) => {
    if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ success: false, message: 'Preview upstream unavailable', detail: error.message }))
  })

  req.pipe(upstream)
})

server.on('upgrade', (req, clientSocket, head) => {
  const target = targetFor(req.url)
  const upstream = net.connect(target.port, target.host, () => {
    const headers = Object.entries(req.headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\r\n')
    upstream.write(`${req.method} ${req.url} HTTP/${req.httpVersion}\r\n${headers}\r\n\r\n`)
    if (head && head.length) upstream.write(head)
    clientSocket.pipe(upstream)
    upstream.pipe(clientSocket)
  })

  upstream.on('error', () => clientSocket.destroy())
  clientSocket.on('error', () => upstream.destroy())
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`SwapThrift preview proxy listening on http://127.0.0.1:${PORT}`)
})
