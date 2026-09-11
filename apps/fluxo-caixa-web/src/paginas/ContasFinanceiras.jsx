import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import {
    useNavigate,
} from 'react-router'
import AlternadorModulos from '../componentes/AlternadorModulos.jsx'
import { API_BASE_URL as API_URL } from '../config.js'
import './ContasFinanceiras.css'

const LARGURA_GRAFICO = 900
const ALTURA_GRAFICO = 280
const ESPACO_HORIZONTAL = 54
const ESPACO_SUPERIOR = 24
const ESPACO_INFERIOR = 42

function IconeLixeira() {
    return (
        <svg
            aria-hidden="true"
            fill="none"
            height="18"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="18"
        >
            <path d="M3 6h18" />
            <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
        </svg>
    )
}

function formatarDinheiro(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(valor ?? 0)
}

function formatarData(data) {
    if (!data) {
        return 'Não informada'
    }

    const [ano, mes, dia] =
        data.split('-')

    return `${dia}/${mes}/${ano}`
}

function formatarDataCurta(data) {
    if (!data) {
        return ''
    }

    const [, mes, dia] =
        data.split('-')

    return `${dia}/${mes}`
}

function completarComZero(numero) {
    return String(numero).padStart(2, '0')
}

function formatarDataParaApi(data) {
    const ano = data.getFullYear()
    const mes = completarComZero(
        data.getMonth() + 1,
    )
    const dia = completarComZero(
        data.getDate(),
    )

    return `${ano}-${mes}-${dia}`
}

function obterDataAtual() {
    return formatarDataParaApi(new Date())
}

function obterPeriodoFuturo(dias) {
    const dataInicial = new Date()
    const dataFinal = new Date()

    dataFinal.setDate(
        dataInicial.getDate() + (dias - 1),
    )

    return {
        dataInicial:
            formatarDataParaApi(dataInicial),
        dataFinal:
            formatarDataParaApi(dataFinal),
    }
}

function criarSerieCompleta(dados, dias) {
    const valoresPorData = new Map(
        (Array.isArray(dados) ? dados : [])
            .map((ponto) => [
                ponto.data,
                ponto,
            ]),
    )

    const hoje = new Date()

    return Array.from(
        { length: dias },
        (_, indice) => {
            const data = new Date(hoje)

            data.setDate(
                hoje.getDate() + indice,
            )

            const dataFormatada =
                formatarDataParaApi(data)

            const ponto =
                valoresPorData.get(
                    dataFormatada,
                )

            return {
                data: dataFormatada,
                totalAReceber: Number(
                    ponto?.totalAReceber
                    ?? 0,
                ),
                totalAPagar: Number(
                    ponto?.totalAPagar
                    ?? 0,
                ),
            }
        },
    )
}

function GraficoProjecaoContas({ pontos }) {
    const larguraUtil =
        LARGURA_GRAFICO
        - (ESPACO_HORIZONTAL * 2)

    const alturaUtil =
        ALTURA_GRAFICO
        - ESPACO_SUPERIOR
        - ESPACO_INFERIOR

    const maiorValor = Math.max(
        1,
        ...pontos.flatMap((ponto) => [
            ponto.totalAReceber,
            ponto.totalAPagar,
        ]),
    )

    function obterX(indice) {
        if (pontos.length <= 1) {
            return ESPACO_HORIZONTAL
        }

        return ESPACO_HORIZONTAL
            + (
                indice
                / (pontos.length - 1)
            ) * larguraUtil
    }

    function obterY(valor) {
        return ESPACO_SUPERIOR
            + alturaUtil
            - (
                Number(valor ?? 0)
                / maiorValor
            ) * alturaUtil
    }

    function criarLinha(campo) {
        return pontos
            .map(
                (ponto, indice) =>
                    `${obterX(indice)},${obterY(ponto[campo])}`,
            )
            .join(' ')
    }

    const linhasGuia = [0, 0.5, 1]

    return (
        <div className="contas-grafico-area">
            <svg
                aria-label="Gráfico da previsão de contas a receber e pagar"
                className="contas-grafico-svg"
                role="img"
                viewBox={`0 0 ${LARGURA_GRAFICO} ${ALTURA_GRAFICO}`}
            >
                {linhasGuia.map((proporcao) => {
                    const y =
                        ESPACO_SUPERIOR
                        + alturaUtil
                        - proporcao * alturaUtil

                    return (
                        <g key={proporcao}>
                            <line
                                className="contas-grafico-guia"
                                x1={ESPACO_HORIZONTAL}
                                x2={LARGURA_GRAFICO - ESPACO_HORIZONTAL}
                                y1={y}
                                y2={y}
                            />

                            <text
                                className="contas-grafico-eixo"
                                x="4"
                                y={y + 4}
                            >
                                {formatarDinheiro(
                                    maiorValor * proporcao,
                                )}
                            </text>
                        </g>
                    )
                })}

                <polyline
                    className="contas-grafico-linha contas-grafico-linha-receber"
                    points={criarLinha('totalAReceber')}
                />

                <polyline
                    className="contas-grafico-linha contas-grafico-linha-pagar"
                    points={criarLinha('totalAPagar')}
                />

                {pontos.map((ponto, indice) => (
                    <g key={ponto.data}>
                        <circle
                            className="contas-grafico-ponto contas-grafico-ponto-receber"
                            cx={obterX(indice)}
                            cy={obterY(ponto.totalAReceber)}
                            r="3"
                        >
                            <title>
                                {`${formatarData(ponto.data)} — Conta a receber, dinheiro que deverá entrar: ${formatarDinheiro(ponto.totalAReceber)}`}
                            </title>
                        </circle>

                        <circle
                            className="contas-grafico-ponto contas-grafico-ponto-pagar"
                            cx={obterX(indice)}
                            cy={obterY(ponto.totalAPagar)}
                            r="3"
                        >
                            <title>
                                {`${formatarData(ponto.data)} — Conta a pagar, dinheiro que deverá sair: ${formatarDinheiro(ponto.totalAPagar)}`}
                            </title>
                        </circle>
                    </g>
                ))}

                {pontos.length > 0 && (
                    <>
                        <text
                            className="contas-grafico-data"
                            x={ESPACO_HORIZONTAL}
                            y={ALTURA_GRAFICO - 10}
                        >
                            {formatarDataCurta(
                                pontos[0].data,
                            )}
                        </text>

                        <text
                            className="contas-grafico-data"
                            textAnchor="end"
                            x={LARGURA_GRAFICO - ESPACO_HORIZONTAL}
                            y={ALTURA_GRAFICO - 10}
                        >
                            {formatarDataCurta(
                                pontos[pontos.length - 1].data,
                            )}
                        </text>
                    </>
                )}
            </svg>
        </div>
    )
}

function limparSessao() {
    localStorage.removeItem(
        'agrogestao_token',
    )

    localStorage.removeItem(
        'agrogestao_tipo_token',
    )

    localStorage.removeItem(
        'agrogestao_usuario',
    )

    localStorage.removeItem(
        'agrogestao_token_expira_em',
    )
}

