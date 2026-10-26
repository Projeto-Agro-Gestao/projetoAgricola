const dataLocal = (data) => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(data)

export function periodoPadrao(agora = new Date()) {
    const fim = dataLocal(agora)
    const inicio = new Date(`${fim}T12:00:00Z`)
    inicio.setUTCDate(inicio.getUTCDate() - 29)
    return { dataInicial: inicio.toISOString().slice(0, 10), dataFinal: fim }
}

export function periodoValido(periodo) {
    const valida = (valor) => /^\d{4}-\d{2}-\d{2}$/.test(valor ?? '')
        && !Number.isNaN(Date.parse(`${valor}T12:00:00Z`))
        && new Date(`${valor}T12:00:00Z`).toISOString().slice(0, 10) === valor
    return valida(periodo?.dataInicial) && valida(periodo?.dataFinal)
        && periodo.dataInicial <= periodo.dataFinal
}

export function obterPeriodoFinanceiro(empresaId, parametros) {
    if (periodoValido(parametros)) return parametros
    try {
        const salvo = JSON.parse(sessionStorage.getItem(`ag-periodo-${empresaId}`))
        if (periodoValido(salvo)) return salvo
    } catch { /* Um armazenamento indisponível não impede a consulta. */ }
    return periodoPadrao()
}

export function salvarPeriodoFinanceiro(empresaId, periodo) {
    if (!empresaId || !periodoValido(periodo)) return
    try {
        sessionStorage.setItem(`ag-periodo-${empresaId}`, JSON.stringify({
            dataInicial: periodo.dataInicial, dataFinal: periodo.dataFinal,
        }))
    } catch { /* A navegação continua mesmo sem armazenamento. */ }
}

export async function carregarTodasMovimentacoes(endereco, requisitar) {
    const itens = []
    let pagina = 0
    while (true) {
        const url = new URL(endereco)
        url.searchParams.set('page', pagina)
        url.searchParams.set('size', 100)
        const resposta = await requisitar(url.toString())
        if (!resposta.ok) throw new Error('Não foi possível carregar as movimentações.')
        const dados = await resposta.json()
        if (Array.isArray(dados)) return dados
        if (!Array.isArray(dados.content)) throw new Error('Resposta de movimentações inválida.')
        itens.push(...dados.content)
        if (dados.last !== false && !(pagina + 1 < dados.totalPages)) return itens
        pagina += 1
    }
}
