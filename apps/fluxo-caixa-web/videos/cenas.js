import { CONFIG } from './config.js'
import { pausa, rolarAte } from './helpers/navegacao.js'

const PAISAGEM = { width: 1920, height: 1080 }
const RETRATO = { width: 1080, height: 1920 }

const cenas = [
    {
        nome: 'landing-16x9',
        viewport: PAISAGEM,
        async executar(page) {
            await page.goto('/', { waitUntil: 'networkidle' })
            await pausa(page, 1400)

            await rolarAte(page, '#atividades', 900)
            await pausa(page, 1100)

            await rolarAte(page, '#recursos', 900)
            await pausa(page, 1300)

            await rolarAte(page, '#financeiro', 900)
            await pausa(page, 1300)

            await rolarAte(page, '.publica-chamada', 900)
            await pausa(page, 1700)
        },
    },
    {
        nome: 'login-16x9',
        viewport: PAISAGEM,
        async executar(page) {
            await page.goto('/login', { waitUntil: 'networkidle' })
            await pausa(page, 2200)

            await page.fill('#emailLogin', CONFIG.email)
            await pausa(page, 700)

            await page.fill('#senhaLogin', CONFIG.senha)
            await pausa(page, 700)

            await page.click('.autenticacao-mostrar-senha')
            await pausa(page, 1200)

            await page.click('.autenticacao-mostrar-senha')
            await pausa(page, 600)

            await page.click('.autenticacao-botao')
            await page.waitForTimeout(4000)
        },
    },
    {
        nome: 'dashboard-16x9',
        viewport: PAISAGEM,
        autenticado: true,
        async executar(page) {
            await page.goto('/dashboard/financeiro', {
                waitUntil: 'networkidle',
            })
            await pausa(page, 4500)

            await page.evaluate(() =>
                window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: 'smooth',
                }),
            )
            await pausa(page, 2600)
        },
    },
    {
        nome: 'movimentacoes-16x9',
        viewport: PAISAGEM,
        autenticado: true,
        async executar(page) {
            await page.goto('/dashboard/movimentacoes', {
                waitUntil: 'networkidle',
            })
            await pausa(page, 4200)

            await page.evaluate(() =>
                window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: 'smooth',
                }),
            )
            await pausa(page, 2400)
        },
    },
    {
        nome: 'app-mobile-9x16',
        viewport: RETRATO,
        autenticado: true,
        async executar(page) {
            await page.goto('/app', { waitUntil: 'networkidle' })
            await pausa(page, 4200)

            await page.evaluate(() =>
                window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: 'smooth',
                }),
            )
            await pausa(page, 2600)
        },
    },
    {
        nome: 'categorias-16x9',
        viewport: PAISAGEM,
        autenticado: true,
        async executar(page) {
            await page.goto('/dashboard/categorias', {
                waitUntil: 'networkidle',
            })
            await pausa(page, 4200)

            await page.evaluate(() =>
                window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: 'smooth',
                }),
            )
            await pausa(page, 2400)
        },
    },
    {
        nome: 'contas-16x9',
        viewport: PAISAGEM,
        autenticado: true,
        async executar(page) {
            await page.goto('/dashboard/contas', {
                waitUntil: 'networkidle',
            })
            await pausa(page, 4500)

            await page.evaluate(() =>
                window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: 'smooth',
                }),
            )
            await pausa(page, 2600)
        },
    },
    {
        nome: 'fornecedores-16x9',
        viewport: PAISAGEM,
        autenticado: true,
        async executar(page) {
            await page.goto('/dashboard/fornecedores', {
                waitUntil: 'networkidle',
            })
            await pausa(page, 4500)

            await page.evaluate(() =>
                window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: 'smooth',
                }),
            )
            await pausa(page, 2400)
        },
    },
    {
        nome: 'nova-movimentacao-16x9',
        viewport: PAISAGEM,
        autenticado: true,
        async executar(page) {
            await page.goto('/dashboard/movimentacoes/nova', {
                waitUntil: 'networkidle',
            })
            await pausa(page, 4200)

            await page.evaluate(() =>
                window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: 'smooth',
                }),
            )
            await pausa(page, 2400)
        },
    },
    {
        nome: 'perfil-16x9',
        viewport: PAISAGEM,
        autenticado: true,
        async executar(page) {
            await page.goto('/dashboard/perfil', {
                waitUntil: 'networkidle',
            })
            await pausa(page, 4200)

            await page.evaluate(() =>
                window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: 'smooth',
                }),
            )
            await pausa(page, 2400)
        },
    },
]

export default cenas
