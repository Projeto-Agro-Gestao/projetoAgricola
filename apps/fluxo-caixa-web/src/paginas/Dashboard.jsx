import {
    useEffect,
    useMemo,
    useState,
} from 'react'
import {
    useNavigate,
} from 'react-router'
import AlternadorModulos from '../componentes/AlternadorModulos.jsx'
import { API_BASE_URL as API_URL } from '../config.js'
import './Dashboard.css'

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
        rotulo: 'Pecuaria',
    },
]

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
        )
    }

    function abrirNovaDespesa() {
        navigate(
            '/dashboard/movimentacoes/nova?tipo=DESPESA',
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
                || resposta.status === 403
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

    function sair() {
        limparSessao()

        navigate('/login', {
            replace: true,
        })
    }

    if (!sessao) {
        return null
    }

    if (carregando) {
        return (
            <div className="dashboard-carregando">
                <p>
                    Carregando informações financeiras...
                </p>
            </div>
        )
    }

    if (erro) {
        return (
            <div className="dashboard-erro">
                <div className="dashboard-erro-conteudo">
                    <h1>
                        Não foi possível carregar o dashboard
                    </h1>

                    <p>{erro}</p>

                    <button
                        className="dashboard-voltar"
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

    return (
        <div className="dashboard">
            <div className="dashboard-conteudo">
                <header className="dashboard-cabecalho">
                    <div className="dashboard-marca">
                        <div className="dashboard-marca-icone">
                            ♧
                        </div>

                        <div>
                            <strong>AgroGestão</strong>

                            <span>
                                {
                                    sessao.usuario
                                        .nomeEmpresa
                                }
                            </span>
                        </div>
                    </div>

                    <div className="dashboard-cabecalho-acoes">
                        <AlternadorModulos />

                        <button
                            className="dashboard-voltar"
                            onClick={sair}
                            type="button"
                        >
                            Sair da conta
                        </button>
                    </div>
                </header>

                <section className="dashboard-apresentacao">
                    <div>
                        <p className="dashboard-etiqueta">
                            Visão geral
                        </p>

                        <h1>
                            Dashboard financeiro
                        </h1>

                        <p className="dashboard-descricao">
                            Olá, {
                            sessao.usuario.nome
                        }. Veja quanto entrou,
                            quanto saiu e qual foi o
                            resultado da sua
                            propriedade.
                        </p>

                        <div className="dashboard-perfil-atividade">
                            <strong>
                                {perfilAtividade.titulo}
                            </strong>

                            <span>
                                {perfilAtividade.descricao}
                            </span>
                        </div>
                    </div>

                    <div className="dashboard-acoes">
                        <button
                            className="dashboard-botao dashboard-botao-secundario"
                            onClick={
                                abrirNovaDespesa
                            }
                            type="button"
                        >
                            Nova despesa — dinheiro saindo
                        </button>

                        <button
                            className="dashboard-botao"
                            onClick={
                                abrirNovaReceita
                            }
                            type="button"
                        >
                            Nova receita — dinheiro entrando
                        </button>
                    </div>
                </section>

                <section className="dashboard-resumo">
                    <article className="dashboard-card">
                        <div className="dashboard-card-cabecalho">
                            <p>Total que entrou</p>

                            <span className="dashboard-card-icone">
                                ↓
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

                    <article className="dashboard-card dashboard-card-saida">
                        <div className="dashboard-card-cabecalho">
                            <p>Total que saiu</p>

                            <span className="dashboard-card-icone">
                                ↑
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
                        className={`dashboard-card ${
                            Number(
                                resumo?.quantoSobrou
                                ?? 0,
                            ) < 0
                                ? 'dashboard-card-saida'
                                : 'dashboard-card-saldo'
                        }`}
                    >
                        <div className="dashboard-card-cabecalho">
                            <p>Quanto sobrou</p>

                            <span className="dashboard-card-icone">
                                R$
                            </span>
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
                        className={`dashboard-card ${
                            margemNegativa
                                ? 'dashboard-card-saida'
                                : 'dashboard-card-saldo'
                        }`}
                    >
                        <div className="dashboard-card-cabecalho">
                            <p>Margem de lucro</p>

                            <span className="dashboard-card-icone">
                                %
                            </span>
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
                        className={`dashboard-card ${
                            ganhoNegativo
                                ? 'dashboard-card-saida'
                                : 'dashboard-card-saldo'
                        }`}
                    >
                        <div className="dashboard-card-cabecalho">
                            <p>
                                Ganho sobre o custo
                            </p>

                            <span className="dashboard-card-icone">
                                %
                            </span>
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

                <section className="dashboard-grafico-painel">
                    <div className="dashboard-grafico-topo">
                        <div>
                            <p className="dashboard-etiqueta">
                                Dados da propriedade
                            </p>

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
                            className="dashboard-grafico-periodos"
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
                                                ? 'dashboard-grafico-periodo-ativo'
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

                        <div className="dashboard-periodo-personalizado">
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
                            aria-label="Area produtiva"
                            className="dashboard-area-filtro"
                        >
                            {AREAS_DASHBOARD.map((area) => (
                                <button
                                    className={
                                        areaSelecionada === area.valor
                                            ? 'dashboard-area-filtro-ativo'
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
                        <div className="dashboard-grafico-legenda">
                            <span>
                                <i className="dashboard-grafico-cor dashboard-grafico-cor-receita" />
                                Receita — dinheiro entrando
                            </span>

                            <span>
                                <i className="dashboard-grafico-cor dashboard-grafico-cor-despesa" />
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
                            <div className="dashboard-grafico-vazio">
                                Atualizando o gráfico...
                            </div>
                        ) : !dadosGrafico.possuiMovimentacoes ? (
                            <div className="dashboard-grafico-vazio">
                                <strong>
                                    Ainda não existem movimentações nesse período.
                                </strong>

                                <span>
                                    Cadastre uma receita — dinheiro entrando — ou uma despesa — dinheiro saindo — para começar a formar o gráfico.
                                </span>
                            </div>
                        ) : (
                            <>
                                <div className="dashboard-grafico-valores">
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

                                <div className="dashboard-grafico-area-real">
                                    <svg
                                        aria-label="Gráfico real do dinheiro entrando e do dinheiro saindo da propriedade"
                                        preserveAspectRatio="none"
                                        role="img"
                                        viewBox={`0 0 ${LARGURA_GRAFICO} ${ALTURA_GRAFICO}`}
                                    >
                                        <line
                                            className="dashboard-grafico-grade"
                                            x1="0"
                                            x2={LARGURA_GRAFICO}
                                            y1="18"
                                            y2="18"
                                        />

                                        <line
                                            className="dashboard-grafico-grade"
                                            x1="0"
                                            x2={LARGURA_GRAFICO}
                                            y1="110"
                                            y2="110"
                                        />

                                        <line
                                            className="dashboard-grafico-grade"
                                            x1="0"
                                            x2={LARGURA_GRAFICO}
                                            y1="200"
                                            y2="200"
                                        />

                                        <path
                                            className="dashboard-grafico-linha-receita"
                                            d={
                                                dadosGrafico
                                                    .caminhoReceitas
                                            }
                                        />

                                        <path
                                            className="dashboard-grafico-linha-despesa"
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
                                                            className="dashboard-grafico-ponto-receita"
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
                                                            className="dashboard-grafico-ponto-despesa"
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

                                <div className="dashboard-grafico-datas">
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
                </section>

                <section className="dashboard-paineis">
                    <article className="dashboard-painel">
                        <div className="dashboard-painel-topo">
                            <h2>
                                Movimentações recentes
                            </h2>

                            <button
                                className="dashboard-link-botao"
                                onClick={
                                    abrirMovimentacoes
                                }
                                type="button"
                            >
                                {movimentacoes.length}{' '}
                                registros
                            </button>
                        </div>

                        {
                            movimentacoes.length
                            === 0
                                ? (
                                    <p className="dashboard-vazio">
                                        Nenhuma movimentação encontrada.
                                    </p>
                                )
                                : (
                                    <ul className="dashboard-lista">
                                        {
                                            movimentacoes.map(
                                                (
                                                    movimentacao,
                                                ) => {
                                                    const despesa =
                                                        movimentacao.tipo
                                                        === 'DESPESA'

                                                    return (
                                                        <li
                                                            className={`dashboard-movimentacao ${
                                                                despesa
                                                                    ? 'dashboard-movimentacao-despesa'
                                                                    : ''
                                                            }`}
                                                            key={
                                                                movimentacao.id
                                                            }
                                                        >
                                                            <div className="dashboard-movimentacao-info">
                                                                <span className="dashboard-movimentacao-icone">
                                                                    {
                                                                        despesa
                                                                            ? '↑'
                                                                            : '↓'
                                                                    }
                                                                </span>

                                                                <div>
                                                                    <strong>
                                                                        {
                                                                            movimentacao.descricao
                                                                        }
                                                                    </strong>

                                                                    <p>
                                                                        {
                                                                            movimentacao.categoriaNome
                                                                        }
                                                                        {' · '}
                                                                        {
                                                                            formatarData(
                                                                                movimentacao.dataMovimentacao,
                                                                            )
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <span
                                                                className={`dashboard-valor ${
                                                                    despesa
                                                                        ? 'dashboard-valor-despesa'
                                                                        : ''
                                                                }`}
                                                            >
                                                                {
                                                                    despesa
                                                                        ? '-'
                                                                        : '+'
                                                                }{' '}

                                                                {
                                                                    formatarDinheiro(
                                                                        movimentacao.valor,
                                                                    )
                                                                }
                                                            </span>
                                                        </li>
                                                    )
                                                },
                                            )
                                        }
                                    </ul>
                                )
                        }
                    </article>

                    <aside className="dashboard-painel">
                        <div className="dashboard-painel-topo">
                            <h2>
                                Acesso rápido
                            </h2>
                        </div>

                        <div className="dashboard-atalhos">
                            <button
                                className="dashboard-atalho"
                                onClick={
                                    abrirNovaReceita
                                }
                                type="button"
                            >
                                <span>＋</span>
                                Cadastrar receita — dinheiro entrando
                            </button>

                            <button
                                className="dashboard-atalho"
                                onClick={
                                    abrirNovaDespesa
                                }
                                type="button"
                            >
                                <span>−</span>
                                Cadastrar despesa — dinheiro saindo
                            </button>

                            <button
                                className="dashboard-atalho"
                                onClick={
                                    abrirMovimentacoes
                                }
                                type="button"
                            >
                                <span>☷</span>
                                Ver todas as movimentações
                            </button>

                            <button
                                className="dashboard-atalho"
                                onClick={
                                    abrirLixeiraMovimentacoes
                                }
                                type="button"
                            >
                                <span><IconeLixeira /></span>
                                Lixeira
                            </button>

                            <button
                                className="dashboard-atalho"
                                onClick={
                                    abrirCategorias
                                }
                                type="button"
                            >
                                <span>⌁</span>
                                Gerenciar categorias
                            </button>

                            <button
                                className="dashboard-atalho"
                                disabled={
                                    Boolean(
                                        baixandoRelatorio,
                                    )
                                }
                                onClick={() =>
                                    baixarRelatorio(
                                        'excel',
                                    )
                                }
                                type="button"
                            >
                                <span>▦</span>
                                {
                                    baixandoRelatorio
                                    === 'excel'
                                        ? 'Gerando Excel...'
                                        : 'Gerar relatório em Excel'
                                }
                            </button>

                            <button
                                className="dashboard-atalho"
                                disabled={
                                    Boolean(
                                        baixandoRelatorio,
                                    )
                                }
                                onClick={() =>
                                    baixarRelatorio(
                                        'pdf',
                                    )
                                }
                                type="button"
                            >
                                <span>▤</span>
                                {
                                    baixandoRelatorio
                                    === 'pdf'
                                        ? 'Gerando PDF...'
                                        : 'Gerar relatório em PDF'
                                }
                            </button>
                        </div>
                    </aside>
                </section>
            </div>
        </div>
    )
}

export default Dashboard
