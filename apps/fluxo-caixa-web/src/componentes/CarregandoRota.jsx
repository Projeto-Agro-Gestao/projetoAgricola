function CarregandoRota() {
    return (
        <div
            aria-live="polite"
            className="rota-carregando"
            role="status"
        >
            <div
                aria-hidden="true"
                className="dots-container"
            >
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
            </div>

            <span className="rota-carregando-texto">
                Carregando…
            </span>
        </div>
    )
}

export default CarregandoRota