function obterSessao() {
    try {
        const token =
            localStorage.getItem(
                'agrogestao_token',
            )

        const tipoToken =
            localStorage.getItem(
                'agrogestao_tipo_token',
            ) ?? 'Bearer'

        const usuarioSalvo =
            localStorage.getItem(
                'agrogestao_usuario',
            )

        const expiraEm =
            Number(
                localStorage.getItem(
                    'agrogestao_token_expira_em',
                ),
            )

        if (!token || !usuarioSalvo) {
            return null
        }

        if (
            expiraEm
            && Date.now() >= expiraEm
        ) {
            limparSessao()
            return null
        }

        const usuario =
            JSON.parse(usuarioSalvo)

        if (!usuario?.empresaId) {
            limparSessao()
            return null
        }

        return {
            token,
            tipoToken,
            usuario,
        }
    } catch {
        limparSessao()
        return null
    }
}

async function obterMensagemDeErro(
    resposta,
    mensagemPadrao,
) {
    const dados =
        await resposta
            .json()
            .catch(() => null)

    return dados?.mensagem
        ?? mensagemPadrao
}

function obterNomeArquivo(
    contentDisposition,
    nomePadrao,
) {
    if (!contentDisposition) {
        return nomePadrao
    }

    const nomeUtf8 =
        contentDisposition.match(
            /filename\*=UTF-8''([^;]+)/i,
        )

    if (nomeUtf8?.[1]) {
        try {
            return decodeURIComponent(
                nomeUtf8[1],
            )
        } catch {
            return nomeUtf8[1]
        }
    }

    const nomeComum =
        contentDisposition.match(
            /filename="?([^";]+)"?/i,
        )

    return nomeComum?.[1]
        ?? nomePadrao
}

function obterClasseSituacao(conta) {
    if (conta.situacao === 'QUITADA') {
        return 'contas-status-quitada'
    }

    if (conta.situacao === 'CANCELADA') {
        return 'contas-status-cancelada'
    }

    if (conta.vencida) {
        return 'contas-status-vencida'
    }

    if (conta.situacao === 'PARCIAL') {
        return 'contas-status-parcial'
    }

    return 'contas-status-pendente'
}

function obterTextoVencimento(conta) {
    if (conta.situacao === 'QUITADA') {
        return 'Conta quitada'
    }

    if (conta.situacao === 'CANCELADA') {
        return 'Conta cancelada'
    }

    if (conta.vencida) {
        const dias =
            Math.abs(
                Number(
                    conta.diasParaVencimento
                    ?? 0,
                ),
            )

        return dias === 1
            ? 'Vencida há 1 dia'
            : `Vencida há ${dias} dias`
    }

    if (conta.diasParaVencimento === 0) {
        return 'Vence hoje'
    }

    if (conta.diasParaVencimento === 1) {
        return 'Vence amanhã'
    }

    return `Vence em ${conta.diasParaVencimento} dias`
}

