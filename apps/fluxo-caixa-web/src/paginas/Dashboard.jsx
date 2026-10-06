import {
    useEffect,
    useMemo,
    useState,
} from 'react'
import {
    useNavigate,
} from 'react-router'
import ShellDashboard from '../componentes/ShellDashboard.jsx'
import CarregamentoTela from '../componentes/CarregamentoTela.jsx'
import { API_BASE_URL as API_URL } from '../config.js'
import './Dashboard.css'
import { limparSessao } from '../servicos/sessao.js'

function Icone({ nome, tamanho }) {
    return (
        <span
            aria-hidden="true"
            className="material-symbols-outlined"
            style={tamanho ? { fontSize: `${tamanho}px` } : undefined}
        >
            {nome}
        </span>
    )
}

const LARGURA_GRAFICO = 720
const ALTURA_GRAFICO = 220
const ESPACO_SUPERIOR = 18
const ESPACO_INFERIOR = 20

const AREAS_DASHBOARD = [
    {
        valor: 'TODAS',
        rotulo: 'Tudo',
    },
    {
        valor: 'AGRICULTURA',
        rotulo: 'Agricultura',
    },
    {
        valor: 'PECUARIA',
        rotulo: 'Pecuária',
    },
]

function formatarDinheiro(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(valor ?? 0)
}

function formatarDinheiroCompacto(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(valor ?? 0)
}

function formatarPercentual(valor) {
    if (valor === null || valor === undefined) {
        return 'Ainda não calculado'
    }

    const percentual =
        new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(valor)

    return `${percentual}%`
}

function formatarData(data) {
    if (!data) {
        return ''
    }

    const [ano, mes, dia] = data.split('-')

    return `${dia}/${mes}/${ano}`
}

function formatarDataCurta(data) {
    if (!data) {
        return ''
    }

    const [, mes, dia] = data.split('-')

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

function obterPeriodo(dias) {
    const dataFinal = new Date()
    const dataInicial = new Date()

    dataInicial.setDate(
        dataFinal.getDate() - (dias - 1),
    )

    return {
        dataInicial:
            formatarDataParaApi(dataInicial),
        dataFinal:
            formatarDataParaApi(dataFinal),
    }
}

// Período do mês corrente (dia 1 até hoje).
function obterPeriodoMes() {
    const hoje = new Date()
    const inicio = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        1,
    )

    return {
        dataInicial: formatarDataParaApi(inicio),
        dataFinal: formatarDataParaApi(hoje),
    }
}

const MESES_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

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
    const dadosErro = await resposta
        .json()
        .catch(() => null)

    return dadosErro?.mensagem
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

function criarCaminho(pontos) {
    if (pontos.length === 0) {
        return ''
    }

    return pontos
        .map((ponto, indice) => {
            const comando =
                indice === 0 ? 'M' : 'L'

            return `${comando} ${ponto.x} ${ponto.y}`
        })
        .join(' ')
}

// Barras de receita/despesa por ponto (estilo do design do Stitch).
function criarBarras(dados, maiorValor) {
    if (dados.length === 0) {
        return []
    }

    const alturaUtil = ALTURA_GRAFICO - ESPACO_SUPERIOR - ESPACO_INFERIOR
    const base = ALTURA_GRAFICO - ESPACO_INFERIOR
    const larguraGrupo = LARGURA_GRAFICO / dados.length
    // Duas barras por grupo, com folga lateral.
    const larguraBarra = Math.min(18, (larguraGrupo * 0.6) / 2)
    const folga = 3

    return dados.map((ponto, indice) => {
        const centro = larguraGrupo * (indice + 0.5)
        const receita = Number(ponto.totalReceitas ?? 0)
        const despesa = Number(ponto.totalDespesas ?? 0)
        const altR = maiorValor > 0 ? (receita / maiorValor) * alturaUtil : 0
        const altD = maiorValor > 0 ? (despesa / maiorValor) * alturaUtil : 0

        return {
            data: ponto.data,
            receita,
            despesa,
            larguraBarra,
            receitaX: centro - larguraBarra - folga / 2,
            despesaX: centro + folga / 2,
            receitaY: base - altR,
            despesaY: base - altD,
            receitaH: altR,
            despesaH: altD,
        }
    })
}

