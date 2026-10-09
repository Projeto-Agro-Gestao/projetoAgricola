import './CarregamentoTela.css'

function CarregamentoTela({
    texto = 'Carregando',
    subtexto = '',
    compacto = false,
    className = '',
}) {
    return (
        <div
            aria-live="polite"
            className={`ag-carregamento${compacto ? ' ag-carregamento-compacto' : ''} ${className}`.trim()}
            role="status"
        >
            <span aria-hidden="true" className="ag-carregamento-indicador" />
            <span className="ag-carregamento-mensagem">
                <span className="ag-carregamento-texto">{texto}</span>
                {subtexto && (
                    <span className="ag-carregamento-subtexto">{subtexto}</span>
                )}
            </span>
        </div>
    )
}

export default CarregamentoTela
