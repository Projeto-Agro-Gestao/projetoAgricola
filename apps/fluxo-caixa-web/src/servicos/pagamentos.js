import { apiFetch } from './api.js'

export function salvarDadosPagamento({ apiUrl, empresaId, dados }) {
    return apiFetch(`${apiUrl}/empresas/${empresaId}/assinatura/documento-pagamento`, {
        method: 'PUT',
        body: { ...dados, numero: dados.semNumero ? null : dados.numero },
    })
}

export async function gerarCobrancaComDados(opcoes, tipo, obterMensagemDeErro) {
    if (!['pix', 'boleto'].includes(tipo)) throw new Error('Forma de pagamento invalida.')
    const salva = await salvarDadosPagamento(opcoes)
    if (!salva.ok) {
        throw new Error(await obterMensagemDeErro(salva, 'Nao foi possivel salvar os dados para pagamento.'))
    }
    return apiFetch(`${opcoes.apiUrl}/empresas/${opcoes.empresaId}/assinatura/pagamentos/${tipo}`, {
        method: 'POST',
    })
}
