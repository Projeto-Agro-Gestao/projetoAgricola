export function voltarPaginaAnterior(
    navigate,
    destinoReserva = '/dashboard',
) {
    const indiceHistorico =
        window.history.state?.idx

    if (
        typeof indiceHistorico === 'number'
        && indiceHistorico > 0
    ) {
        navigate(-1)
        return
    }

    navigate(destinoReserva, {
        replace: true,
    })
}
