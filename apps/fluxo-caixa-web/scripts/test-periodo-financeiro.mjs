import assert from 'node:assert/strict'
import { periodoPadrao, periodoValido, obterPeriodoFinanceiro, salvarPeriodoFinanceiro, carregarTodasMovimentacoes } from '../src/servicos/periodoFinanceiro.js'

const armazenamento = new Map()
globalThis.sessionStorage = { getItem: (chave) => armazenamento.get(chave) ?? null, setItem: (chave, valor) => armazenamento.set(chave, valor) }
assert.deepEqual(periodoPadrao(new Date('2026-10-07T18:00:00Z')), { dataInicial: '2026-09-08', dataFinal: '2026-10-07' })
assert.deepEqual(periodoPadrao(new Date('2026-10-08T01:00:00Z')), { dataInicial: '2026-09-08', dataFinal: '2026-10-07' })
assert.equal(periodoValido({ dataInicial: '2026-02-30', dataFinal: '2026-03-02' }), false)
assert.equal(periodoValido({ dataInicial: '2026-10-08', dataFinal: '2026-10-07' }), false)
const setembro = { dataInicial: '2026-09-01', dataFinal: '2026-09-30' }
salvarPeriodoFinanceiro(11, setembro)
assert.deepEqual(obterPeriodoFinanceiro(11), setembro)
assert.notDeepEqual(obterPeriodoFinanceiro(12), setembro)
armazenamento.set('ag-periodo-13', '{inválido')
assert.equal(periodoValido(obterPeriodoFinanceiro(13)), true)
const urls = []
const itens = await carregarTodasMovimentacoes('https://exemplo.test/movimentacoes?dataInicial=2026-09-08&dataFinal=2026-10-07&categoriaId=4', async (endereco) => {
    const url = new URL(endereco)
    urls.push(url)
    const pagina = Number(url.searchParams.get('page'))
    return { ok: true, json: async () => ({ content: [{ id: pagina + 1 }], last: pagina === 2, totalPages: 3 }) }
})
assert.deepEqual(itens.map((item) => item.id), [1, 2, 3])
assert.equal(urls.length, 3)
assert.ok(urls.every((url) => url.searchParams.get('dataInicial') === '2026-09-08' && url.searchParams.get('categoriaId') === '4'))
await assert.rejects(() => carregarTodasMovimentacoes('https://exemplo.test/movimentacoes', async () => ({ ok: false })))
await assert.rejects(() => carregarTodasMovimentacoes('https://exemplo.test/movimentacoes', async () => ({ ok: true, json: async () => ({ erro: 'sem conteúdo' }) })))
console.log('Período compartilhado, fuso, isolamento por empresa, paginação e erros: OK')
