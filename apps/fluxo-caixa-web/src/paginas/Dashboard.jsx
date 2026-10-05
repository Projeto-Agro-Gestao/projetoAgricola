import {
    useEffect,
    useMemo,
    useState,
} from 'react'
import {
    useNavigate,
} from 'react-router'
import ShellDashboard from '../componentes/ShellDashboard.jsx'
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

function obterPerfilAtividade(usuario) {
    const agriculturaAtiva =
        usuario?.agriculturaAtiva ?? true
    const pecuariaAtiva =
        usuario?.pecuariaAtiva ?? false

    if (agriculturaAtiva && pecuariaAtiva) {
        return {
            titulo: 'Agricultura e pecuária',
            descricao:
                'Categorias preparadas para lavoura, criação e manejo.',
        }
    }

    if (pecuariaAtiva) {
        return {
            titulo: 'Pecuária',
            descricao:
                'Categorias preparadas para animais, leite e manejo.',
        }
    }

    return {
        titulo: 'Agricultura',
        descricao:
            'Categorias preparadas para lavoura, safra e insumos.',
    }
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

function criarPontosDaLinha(
    dados,
    campo,
    maiorValor,
) {
    if (dados.length === 0) {
        return []
    }

    const alturaUtil =
        ALTURA_GRAFICO
        - ESPACO_SUPERIOR
        - ESPACO_INFERIOR

    return dados.map((ponto, indice) => {
        const divisor =
            Math.max(dados.length - 1, 1)

        const x =
            (indice / divisor)
            * LARGURA_GRAFICO

        const valor =
            Number(ponto[campo] ?? 0)

        const proporcao =
            maiorValor > 0
                ? valor / maiorValor
                : 0

        const y =
            ALTURA_GRAFICO
            - ESPACO_INFERIOR
            - proporcao * alturaUtil

        return {
            x,
            y,
            valor,
            data: ponto.data,
        }
    })
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

function Dashboard() {
    const navigate = useNavigate()

    const [sessao] =
        useState(obterSessao)
    const perfilAtividade =
        obterPerfilAtividade(sessao?.usuario)

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
        graficoVisivel,
        setGraficoVisivel,
    ] = useState(true)

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

        const pontosReceitas =
            criarPontosDaLinha(
                fluxoCaixa,
                'totalReceitas',
                maiorValor,
            )

        const pontosDespesas =
            criarPontosDaLinha(
                fluxoCaixa,
                'totalDespesas',
                maiorValor,
            )

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
            maiorValor,
            pontosReceitas,
            pontosDespesas,
            caminhoReceitas:
                criarCaminho(
                    pontosReceitas,
                ),
            caminhoDespesas:
                criarCaminho(
                    pontosDespesas,
                ),
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
                <p>
                    Carregando informações financeiras...
                </p>
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

    const abasLancamentos = [
        { valor: 'TODOS', rotulo: 'Todos' },
        { valor: 'RECEITA', rotulo: 'Receitas' },
        { valor: 'DESPESA', rotulo: 'Despesas' },
    ]

    return (
        <ShellDashboard sessao={sessao} ativo="visao-geral">
            <div className="ag-fin">
                <section className="ag-fin-topo">
                    <div className="ag-fin-topo-texto">
                        <span className="ag-fin-eyebrow">
                            Gestão financeira
                        </span>

                        <h1>
                            Controle interno financeiro
                        </h1>

                        <p className="ag-fin-saudacao">
                            Olá, {sessao.usuario.nome}. Veja
                            quanto entrou, quanto saiu e qual
                            foi o resultado da sua propriedade.
                        </p>

                        <div className="ag-fin-perfil">
                            <Icone nome="agriculture" tamanho={18} />
                            <strong>
                                {perfilAtividade.titulo}
                            </strong>
                            <span>
                                {perfilAtividade.descricao}
                            </span>
                        </div>
                    </div>

                    <div className="ag-fin-topo-acoes">
                        <button
                            className="ag-fin-botao ag-fin-botao-neutro"
                            onClick={abrirNovaDespesa}
                            type="button"
                        >
                            <Icone nome="remove" tamanho={18} />
                            Nova despesa
                        </button>

                        <button
                            className="ag-fin-botao"
                            onClick={abrirNovaReceita}
                            type="button"
                        >
                            <Icone nome="add" tamanho={18} />
                            Nova receita
                        </button>

                        <button
                            className="ag-fin-botao ag-fin-botao-contorno"
                            onClick={abrirMovimentacoes}
                            type="button"
                        >
                            Ver todas as movimentações
                            <Icone nome="arrow_forward" tamanho={18} />
                        </button>
                    </div>
                </section>

                <section className="ag-fin-kpis">
                    <article className="ag-fin-kpi">
                        <div className="ag-fin-kpi-topo">
                            <p>Total que entrou</p>
                            <span className="ag-fin-kpi-icone">
                                <Icone nome="south_east" tamanho={22} />
                            </span>
                        </div>

                        <strong>
                            {formatarDinheiro(
                                resumo?.totalEntrou,
                            )}
                        </strong>

                        <small>
                            Receita — dinheiro entrando — registrada no período
                        </small>
                    </article>

                    <article className="ag-fin-kpi ag-fin-kpi-saida">
                        <div className="ag-fin-kpi-topo">
                            <p>Total que saiu</p>
                            <span className="ag-fin-kpi-icone">
                                <Icone nome="north_east" tamanho={22} />
                            </span>
                        </div>

                        <strong>
                            {formatarDinheiro(
                                resumo?.totalSaiu,
                            )}
                        </strong>

                        <small>
                            Despesa — dinheiro saindo — registrada no período
                        </small>
                    </article>

                    <article
                        className={`ag-fin-kpi ${
                            Number(
                                resumo?.quantoSobrou
                                ?? 0,
                            ) < 0
                                ? 'ag-fin-kpi-saida'
                                : 'ag-fin-kpi-saldo'
                        }`}
                    >
                        <div className="ag-fin-kpi-topo">
                            <p>Quanto sobrou</p>
                            <span className="ag-fin-kpi-icone">R$</span>
                        </div>

                        <strong>
                            {formatarDinheiro(
                                resumo?.quantoSobrou,
                            )}
                        </strong>

                        <small>
                            Entradas menos as saídas
                        </small>
                    </article>

                    <article
                        className={`ag-fin-kpi ${
                            margemNegativa
                                ? 'ag-fin-kpi-saida'
                                : 'ag-fin-kpi-saldo'
                        }`}
                    >
                        <div className="ag-fin-kpi-topo">
                            <p>Margem de lucro</p>
                            <span className="ag-fin-kpi-icone">%</span>
                        </div>

                        <strong>
                            {formatarPercentual(
                                resumo?.margemLucro,
                            )}
                        </strong>

                        <small>
                            {
                                resumo?.margemLucro
                                === null
                                    ? 'Registre uma receita — dinheiro entrando — para calcular'
                                    : margemNegativa
                                        ? 'O resultado do período foi negativo'
                                        : 'Quanto sobrou de cada R$ 100,00 vendidos'
                            }
                        </small>
                    </article>

                    <article
                        className={`ag-fin-kpi ${
                            ganhoNegativo
                                ? 'ag-fin-kpi-saida'
                                : 'ag-fin-kpi-saldo'
                        }`}
                    >
                        <div className="ag-fin-kpi-topo">
                            <p>Ganho sobre o custo</p>
                            <span className="ag-fin-kpi-icone">%</span>
                        </div>

                        <strong>
                            {formatarPercentual(
                                resumo?.ganhoSobreCusto,
                            )}
                        </strong>

                        <small>
                            {
                                resumo?.ganhoSobreCusto
                                === null
                                    ? 'Registre uma despesa — dinheiro saindo — para calcular'
                                    : ganhoNegativo
                                        ? 'O dinheiro que saiu foi maior que o dinheiro que entrou'
                                        : 'Quanto ganhou em relação ao valor gasto'
                            }
                        </small>
                    </article>
                </section>

                <section className="ag-fin-analytics">
                <article className="ag-fin-grafico">
                    <div className="ag-fin-grafico-topo">
                        <div>
                            <span className="ag-fin-eyebrow">
                                Dados da propriedade
                            </span>

                            <h2>
                                Fluxo de caixa
                            </h2>

                            <p>
                                Receita — dinheiro entrando —
                                e despesa — dinheiro saindo —
                                registradas no período.
                            </p>
                        </div>

                        <div
                            className="ag-fin-periodos"
                            aria-label="Período do gráfico"
                        >
                            <button
                                aria-expanded={
                                    graficoVisivel
                                }
                                onClick={() =>
                                    setGraficoVisivel(
                                        (visivelAtual) =>
                                            !visivelAtual,
                                    )
                                }
                                type="button"
                            >
                                {graficoVisivel
                                    ? 'Ocultar gráfico'
                                    : 'Mostrar gráfico'}
                            </button>

                            {[7, 30, 90].map(
                                (dias) => (
                                    <button
                                        className={
                                            !periodoSelecionado.personalizado
                                            && periodoGrafico === dias
                                                ? 'ag-fin-periodo-ativo'
                                                : ''
                                        }
                                        disabled={
                                            carregandoGrafico
                                        }
                                        key={dias}
                                        onClick={() => {
                                            setDataInicialPersonalizada(
                                                '',
                                            )
                                            setDataFinalPersonalizada(
                                                '',
                                            )
                                            setPeriodoGrafico(
                                                dias,
                                            )
                                        }}
                                        type="button"
                                    >
                                        {dias} dias
                                    </button>
                                ),
                            )}
                        </div>

                        <div className="ag-fin-periodo-personalizado">
                            <label>
                                De
                                <input
                                    disabled={carregandoGrafico}
                                    onChange={(evento) =>
                                        setDataInicialPersonalizada(
                                            evento.target.value,
                                        )
                                    }
                                    type="date"
                                    value={
                                        dataInicialPersonalizada
                                    }
                                />
                            </label>

                            <label>
                                Até
                                <input
                                    disabled={carregandoGrafico}
                                    onChange={(evento) =>
                                        setDataFinalPersonalizada(
                                            evento.target.value,
                                        )
                                    }
                                    type="date"
                                    value={
                                        dataFinalPersonalizada
                                    }
                                />
                            </label>

                            {(dataInicialPersonalizada
                                || dataFinalPersonalizada) && (
                                <button
                                    disabled={carregandoGrafico}
                                    onClick={() => {
                                        setDataInicialPersonalizada(
                                            '',
                                        )
                                        setDataFinalPersonalizada(
                                            '',
                                        )
                                    }}
                                    type="button"
                                >
                                    Limpar datas
                                </button>
                            )}
                        </div>

                        <div
                            aria-label="Área produtiva"
                            className="ag-fin-area-filtro"
                        >
                            {AREAS_DASHBOARD.map((area) => (
                                <button
                                    className={
                                        areaSelecionada === area.valor
                                            ? 'ag-fin-area-filtro-ativo'
                                            : ''
                                    }
                                    disabled={carregandoGrafico}
                                    key={area.valor}
                                    onClick={() =>
                                        setAreaSelecionada(
                                            area.valor,
                                        )
                                    }
                                    type="button"
                                >
                                    {area.rotulo}
                                </button>
                            ))}
                        </div>
                    </div>

                    {graficoVisivel && (
                        <div className="ag-fin-grafico-legenda">
                            <span>
                                <i className="ag-fin-grafico-cor ag-fin-grafico-cor-receita" />
                                Receita — dinheiro entrando
                            </span>

                            <span>
                                <i className="ag-fin-grafico-cor ag-fin-grafico-cor-despesa" />
                                Despesa — dinheiro saindo
                            </span>

                            {primeiraData && ultimaData && (
                                <small>
                                    {formatarData(
                                        primeiraData,
                                    )}
                                    {' até '}
                                    {formatarData(
                                        ultimaData,
                                    )}
                                </small>
                            )}
                        </div>
                    )}

                    {graficoVisivel && (
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
                                        aria-label="Gráfico real do dinheiro entrando e do dinheiro saindo da propriedade"
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

                                        <path
                                            className="ag-fin-grafico-linha-receita"
                                            d={
                                                dadosGrafico
                                                    .caminhoReceitas
                                            }
                                        />

                                        <path
                                            className="ag-fin-grafico-linha-despesa"
                                            d={
                                                dadosGrafico
                                                    .caminhoDespesas
                                            }
                                        />

                                        {
                                            dadosGrafico
                                                .pontosReceitas
                                                .map(
                                                    (ponto) => (
                                                        <circle
                                                            className="ag-fin-grafico-ponto-receita"
                                                            cx={ponto.x}
                                                            cy={ponto.y}
                                                            key={`receita-${ponto.data}`}
                                                            r="4"
                                                        >
                                                            <title>
                                                                {
                                                                    formatarData(
                                                                        ponto.data,
                                                                    )
                                                                }
                                                                {
                                                                    ` — Receita — dinheiro entrando: ${formatarDinheiro(ponto.valor)}`
                                                                }
                                                            </title>
                                                        </circle>
                                                    ),
                                                )
                                        }

                                        {
                                            dadosGrafico
                                                .pontosDespesas
                                                .map(
                                                    (ponto) => (
                                                        <circle
                                                            className="ag-fin-grafico-ponto-despesa"
                                                            cx={ponto.x}
                                                            cy={ponto.y}
                                                            key={`despesa-${ponto.data}`}
                                                            r="4"
                                                        >
                                                            <title>
                                                                {
                                                                    formatarData(
                                                                        ponto.data,
                                                                    )
                                                                }
                                                                {
                                                                    ` — Despesa — dinheiro saindo: ${formatarDinheiro(ponto.valor)}`
                                                                }
                                                            </title>
                                                        </circle>
                                                    ),
                                                )
                                        }
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
                    )}
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
                            <span className="ag-fin-eyebrow">
                                Movimentações
                            </span>
                            <h2>Lançamentos recentes</h2>
                        </div>

                        <button
                            className="ag-fin-link"
                            onClick={abrirMovimentacoes}
                            type="button"
                        >
                            Ver todas as movimentações
                            <Icone nome="arrow_forward" tamanho={16} />
                        </button>
                    </div>

                    <div
                        className="ag-fin-abas"
                        aria-label="Filtrar lançamentos"
                    >
                        {abasLancamentos.map((aba) => (
                            <button
                                className={
                                    abaLancamentos === aba.valor
                                        ? 'ag-fin-aba-ativa'
                                        : ''
                                }
                                key={aba.valor}
                                onClick={() =>
                                    setAbaLancamentos(aba.valor)
                                }
                                type="button"
                            >
                                {aba.rotulo}
                            </button>
                        ))}
                    </div>

                    {
                        lancamentosFiltrados.length === 0
                            ? (
                                <p className="ag-fin-vazio">
                                    Nenhuma movimentação encontrada.
                                </p>
                            )
                            : (
                                <div className="ag-fin-tabela-area">
                                    <table className="ag-fin-tabela">
                                        <thead>
                                            <tr>
                                                <th>Data</th>
                                                <th>Descrição</th>
                                                <th>Categoria</th>
                                                <th className="ag-fin-coluna-valor">
                                                    Valor
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {
                                                lancamentosFiltrados.map(
                                                    (movimentacao) => {
                                                        const despesa =
                                                            movimentacao.tipo
                                                            === 'DESPESA'

                                                        return (
                                                            <tr key={movimentacao.id}>
                                                                <td>
                                                                    {formatarData(
                                                                        movimentacao.dataMovimentacao,
                                                                    )}
                                                                </td>
                                                                <td className="ag-fin-celula-descricao">
                                                                    {movimentacao.descricao}
                                                                </td>
                                                                <td>
                                                                    {movimentacao.categoriaNome}
                                                                </td>
                                                                <td
                                                                    className={`ag-fin-coluna-valor ag-fin-valor ${
                                                                        despesa
                                                                            ? 'ag-fin-valor-despesa'
                                                                            : 'ag-fin-valor-receita'
                                                                    }`}
                                                                >
                                                                    {despesa ? '- ' : '+ '}
                                                                    {formatarDinheiro(
                                                                        movimentacao.valor,
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        )
                                                    },
                                                )
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            )
                    }
                </section>
            </div>
        </ShellDashboard>
    )
}

export default Dashboard