function Dashboard() {
    const navigate = useNavigate()

    const [sessao] =
        useState(obterSessao)

    const [resumo, setResumo] =
        useState(null)

    const [
        movimentacoes,
        setMovimentacoes,
    ] = useState([])

    const [
        fluxoCaixa,
        setFluxoCaixa,
    ] = useState([])

    const [
        periodoGrafico,
        setPeriodoGrafico,
    ] = useState(30)

    const [
        dataInicialPersonalizada,
        setDataInicialPersonalizada,
    ] = useState('')

    const [
        dataFinalPersonalizada,
        setDataFinalPersonalizada,
    ] = useState('')

    const [
        areaSelecionada,
        setAreaSelecionada,
    ] = useState('TODAS')


    const [
        carregando,
        setCarregando,
    ] = useState(true)

    const [
        carregandoGrafico,
        setCarregandoGrafico,
    ] = useState(false)

    const [
        baixandoRelatorio,
        setBaixandoRelatorio,
    ] = useState('')

    const [erro, setErro] =
        useState('')

    const [
        abaLancamentos,
        setAbaLancamentos,
    ] = useState('TODOS')

    const periodoSelecionado = useMemo(() => {
        if (
            dataInicialPersonalizada
            && dataFinalPersonalizada
        ) {
            return {
                dataInicial:
                    dataInicialPersonalizada,
                dataFinal:
                    dataFinalPersonalizada,
                personalizado: true,
            }
        }

        return {
            ...obterPeriodo(periodoGrafico),
            personalizado: false,
        }
    }, [
        dataFinalPersonalizada,
        dataInicialPersonalizada,
        periodoGrafico,
    ])

    const hoje = new Date()
    const rotuloMes = `${MESES_PT[hoje.getMonth()]} ${hoje.getFullYear()}`
    const periodoMes = obterPeriodoMes()

    // Qual pílula de período está ativa.
    const pilulaAtiva = (() => {
        if (periodoSelecionado.personalizado) {
            if (
                dataInicialPersonalizada === periodoMes.dataInicial
                && dataFinalPersonalizada === periodoMes.dataFinal
            ) {
                return 'mes'
            }
            return 'personalizado'
        }
        if (periodoGrafico === 1) return 'hoje'
        if (periodoGrafico === 7) return 'semana'
        return 'personalizado'
    })()

    function selecionarPreset(dias) {
        setDataInicialPersonalizada('')
        setDataFinalPersonalizada('')
        setPeriodoGrafico(dias)
    }

    function selecionarMes() {
        setPeriodoGrafico(30)
        setDataInicialPersonalizada(periodoMes.dataInicial)
        setDataFinalPersonalizada(periodoMes.dataFinal)
    }

    const [mostrarDatas, setMostrarDatas] = useState(false)

    useEffect(() => {
        if (!sessao) {
            navigate('/login', {
                replace: true,
            })

            return undefined
        }

        let componenteAtivo = true

        const empresaId =
            sessao.usuario.empresaId

        const cabecalhos = {
            Authorization:
                `${sessao.tipoToken} ${sessao.token}`,
        }

        if (
            periodoSelecionado.dataInicial
            > periodoSelecionado.dataFinal
        ) {
            setErro(
                'A data inicial não pode ser maior que a data final.',
            )
            setFluxoCaixa([])
            setCarregando(false)
            setCarregandoGrafico(false)

            return undefined
        }

        const parametrosGrafico =
            new URLSearchParams({
                dataInicial:
                periodoSelecionado.dataInicial,
                dataFinal:
                periodoSelecionado.dataFinal,
            })

        if (areaSelecionada !== 'TODAS') {
            parametrosGrafico.set(
                'area',
                areaSelecionada,
            )
        }

        async function carregarDashboard() {
            try {
                setCarregandoGrafico(true)

                const [
                    respostaResumo,
                    respostaMovimentacoes,
                    respostaFluxoCaixa,
                ] = await Promise.all([
                    fetch(
                        `${API_URL}/empresas/${empresaId}/dashboard/resumo?${parametrosGrafico}`,
                        {
                            headers: cabecalhos,
                        },
                    ),

                    fetch(
                        `${API_URL}/empresas/${empresaId}/movimentacoes`,
                        {
                            headers: cabecalhos,
                        },
                    ),

                    fetch(
                        `${API_URL}/empresas/${empresaId}/dashboard/fluxo-caixa?${parametrosGrafico}`,
                        {
                            headers: cabecalhos,
                        },
                    ),
                ])

                const respostas = [
                    respostaResumo,
                    respostaMovimentacoes,
                    respostaFluxoCaixa,
                ]

                const acessoNegado =
                    respostas.some(
                        (resposta) =>
                            resposta.status === 401
                    )

                if (acessoNegado) {
                    limparSessao()

                    navigate('/login', {
                        replace: true,
                    })

                    return
                }

                if (!respostaResumo.ok) {
                    const mensagem =
                        await obterMensagemDeErro(
                            respostaResumo,
                            'Não foi possível carregar o resumo financeiro.',
                        )

                    throw new Error(mensagem)
                }

                if (!respostaMovimentacoes.ok) {
                    const mensagem =
                        await obterMensagemDeErro(
                            respostaMovimentacoes,
                            'Não foi possível carregar as movimentações.',
                        )

                    throw new Error(mensagem)
                }

                if (!respostaFluxoCaixa.ok) {
                    const mensagem =
                        await obterMensagemDeErro(
                            respostaFluxoCaixa,
                            'Não foi possível carregar o gráfico financeiro.',
                        )

                    throw new Error(mensagem)
                }

                const [
                    dadosResumo,
                    dadosMovimentacoes,
                    dadosFluxoCaixa,
                ] = await Promise.all([
                    respostaResumo.json(),
                    respostaMovimentacoes.json(),
                    respostaFluxoCaixa.json(),
                ])

                if (!componenteAtivo) {
                    return
                }

                setResumo(dadosResumo)

                setMovimentacoes(
                    dadosMovimentacoes.content
                    ?? [],
                )

                setFluxoCaixa(
                    Array.isArray(dadosFluxoCaixa)
                        ? dadosFluxoCaixa
                        : [],
                )

                setErro('')
            } catch (erroDaRequisicao) {
                if (!componenteAtivo) {
                    return
                }

                setErro(
                    erroDaRequisicao
                    instanceof Error
                        ? erroDaRequisicao.message
                        : 'Não foi possível carregar o dashboard.',
                )
            } finally {
                if (componenteAtivo) {
                    setCarregando(false)
                    setCarregandoGrafico(false)
                }
            }
        }

        carregarDashboard()

        return () => {
            componenteAtivo = false
        }
    }, [
        navigate,
        areaSelecionada,
        periodoSelecionado.dataFinal,
        periodoSelecionado.dataInicial,
        sessao,
    ])

    const dadosGrafico = useMemo(() => {
        const maiorValor =
            Math.max(
                1,
                ...fluxoCaixa.flatMap(
                    (ponto) => [
                        Number(
                            ponto.totalReceitas
                            ?? 0,
                        ),
                        Number(
                            ponto.totalDespesas
                            ?? 0,
                        ),
                    ],
                ),
            )

        // Saldo acumulado: soma progressiva do saldo diário.
        let acumulado = 0
        const saldoAcumulado = fluxoCaixa.map((ponto) => {
            acumulado += Number(ponto.saldoDoDia ?? 0)
            return { data: ponto.data, valor: acumulado }
        })

        // Escala do eixo: maior entre barras e o pico do saldo acumulado.
        const maiorAcumulado = saldoAcumulado.reduce(
            (maior, ponto) => Math.max(maior, ponto.valor),
            0,
        )
        const escala = Math.max(maiorValor, maiorAcumulado, 1)

        const barras = criarBarras(fluxoCaixa, escala)

        // Pontos da linha de saldo acumulado, centralizados em cada grupo.
        const larguraGrupo =
            fluxoCaixa.length > 0
                ? LARGURA_GRAFICO / fluxoCaixa.length
                : LARGURA_GRAFICO
        const alturaUtil =
            ALTURA_GRAFICO - ESPACO_SUPERIOR - ESPACO_INFERIOR
        const base = ALTURA_GRAFICO - ESPACO_INFERIOR
        const pontosSaldo = saldoAcumulado.map((ponto, indice) => {
            const proporcao = escala > 0 ? ponto.valor / escala : 0
            return {
                x: larguraGrupo * (indice + 0.5),
                y: base - Math.max(0, proporcao) * alturaUtil,
                valor: ponto.valor,
                data: ponto.data,
            }
        })

        const possuiMovimentacoes =
            fluxoCaixa.some(
                (ponto) =>
                    Number(
                        ponto.totalReceitas
                        ?? 0,
                    ) > 0
                    || Number(
                        ponto.totalDespesas
                        ?? 0,
                    ) > 0,
            )

        return {
            maiorValor: escala,
            barras,
            pontosSaldo,
            caminhoSaldo: criarCaminho(pontosSaldo),
            possuiMovimentacoes,
        }
    }, [fluxoCaixa])

    function abrirNovaReceita() {
        navigate(
            '/dashboard/movimentacoes/nova?tipo=RECEITA',
            {
                state: {
                    voltarPara: '/dashboard/financeiro',
                },
            },
        )
    }

    function abrirNovaDespesa() {
        navigate(
            '/dashboard/movimentacoes/nova?tipo=DESPESA',
            {
                state: {
                    voltarPara: '/dashboard/financeiro',
                },
            },
        )
    }

    function abrirMovimentacoes() {
        navigate(
            '/dashboard/movimentacoes',
        )
    }

    function abrirLixeiraMovimentacoes() {
        navigate(
            '/dashboard/movimentacoes?lixeira=1',
        )
    }

    function abrirCategorias() {
        navigate(
            '/dashboard/categorias',
        )
    }

    function abrirFornecedores() {
        navigate(
            '/dashboard/fornecedores',
        )
    }

    function abrirPlanoPagamentos() {
        navigate(
            '/dashboard/plano',
        )
    }

    async function baixarRelatorio(tipo) {
        if (!sessao) {
            return
        }

        const empresaId =
            sessao.usuario.empresaId

        const extensao =
            tipo === 'excel'
                ? 'xlsx'
                : 'pdf'

        const nomePadrao =
            `relatorio.${extensao}`

        try {
            setBaixandoRelatorio(tipo)

            if (
                periodoSelecionado.dataInicial
                > periodoSelecionado.dataFinal
            ) {
                throw new Error(
                    'A data inicial não pode ser maior que a data final.',
                )
            }

            const parametrosRelatorio =
                new URLSearchParams({
                    dataInicial:
                        periodoSelecionado.dataInicial,
                    dataFinal:
                        periodoSelecionado.dataFinal,
                })

            const resposta =
                await fetch(
                    `${API_URL}/empresas/${empresaId}/relatorios/${tipo}?${parametrosRelatorio}`,
                    {
                        headers: {
                            Authorization:
                                `${sessao.tipoToken} ${sessao.token}`,
                        },
                    },
                )

            if (
                resposta.status === 401

            ) {
                limparSessao()

                navigate('/login', {
                    replace: true,
                })

                return
            }

            if (!resposta.ok) {
                const mensagem =
                    await obterMensagemDeErro(
                        resposta,
                        'Não foi possível gerar o relatório.',
                    )

                throw new Error(mensagem)
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
                URL.createObjectURL(
                    arquivo,
                )

            const link =
                document.createElement('a')

            link.href = urlArquivo
            link.download = nomeArquivo

            document.body.appendChild(
                link,
            )

            link.click()
            link.remove()

            URL.revokeObjectURL(
                urlArquivo,
            )
        } catch (erroDoRelatorio) {
            const mensagem =
                erroDoRelatorio
                instanceof Error
                    ? erroDoRelatorio.message
                    : 'Não foi possível gerar o relatório.'

            window.alert(mensagem)
        } finally {
            setBaixandoRelatorio('')
        }
    }

    if (!sessao) {
        return null
    }

    if (carregando) {
        return (
            <div className="ag-fin-estado publica">
                <CarregamentoTela texto="Carregando dashboard financeiro" />
            </div>
        )
    }

    if (erro) {
        return (
            <div className="ag-fin-estado publica">
                <div className="ag-fin-estado-caixa">
                    <h1>
                        Não foi possível carregar o dashboard
                    </h1>

                    <p>{erro}</p>

                    <button
                        className="ag-fin-botao"
                        onClick={() =>
                            window.location.reload()
                        }
                        type="button"
                    >
                        Tentar novamente
                    </button>
                </div>
            </div>
        )
    }

    const margemNegativa =
        Number(
            resumo?.margemLucro ?? 0,
        ) < 0

    const ganhoNegativo =
        Number(
            resumo?.ganhoSobreCusto ?? 0,
        ) < 0

    const primeiraData =
        fluxoCaixa.at(0)?.data

    const ultimaData =
        fluxoCaixa.at(-1)?.data

    const lancamentosFiltrados =
        movimentacoes
            .filter((movimentacao) =>
                abaLancamentos === 'TODOS'
                || movimentacao.tipo === abaLancamentos
            )
            .slice(0, 8)

    const totalReceitas = movimentacoes.filter(
        (m) => m.tipo === 'RECEITA',
    ).length
    const totalDespesas = movimentacoes.filter(
        (m) => m.tipo === 'DESPESA',
    ).length

    const abasLancamentos = [
        { valor: 'TODOS', rotulo: 'Todos', contagem: movimentacoes.length },
        { valor: 'RECEITA', rotulo: 'Receitas', contagem: totalReceitas },
        { valor: 'DESPESA', rotulo: 'Despesas', contagem: totalDespesas },
    ]

    return (
        <ShellDashboard sessao={sessao} ativo="visao-geral">
            <div className="ag-fin">
                <header className="ag-fin-topo">
                    <span className="ag-fin-eyebrow">
                        Gestão Financeira &amp; Fiscal
                        <i className="ag-fin-eyebrow-ponto" />
                        <strong>Fluxo de Caixa Rural</strong>
                    </span>
                    <h1>Controle Interno Financeiro</h1>
                </header>

                <section className="ag-fin-filtros">
                    <div className="ag-fin-pilulas">
                        <button
                            className={`ag-fin-pilula ${pilulaAtiva === 'hoje' ? 'ag-ativo' : ''}`}
                            disabled={carregandoGrafico}
                            onClick={() => selecionarPreset(1)}
                            type="button"
                        >
                            Hoje
                        </button>
                        <button
                            className={`ag-fin-pilula ${pilulaAtiva === 'semana' ? 'ag-ativo' : ''}`}
                            disabled={carregandoGrafico}
                            onClick={() => selecionarPreset(7)}
                            type="button"
                        >
                            Esta Semana
                        </button>
                        <button
                            className={`ag-fin-pilula ${pilulaAtiva === 'mes' ? 'ag-ativo' : ''}`}
                            disabled={carregandoGrafico}
                            onClick={selecionarMes}
                            type="button"
                        >
                            Este Mês ({rotuloMes})
                        </button>
                        <button
                            className={`ag-fin-pilula ${pilulaAtiva === 'personalizado' ? 'ag-ativo' : ''}`}
                            onClick={() => setMostrarDatas((v) => !v)}
                            type="button"
                        >
                            Personalizado
                            <Icone nome="calendar_today" tamanho={16} />
                        </button>
                    </div>

                    <div className="ag-fin-filtros-direita">
                        <div className="ag-fin-area-dropdown">
                            <Icone nome="domain" tamanho={16} />
                            <select
                                aria-label="Área produtiva"
                                disabled={carregandoGrafico}
                                onChange={(evento) =>
                                    setAreaSelecionada(evento.target.value)
                                }
                                value={areaSelecionada}
                            >
                                {AREAS_DASHBOARD.map((area) => (
                                    <option key={area.valor} value={area.valor}>
                                        {area.valor === 'TODAS'
                                            ? 'Todas as áreas'
                                            : area.rotulo}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            className="ag-fin-filtro-icone"
                            disabled={!!baixandoRelatorio}
                            onClick={() => baixarRelatorio('pdf')}
                            title="Exportar relatório"
                            type="button"
                        >
                            <Icone nome="file_download" tamanho={20} />
                        </button>
                    </div>
                </section>

                {mostrarDatas && (
                    <section className="ag-fin-datas-personalizado">
                        <label>
                            De
                            <input
                                disabled={carregandoGrafico}
                                onChange={(evento) =>
                                    setDataInicialPersonalizada(evento.target.value)
                                }
                                type="date"
                                value={dataInicialPersonalizada}
                            />
                        </label>
                        <label>
                            Até
                            <input
                                disabled={carregandoGrafico}
                                onChange={(evento) =>
                                    setDataFinalPersonalizada(evento.target.value)
                                }
                                type="date"
                                value={dataFinalPersonalizada}
                            />
                        </label>
                        {(dataInicialPersonalizada || dataFinalPersonalizada) && (
                            <button
                                disabled={carregandoGrafico}
                                onClick={() => {
                                    setDataInicialPersonalizada('')
                                    setDataFinalPersonalizada('')
                                }}
                                type="button"
                            >
                                Limpar datas
                            </button>
                        )}
                    </section>
                )}

                <section className="ag-fin-kpis">
                    <article className="ag-fin-kpi">
                        <div className="ag-fin-kpi-topo">
                            <div className="ag-fin-kpi-cabecalho">
                                <span className="ag-fin-kpi-eyebrow">Receita Realizada</span>
                                <h3 className="ag-fin-kpi-titulo">Total que entrou</h3>
                            </div>
                            <span className="ag-fin-kpi-icone">
                                <Icone nome="south_east" tamanho={22} />
                            </span>
                        </div>

                        <strong className="ag-fin-kpi-valor">
                            <span className="ag-fin-kpi-moeda">R$</span>
                            <span className="ag-fin-kpi-numero">
                                {formatarDinheiro(resumo?.totalEntrou).replace('R$', '').trim()}
                            </span>
                        </strong>

                        <small>
                            Receita — dinheiro entrando — registrada no período
                        </small>

                        <div className="ag-fin-kpi-rodape">
                            <span className="ag-fin-kpi-badge ag-fin-kpi-badge-verde">
                                <Icone nome="south_east" tamanho={14} />
                                Entradas do período
                            </span>
                        </div>
                    </article>

                    <article className="ag-fin-kpi ag-fin-kpi-saida">
                        <div className="ag-fin-kpi-topo">
                            <div className="ag-fin-kpi-cabecalho">
                                <span className="ag-fin-kpi-eyebrow">Despesas &amp; Custos</span>
                                <h3 className="ag-fin-kpi-titulo">Total que saiu</h3>
                            </div>
                            <span className="ag-fin-kpi-icone">
                                <Icone nome="north_east" tamanho={22} />
                            </span>
                        </div>

                        <strong className="ag-fin-kpi-valor">
                            <span className="ag-fin-kpi-moeda">R$</span>
                            <span className="ag-fin-kpi-numero">
                                {formatarDinheiro(resumo?.totalSaiu).replace('R$', '').trim()}
                            </span>
                        </strong>

                        <small>
                            Despesa — dinheiro saindo — registrada no período
                        </small>

                        <div className="ag-fin-kpi-rodape">
                            <span className="ag-fin-kpi-badge ag-fin-kpi-badge-ambar">
                                <Icone nome="north_east" tamanho={14} />
                                Saídas do período
                            </span>
                        </div>
                    </article>

                    <article
                        className={`ag-fin-kpi ${
                            Number(resumo?.quantoSobrou ?? 0) < 0
                                ? 'ag-fin-kpi-saida'
                                : ''
                        }`}
                    >
                        <div className="ag-fin-kpi-topo">
                            <div className="ag-fin-kpi-cabecalho">
                                <span className="ag-fin-kpi-eyebrow">Saldo Líquido</span>
                                <h3 className="ag-fin-kpi-titulo">Quanto sobrou</h3>
                            </div>
                            <span className="ag-fin-kpi-icone">R$</span>
                        </div>

                        <strong className="ag-fin-kpi-valor">
                            <span className="ag-fin-kpi-moeda">R$</span>
                            <span className="ag-fin-kpi-numero">
                                {formatarDinheiro(resumo?.quantoSobrou).replace('R$', '').trim()}
                            </span>
                        </strong>

                        <small>
                            Entradas menos as saídas consolidadas no caixa
                        </small>

                        <div className="ag-fin-kpi-rodape">
                            {Number(resumo?.quantoSobrou ?? 0) < 0 ? (
                                <span className="ag-fin-kpi-badge ag-fin-kpi-badge-ambar">
                                    <Icone nome="trending_down" tamanho={14} />
                                    Déficit no período
                                </span>
                            ) : (
                                <span className="ag-fin-kpi-badge ag-fin-kpi-badge-verde">
                                    <Icone nome="check_circle" tamanho={14} />
                                    Superávit no período
                                </span>
                            )}
                        </div>
                    </article>

                    <article
                        className={`ag-fin-kpi ${
                            margemNegativa ? 'ag-fin-kpi-saida' : ''
                        }`}
                    >
                        <div className="ag-fin-kpi-topo">
                            <div className="ag-fin-kpi-cabecalho">
                                <span className="ag-fin-kpi-eyebrow">Rentabilidade</span>
                                <h3 className="ag-fin-kpi-titulo">Margem de lucro</h3>
                            </div>
                            <span className="ag-fin-kpi-icone">%</span>
                        </div>

                        <strong className="ag-fin-kpi-valor">
                            {formatarPercentual(resumo?.margemLucro)}
                        </strong>

                        <small>
                            {
                                resumo?.margemLucro === null
                                    ? 'Registre uma receita — dinheiro entrando — para calcular'
                                    : margemNegativa
                                        ? 'O resultado do período foi negativo'
                                        : 'Quanto sobrou de cada R$ 100,00 vendidos'
                            }
                        </small>

                        <div className="ag-fin-kpi-rodape">
                            {resumo?.margemLucro === null ? (
                                <span className="ag-fin-kpi-badge ag-fin-kpi-badge-neutro">
                                    Sem receita no período
                                </span>
                            ) : (
                                <span className={`ag-fin-kpi-badge ${margemNegativa ? 'ag-fin-kpi-badge-ambar' : 'ag-fin-kpi-badge-verde'}`}>
                                    <Icone nome={margemNegativa ? 'trending_down' : 'trending_up'} tamanho={14} />
                                    {margemNegativa ? 'Margem negativa' : 'Margem positiva'}
                                </span>
                            )}
                        </div>
                    </article>

                    <article
                        className={`ag-fin-kpi ${
                            ganhoNegativo ? 'ag-fin-kpi-saida' : ''
                        }`}
                    >
                        <div className="ag-fin-kpi-topo">
                            <div className="ag-fin-kpi-cabecalho">
                                <span className="ag-fin-kpi-eyebrow">Multiplicador</span>
                                <h3 className="ag-fin-kpi-titulo">Ganho s/ custo</h3>
                            </div>
                            <span className="ag-fin-kpi-icone">
                                <Icone nome="stacked_line_chart" tamanho={22} />
                            </span>
                        </div>

                        <strong className="ag-fin-kpi-valor">
                            {formatarPercentual(resumo?.ganhoSobreCusto)}
                        </strong>

                        <small>
                            {
                                resumo?.ganhoSobreCusto === null
                                    ? 'Registre uma despesa — dinheiro saindo — para calcular'
                                    : ganhoNegativo
                                        ? 'O dinheiro que saiu foi maior que o dinheiro que entrou'
                                        : 'Quanto ganhou em relação ao valor gasto'
                            }
                        </small>

                        <div className="ag-fin-kpi-rodape">
                            {resumo?.ganhoSobreCusto === null ? (
                                <span className="ag-fin-kpi-badge ag-fin-kpi-badge-neutro">
                                    Sem despesa no período
                                </span>
                            ) : (
                                <span className={`ag-fin-kpi-badge ${ganhoNegativo ? 'ag-fin-kpi-badge-ambar' : 'ag-fin-kpi-badge-verde'}`}>
                                    <Icone nome="stacked_line_chart" tamanho={14} />
                                    Retorno sobre o custo
                                </span>
                            )}
                        </div>
                    </article>
                </section>

                <section className="ag-fin-analytics">
                <article className="ag-fin-grafico">
                    <div className="ag-fin-grafico-topo">
                        <div>
                            <h2>
                                Evolução do Fluxo de Caixa
                            </h2>

                            <p>
                                Entradas e saídas operacionais
                                registradas no período.
                            </p>
                        </div>

                    </div>

                    <div className="ag-fin-grafico-legenda">
                        <span>
                            <i className="ag-fin-grafico-cor ag-fin-grafico-cor-receita" />
                            Receitas
                        </span>

                        <span>
                            <i className="ag-fin-grafico-cor ag-fin-grafico-cor-despesa" />
                            Despesas
                        </span>

                        <span>
                            <i className="ag-fin-grafico-cor ag-fin-grafico-cor-saldo" />
                            Saldo Acumulado
                        </span>

                        {primeiraData && ultimaData && (
                            <small>
                                {formatarData(primeiraData)}
                                {' até '}
                                {formatarData(ultimaData)}
                            </small>
                        )}
                    </div>

                    {
                        carregandoGrafico ? (
                            <div className="ag-fin-grafico-vazio">
                                Atualizando o gráfico...
                            </div>
                        ) : !dadosGrafico.possuiMovimentacoes ? (
                            <div className="ag-fin-grafico-vazio">
                                <strong>
                                    Ainda não existem movimentações nesse período.
                                </strong>

                                <span>
                                    Cadastre uma receita — dinheiro entrando — ou uma despesa — dinheiro saindo — para começar a formar o gráfico.
                                </span>
                            </div>
                        ) : (
                            <>
                                <div className="ag-fin-grafico-valores">
                                    <span>
                                        {formatarDinheiroCompacto(
                                            dadosGrafico.maiorValor,
                                        )}
                                    </span>

                                    <span>
                                        {formatarDinheiroCompacto(
                                            dadosGrafico.maiorValor
                                            / 2,
                                        )}
                                    </span>

                                    <span>R$ 0</span>
                                </div>

                                <div className="ag-fin-grafico-area-real">
                                    <svg
                                        aria-label="Gráfico de receitas e despesas por período com a linha de saldo acumulado"
                                        preserveAspectRatio="none"
                                        role="img"
                                        viewBox={`0 0 ${LARGURA_GRAFICO} ${ALTURA_GRAFICO}`}
                                    >
                                        <line
                                            className="ag-fin-grafico-grade"
                                            x1="0"
                                            x2={LARGURA_GRAFICO}
                                            y1="18"
                                            y2="18"
                                        />

                                        <line
                                            className="ag-fin-grafico-grade"
                                            x1="0"
                                            x2={LARGURA_GRAFICO}
                                            y1="110"
                                            y2="110"
                                        />

                                        <line
                                            className="ag-fin-grafico-grade"
                                            x1="0"
                                            x2={LARGURA_GRAFICO}
                                            y1="200"
                                            y2="200"
                                        />

                                        {dadosGrafico.barras.map((barra) => (
                                            <g key={`barra-${barra.data}`}>
                                                <rect
                                                    className="ag-fin-grafico-barra-receita"
                                                    x={barra.receitaX}
                                                    y={barra.receitaY}
                                                    width={barra.larguraBarra}
                                                    height={Math.max(0, barra.receitaH)}
                                                    rx="2"
                                                >
                                                    <title>
                                                        {formatarData(barra.data)}
                                                        {` — Receitas: ${formatarDinheiro(barra.receita)}`}
                                                    </title>
                                                </rect>
                                                <rect
                                                    className="ag-fin-grafico-barra-despesa"
                                                    x={barra.despesaX}
                                                    y={barra.despesaY}
                                                    width={barra.larguraBarra}
                                                    height={Math.max(0, barra.despesaH)}
                                                    rx="2"
                                                >
                                                    <title>
                                                        {formatarData(barra.data)}
                                                        {` — Despesas: ${formatarDinheiro(barra.despesa)}`}
                                                    </title>
                                                </rect>
                                            </g>
                                        ))}

                                        <path
                                            className="ag-fin-grafico-linha-saldo"
                                            d={dadosGrafico.caminhoSaldo}
                                        />

                                        {dadosGrafico.pontosSaldo.map((ponto) => (
                                            <circle
                                                className="ag-fin-grafico-ponto-saldo"
                                                cx={ponto.x}
                                                cy={ponto.y}
                                                key={`saldo-${ponto.data}`}
                                                r="4"
                                            >
                                                <title>
                                                    {formatarData(ponto.data)}
                                                    {` — Saldo acumulado: ${formatarDinheiro(ponto.valor)}`}
                                                </title>
                                            </circle>
                                        ))}
                                    </svg>
                                </div>

                                <div className="ag-fin-grafico-datas">
                                    <span>
                                        {formatarDataCurta(
                                            primeiraData,
                                        )}
                                    </span>

                                    <span>
                                        {formatarDataCurta(
                                            ultimaData,
                                        )}
                                    </span>
                                </div>
                            </>
                        )
                    }
                </article>

                <aside className="ag-fin-acoes">
                    <div className="ag-fin-acoes-topo">
                        <h2>Acesso rápido</h2>
                    </div>

                    <div className="ag-fin-atalhos">
                        <button
                            className="ag-fin-atalho"
                            onClick={abrirNovaReceita}
                            type="button"
                        >
                            <span className="ag-fin-atalho-icone ag-fin-atalho-receita">
                                <Icone nome="add" tamanho={20} />
                            </span>
                            Cadastrar receita — dinheiro entrando
                        </button>

                        <button
                            className="ag-fin-atalho"
                            onClick={abrirNovaDespesa}
                            type="button"
                        >
                            <span className="ag-fin-atalho-icone ag-fin-atalho-despesa">
                                <Icone nome="remove" tamanho={20} />
                            </span>
                            Cadastrar despesa — dinheiro saindo
                        </button>

                        <button
                            className="ag-fin-atalho"
                            onClick={abrirMovimentacoes}
                            type="button"
                        >
                            <span className="ag-fin-atalho-icone">
                                <Icone nome="table_rows" tamanho={20} />
                            </span>
                            Ver todas as movimentações
                        </button>

                        <button
                            className="ag-fin-atalho"
                            onClick={abrirLixeiraMovimentacoes}
                            type="button"
                        >
                            <span className="ag-fin-atalho-icone">
                                <Icone nome="delete" tamanho={20} />
                            </span>
                            Lixeira
                        </button>

                        <button
                            className="ag-fin-atalho"
                            onClick={abrirCategorias}
                            type="button"
                        >
                            <span className="ag-fin-atalho-icone">
                                <Icone nome="sell" tamanho={20} />
                            </span>
                            Gerenciar categorias
                        </button>

                        <button
                            className="ag-fin-atalho"
                            onClick={abrirFornecedores}
                            type="button"
                        >
                            <span className="ag-fin-atalho-icone">
                                <Icone nome="groups" tamanho={20} />
                            </span>
                            Gerenciar fornecedores
                        </button>

                        <button
                            className="ag-fin-atalho"
                            onClick={abrirPlanoPagamentos}
                            type="button"
                        >
                            <span className="ag-fin-atalho-icone">
                                <Icone nome="credit_card" tamanho={20} />
                            </span>
                            Plano e pagamentos
                        </button>

                        <button
                            className="ag-fin-atalho"
                            disabled={
                                Boolean(baixandoRelatorio)
                            }
                            onClick={() =>
                                baixarRelatorio('excel')
                            }
                            type="button"
                        >
                            <span className="ag-fin-atalho-icone">
                                <Icone nome="table_view" tamanho={20} />
                            </span>
                            {
                                baixandoRelatorio === 'excel'
                                    ? 'Gerando Excel...'
                                    : 'Gerar relatório em Excel'
                            }
                        </button>

                        <button
                            className="ag-fin-atalho"
                            disabled={
                                Boolean(baixandoRelatorio)
                            }
                            onClick={() =>
                                baixarRelatorio('pdf')
                            }
                            type="button"
                        >
                            <span className="ag-fin-atalho-icone">
                                <Icone nome="picture_as_pdf" tamanho={20} />
                            </span>
                            {
                                baixandoRelatorio === 'pdf'
                                    ? 'Gerando PDF...'
                                    : 'Gerar relatório em PDF'
                            }
                        </button>
                    </div>
                </aside>
                </section>

                <section className="ag-fin-lancamentos">
                    <div className="ag-fin-lancamentos-topo">
                        <div>
                            <h2>Lançamentos Recentes</h2>
                            <p>Movimentações financeiras do período registrado</p>
                        </div>

                        <div
                            className="ag-fin-abas"
                            aria-label="Filtrar lançamentos"
                        >
                            {abasLancamentos.map((aba) => (
                                <button
                                    className={
                                        abaLancamentos === aba.valor
                                            ? 'ag-fin-aba ag-fin-aba-ativa'
                                            : 'ag-fin-aba'
                                    }
                                    key={aba.valor}
                                    onClick={() => setAbaLancamentos(aba.valor)}
                                    type="button"
                                >
                                    {aba.rotulo} ({aba.contagem})
                                </button>
                            ))}
                        </div>
                    </div>

                    {lancamentosFiltrados.length === 0 ? (
                        <p className="ag-fin-vazio">
                            Nenhuma movimentação encontrada.
                        </p>
                    ) : (
                        <>
                            <div className="ag-fin-tabela-area">
                                <table className="ag-fin-tabela">
                                    <thead>
                                        <tr>
                                            <th>Data</th>
                                            <th>Descrição &amp; Favorecido</th>
                                            <th>Centro / Categoria</th>
                                            <th className="ag-fin-coluna-valor">
                                                Valor Líquido
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {lancamentosFiltrados.map((movimentacao) => {
                                            const despesa =
                                                movimentacao.tipo === 'DESPESA'
                                            const favorecido =
                                                movimentacao.fornecedorNome
                                                || movimentacao.compradorNome

                                            return (
                                                <tr key={movimentacao.id}>
                                                    <td className="ag-fin-td-data">
                                                        {formatarData(
                                                            movimentacao.dataMovimentacao,
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="ag-fin-td-desc">
                                                            <span
                                                                className={`ag-fin-td-seta ${
                                                                    despesa
                                                                        ? 'ag-fin-seta-despesa'
                                                                        : 'ag-fin-seta-receita'
                                                                }`}
                                                            >
                                                                <Icone
                                                                    nome={despesa ? 'north_east' : 'south_east'}
                                                                    tamanho={18}
                                                                />
                                                            </span>
                                                            <div>
                                                                <strong>{movimentacao.descricao}</strong>
                                                                {favorecido && (
                                                                    <small>{favorecido}</small>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {movimentacao.categoriaNome ? (
                                                            <span className="ag-fin-td-categoria">
                                                                {movimentacao.categoriaNome}
                                                            </span>
                                                        ) : (
                                                            <span className="ag-fin-td-sem-categoria">
                                                                Sem categoria
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td
                                                        className={`ag-fin-coluna-valor ag-fin-valor ${
                                                            despesa
                                                                ? 'ag-fin-valor-despesa'
                                                                : 'ag-fin-valor-receita'
                                                        }`}
                                                    >
                                                        {despesa ? '- ' : '+ '}
                                                        {formatarDinheiro(movimentacao.valor)}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="ag-fin-lancamentos-rodape">
                                <span>
                                    Exibindo {lancamentosFiltrados.length} de{' '}
                                    {abaLancamentos === 'TODOS'
                                        ? movimentacoes.length
                                        : abaLancamentos === 'RECEITA'
                                            ? totalReceitas
                                            : totalDespesas}{' '}
                                    lançamentos
                                </span>
                                <button
                                    className="ag-fin-link"
                                    onClick={abrirMovimentacoes}
                                    type="button"
                                >
                                    Ver todas as movimentações
                                    <Icone nome="arrow_forward" tamanho={16} />
                                </button>
                            </div>
                        </>
                    )}
                </section>
            </div>
        </ShellDashboard>
    )
}

export default Dashboard
