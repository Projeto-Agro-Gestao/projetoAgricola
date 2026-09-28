const CHAVE_ROTA_ATUAL = 'agrogestao_rota_atual'
const CHAVE_ROTA_ANTERIOR = 'agrogestao_rota_anterior'

function obterRotaAtualDaJanela() {
    return `${window.location.pathname}${window.location.search}`
}

export function voltarPaginaAnterior(
    navigate,
    destinoReserva = '/dashboard',
) {
    const indiceHistorico =
        window.history.state?.idx
    const ultimaRotaInterna =
        sessionStorage.getItem(CHAVE_ROTA_ANTERIOR)
    const rotaAtual = obterRotaAtualDaJanela()

    if (
        typeof indiceHistorico === 'number'
        && indiceHistorico > 0
    ) {
        navigate(-1)
        return
    }

    if (
        ultimaRotaInterna
        && ultimaRotaInterna !== rotaAtual
    ) {
        navigate(ultimaRotaInterna)
        return
    }

    navigate(destinoReserva, {
        replace: true,
    })
}

export function registrarRotaAtual(location) {
    const proximaRota =
        `${location.pathname}${location.search}`
    const rotaAtual =
        sessionStorage.getItem(CHAVE_ROTA_ATUAL)

    if (rotaAtual === proximaRota) {
        return
    }

    if (rotaAtual) {
        sessionStorage.setItem(
            CHAVE_ROTA_ANTERIOR,
            rotaAtual,
        )
    }

    sessionStorage.setItem(
        CHAVE_ROTA_ATUAL,
        proximaRota,
    )
}
