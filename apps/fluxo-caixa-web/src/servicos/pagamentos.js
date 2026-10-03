export function salvarDadosPagamento({ apiUrl, empresaId, sessao, dados }) {
    return fetch(`${apiUrl}/empresas/${empresaId}/assinatura/documento-pagamento`, {
        method: 'PUT',
        headers: {
            Authorization: `${sessao.tipoToken} ${sessao.token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...dados, numero: dados.semNumero ? null : dados.numero }),
    })
}

export async function gerarCobrancaComDados(opcoes, tipo, obterMensagemDeErro) {
    if (!['pix', 'boleto'].includes(tipo)) throw new Error('Forma de pagamento invalida.')
    const salva = await salvarDadosPagamento(opcoes)
    if (!salva.ok) {
        throw new Error(await obterMensagemDeErro(salva, 'Nao foi possivel salvar os dados para pagamento.'))
    }
    return fetch(`${opcoes.apiUrl}/empresas/${opcoes.empresaId}/assinatura/pagamentos/${tipo}`, {
        method: 'POST',
        headers: { Authorization: `${opcoes.sessao.tipoToken} ${opcoes.sessao.token}` },
    })
}
