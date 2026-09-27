import { CONFIG } from './config.js'
import { pausa, rolarAte, rolarParaFim } from './helpers/navegacao.js'

const PAISAGEM = { width: 1920, height: 1080 }
const RETRATO = { width: 1080, height: 1920 }

const roteiros = [
    {
        nome: 'landing',
        async executar(page) {
            await page.goto('/', { waitUntil: 'networkidle' })
            await pausa(page, 1000)

            await rolarAte(page, '#atividades')
            await pausa(page, 500)

            await rolarAte(page, '#recursos')
            await pausa(page, 600)

            await rolarAte(page, '#financeiro')
            await pausa(page, 600)

            await rolarAte(page, '.publica-chamada')
            await pausa(page, 900)
        },
    },
    {
        nome: 'login',
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
        nome: 'dashboard',
        autenticado: true,
        async executar(page) {
            await page.goto('/dashboard/financeiro', {
                waitUntil: 'networkidle',
            })
            await pausa(page, 4500)

            await rolarParaFim(page)
            await pausa(page, 2600)
        },
    },
    {
        nome: 'movimentacoes',
        autenticado: true,
        async executar(page) {
            await page.goto('/dashboard/movimentacoes', {
                waitUntil: 'networkidle',
            })
            await pausa(page, 4200)

            await rolarParaFim(page)
            await pausa(page, 2400)
        },
    },
    {
        nome: 'nova-movimentacao',
        autenticado: true,
        async executar(page) {
            await page.goto('/dashboard/movimentacoes/nova', {
                waitUntil: 'networkidle',
            })
            await pausa(page, 4200)

            await rolarParaFim(page)
            await pausa(page, 2400)
        },
    },
    {
        nome: 'categorias',
        autenticado: true,
        async executar(page) {
            await page.goto('/dashboard/categorias', {
                waitUntil: 'networkidle',
            })
            await pausa(page, 4200)

            await rolarParaFim(page)
            await pausa(page, 2400)
        },
    },
    {
        nome: 'contas',
        autenticado: true,
        async executar(page) {
            await page.goto('/dashboard/contas', {
                waitUntil: 'networkidle',
            })
            await pausa(page, 4500)

            await rolarParaFim(page)
            await pausa(page, 2600)
        },
    },
    {
        nome: 'fornecedores',
        autenticado: true,
        async executar(page) {
            await page.goto('/dashboard/fornecedores', {
                waitUntil: 'networkidle',
            })
            await pausa(page, 4500)

            await rolarParaFim(page)
            await pausa(page, 2400)
        },
    },
    {
        nome: 'perfil',
        autenticado: true,
        async executar(page) {
            await page.goto('/dashboard/perfil', {
                waitUntil: 'networkidle',
            })
            await pausa(page, 4200)

            await rolarParaFim(page)
            await pausa(page, 2400)
        },
    },
    {
        nome: 'app-mobile',
        autenticado: true,
        apenasRetrato: true,
        async executar(page) {
            await page.goto('/app', { waitUntil: 'networkidle' })
            await pausa(page, 4200)

            await rolarParaFim(page)
            await pausa(page, 2600)
        },
    },
]

const cenas = roteiros.flatMap((roteiro) => {
    const formatos = roteiro.apenasRetrato
        ? [['9x16', RETRATO]]
        : [
              ['16x9', PAISAGEM],
              ['9x16', RETRATO],
          ]

    return formatos.map(([sufixo, viewport]) => ({
        nome: `${roteiro.nome}-${sufixo}`,
        viewport,
        autenticado: roteiro.autenticado,
        executar: roteiro.executar,
    }))
})

export default cenas
