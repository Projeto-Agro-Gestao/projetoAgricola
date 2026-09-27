import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'

const diretorio = path.dirname(fileURLToPath(import.meta.url))
const saida = path.join(diretorio, 'cards')

fs.mkdirSync(saida, { recursive: true })

const FOLHA = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/></svg>`

const FORMATOS = [
    { nome: '16x9', largura: 1920, altura: 1080 },
    { nome: '9x16', largura: 1080, altura: 1920 },
]

function montarHtml(tipo, largura, altura) {
    const titulo =
        tipo === 'intro'
            ? 'Gestão financeira da sua propriedade'
            : 'Comece agora'
    const subtitulo =
        tipo === 'intro'
            ? 'Receitas, despesas e resultado em um só lugar'
            : 'Conheça o AgroGestão'

    return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${largura}px; height: ${altura}px;
    display: grid; place-items: center;
    background: radial-gradient(circle at 30% 22%, #4aa300, #2f7a00 72%);
    color: #ffffff; font-family: Arial, Helvetica, sans-serif;
  }
  .card { text-align: center; padding: 0 9%; }
  .marca {
    display: inline-flex; align-items: center; gap: 0.9vw;
    font-size: 2.4vw; font-weight: 800; letter-spacing: -0.02em;
  }
  .marca svg { width: 3.4vw; height: 3.4vw; }
  h1 {
    margin-top: 1.6vw;
    font-size: 6vw; font-weight: 800;
    line-height: 1.04; letter-spacing: -0.045em;
    text-wrap: balance;
  }
  p {
    margin-top: 1.4vw;
    font-size: 2.2vw; opacity: 0.92;
  }
</style>
</head>
<body>
  <div class="card">
    <div class="marca">${FOLHA}<span>AgroGestão</span></div>
    <h1>${titulo}</h1>
    <p>${subtitulo}</p>
  </div>
</body>
</html>`
}

const navegador = await chromium.launch()

for (const formato of FORMATOS) {
    for (const tipo of ['intro', 'outro']) {
        const page = await navegador.newPage({
            viewport: {
                width: formato.largura,
                height: formato.altura,
            },
        })

        await page.setContent(
            montarHtml(tipo, formato.largura, formato.altura),
        )
        await page.screenshot({
            path: path.join(saida, `${tipo}-${formato.nome}.png`),
        })
        await page.close()

        console.log(`card ${tipo}-${formato.nome}.png`)
    }
}

await navegador.close()