function ContasFinanceiras() {
    const navigate = useNavigate()

    const [sessao] =
        useState(obterSessao)

    const [resumo, setResumo] =
        useState(null)

    const [contas, setContas] =
        useState([])

    const [contasLixeira, setContasLixeira] =
        useState([])

    const [mostrandoLixeira, setMostrandoLixeira] =
        useState(false)

    const [lembretes, setLembretes] =
        useState([])

    const [projecao, setProjecao] =
        useState([])

    const [diasGrafico, setDiasGrafico] =
        useState(30)

    const [graficoVisivel, setGraficoVisivel] =
        useState(true)

    const [tipo, setTipo] =
        useState('')

    const [situacao, setSituacao] =
        useState('')

    const [carregando, setCarregando] =
        useState(true)

    const [erro, setErro] =
        useState('')

    const [
        contaParaLiquidar,
        setContaParaLiquidar,
    ] = useState(null)

    const [
        contaParaCancelar,
        setContaParaCancelar,
    ] = useState(null)

    const [
        contaParaExcluirPermanente,
        setContaParaExcluirPermanente,
    ] = useState(null)

    const [
        contaParaEnviarFinanceiro,
        setContaParaEnviarFinanceiro,
    ] = useState(null)

    const [
        categoriasLiquidacao,
        setCategoriasLiquidacao,
    ] = useState([])

    const [
        carregandoCategoriasLiquidacao,
        setCarregandoCategoriasLiquidacao,
    ] = useState(false)

    const [
        salvandoLiquidacao,
        setSalvandoLiquidacao,
    ] = useState(false)

    const [
        cancelandoConta,
        setCancelandoConta,
    ] = useState(false)

    const [
        excluindoContaPermanente,
        setExcluindoContaPermanente,
    ] = useState(false)

    const [
        restaurandoContaId,
        setRestaurandoContaId,
    ] = useState(null)

    const [
        enviandoFinanceiro,
        setEnviandoFinanceiro,
    ] = useState(false)

    const [valorLiquidacao, setValorLiquidacao] =
        useState('')

    const [dataLiquidacao, setDataLiquidacao] =
        useState(obterDataAtual)

    const [
        observacaoLiquidacao,
        setObservacaoLiquidacao,
    ] = useState('')

    const [
        lancarNoControleFinanceiro,
        setLancarNoControleFinanceiro,
    ] = useState(true)

    const [
        categoriaLiquidacaoId,
        setCategoriaLiquidacaoId,
    ] = useState('')

    const [
        novaCategoriaFinanceiro,
        setNovaCategoriaFinanceiro,
    ] = useState('')

    const [erroModal, setErroModal] =
        useState('')

    const [
        baixandoRelatorio,
        setBaixandoRelatorio,
    ] = useState('')

    function criarCabecalhos(possuiCorpo = false) {
        const cabecalhos = {
            Authorization:
                `${sessao.tipoToken} ${sessao.token}`,
        }

        if (possuiCorpo) {
            cabecalhos['Content-Type'] =
                'application/json; charset=utf-8'
        }

        return cabecalhos
    }

    const carregarDados =
        useCallback(async () => {
            if (!sessao) {
                return
            }

            try {
                setCarregando(true)
                setErro('')

                const empresaId =
                    sessao.usuario.empresaId

                const cabecalhos = {
                    Authorization:
                        `${sessao.tipoToken} ${sessao.token}`,
                }

                const parametros =
                    new URLSearchParams()

                if (tipo) {
                    parametros.set(
                        'tipo',
                        tipo,
                    )
                }

                if (situacao) {
                    parametros.set(
                        'situacao',
                        situacao,
                    )
                }

                const enderecoContas =
                    parametros.size > 0
                        ? `${API_URL}/empresas/${empresaId}/contas-financeiras?${parametros}`
                        : `${API_URL}/empresas/${empresaId}/contas-financeiras`

                const periodoGrafico =
                    obterPeriodoFuturo(
                        diasGrafico,
                    )

                const parametrosGrafico =
                    new URLSearchParams({
                        dataInicial:
                        periodoGrafico.dataInicial,
                        dataFinal:
                        periodoGrafico.dataFinal,
                    })

                const [
                    respostaResumo,
                    respostaContas,
                    respostaLembretes,
                    respostaProjecao,
                ] = await Promise.all([
                    fetch(
                        `${API_URL}/empresas/${empresaId}/contas-financeiras/resumo`,
                        {
                            headers: cabecalhos,
                        },
                    ),

                    fetch(
                        enderecoContas,
                        {
                            headers: cabecalhos,
                        },
                    ),

                    fetch(
                        `${API_URL}/empresas/${empresaId}/contas-financeiras/lembretes`,
                        {
                            headers: cabecalhos,
                        },
                    ),

                    fetch(
                        `${API_URL}/empresas/${empresaId}/contas-financeiras/projecao?${parametrosGrafico}`,
                        {
                            headers: cabecalhos,
                        },
                    ),
                ])

                const respostas = [
                    respostaResumo,
                    respostaContas,
                    respostaLembretes,
                    respostaProjecao,
                ]

                const acessoNegado =
                    respostas.some(
                        (resposta) =>
                            resposta.status === 401
                            || resposta.status === 403,
                    )

                if (acessoNegado) {
                    limparSessao()

                    navigate('/login', {
                        replace: true,
                    })

                    return
                }

                if (!respostaResumo.ok) {
                    throw new Error(
                        await obterMensagemDeErro(
                            respostaResumo,
                            'Não foi possível carregar o resumo das contas.',
                        ),
                    )
                }

                if (!respostaContas.ok) {
                    throw new Error(
                        await obterMensagemDeErro(
                            respostaContas,
                            'Não foi possível carregar as contas.',
                        ),
                    )
                }

                if (!respostaLembretes.ok) {
                    throw new Error(
                        await obterMensagemDeErro(
                            respostaLembretes,
                            'Não foi possível carregar os lembretes.',
                        ),
                    )
                }

                if (!respostaProjecao.ok) {
                    throw new Error(
                        await obterMensagemDeErro(
                            respostaProjecao,
                            'Não foi possível carregar a projeção futura das contas.',
                        ),
                    )
                }

                const [
                    dadosResumo,
                    dadosContas,
                    dadosLembretes,
                    dadosProjecao,
                ] = await Promise.all([
                    respostaResumo.json(),
                    respostaContas.json(),
                    respostaLembretes.json(),
                    respostaProjecao.json(),
                ])

                setResumo(dadosResumo)

                setContas(
                    Array.isArray(dadosContas)
                        ? dadosContas
                        : [],
                )

                setLembretes(
                    Array.isArray(dadosLembretes)
                        ? dadosLembretes
                        : [],
                )

                setProjecao(
                    Array.isArray(dadosProjecao)
                        ? dadosProjecao
                        : [],
                )
            } catch (erroDaRequisicao) {
                setErro(
                    erroDaRequisicao
                    instanceof Error
                        ? erroDaRequisicao.message
                        : 'Não foi possível carregar as contas financeiras.',
                )
            } finally {
                setCarregando(false)
            }
        }, [
            navigate,
            diasGrafico,
            sessao,
            situacao,
            tipo,
        ])

    const carregarLixeira =
        useCallback(async () => {
            if (!sessao) {
                return
            }

            try {
                setCarregando(true)
                setErro('')

                const empresaId =
                    sessao.usuario.empresaId

                const resposta = await fetch(
                    `${API_URL}/empresas/${empresaId}/contas-financeiras/lixeira`,
                    {
                        headers: criarCabecalhos(),
                    },
                )

                if (
                    resposta.status === 401
                    || resposta.status === 403
                ) {
                    limparSessao()

                    navigate('/login', {
                        replace: true,
                    })

                    return
                }

                if (!resposta.ok) {
                    throw new Error(
                        await obterMensagemDeErro(
                            resposta,
                            'NÃ£o foi possÃ­vel carregar a lixeira de contas.',
                        ),
                    )
                }

                const dados = await resposta.json()

                setContasLixeira(
                    Array.isArray(dados)
                        ? dados
                        : [],
                )
                setMostrandoLixeira(true)
            } catch (erroDaRequisicao) {
                setErro(
                    erroDaRequisicao instanceof Error
                        ? erroDaRequisicao.message
                        : 'NÃ£o foi possÃ­vel carregar a lixeira de contas.',
                )
            } finally {
                setCarregando(false)
            }
        }, [
            navigate,
            sessao,
        ])

    useEffect(() => {
        if (!sessao) {
            navigate('/login', {
                replace: true,
            })

            return
        }

        const temporizador = window.setTimeout(
            () => {
                void carregarDados()
            },
            0,
        )

        return () => {
            window.clearTimeout(temporizador)
        }
    }, [
        carregarDados,
        navigate,
        sessao,
    ])

    const previsaoPositiva =
        Number(
            resumo?.diferencaPrevista
            ?? 0,
        ) >= 0

    const contasAtivas =
        useMemo(
            () =>
                contas.filter(
                    (conta) =>
                        conta.situacao
                        !== 'CANCELADA',
                ),
            [contas],
        )

    const contasVisiveis =
        mostrandoLixeira
            ? contasLixeira
            : situacao === 'CANCELADA'
            ? contas
            : contasAtivas

    const pontosGrafico =
        useMemo(
            () =>
                criarSerieCompleta(
                    projecao,
                    diasGrafico,
                ),
            [
                diasGrafico,
                projecao,
            ],
        )

    function voltarAoDashboard() {
        navigate('/dashboard')
    }

    function criarConta(tipoConta) {
        navigate(
            `/dashboard/contas/nova?tipo=${tipoConta}`,
        )
    }

    function abrirCategorias() {
        navigate('/dashboard/categorias')
    }

    async function baixarRelatorio(tipoRelatorio) {
        if (!sessao) {
            return
        }

        const empresaId =
            sessao.usuario.empresaId

        const periodo =
            obterPeriodoFuturo(diasGrafico)

        const parametros =
            new URLSearchParams({
                dataInicial: periodo.dataInicial,
                dataFinal: periodo.dataFinal,
            })

        const extensao =
            tipoRelatorio === 'excel'
                ? 'xlsx'
                : 'pdf'

        const nomePadrao =
            `projecao-financeira.${extensao}`

        try {
            setBaixandoRelatorio(tipoRelatorio)
            setErro('')

            const resposta =
                await fetch(
                    `${API_URL}/empresas/${empresaId}/relatorios/${tipoRelatorio}?${parametros}`,
                    {
                        headers: criarCabecalhos(),
                    },
                )

            if (
                resposta.status === 401
                || resposta.status === 403
            ) {
                limparSessao()

                navigate('/login', {
                    replace: true,
                })

                return
            }

            if (!resposta.ok) {
                throw new Error(
                    await obterMensagemDeErro(
                        resposta,
                        'Não foi possível gerar o relatório de projeção financeira.',
                    ),
                )
            }

            const arquivo =
                await resposta.blob()

            const nomeArquivo =
                obterNomeArquivo(
                    resposta.headers.get(
                        'Content-Disposition',
                    ),
                    nomePadrao,
                )

            const urlArquivo =
                URL.createObjectURL(arquivo)

            const link =
                document.createElement('a')

            link.href = urlArquivo
            link.download = nomeArquivo

            document.body.appendChild(link)
            link.click()
            link.remove()

            URL.revokeObjectURL(urlArquivo)
        } catch (erroDoRelatorio) {
            setErro(
                erroDoRelatorio instanceof Error
                    ? erroDoRelatorio.message
                    : 'Não foi possível gerar o relatório de projeção financeira.',
            )
        } finally {
            setBaixandoRelatorio('')
        }
    }

    async function carregarCategoriasLiquidacao(conta) {
        if (!sessao) {
            return
        }

        const tipoCategoria =
            conta.tipo === 'PAGAR'
                ? 'DESPESA'
                : 'RECEITA'

        try {
            setCarregandoCategoriasLiquidacao(true)
            setErroModal('')

            const empresaId =
                sessao.usuario.empresaId

            const resposta = await fetch(
                `${API_URL}/empresas/${empresaId}/categorias?tipo=${tipoCategoria}`,
                {
                    headers: criarCabecalhos(),
                },
            )

            if (
                resposta.status === 401 ||
                resposta.status === 403
            ) {
                limparSessao()

                navigate('/login', {
                    replace: true,
                })

                return
            }

            if (!resposta.ok) {
                throw new Error(
                    await obterMensagemDeErro(
                        resposta,
                        'Não foi possível carregar as categorias.',
                    ),
                )
            }

            const dados =
                await resposta.json()

            const categorias =
                Array.isArray(dados)
                    ? dados
                    : []

            setCategoriasLiquidacao(categorias)
            setCategoriaLiquidacaoId(
                categorias.length > 0
                    ? String(categorias[0].id)
                    : '',
            )
        } catch (erroDaRequisicao) {
            setErroModal(
                erroDaRequisicao instanceof Error
                    ? erroDaRequisicao.message
                    : 'Não foi possível carregar as categorias.',
            )
        } finally {
            setCarregandoCategoriasLiquidacao(false)
        }
    }

    function abrirLiquidacao(conta) {
        setContaParaLiquidar(conta)
        setValorLiquidacao(String(conta.valorPendente))
        setDataLiquidacao(obterDataAtual())
        setObservacaoLiquidacao('')
        setLancarNoControleFinanceiro(true)
        setCategoriasLiquidacao([])
        setCategoriaLiquidacaoId('')
        setErroModal('')

        void carregarCategoriasLiquidacao(conta)
    }

    function fecharModalLiquidacao() {
        if (salvandoLiquidacao) {
            return
        }

        setContaParaLiquidar(null)
        setErroModal('')
    }

    async function liquidarConta(evento) {
        evento.preventDefault()

        if (!sessao || !contaParaLiquidar) {
            return
        }

        if (
            lancarNoControleFinanceiro &&
            !categoriaLiquidacaoId
        ) {
            setErroModal(
                'Escolha uma categoria para lançar no dashboard financeiro.',
            )

            return
        }

        try {
            setSalvandoLiquidacao(true)
            setErroModal('')

            const empresaId =
                sessao.usuario.empresaId

            const corpo = {
                valor:
                    Number(valorLiquidacao),
                dataLiquidacao,
                observacao:
                    observacaoLiquidacao.trim()
                    || null,
                lancarNoControleFinanceiro,
                categoriaId:
                    lancarNoControleFinanceiro
                        ? Number(
                            categoriaLiquidacaoId,
                        )
                        : null,
            }

            const resposta = await fetch(
                `${API_URL}/empresas/${empresaId}/contas-financeiras/${contaParaLiquidar.id}/liquidacoes`,
                {
                    method: 'POST',
                    headers:
                        criarCabecalhos(true),
                    body:
                        JSON.stringify(corpo),
                },
            )

            if (
                resposta.status === 401 ||
                resposta.status === 403
            ) {
                limparSessao()

                navigate('/login', {
                    replace: true,
                })

                return
            }

            if (!resposta.ok) {
                throw new Error(
                    await obterMensagemDeErro(
                        resposta,
                        'Não foi possível quitar a conta.',
                    ),
                )
            }

            setContaParaLiquidar(null)
            await carregarDados()
        } catch (erroDaRequisicao) {
            setErroModal(
                erroDaRequisicao instanceof Error
                    ? erroDaRequisicao.message
                    : 'Não foi possível quitar a conta.',
            )
        } finally {
            setSalvandoLiquidacao(false)
        }
    }

    function abrirCancelamento(conta) {
        setContaParaCancelar(conta)
        setErroModal('')
    }

    function fecharModalCancelamento() {
        if (cancelandoConta) {
            return
        }

        setContaParaCancelar(null)
        setErroModal('')
    }

    async function cancelarConta() {
        if (!sessao || !contaParaCancelar) {
            return
        }

        try {
            setCancelandoConta(true)
            setErroModal('')

            const empresaId =
                sessao.usuario.empresaId

            const resposta = await fetch(
                `${API_URL}/empresas/${empresaId}/contas-financeiras/${contaParaCancelar.id}/cancelar`,
                {
                    method: 'PATCH',
                    headers: criarCabecalhos(),
                },
            )

            if (
                resposta.status === 401 ||
                resposta.status === 403
            ) {
                limparSessao()

                navigate('/login', {
                    replace: true,
                })

                return
            }

            if (!resposta.ok) {
                throw new Error(
                    await obterMensagemDeErro(
                        resposta,
                        'Não foi possível cancelar a conta.',
                    ),
                )
            }

            setContaParaCancelar(null)
            await carregarDados()
        } catch (erroDaRequisicao) {
            setErroModal(
                erroDaRequisicao instanceof Error
                    ? erroDaRequisicao.message
                    : 'Não foi possível cancelar a conta.',
            )
        } finally {
            setCancelandoConta(false)
        }
    }

    async function restaurarConta(conta) {
        if (!sessao) {
            return
        }

        try {
            setRestaurandoContaId(conta.id)
            setErro('')

            const empresaId =
                sessao.usuario.empresaId

            const resposta = await fetch(
                `${API_URL}/empresas/${empresaId}/contas-financeiras/${conta.id}/restaurar`,
                {
                    method: 'PATCH',
                    headers: criarCabecalhos(),
                },
            )

            if (
                resposta.status === 401 ||
                resposta.status === 403
            ) {
                limparSessao()

                navigate('/login', {
                    replace: true,
                })

                return
            }

            if (!resposta.ok) {
                throw new Error(
                    await obterMensagemDeErro(
                        resposta,
                        'NÃ£o foi possÃ­vel restaurar a conta.',
                    ),
                )
            }

            setContasLixeira(
                (contasAtuais) =>
                    contasAtuais.filter(
                        (item) => item.id !== conta.id,
                    ),
            )
        } catch (erroDaRequisicao) {
            setErro(
                erroDaRequisicao instanceof Error
                    ? erroDaRequisicao.message
                    : 'NÃ£o foi possÃ­vel restaurar a conta.',
            )
        } finally {
            setRestaurandoContaId(null)
        }
    }

    function abrirExclusaoPermanente(conta) {
        setContaParaExcluirPermanente(conta)
        setErroModal('')
    }

    function fecharExclusaoPermanente() {
        if (excluindoContaPermanente) {
            return
        }

        setContaParaExcluirPermanente(null)
        setErroModal('')
    }

    async function excluirContaPermanentemente() {
        if (!sessao || !contaParaExcluirPermanente) {
            return
        }

        try {
            setExcluindoContaPermanente(true)
            setErroModal('')

            const empresaId =
                sessao.usuario.empresaId

            const resposta = await fetch(
                `${API_URL}/empresas/${empresaId}/contas-financeiras/${contaParaExcluirPermanente.id}/permanente`,
                {
                    method: 'DELETE',
                    headers: criarCabecalhos(),
                },
            )

            if (
                resposta.status === 401 ||
                resposta.status === 403
            ) {
                limparSessao()

                navigate('/login', {
                    replace: true,
                })

                return
            }

            if (!resposta.ok) {
                throw new Error(
                    await obterMensagemDeErro(
                        resposta,
                        'NÃ£o foi possÃ­vel excluir definitivamente a conta.',
                    ),
                )
            }

            setContasLixeira(
                (contasAtuais) =>
                    contasAtuais.filter(
                        (item) =>
                            item.id !==
                            contaParaExcluirPermanente.id,
                    ),
            )

            setContaParaExcluirPermanente(null)
        } catch (erroDaRequisicao) {
            setErroModal(
                erroDaRequisicao instanceof Error
                    ? erroDaRequisicao.message
                    : 'NÃ£o foi possÃ­vel excluir definitivamente a conta.',
            )
        } finally {
            setExcluindoContaPermanente(false)
        }
    }

    function abrirEnvioFinanceiro(conta) {
        setContaParaEnviarFinanceiro(conta)
        setObservacaoLiquidacao('')
        setNovaCategoriaFinanceiro('')
        setCategoriaLiquidacaoId('')
        setCategoriasLiquidacao([])
        setErroModal('')

        void carregarCategoriasLiquidacao(conta)
    }

    function fecharEnvioFinanceiro() {
        if (enviandoFinanceiro) {
            return
        }

        setContaParaEnviarFinanceiro(null)
        setErroModal('')
        setNovaCategoriaFinanceiro('')
    }

    async function enviarContaAoFinanceiro(evento) {
        evento.preventDefault()

        if (!sessao || !contaParaEnviarFinanceiro) {
            return
        }

        if (
            !categoriaLiquidacaoId &&
            !novaCategoriaFinanceiro.trim()
        ) {
            setErroModal(
                'Escolha uma categoria existente ou crie uma nova categoria.',
            )

            return
        }

        try {
            setEnviandoFinanceiro(true)
            setErroModal('')

            const empresaId =
                sessao.usuario.empresaId

            const corpo = {
                categoriaId:
                    categoriaLiquidacaoId
                        ? Number(categoriaLiquidacaoId)
                        : null,
                novaCategoriaNome:
                    novaCategoriaFinanceiro.trim()
                    || null,
                observacao:
                    observacaoLiquidacao.trim()
                    || null,
            }

            const resposta = await fetch(
                `${API_URL}/empresas/${empresaId}/contas-financeiras/${contaParaEnviarFinanceiro.id}/enviar-financeiro`,
                {
                    method: 'POST',
                    headers:
                        criarCabecalhos(true),
                    body:
                        JSON.stringify(corpo),
                },
            )

            if (
                resposta.status === 401 ||
                resposta.status === 403
            ) {
                limparSessao()

                navigate('/login', {
                    replace: true,
                })

                return
            }

            if (!resposta.ok) {
                throw new Error(
                    await obterMensagemDeErro(
                        resposta,
                        'NÃ£o foi possÃ­vel enviar a conta ao financeiro.',
                    ),
                )
            }

            setContaParaEnviarFinanceiro(null)
            setNovaCategoriaFinanceiro('')
            await carregarDados()
        } catch (erroDaRequisicao) {
            setErroModal(
                erroDaRequisicao instanceof Error
                    ? erroDaRequisicao.message
                    : 'NÃ£o foi possÃ­vel enviar a conta ao financeiro.',
            )
        } finally {
            setEnviandoFinanceiro(false)
        }
    }

    if (!sessao) {
        return null
    }

    return (
        <div className="contas-pagina">
            <div className="contas-conteudo">
                <header className="contas-cabecalho">
                    <div className="contas-cabecalho-navegacao">
                        <button
                            className="contas-voltar"
                            onClick={
                                voltarAoDashboard
                            }
                            type="button"
                        >
                            ← Voltar ao dashboard
                        </button>

                        <AlternadorModulos />
                    </div>

                    <div className="contas-cabecalho-linha">
                        <div>
                            <p className="contas-etiqueta">
                                Planejamento financeiro
                            </p>

                            <h1>
                                Contas a pagar e receber
                            </h1>

                            <span>
                                Acompanhe vencimentos,
                                compromissos e valores
                                previstos da propriedade.
                            </span>
                        </div>

                        <div className="contas-acoes">
                            <button
                                className="contas-botao contas-botao-secundario"
                                onClick={() => {
                                    if (mostrandoLixeira) {
                                        setMostrandoLixeira(false)
                                        void carregarDados()
                                    } else {
                                        void carregarLixeira()
                                    }
                                }}
                                type="button"
                            >
                                {mostrandoLixeira
                                    ? 'Ver contas cadastradas'
                                    : 'Lixeira'}
                            </button>

                            <button
                                className="contas-botao contas-botao-secundario"
                                onClick={() =>
                                    criarConta('PAGAR')
                                }
                                type="button"
                            >
                                Nova conta a pagar — dinheiro que deverá sair
                            </button>

                            <button
                                className="contas-botao"
                                onClick={() =>
                                    criarConta('RECEBER')
                                }
                                type="button"
                            >
                                Nova conta a receber — dinheiro que deverá entrar
                            </button>
                        </div>
                    </div>
                </header>

                {erro && (
                    <div className="contas-erro">
                        <strong>
                            Não foi possível carregar
                        </strong>

                        <span>{erro}</span>

                        <button
                            onClick={carregarDados}
                            type="button"
                        >
                            Tentar novamente
                        </button>
                    </div>
                )}

                {lembretes.length > 0 && (
                    <section className="contas-alerta">
                        <div className="contas-alerta-icone">
                            !
                        </div>

                        <div>
                            <strong>
                                {lembretes.length === 1
                                    ? '1 conta precisa da sua atenção'
                                    : `${lembretes.length} contas precisam da sua atenção`}
                            </strong>

                            <p>
                                Existem contas próximas do
                                vencimento ou já vencidas.
                            </p>
                        </div>

                        <a href="#lista-contas">
                            Ver contas
                        </a>
                    </section>
                )}

                <section className="contas-resumo">
                    <article className="contas-card contas-card-receber">
                        <p>
                            Total a receber — dinheiro que deverá entrar
                        </p>

                        <strong>
                            {formatarDinheiro(
                                resumo?.totalAReceber,
                            )}
                        </strong>

                        <span>
                            {
                                resumo
                                    ?.quantidadeContasAReceber
                                ?? 0
                            } contas no período
                        </span>
                    </article>

                    <article className="contas-card contas-card-pagar">
                        <p>
                            Total a pagar — dinheiro que deverá sair
                        </p>

                        <strong>
                            {formatarDinheiro(
                                resumo?.totalAPagar,
                            )}
                        </strong>

                        <span>
                            {
                                resumo
                                    ?.quantidadeContasAPagar
                                ?? 0
                            } contas no período
                        </span>
                    </article>

                    <article
                        className={`contas-card ${
                            previsaoPositiva
                                ? 'contas-card-positivo'
                                : 'contas-card-negativo'
                        }`}
                    >
                        <p>Diferença prevista</p>

                        <strong>
                            {formatarDinheiro(
                                resumo
                                    ?.diferencaPrevista,
                            )}
                        </strong>

                        <span>
                            {previsaoPositiva
                                ? 'Previsão positiva'
                                : 'Previsão de resultado negativo'}
                        </span>
                    </article>

                    <article className="contas-card contas-card-alertas">
                        <p>Precisam de atenção</p>

                        <strong>
                            {
                                resumo
                                    ?.quantidadeLembretes
                                ?? 0
                            }
                        </strong>

                        <span>
                            {
                                resumo
                                    ?.quantidadeVencidas
                                ?? 0
                            } contas vencidas
                        </span>
                    </article>
                </section>

                <section className="contas-projecao-painel">
                    <div className="contas-projecao-topo">
                        <div>
                            <p className="contas-etiqueta">
                                Perspectiva futura
                            </p>

                            <h2>
                                Previsão de dinheiro entrando e saindo
                            </h2>

                            <span>
                                O gráfico usa as datas de vencimento das contas pendentes e parcialmente quitadas.
                            </span>
                        </div>

                        <div className="contas-projecao-controles">
                            <div
                                aria-label="Período do gráfico"
                                className="contas-periodos"
                                role="group"
                            >
                                {[7, 30, 90].map((dias) => (
                                    <button
                                        className={
                                            diasGrafico === dias
                                                ? 'ativo'
                                                : ''
                                        }
                                        key={dias}
                                        onClick={() =>
                                            setDiasGrafico(dias)
                                        }
                                        type="button"
                                    >
                                        {dias} dias
                                    </button>
                                ))}
                            </div>

                            <button
                                className="contas-grafico-alternar"
                                onClick={() =>
                                    setGraficoVisivel(
                                        (visivel) =>
                                            !visivel,
                                    )
                                }
                                type="button"
                            >
                                {graficoVisivel
                                    ? 'Ocultar gráfico'
                                    : 'Mostrar gráfico'}
                            </button>
                        </div>
                    </div>

                    {graficoVisivel && (
                        <>
                            <div className="contas-grafico-legenda">
                                <span className="contas-legenda-receber">
                                    <i />
                                    Conta a receber — dinheiro que deverá entrar
                                </span>

                                <span className="contas-legenda-pagar">
                                    <i />
                                    Conta a pagar — dinheiro que deverá sair
                                </span>
                            </div>

                            {carregando ? (
                                <div className="contas-grafico-vazio">
                                    Carregando a previsão futura...
                                </div>
                            ) : (
                                <GraficoProjecaoContas
                                    pontos={pontosGrafico}
                                />
                            )}

                            <p className="contas-grafico-explicacao">
                                Os valores representam o que ainda está pendente para cada data. Contas quitadas e canceladas não entram nesta previsão.
                            </p>
                        </>
                    )}
                </section>

                <section className="contas-atalhos-painel">
                    <div className="contas-lista-topo">
                        <div>
                            <p className="contas-etiqueta">
                                Acesso rápido
                            </p>

                            <h2>
                                Contas e categorias
                            </h2>
                        </div>
                    </div>

                    <div className="contas-atalhos">
                        <button
                            onClick={() =>
                                criarConta('RECEBER')
                            }
                            type="button"
                        >
                            <span>+</span>
                            Nova conta a receber
                        </button>

                        <button
                            onClick={() =>
                                criarConta('PAGAR')
                            }
                            type="button"
                        >
                            <span>-</span>
                            Nova conta a pagar
                        </button>

                        <button
                            onClick={abrirCategorias}
                            type="button"
                        >
                            <span>≡</span>
                            Gerenciar categorias
                        </button>

                        <button
                            onClick={abrirCategorias}
                            type="button"
                        >
                            <span>+</span>
                            Criar categoria
                        </button>

                        <button
                            className="contas-atalho-lixeira"
                            onClick={() => {
                                if (mostrandoLixeira) {
                                    setMostrandoLixeira(false)
                                    void carregarDados()
                                } else {
                                    void carregarLixeira()
                                }
                            }}
                            type="button"
                        >
                            <span>
                                <IconeLixeira />
                            </span>
                            <span>âŒ«</span>
                            {mostrandoLixeira
                                ? 'Ver contas cadastradas'
                                : 'Lixeira'}
                        </button>

                        <button
                            disabled={Boolean(
                                baixandoRelatorio,
                            )}
                            onClick={() =>
                                baixarRelatorio(
                                    'excel',
                                )
                            }
                            type="button"
                        >
                            <span>▦</span>
                            {baixandoRelatorio
                            === 'excel'
                                ? 'Gerando Excel...'
                                : 'Excel da projeção'}
                        </button>

                        <button
                            disabled={Boolean(
                                baixandoRelatorio,
                            )}
                            onClick={() =>
                                baixarRelatorio(
                                    'pdf',
                                )
                            }
                            type="button"
                        >
                            <span>▤</span>
                            {baixandoRelatorio
                            === 'pdf'
                                ? 'Gerando PDF...'
                                : 'PDF da projeção'}
                        </button>
                    </div>
                </section>

                <section
                    className="contas-lista-painel"
                    id="lista-contas"
                >
                    <div className="contas-lista-topo">
                        <div>
                            <h2>
                                {mostrandoLixeira
                                    ? 'Contas na lixeira'
                                    : 'Contas cadastradas'}
                            </h2>

                            <p>
                                {contasVisiveis.length}{' '}
                                registros encontrados
                            </p>
                        </div>

                        {!mostrandoLixeira && (
                        <div className="contas-filtros">
                            <select
                                aria-label="Filtrar pelo tipo"
                                onChange={(evento) =>
                                    setTipo(
                                        evento
                                            .target
                                            .value,
                                    )
                                }
                                value={tipo}
                            >
                                <option value="">
                                    Pagar — dinheiro que deverá sair e receber — dinheiro que deverá entrar
                                </option>

                                <option value="PAGAR">
                                    Contas a pagar — dinheiro que deverá sair
                                </option>

                                <option value="RECEBER">
                                    Contas a receber — dinheiro que deverá entrar
                                </option>
                            </select>

                            <select
                                aria-label="Filtrar pela situação"
                                onChange={(evento) =>
                                    setSituacao(
                                        evento
                                            .target
                                            .value,
                                    )
                                }
                                value={situacao}
                            >
                                <option value="">
                                    Todas as situações
                                </option>

                                <option value="PENDENTE">
                                    Pendentes
                                </option>

                                <option value="PARCIAL">
                                    Parcialmente quitadas
                                </option>

                                <option value="QUITADA">
                                    Quitadas
                                </option>

                                <option value="CANCELADA">
                                    Canceladas
                                </option>
                            </select>
                        </div>
                        )}
                    </div>

                    {carregando ? (
                        <div className="contas-vazio">
                            Carregando contas...
                        </div>
                    ) : contasVisiveis.length === 0 ? (
                        <div className="contas-vazio">
                            <strong>
                                {mostrandoLixeira
                                    ? 'A lixeira está vazia'
                                    : 'Nenhuma conta encontrada'}
                            </strong>

                            <p>
                                Cadastre uma conta a pagar
                                ou receber para começar o
                                planejamento.
                            </p>
                        </div>
                    ) : (
                        <div className="contas-lista">
                            {contasVisiveis.map((conta) => (
                                <article
                                    className="contas-item"
                                    key={conta.id}
                                >
                                    <div
                                        className={`contas-item-icone ${
                                            conta.tipo
                                            === 'RECEBER'
                                                ? 'contas-item-receber'
                                                : 'contas-item-pagar'
                                        }`}
                                    >
                                        {conta.tipo
                                        === 'RECEBER'
                                            ? '↓'
                                            : '↑'}
                                    </div>

                                    <div className="contas-item-informacoes">
                                        <div className="contas-item-titulo">
                                            <strong>
                                                {
                                                    conta.descricao
                                                }
                                            </strong>

                                            <span
                                                className={`contas-status ${obterClasseSituacao(
                                                    conta,
                                                )}`}
                                            >
                                                {
                                                    conta.vencida
                                                        ? 'Vencida'
                                                        : conta.situacaoDescricao
                                                }
                                            </span>
                                        </div>

                                        <p>
                                            {
                                                conta.categoriaNome
                                            }

                                            {conta.favorecido
                                                ? ` · ${conta.favorecido}`
                                                : ''}
                                        </p>

                                        <small>
                                            Vencimento:{' '}
                                            {formatarData(
                                                conta.dataVencimento,
                                            )}
                                            {' · '}
                                            {
                                                obterTextoVencimento(
                                                    conta,
                                                )
                                            }
                                        </small>
                                    </div>

                                    <div className="contas-item-valores">
                                        <strong
                                            className={
                                                conta.tipo
                                                === 'RECEBER'
                                                    ? 'contas-valor-receber'
                                                    : 'contas-valor-pagar'
                                            }
                                        >
                                            {conta.tipo
                                            === 'RECEBER'
                                                ? '+'
                                                : '-'}{' '}

                                            {formatarDinheiro(
                                                conta.valorPendente,
                                            )}
                                        </strong>

                                        {Number(
                                            conta.valorLiquidado
                                            ?? 0,
                                        ) > 0 && (
                                            <small>
                                                Liquidado:{' '}
                                                {
                                                    formatarDinheiro(
                                                        conta.valorLiquidado,
                                                    )
                                                }
                                            </small>
                                        )}
                                    </div>

                                    <div className="contas-item-acoes">
                                        {mostrandoLixeira ? (
                                            <>
                                                <button
                                                    className="contas-acao-principal"
                                                    disabled={
                                                        restaurandoContaId ===
                                                        conta.id
                                                    }
                                                    onClick={() =>
                                                        restaurarConta(
                                                            conta,
                                                        )
                                                    }
                                                    type="button"
                                                >
                                                    {restaurandoContaId ===
                                                    conta.id
                                                        ? 'Restaurando...'
                                                        : 'Restaurar conta'}
                                                </button>

                                                <button
                                                    className="contas-acao-perigo"
                                                    onClick={() =>
                                                        abrirExclusaoPermanente(
                                                            conta,
                                                        )
                                                    }
                                                    type="button"
                                                >
                                                    Excluir permanentemente
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                {conta.situacao !== 'QUITADA'
                                                    && conta.situacao !== 'CANCELADA' && (
                                                        <button
                                                            className="contas-acao-principal"
                                                            onClick={() =>
                                                                abrirLiquidacao(
                                                                    conta,
                                                                )
                                                            }
                                                            type="button"
                                                        >
                                                            Quitar
                                                        </button>
                                                    )}

                                                {conta.situacao !== 'QUITADA'
                                                    && conta.situacao !== 'CANCELADA'
                                                    && !conta.movimentacaoFinanceiroId && (
                                                        <button
                                                            className="contas-acao-principal"
                                                            onClick={() =>
                                                                abrirEnvioFinanceiro(
                                                                    conta,
                                                                )
                                                            }
                                                            type="button"
                                                        >
                                                            Enviar ao financeiro
                                                        </button>
                                                    )}

                                                {conta.situacao !== 'QUITADA'
                                                    && conta.situacao !== 'CANCELADA' && (
                                                        <button
                                                            className="contas-acao-perigo"
                                                            onClick={() =>
                                                                abrirCancelamento(
                                                                    conta,
                                                                )
                                                            }
                                                            type="button"
                                                        >
                                                            Enviar para lixeira
                                                        </button>
                                                    )}
                                            </>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {contaParaLiquidar && (
                <div
                    className="contas-modal-fundo"
                    role="presentation"
                >
                    <section
                        aria-modal="true"
                        className="contas-modal"
                        role="dialog"
                    >
                        <div className="contas-modal-topo">
                            <div>
                                <p className="contas-etiqueta">
                                    Quitar conta
                                </p>

                                <h2>
                                    {contaParaLiquidar.descricao}
                                </h2>
                            </div>

                            <button
                                aria-label="Fechar"
                                onClick={fecharModalLiquidacao}
                                type="button"
                            >
                                ×
                            </button>
                        </div>

                        <form
                            className="contas-modal-formulario"
                            onSubmit={liquidarConta}
                        >
                            <div className="contas-modal-linha">
                                <label>
                                    Valor
                                    <input
                                        disabled={salvandoLiquidacao}
                                        min="0.01"
                                        onChange={(evento) =>
                                            setValorLiquidacao(
                                                evento.target.value,
                                            )
                                        }
                                        required
                                        step="0.01"
                                        type="number"
                                        value={valorLiquidacao}
                                    />
                                </label>

                                <label>
                                    Data
                                    <input
                                        disabled={salvandoLiquidacao}
                                        max={obterDataAtual()}
                                        onChange={(evento) =>
                                            setDataLiquidacao(
                                                evento.target.value,
                                            )
                                        }
                                        required
                                        type="date"
                                        value={dataLiquidacao}
                                    />
                                </label>
                            </div>

                            <label className="contas-modal-check">
                                <input
                                    checked={
                                        lancarNoControleFinanceiro
                                    }
                                    disabled={salvandoLiquidacao}
                                    onChange={(evento) =>
                                        setLancarNoControleFinanceiro(
                                            evento.target.checked,
                                        )
                                    }
                                    type="checkbox"
                                />

                                <span>
                                    Lançar também no Dashboard financeiro
                                </span>
                            </label>

                            {lancarNoControleFinanceiro && (
                                <label>
                                    Categoria no Dashboard financeiro
                                    <select
                                        disabled={
                                            salvandoLiquidacao
                                            || carregandoCategoriasLiquidacao
                                        }
                                        onChange={(evento) =>
                                            setCategoriaLiquidacaoId(
                                                evento.target.value,
                                            )
                                        }
                                        required
                                        value={categoriaLiquidacaoId}
                                    >
                                        {carregandoCategoriasLiquidacao ? (
                                            <option value="">
                                                Carregando categorias...
                                            </option>
                                        ) : categoriasLiquidacao.length === 0 ? (
                                            <option value="">
                                                Nenhuma categoria disponível
                                            </option>
                                        ) : (
                                            categoriasLiquidacao.map(
                                                (categoria) => (
                                                    <option
                                                        key={categoria.id}
                                                        value={categoria.id}
                                                    >
                                                        {categoria.nome}
                                                    </option>
                                                ),
                                            )
                                        )}
                                    </select>
                                </label>
                            )}

                            {lancarNoControleFinanceiro
                                && !carregandoCategoriasLiquidacao
                                && categoriasLiquidacao.length === 0 && (
                                    <button
                                        className="contas-modal-link"
                                        onClick={abrirCategorias}
                                        type="button"
                                    >
                                        Criar categoria
                                    </button>
                                )}

                            <label>
                                Observação
                                <textarea
                                    disabled={salvandoLiquidacao}
                                    maxLength="500"
                                    onChange={(evento) =>
                                        setObservacaoLiquidacao(
                                            evento.target.value,
                                        )
                                    }
                                    placeholder="Detalhes opcionais"
                                    value={observacaoLiquidacao}
                                />
                            </label>

                            {erroModal && (
                                <p className="contas-modal-erro">
                                    {erroModal}
                                </p>
                            )}

                            <div className="contas-modal-acoes">
                                <button
                                    onClick={fecharModalLiquidacao}
                                    type="button"
                                >
                                    Voltar
                                </button>

                                <button
                                    className="contas-modal-confirmar"
                                    disabled={salvandoLiquidacao}
                                    type="submit"
                                >
                                    {salvandoLiquidacao
                                        ? 'Quitando...'
                                        : 'Confirmar quitação'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}

            {contaParaCancelar && (
                <div
                    className="contas-modal-fundo"
                    role="presentation"
                >
                    <section
                        aria-modal="true"
                        className="contas-modal contas-modal-perigo"
                        role="dialog"
                    >
                        <div className="contas-modal-topo">
                            <div>
                                <p className="contas-etiqueta">
                                    Cancelar conta
                                </p>

                                <h2>
                                    {contaParaCancelar.descricao}
                                </h2>
                            </div>

                            <button
                                aria-label="Fechar"
                                onClick={fecharModalCancelamento}
                                type="button"
                            >
                                ×
                            </button>
                        </div>

                        <p className="contas-modal-texto">
                            Tem certeza que deseja cancelar esta conta?
                            Depois disso ela não entrará mais nas
                            projeções e a operação não poderá ser
                            desfeita pela tela.
                        </p>

                        {erroModal && (
                            <p className="contas-modal-erro">
                                {erroModal}
                            </p>
                        )}

                        <div className="contas-modal-acoes">
                            <button
                                onClick={fecharModalCancelamento}
                                type="button"
                            >
                                Voltar
                            </button>

                            <button
                                className="contas-modal-confirmar-perigo"
                                disabled={cancelandoConta}
                                onClick={cancelarConta}
                                type="button"
                            >
                                {cancelandoConta
                                    ? 'Cancelando...'
                                    : 'Sim, cancelar conta'}
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {contaParaExcluirPermanente && (
                <div
                    className="contas-modal-fundo"
                    role="presentation"
                >
                    <section
                        aria-modal="true"
                        className="contas-modal contas-modal-perigo"
                        role="dialog"
                    >
                        <div className="contas-modal-topo">
                            <div>
                                <p className="contas-etiqueta">
                                    ExclusÃ£o definitiva
                                </p>

                                <h2>
                                    {contaParaExcluirPermanente.descricao}
                                </h2>
                            </div>

                            <button
                                aria-label="Fechar"
                                onClick={fecharExclusaoPermanente}
                                type="button"
                            >
                                Ã—
                            </button>
                        </div>

                        <p className="contas-modal-texto">
                            Esta conta serÃ¡ apagada permanentemente.
                            Depois disso nÃ£o serÃ¡ possÃ­vel recuperar.
                        </p>

                        {erroModal && (
                            <p className="contas-modal-erro">
                                {erroModal}
                            </p>
                        )}

                        <div className="contas-modal-acoes">
                            <button
                                onClick={fecharExclusaoPermanente}
                                type="button"
                            >
                                Voltar
                            </button>

                            <button
                                className="contas-modal-confirmar-perigo"
                                disabled={excluindoContaPermanente}
                                onClick={excluirContaPermanentemente}
                                type="button"
                            >
                                {excluindoContaPermanente
                                    ? 'Excluindo...'
                                    : 'Sim, excluir de vez'}
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {contaParaEnviarFinanceiro && (
                <div
                    className="contas-modal-fundo"
                    role="presentation"
                >
                    <section
                        aria-modal="true"
                        className="contas-modal"
                        role="dialog"
                    >
                        <div className="contas-modal-topo">
                            <div>
                                <p className="contas-etiqueta">
                                    Enviar ao financeiro
                                </p>

                                <h2>
                                    {contaParaEnviarFinanceiro.descricao}
                                </h2>
                            </div>

                            <button
                                aria-label="Fechar"
                                onClick={fecharEnvioFinanceiro}
                                type="button"
                            >
                                Ã—
                            </button>
                        </div>

                        <form
                            className="contas-modal-formulario"
                            onSubmit={enviarContaAoFinanceiro}
                        >
                            <p className="contas-modal-texto">
                                O valor pendente serÃ¡ lanÃ§ado no Dashboard
                                financeiro e esta conta sairÃ¡ da previsÃ£o futura.
                            </p>

                            <label>
                                Categoria existente
                                <select
                                    disabled={
                                        enviandoFinanceiro
                                        || carregandoCategoriasLiquidacao
                                    }
                                    onChange={(evento) =>
                                        setCategoriaLiquidacaoId(
                                            evento.target.value,
                                        )
                                    }
                                    value={categoriaLiquidacaoId}
                                >
                                    <option value="">
                                        Escolher categoria existente
                                    </option>

                                    {carregandoCategoriasLiquidacao ? (
                                        <option value="">
                                            Carregando categorias...
                                        </option>
                                    ) : (
                                        categoriasLiquidacao.map(
                                            (categoria) => (
                                                <option
                                                    key={categoria.id}
                                                    value={categoria.id}
                                                >
                                                    {categoria.nome}
                                                </option>
                                            ),
                                        )
                                    )}
                                </select>
                            </label>

                            <label>
                                Ou criar nova categoria
                                <input
                                    disabled={enviandoFinanceiro}
                                    maxLength="100"
                                    onChange={(evento) =>
                                        setNovaCategoriaFinanceiro(
                                            evento.target.value,
                                        )
                                    }
                                    placeholder="Ex.: Venda de soja"
                                    type="text"
                                    value={novaCategoriaFinanceiro}
                                />
                            </label>

                            <label>
                                ObservaÃ§Ã£o
                                <textarea
                                    disabled={enviandoFinanceiro}
                                    maxLength="500"
                                    onChange={(evento) =>
                                        setObservacaoLiquidacao(
                                            evento.target.value,
                                        )
                                    }
                                    placeholder="Detalhes opcionais"
                                    value={observacaoLiquidacao}
                                />
                            </label>

                            {erroModal && (
                                <p className="contas-modal-erro">
                                    {erroModal}
                                </p>
                            )}

                            <div className="contas-modal-acoes">
                                <button
                                    onClick={fecharEnvioFinanceiro}
                                    type="button"
                                >
                                    Voltar
                                </button>

                                <button
                                    className="contas-modal-confirmar"
                                    disabled={enviandoFinanceiro}
                                    type="submit"
                                >
                                    {enviandoFinanceiro
                                        ? 'Enviando...'
                                        : 'Enviar ao financeiro'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </div>
    )
}

export default ContasFinanceiras
