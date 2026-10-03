import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import path from 'node:path'
import { chromium } from 'playwright'

const root = path.resolve('dist')
const config = JSON.parse(await readFile('vercel.json', 'utf8'))
const headers = Object.fromEntries(config.headers[0].headers.map(({ key, value }) => [key, value]))
const server = createServer(async (req, res) => {
    try {
        const url = new URL(req.url, 'http://localhost')
        const relative = url.pathname.startsWith('/assets/') ? url.pathname.slice(1) : 'index.html'
        const file = path.resolve(root, relative)
        assert.ok(file.startsWith(root + path.sep))
        const content = await readFile(file)
        const mime = file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html'
        res.writeHead(200, { ...headers, 'Content-Type': mime })
        res.end(content)
    } catch {
        res.writeHead(404)
        res.end()
    }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
let browser
try {
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    await page.goto(`http://127.0.0.1:${server.address().port}/login`)
    await page.getByRole('heading', { name: 'Entrar na conta' }).waitFor()
    await page.evaluate(() => {
        window.__invasaoExecutada = false
        const script = document.createElement('script')
        script.textContent = 'window.__invasaoExecutada = true'
        document.body.appendChild(script)
    })
    assert.equal(await page.evaluate(() => window.__invasaoExecutada), false)
    assert.match(headers['Content-Security-Policy'], /frame-ancestors 'none'/)
    assert.match(headers['Content-Security-Policy'], /object-src 'none'/)
    console.log('security headers ok: login renderizado; script inline bloqueado pela CSP')
} finally {
    await browser?.close()
    await new Promise(resolve => server.close(resolve))
}
