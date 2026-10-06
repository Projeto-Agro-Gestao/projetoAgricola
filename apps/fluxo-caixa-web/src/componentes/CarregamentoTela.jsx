import './CarregamentoTela.css'

/**
 * Tela de carregamento com o logo animado oficial Agro Gestão.
 *
 * O logo (broto + anéis orbitais + ondas de radar) é um SVG com animações
 * em CSS puro, originado do Stitch. O texto fica abaixo e é variável por tela.
 *
 * props:
 * - texto: mensagem principal (ex.: "Carregando dashboard financeiro").
 * - subtexto: linha secundária opcional.
 * - compacto: logo e altura menores, para loading dentro de uma área
 *   de conteúdo (coluna, tabela) em vez de tela inteira.
 * - className: classe extra opcional no container.
 */
function CarregamentoTela({
    texto = 'Carregando',
    subtexto = '',
    compacto = false,
    className = '',
}) {
    const classes = [
        'ag-carregamento',
        compacto ? 'ag-carregamento-compacto' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ')

    return (
        <div aria-live="polite" className={classes} role="status">
            <svg
                aria-hidden="true"
                className="ag-carregamento-logo"
                viewBox="0 0 400 340"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient
                        id="agCarregGreen"
                        x1="0%"
                        x2="100%"
                        y1="0%"
                        y2="100%"
                    >
                        <stop offset="0%" stopColor="#3b7b00" />
                        <stop offset="50%" stopColor="#4d9e00" />
                        <stop offset="100%" stopColor="#2d5e00" />
                    </linearGradient>
                    <linearGradient
                        id="agCarregGold"
                        x1="0%"
                        x2="100%"
                        y1="0%"
                        y2="100%"
                    >
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>
                    <filter
                        height="140%"
                        id="agCarregGlow"
                        width="140%"
                        x="-20%"
                        y="-20%"
                    >
                        <feGaussianBlur
                            result="blur"
                            stdDeviation="6"
                        />
                        <feComposite
                            in="SourceGraphic"
                            in2="blur"
                            operator="over"
                        />
                    </filter>
                </defs>

                {/* Fundo circular suave */}
                <circle
                    cx="200"
                    cy="170"
                    fill="#f4f8ec"
                    opacity="0.6"
                    r="130"
                />

                {/* Ondas concêntricas (radar de dados) */}
                <circle
                    className="ag-pulse"
                    cx="200"
                    cy="170"
                    fill="none"
                    opacity="0.6"
                    r="52"
                    stroke="#7bb642"
                />
                <circle
                    className="ag-pulse ag-pulse-atraso"
                    cx="200"
                    cy="170"
                    fill="none"
                    opacity="0.4"
                    r="52"
                    stroke="#3b7b00"
                />

                {/* Anel externo segmentado */}
                <g className="ag-ring-externo">
                    <circle
                        cx="200"
                        cy="170"
                        fill="none"
                        r="88"
                        stroke="#d5e4c3"
                        strokeDasharray="4 6"
                        strokeWidth="2"
                    />
                    <circle
                        cx="200"
                        cy="170"
                        fill="none"
                        r="88"
                        stroke="url(#agCarregGreen)"
                        strokeDasharray="75 180"
                        strokeLinecap="round"
                        strokeWidth="3.5"
                    />
                    <circle
                        cx="200"
                        cy="82"
                        fill="#f59e0b"
                        filter="url(#agCarregGlow)"
                        r="5.5"
                    />
                    <circle cx="200" cy="258" fill="#3b7b00" r="4" />
                </g>

                {/* Anel intermediário de precisão */}
                <g className="ag-ring-meio">
                    <circle
                        cx="200"
                        cy="170"
                        fill="none"
                        opacity="0.85"
                        r="66"
                        stroke="#3b7b00"
                        strokeDasharray="40 70 20 50"
                        strokeLinecap="round"
                        strokeWidth="2"
                    />
                    <circle cx="258" cy="140" fill="#4d9e00" r="3.5" />
                </g>

                {/* Núcleo: broto + sol dourado */}
                <g className="ag-nucleo">
                    <circle
                        cx="200"
                        cy="170"
                        fill="#ffffff"
                        filter="drop-shadow(0 4px 12px rgba(59,123,0,0.12))"
                        r="42"
                        stroke="#e1eccd"
                        strokeWidth="2"
                    />
                    <path
                        d="M 200 186 Q 200 165 199 145"
                        fill="none"
                        stroke="#3b7b00"
                        strokeLinecap="round"
                        strokeWidth="3.5"
                    />
                    <path
                        className="ag-folha-esq"
                        d="M 199 164 C 182 160 174 144 180 134 C 189 134 199 148 199 164 Z"
                        fill="url(#agCarregGreen)"
                    />
                    <path
                        className="ag-folha-dir"
                        d="M 199 158 C 218 152 226 136 220 126 C 210 126 199 142 199 158 Z"
                        fill="#4d9e00"
                    />
                    <circle
                        cx="200"
                        cy="182"
                        fill="url(#agCarregGold)"
                        filter="drop-shadow(0 1px 3px rgba(217,119,6,0.5))"
                        r="6"
                    />
                </g>

                {/* Três pontos de progresso */}
                <circle
                    className="ag-dot ag-dot-1"
                    cx="188"
                    cy="300"
                    fill="#3b7b00"
                    r="4"
                />
                <circle
                    className="ag-dot ag-dot-2"
                    cx="200"
                    cy="300"
                    fill="#4d9e00"
                    r="4"
                />
                <circle
                    className="ag-dot ag-dot-3"
                    cx="212"
                    cy="300"
                    fill="#f59e0b"
                    r="4"
                />
            </svg>

            <p className="ag-carregamento-texto">{texto}</p>
            {subtexto && (
                <p className="ag-carregamento-subtexto">{subtexto}</p>
            )}
        </div>
    )
}

export default CarregamentoTela
