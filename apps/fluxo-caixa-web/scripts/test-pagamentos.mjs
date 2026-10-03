import assert from 'node:assert/strict'
import { gerarCobrancaComDados } from '../src/servicos/pagamentos.js'

const originalFetch = globalThis.fetch
const opcoes = { apiUrl: '/api/v1', empresaId: 7, sessao: { tipoToken: 'Bearer', token: 'token-de-teste' },
    dados: { documento: '52998224725', semNumero: true, numero: '123', rua: 'Endereco atualizado' } }
const mensagem = async resposta => (await resposta.json()).mensagem
try {
    for (const tipo of ['pix', 'boleto']) {
        const chamadas = []
        globalThis.fetch = async (url, request) => {
            chamadas.push({ url, request })
            return new Response(JSON.stringify({ id: 1 }), { status: 200 })
        }
        await gerarCobrancaComDados(opcoes, tipo, mensagem)
        assert.equal(chamadas.length, 2)
        assert.equal(chamadas[0].request.method, 'PUT')
        assert.equal(JSON.parse(chamadas[0].request.body).numero, null)
        assert.equal(JSON.parse(chamadas[0].request.body).rua, 'Endereco atualizado')
        assert.equal(chamadas[1].url, `/api/v1/empresas/7/assinatura/pagamentos/${tipo}`)
        assert.equal(chamadas[1].request.method, 'POST')
    }
    for (const status of [400, 401, 403, 502]) {
        let chamadas = 0
        globalThis.fetch = async () => {
            chamadas++
            return new Response(JSON.stringify({ mensagem: 'Dados recusados' }), { status })
        }
        await assert.rejects(() => gerarCobrancaComDados(opcoes, 'pix', mensagem), /Dados recusados/)
        assert.equal(chamadas, 1, 'Nao criar cobranca se o cadastro falhou')
    }
    let chamadas = 0
    globalThis.fetch = async () => { chamadas++; throw new Error('Erro de rede') }
    await assert.rejects(() => gerarCobrancaComDados(opcoes, 'boleto', mensagem), /Erro de rede/)
    assert.equal(chamadas, 1, 'Nao repetir POST automaticamente')
    await assert.rejects(() => gerarCobrancaComDados(opcoes, 'invalido', mensagem), /Forma de pagamento invalida/)
    console.log('test:pagamentos ok: salva antes de cobrar; falhas interrompem o fluxo; sem retry de cobranca')
} finally { globalThis.fetch = originalFetch }
