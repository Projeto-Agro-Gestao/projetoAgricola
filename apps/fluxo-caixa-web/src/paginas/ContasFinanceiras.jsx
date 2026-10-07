import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import {
    useNavigate,
} from 'react-router'
import { API_BASE_URL as API_URL } from '../config.js'
import ShellDashboard from '../componentes/ShellDashboard.jsx'
import './Dashboard.css'
import './ContasFinanceiras.css'
import { apiFetch } from '../servicos/api.js'
import { obterSessao } from '../servicos/sessao.js'
import CarregamentoTela from '../componentes/CarregamentoTela.jsx'

// Mesmo helper de ícone material-symbols usado em Dashboard.jsx / ShellDashboard.jsx.
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

const LARGURA_GRAFICO = 900
const ALTURA_GRAFICO = 280
const ESPACO_HORIZONTAL = 54
const ESPACO_SUPERIOR = 24
const ESPACO_INFERIOR = 42

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
                    apiFetch(
                        `${API_URL}/empresas/${empresaId}/contas-financeiras/resumo`,
                    ),

                    apiFetch(enderecoContas),

                    apiFetch(
                        `${API_URL}/empresas/${empresaId}/contas-financeiras/lembretes`,
                    ),

                    apiFetch(
                        `${API_URL}/empresas/${empresaId}/contas-financeiras/projecao?${parametrosGrafico}`,
                    ),
                ])

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

                const resposta = await apiFetch(
                    `${API_URL}/empresas/${empresaId}/contas-financeiras/lixeira`,
                )

                if (!resposta.ok) {
                    throw new Error(
                        await obterMensagemDeErro(
                            resposta,
                            'Não foi possível carregar a lixeira de contas.',
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
                        : 'Não foi possível carregar a lixeira de contas.',
                )
            } finally {
                setCarregando(false)
            }
        }, [
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

    const resumoCategoriasContas =
        useMemo(
            () => {
                const grupos = new Map()

                contasAtivas.forEach((conta) => {
                    const nome =
                        conta.categoriaNome
                        || 'Sem categoria'
                    const chave = `${conta.tipo}-${nome}`

                    if (!grupos.has(chave)) {
                        grupos.set(chave, {
                            nome,
                            tipo: conta.tipo,
                            quantidade: 0,
                            valor: 0,
                        })
                    }

                    const grupo = grupos.get(chave)

                    grupo.quantidade += 1
                    grupo.valor += Number(
                        conta.valorPendente ?? 0,
                    )
                })

                return Array.from(grupos.values()).sort(
                    (primeira, segunda) =>
                        segunda.valor - primeira.valor,
                )
            },
            [contasAtivas],
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

    // Régua semanal: agrega os pontos da projeção em 4 buckets de 7 dias a
    // partir de hoje (recebimentos, pagamentos, líquido). Dado 100% derivado
    // de /projecao (via pontosGrafico), sem nenhum número fixo.
    // ponytail: assume semanas corridas a partir de hoje, não semanas-calendário
    // fixas. O rótulo exato dependeria de /projecao já bucketizado por
    // semana-calendário no backend (não existe hoje).
    const semanasRegua =
        useMemo(
            () =>
                Array.from(
                    { length: 4 },
                    (_, semana) => {
                        const indiceInicial =
                            semana * 7
                        const janela =
                            pontosGrafico.slice(
                                indiceInicial,
                                indiceInicial + 7,
                            )

                        const recebimentos =
                            janela.reduce(
                                (soma, ponto) =>
                                    soma
                                    + Number(
                                        ponto.totalAReceber
                                        ?? 0,
                                    ),
                                0,
                            )

                        const pagamentos =
                            janela.reduce(
                                (soma, ponto) =>
                                    soma
                                    + Number(
                                        ponto.totalAPagar
                                        ?? 0,
                                    ),
                                0,
                            )

                        return {
                            semana,
                            inicio:
                                janela[0]?.data,
                            fim:
                                janela[
                                    janela.length - 1
                                ]?.data,
                            recebimentos,
                            pagamentos,
                            liquido:
                                recebimentos
                                - pagamentos,
                            atual: semana === 0,
                        }
                    },
                ).filter(
                    (semana) => semana.inicio,
                ),
            [pontosGrafico],
        )

    // Escala comum das barras: maior valor (receber ou pagar) entre as
    // semanas, para as barras serem comparáveis entre os cards.
    const maximoRegua =
        useMemo(
            () =>
                Math.max(
                    1,
                    ...semanasRegua.flatMap(
                        (semana) => [
                            semana.recebimentos,
                            semana.pagamentos,
                        ],
                    ),
                ),
            [semanasRegua],
        )

    const larguraBarra = (valor) =>
        `${Math.round((Number(valor) / maximoRegua) * 100)}%`

    // Valor em R$ dos vencidos: soma do valorPendente das contas com
    // vencida === true (lista real já carregada). ponytail: o total exato de
    // vencidos deveria vir de um campo do backend (resumo.totalVencido); esta
    // soma no front depende da lista carregada dentro do período filtrado.
    const totalVencidoDerivado =
        useMemo(
            () =>
                contas
                    .filter(
                        (conta) =>
                            conta.vencida === true,
                    )
                    .reduce(
                        (soma, conta) =>
                            soma
                            + Number(
                                conta.valorPendente
                                ?? 0,
                            ),
                        0,
                    ),
            [contas],
        )

    // Próximo grande vencimento: derivado da lista — conta a pagar ainda
    // pendente com a data de vencimento mais próxima no futuro.
    // ponytail: idealmente seria um campo dedicado do /resumo
    // (ex.: resumo.proximoVencimento); hoje é derivado da lista carregada.
    const proximoGrandeVencimento =
        useMemo(
            () => {
                const hoje = obterDataAtual()

                return contas
                    .filter(
                        (conta) =>
                            conta.tipo === 'PAGAR'
                            && conta.situacao
                                !== 'QUITADA'
                            && conta.situacao
                                !== 'CANCELADA'
                            && conta.dataVencimento
                            && conta.dataVencimento
                                >= hoje,
                    )
                    .sort(
                        (primeira, segunda) =>
                            primeira.dataVencimento.localeCompare(
                                segunda.dataVencimento,
                            ),
                    )[0]
                    ?? null
            },
            [contas],
        )

    function criarConta(tipoConta) {
        navigate(
            `/dashboard/contas/nova?tipo=${tipoConta}`,
        )
    }

    function abrirCategorias() {
        navigate('/dashboard/categorias')
    }

    function abrirFornecedores() {
        navigate('/dashboard/fornecedores')
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
                await apiFetch(
                    `${API_URL}/empresas/${empresaId}/relatorios/${tipoRelatorio}?${parametros}`,
                )

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

            const resposta = await apiFetch(
                `${API_URL}/empresas/${empresaId}/categorias?tipo=${tipoCategoria}`,
            )

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

            const resposta = await apiFetch(
                `${API_URL}/empresas/${empresaId}/contas-financeiras/${contaParaLiquidar.id}/liquidacoes`,
                {
                    method: 'POST',
                    body: corpo,
                },
            )

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

            const resposta = await apiFetch(
                `${API_URL}/empresas/${empresaId}/contas-financeiras/${contaParaCancelar.id}/cancelar`,
                {
                    method: 'PATCH',
                },
            )

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

            const resposta = await apiFetch(
                `${API_URL}/empresas/${empresaId}/contas-financeiras/${conta.id}/restaurar`,
                {
                    method: 'PATCH',
                },
            )

            if (!resposta.ok) {
                throw new Error(
                    await obterMensagemDeErro(
                        resposta,
                        'Não foi possível restaurar a conta.',
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
                    : 'Não foi possível restaurar a conta.',
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

            const resposta = await apiFetch(
                `${API_URL}/empresas/${empresaId}/contas-financeiras/${contaParaExcluirPermanente.id}/permanente`,
                {
                    method: 'DELETE',
                },
            )

            if (!resposta.ok) {
                throw new Error(
                    await obterMensagemDeErro(
                        resposta,
                        'Não foi possível excluir definitivamente a conta.',
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
                    : 'Não foi possível excluir definitivamente a conta.',
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

            const resposta = await apiFetch(
                `${API_URL}/empresas/${empresaId}/contas-financeiras/${contaParaEnviarFinanceiro.id}/enviar-financeiro`,
                {
                    method: 'POST',
                    body: corpo,
                },
            )

            if (!resposta.ok) {
                throw new Error(
                    await obterMensagemDeErro(
                        resposta,
                        'Não foi possível enviar a conta ao financeiro.',
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
                    : 'Não foi possível enviar a conta ao financeiro.',
            )
        } finally {
            setEnviandoFinanceiro(false)
        }
    }

    if (!sessao) {
        return null
    }

    // Mesma regra de safra usada no ShellDashboard (jul→jun).
    const hojeSafra = new Date()
    const anoSafra =
        hojeSafra.getMonth() >= 6
            ? hojeSafra.getFullYear()
            : hojeSafra.getFullYear() - 1
    const safraAtual = `${anoSafra}/${anoSafra + 1}`

    // Contagens das abas derivadas da lista real de contas ativas.
    const totalAPagar = contasAtivas.filter(
        (conta) => conta.tipo === 'PAGAR',
    ).length
    const totalAReceber = contasAtivas.filter(
        (conta) => conta.tipo === 'RECEBER',
    ).length
    const totalQuitadas = contasAtivas.filter(
        (conta) => conta.situacao === 'QUITADA',
    ).length

    const abasContas = [
        {
            rotulo: 'Todos',
            contagem: contasAtivas.length,
            ativa: tipo === '' && situacao === '',
            aoSelecionar: () => {
                setTipo('')
                setSituacao('')
            },
        },
        {
            rotulo: 'A Pagar',
            contagem: totalAPagar,
            ativa: tipo === 'PAGAR',
            aoSelecionar: () => {
                setTipo('PAGAR')
                setSituacao('')
            },
        },
        {
            rotulo: 'A Receber',
            contagem: totalAReceber,
            ativa: tipo === 'RECEBER',
            aoSelecionar: () => {
                setTipo('RECEBER')
                setSituacao('')
            },
        },
        {
            rotulo: 'Pagas · Conciliadas',
            contagem: totalQuitadas,
            ativa: situacao === 'QUITADA',
            aoSelecionar: () => {
                setTipo('')
                setSituacao('QUITADA')
            },
        },
    ]

    // Chips de situação (mesma estrutura visual das abas). Reusa o estado
    // `situacao` que já filtra a lista — só troca o <select> por pills.
    const chipsSituacao = [
        { rotulo: 'Todas as situações', valor: '' },
        { rotulo: 'Pendentes', valor: 'PENDENTE' },
        { rotulo: 'Parcialmente quitadas', valor: 'PARCIAL' },
        { rotulo: 'Quitadas', valor: 'QUITADA' },
        { rotulo: 'Canceladas', valor: 'CANCELADA' },
    ]

    // Período: mapeia os chips para a janela de dias já existente (diasGrafico).
    // ponytail: um preset "Este Mês (mês-calendário)" exigiria filtro por mês no
    // /projecao do backend; hoje é sempre uma janela de N dias a partir de hoje.
    const periodosChips = [
        { rotulo: 'Próximos 7 dias', dias: 7 },
        { rotulo: 'Próximos 30 dias', dias: 30 },
        { rotulo: 'Próximos 90 dias', dias: 90 },
    ]

    const previsaoNegativa = !previsaoPositiva

    return (
        <ShellDashboard sessao={sessao} ativo="contas">
            <div className="ag-fin">
                <header className="ag-fin-topo">
                    <span className="ag-fin-eyebrow">
                        Planejamento Financeiro
                        <i className="ag-fin-eyebrow-ponto" />
                        <strong>Fluxo de Caixa Rural</strong>
                    </span>
                    <h1>Contas a Pagar e Receber</h1>
                </header>

                <section className="ag-fin-filtros">
                    <div
                        aria-label="Período da projeção"
                        className="ag-fin-pilulas"
                        role="group"
                    >
                        {periodosChips.map((chip) => (
                            <button
                                className={`ag-fin-pilula ${diasGrafico === chip.dias ? 'ag-ativo' : ''}`}
                                disabled={carregando}
                                key={chip.dias}
                                onClick={() =>
                                    setDiasGrafico(chip.dias)
                                }
                                type="button"
                            >
                                {chip.rotulo}
                            </button>
                        ))}
                    </div>

                    <div className="ag-fin-filtros-direita">
                        <button
                            className="ag-fin-botao ag-fin-botao-contorno"
                            onClick={abrirCategorias}
                            type="button"
                        >
                            <Icone nome="sell" tamanho={18} />
                            Filtrar por Categoria
                        </button>

                        <button
                            className="ag-fin-botao"
                            disabled={Boolean(baixandoRelatorio)}
                            onClick={() =>
                                baixarRelatorio('pdf')
                            }
                            type="button"
                        >
                            <Icone nome="file_download" tamanho={18} />
                            {baixandoRelatorio === 'pdf'
                                ? 'Gerando...'
                                : 'Exportar Fluxo'}
                        </button>
                    </div>
                </section>

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

                <section className="ag-fin-kpis">
                    <article className="ag-fin-kpi">
                        <div className="ag-fin-kpi-topo">
                            <div className="ag-fin-kpi-cabecalho">
                                <span className="ag-fin-kpi-eyebrow">Fluxo Ativo</span>
                                <h3 className="ag-fin-kpi-titulo">Total a Receber (Previsto)</h3>
                            </div>
                            <span className="ag-fin-kpi-icone">
                                <Icone nome="south_east" tamanho={22} />
                            </span>
                        </div>

                        <strong className="ag-fin-kpi-valor">
                            <span className="ag-fin-kpi-moeda">R$</span>
                            <span className="ag-fin-kpi-numero">
                                {formatarDinheiro(resumo?.totalAReceber).replace('R$', '').trim()}
                            </span>
                        </strong>

                        <small>
                            {resumo?.quantidadeContasAReceber ?? 0} contas a receber no período
                        </small>

                        <div className="ag-fin-kpi-rodape">
                            <span className="ag-fin-kpi-badge ag-fin-kpi-badge-verde">
                                <Icone nome="south_east" tamanho={14} />
                                Entradas previstas
                            </span>
                        </div>
                    </article>

                    <article className="ag-fin-kpi ag-fin-kpi-saida">
                        <div className="ag-fin-kpi-topo">
                            <div className="ag-fin-kpi-cabecalho">
                                <span className="ag-fin-kpi-eyebrow">Compromissado</span>
                                <h3 className="ag-fin-kpi-titulo">Total a Pagar</h3>
                            </div>
                            <span className="ag-fin-kpi-icone">
                                <Icone nome="north_east" tamanho={22} />
                            </span>
                        </div>

                        <strong className="ag-fin-kpi-valor">
                            <span className="ag-fin-kpi-moeda">R$</span>
                            <span className="ag-fin-kpi-numero">
                                {formatarDinheiro(resumo?.totalAPagar).replace('R$', '').trim()}
                            </span>
                        </strong>

                        <small>
                            {resumo?.quantidadeContasAPagar ?? 0} títulos a pagar no período
                        </small>

                        <div className="ag-fin-kpi-rodape">
                            <span className="ag-fin-kpi-badge ag-fin-kpi-badge-ambar">
                                <Icone nome="north_east" tamanho={14} />
                                Saídas previstas
                            </span>
                        </div>
                    </article>

                    <article
                        className={`ag-fin-kpi ${
                            previsaoNegativa ? 'ag-fin-kpi-saida' : ''
                        }`}
                    >
                        <div className="ag-fin-kpi-topo">
                            <div className="ag-fin-kpi-cabecalho">
                                <span className="ag-fin-kpi-eyebrow">Projeção</span>
                                <h3 className="ag-fin-kpi-titulo">Saldo Projetado no Período</h3>
                            </div>
                            <span className="ag-fin-kpi-icone">R$</span>
                        </div>

                        <strong className="ag-fin-kpi-valor">
                            <span className="ag-fin-kpi-moeda">R$</span>
                            <span className="ag-fin-kpi-numero">
                                {formatarDinheiro(resumo?.diferencaPrevista).replace('R$', '').trim()}
                            </span>
                        </strong>

                        <small>
                            Diferença entre o que deve entrar e o que deve sair
                        </small>

                        <div className="ag-fin-kpi-rodape">
                            {previsaoNegativa ? (
                                <span className="ag-fin-kpi-badge ag-fin-kpi-badge-ambar">
                                    <Icone nome="trending_down" tamanho={14} />
                                    Projeção negativa
                                </span>
                            ) : (
                                <span className="ag-fin-kpi-badge ag-fin-kpi-badge-verde">
                                    <Icone nome="trending_up" tamanho={14} />
                                    Projeção positiva
                                </span>
                            )}
                        </div>
                    </article>

                    <article className="ag-fin-kpi ag-fin-kpi-saida">
                        <div className="ag-fin-kpi-topo">
                            <div className="ag-fin-kpi-cabecalho">
                                <span className="ag-fin-kpi-eyebrow">Em Alerta</span>
                                <h3 className="ag-fin-kpi-titulo">Vencidos</h3>
                            </div>
                            <span className="ag-fin-kpi-icone">
                                <Icone nome="warning" tamanho={22} />
                            </span>
                        </div>

                        <strong className="ag-fin-kpi-valor">
                            <span className="ag-fin-kpi-moeda">R$</span>
                            <span className="ag-fin-kpi-numero">
                                {formatarDinheiro(totalVencidoDerivado).replace('R$', '').trim()}
                            </span>
                        </strong>

                        <small>
                            {resumo?.quantidadeVencidas ?? 0} conta(s) vencida(s) — valor em atraso
                        </small>

                        <div className="ag-fin-kpi-rodape">
                            <span className="ag-fin-kpi-badge ag-fin-kpi-badge-ambar">
                                <Icone nome="priority_high" tamanho={14} />
                                Resolver pendência
                            </span>
                        </div>
                    </article>

                    <article className="ag-fin-kpi">
                        <div className="ag-fin-kpi-topo">
                            <div className="ag-fin-kpi-cabecalho">
                                <span className="ag-fin-kpi-eyebrow">A Pagar</span>
                                <h3 className="ag-fin-kpi-titulo">Próximo Grande Vencimento</h3>
                            </div>
                            <span className="ag-fin-kpi-icone">
                                <Icone nome="event" tamanho={22} />
                            </span>
                        </div>

                        {proximoGrandeVencimento ? (
                            <>
                                <strong className="ag-fin-kpi-valor">
                                    <span className="ag-fin-kpi-moeda">R$</span>
                                    <span className="ag-fin-kpi-numero">
                                        {formatarDinheiro(proximoGrandeVencimento.valorPendente).replace('R$', '').trim()}
                                    </span>
                                </strong>

                                <small>
                                    {proximoGrandeVencimento.descricao}
                                    {' · vence '}
                                    {formatarData(proximoGrandeVencimento.dataVencimento)}
                                </small>
                            </>
                        ) : (
                            <>
                                <strong className="ag-fin-kpi-valor">
                                    <span className="ag-fin-kpi-numero">
                                        Sem vencimento próximo
                                    </span>
                                </strong>

                                <small>
                                    Nenhuma conta a pagar pendente no horizonte carregado
                                </small>
                            </>
                        )}

                        <div className="ag-fin-kpi-rodape">
                            <span className="ag-fin-kpi-badge ag-fin-kpi-badge-neutro">
                                <Icone nome="schedule" tamanho={14} />
                                Próximo compromisso
                            </span>
                        </div>
                    </article>
                </section>

                <section className="ag-contas-regua">
                    <div className="ag-contas-regua-topo">
                        <div>
                            <h2>Régua de Vencimentos &amp; Fluxo Semanal</h2>
                            <p>Recebimentos e pagamentos previstos, agregados por semana corrida.</p>
                        </div>

                        <ul className="ag-contas-regua-legenda">
                            <li className="ag-contas-legenda-receber">
                                Recebíveis
                            </li>
                            <li className="ag-contas-legenda-pagar">
                                Compromissos
                            </li>
                            <li className="ag-contas-legenda-liquido">
                                Saldo Líquido
                            </li>
                        </ul>
                    </div>

                    {semanasRegua.length === 0 ? (
                        <p className="ag-fin-vazio">
                            Sem projeção para o período selecionado.
                        </p>
                    ) : (
                        <div className="ag-contas-regua-cards">
                            {semanasRegua.map((semana) => (
                                <article
                                    className={`ag-contas-semana ${semana.atual ? 'ag-contas-semana-atual' : ''}`}
                                    key={semana.semana}
                                >
                                    {semana.atual && (
                                        <span className="ag-contas-semana-selo">
                                            Semana atual
                                        </span>
                                    )}
                                    <header>
                                        <span className="ag-contas-semana-rotulo">
                                            {`Semana ${semana.semana + 1}`}
                                        </span>
                                        <small>
                                            {formatarDataCurta(semana.inicio)}
                                            {' – '}
                                            {formatarDataCurta(semana.fim)}
                                        </small>
                                    </header>

                                    <dl>
                                        <div>
                                            <dt>Recebimentos</dt>
                                            <dd className="ag-contas-semana-receber">
                                                {formatarDinheiro(semana.recebimentos)}
                                            </dd>
                                            <div
                                                aria-hidden="true"
                                                className="ag-contas-barra"
                                            >
                                                <span
                                                    className="ag-contas-barra-receber"
                                                    style={{ width: larguraBarra(semana.recebimentos) }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <dt>Pagamentos</dt>
                                            <dd className="ag-contas-semana-pagar">
                                                {formatarDinheiro(semana.pagamentos)}
                                            </dd>
                                            <div
                                                aria-hidden="true"
                                                className="ag-contas-barra"
                                            >
                                                <span
                                                    className="ag-contas-barra-pagar"
                                                    style={{ width: larguraBarra(semana.pagamentos) }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <dt>Líquido</dt>
                                            <dd
                                                className={
                                                    semana.liquido < 0
                                                        ? 'ag-contas-semana-pagar'
                                                        : 'ag-contas-semana-receber'
                                                }
                                            >
                                                {semana.liquido < 0
                                                    ? 'Negativo · '
                                                    : 'Positivo · '}
                                                {formatarDinheiro(semana.liquido)}
                                            </dd>
                                        </div>
                                    </dl>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                <section className="contas-projecao-painel">
                    <div className="contas-projecao-topo">
                        <div>
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

                        </div>
                    </div>

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
                </section>

                <section className="ag-fin-analytics ag-contas-layout">
                <aside className="ag-fin-acoes ag-contas-aside">
                    <div className="ag-fin-acoes-topo">
                        <h2>Contas &amp; Categorias</h2>
                    </div>

                    <div className="ag-fin-atalhos">
                        <button
                            className="ag-fin-atalho"
                            onClick={() =>
                                criarConta('RECEBER')
                            }
                            type="button"
                        >
                            <span className="ag-fin-atalho-icone ag-fin-atalho-receita">
                                <Icone nome="add" tamanho={20} />
                            </span>
                            Nova conta a receber
                        </button>

                        <button
                            className="ag-fin-atalho"
                            onClick={() =>
                                criarConta('PAGAR')
                            }
                            type="button"
                        >
                            <span className="ag-fin-atalho-icone ag-fin-atalho-despesa">
                                <Icone nome="remove" tamanho={20} />
                            </span>
                            Nova conta a pagar
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
                            <span className="ag-fin-atalho-icone">
                                <Icone nome="delete" tamanho={20} />
                            </span>
                            {mostrandoLixeira
                                ? 'Ver contas cadastradas'
                                : 'Lixeira'}
                        </button>

                        <button
                            className="ag-fin-atalho"
                            disabled={Boolean(
                                baixandoRelatorio,
                            )}
                            onClick={() =>
                                baixarRelatorio('excel')
                            }
                            type="button"
                        >
                            <span className="ag-fin-atalho-icone">
                                <Icone nome="table_view" tamanho={20} />
                            </span>
                            {baixandoRelatorio === 'excel'
                                ? 'Gerando Excel...'
                                : 'Excel da projeção'}
                        </button>

                        <button
                            className="ag-fin-atalho"
                            disabled={Boolean(
                                baixandoRelatorio,
                            )}
                            onClick={() =>
                                baixarRelatorio('pdf')
                            }
                            type="button"
                        >
                            <span className="ag-fin-atalho-icone">
                                <Icone nome="picture_as_pdf" tamanho={20} />
                            </span>
                            {baixandoRelatorio === 'pdf'
                                ? 'Gerando PDF...'
                                : 'PDF da projeção'}
                        </button>
                    </div>

                    <div className="ag-contas-categorias">
                        <h3>Resumo por categoria</h3>

                        {resumoCategoriasContas.length === 0 ? (
                            <p className="ag-fin-vazio">
                                As categorias aparecerão aqui quando houver contas ativas.
                            </p>
                        ) : (
                            <ul className="ag-contas-categorias-lista">
                                {resumoCategoriasContas.map((categoria) => (
                                    <li
                                        key={`${categoria.tipo}-${categoria.nome}`}
                                    >
                                        <span
                                            className={`ag-contas-categoria-marca ${
                                                categoria.tipo === 'RECEBER'
                                                    ? 'receber'
                                                    : 'pagar'
                                            }`}
                                        >
                                            {categoria.tipo === 'RECEBER' ? '+' : '-'}
                                        </span>
                                        <div className="ag-contas-categoria-texto">
                                            <strong>{categoria.nome}</strong>
                                            <small>
                                                {categoria.quantidade} conta(s)
                                                {' · '}
                                                {categoria.tipo === 'RECEBER'
                                                    ? 'a receber'
                                                    : 'a pagar'}
                                            </small>
                                        </div>
                                        <strong className="ag-contas-categoria-valor">
                                            {formatarDinheiro(categoria.valor)}
                                        </strong>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/*
                      ponytail: a foto real da propriedade dependeria de um campo
                      de imagem no cadastro da propriedade (não existe hoje); por
                      isso o card usa um gradiente como placeholder honesto.
                    */}
                    <div className="ag-contas-propriedade">
                        <div className="ag-contas-propriedade-arte" aria-hidden="true" />
                        <div className="ag-contas-propriedade-texto">
                            <span className="ag-contas-propriedade-selo">
                                <Icone nome="verified" tamanho={14} />
                                LCDPR Integrado
                            </span>
                            <strong>{sessao.usuario.nomeEmpresa}</strong>
                            <small>Safra {safraAtual}</small>
                        </div>
                    </div>
                </aside>

                <section
                    className="contas-lista-painel ag-contas-coluna"
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
                        <div
                            aria-label="Filtrar contas"
                            className="ag-fin-abas"
                        >
                            {abasContas.map((aba) => (
                                <button
                                    aria-current={
                                        aba.ativa ? 'page' : undefined
                                    }
                                    className={
                                        aba.ativa
                                            ? 'ag-fin-aba ag-fin-aba-ativa'
                                            : 'ag-fin-aba'
                                    }
                                    key={aba.rotulo}
                                    onClick={aba.aoSelecionar}
                                    type="button"
                                >
                                    {aba.rotulo} ({aba.contagem})
                                </button>
                            ))}
                        </div>
                        )}

                        <div
                            aria-label="Visão da lista"
                            className="contas-lista-acoes"
                            role="group"
                        >
                            <button
                                aria-label="Atualizar lista"
                                className="contas-lista-acao"
                                onClick={carregarDados}
                                type="button"
                            >
                                <Icone nome="refresh" tamanho={18} />
                            </button>

                            {/* ponytail: ícones de visão (lista/compacto) são
                               placeholders decorativos — não há função de
                               alternância de visão definida pelo produto/backend
                               hoje. Viram um follow-up isolado quando houver. */}
                            <button
                                aria-label="Visão em lista (indisponível)"
                                className="contas-lista-acao"
                                disabled
                                type="button"
                            >
                                <Icone nome="view_list" tamanho={18} />
                            </button>

                            <button
                                aria-label="Visão compacta (indisponível)"
                                className="contas-lista-acao"
                                disabled
                                type="button"
                            >
                                <Icone nome="view_agenda" tamanho={18} />
                            </button>
                        </div>

                        {!mostrandoLixeira && (
                        <div className="contas-filtros contas-filtros-granular">
                            <div
                                aria-label="Filtrar pela situação"
                                className="ag-fin-abas contas-chips-situacao"
                                role="group"
                            >
                                {chipsSituacao.map((chip) => (
                                    <button
                                        aria-current={
                                            situacao === chip.valor
                                                ? 'true'
                                                : undefined
                                        }
                                        aria-pressed={situacao === chip.valor}
                                        className={
                                            situacao === chip.valor
                                                ? 'ag-fin-aba ag-fin-aba-ativa'
                                                : 'ag-fin-aba'
                                        }
                                        key={chip.valor || 'todas'}
                                        onClick={() =>
                                            setSituacao(chip.valor)
                                        }
                                        type="button"
                                    >
                                        {chip.rotulo}
                                    </button>
                                ))}
                            </div>
                        </div>
                        )}
                    </div>

                    {carregando ? (
                        <CarregamentoTela compacto texto="Carregando contas" />
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
                        <div className="contas-tabela-wrapper">
                            {/* ponytail: a coluna "Conta / Liquidação" do mock
                               (banco + forma de pagamento) foi OMITIDA — esses
                               dados não existem na conta hoje; renderizá-la
                               exigiria campos novos no backend (conta bancária +
                               forma de liquidação). Não criar coluna com dado
                               falso. */}
                            <table className="contas-tabela">
                                <thead>
                                    <tr>
                                        <th scope="col">Tipo</th>
                                        <th scope="col">Vencimento</th>
                                        <th scope="col">
                                            Descrição &amp; Favorecido/Cliente
                                        </th>
                                        <th scope="col">Categoria</th>
                                        <th
                                            className="contas-coluna-direita"
                                            scope="col"
                                        >
                                            Valor
                                        </th>
                                        <th
                                            className="contas-coluna-direita"
                                            scope="col"
                                        >
                                            Ações
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {contasVisiveis.map((conta) => {
                                        const ehReceber =
                                            conta.tipo === 'RECEBER'

                                        return (
                                            <tr key={conta.id}>
                                                <td data-coluna="Tipo">
                                                    <span
                                                        aria-label={
                                                            ehReceber
                                                                ? 'A receber'
                                                                : 'A pagar'
                                                        }
                                                        className={`contas-tipo-icone ${
                                                            ehReceber
                                                                ? 'contas-item-receber'
                                                                : 'contas-item-pagar'
                                                        }`}
                                                        role="img"
                                                    >
                                                        {ehReceber ? '↓' : '↑'}
                                                    </span>
                                                </td>

                                                <td data-coluna="Vencimento">
                                                    <strong className="contas-celula-principal">
                                                        {formatarData(
                                                            conta.dataVencimento,
                                                        )}
                                                    </strong>

                                                    <small className="contas-celula-secundaria">
                                                        {obterTextoVencimento(
                                                            conta,
                                                        )}
                                                    </small>
                                                </td>

                                                <td data-coluna="Descrição">
                                                    <div className="contas-celula-descricao">
                                                        <strong>
                                                            {conta.descricao}
                                                        </strong>

                                                        <span
                                                            className={`contas-status ${obterClasseSituacao(
                                                                conta,
                                                            )}`}
                                                        >
                                                            {conta.vencida
                                                                ? 'Vencida'
                                                                : conta.situacaoDescricao}
                                                        </span>
                                                    </div>

                                                    {(conta.favorecido
                                                        || conta.fornecedorNome
                                                        || conta.compradorNome) && (
                                                        <small className="contas-celula-secundaria">
                                                            {[
                                                                conta.favorecido,
                                                                conta.fornecedorNome,
                                                                conta.compradorNome,
                                                            ]
                                                                .filter(Boolean)
                                                                .join(' · ')}
                                                        </small>
                                                    )}
                                                </td>

                                                <td data-coluna="Categoria">
                                                    {conta.categoriaNome && (
                                                        <span className="contas-categoria">
                                                            <span
                                                                aria-hidden="true"
                                                                className={`contas-categoria-ponto ${
                                                                    ehReceber
                                                                        ? 'contas-categoria-ponto-receber'
                                                                        : 'contas-categoria-ponto-pagar'
                                                                }`}
                                                            />
                                                            {conta.categoriaNome}
                                                        </span>
                                                    )}
                                                </td>

                                                <td
                                                    className="contas-coluna-direita"
                                                    data-coluna="Valor"
                                                >
                                                    <strong
                                                        className={
                                                            ehReceber
                                                                ? 'contas-valor-receber'
                                                                : 'contas-valor-pagar'
                                                        }
                                                    >
                                                        {ehReceber ? '+' : '-'}{' '}
                                                        {formatarDinheiro(
                                                            conta.valorPendente,
                                                        )}
                                                    </strong>

                                                    {Number(
                                                        conta.valorLiquidado ?? 0,
                                                    ) > 0 && (
                                                        <small className="contas-celula-secundaria">
                                                            Liquidado:{' '}
                                                            {formatarDinheiro(
                                                                conta.valorLiquidado,
                                                            )}
                                                        </small>
                                                    )}
                                                </td>

                                                <td
                                                    className="contas-coluna-direita"
                                                    data-coluna="Ações"
                                                >
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
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
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
                                    Exclusão definitiva
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
                                ×
                            </button>
                        </div>

                        <p className="contas-modal-texto">
                            Esta conta será apagada permanentemente.
                            Depois disso não será possível recuperar.
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
                                ×
                            </button>
                        </div>

                        <form
                            className="contas-modal-formulario"
                            onSubmit={enviarContaAoFinanceiro}
                        >
                            <p className="contas-modal-texto">
                                O valor pendente será lançado no Dashboard
                                financeiro e esta conta sairá da previsão futura.
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
                                Observação
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
        </ShellDashboard>
    )
}

export default ContasFinanceiras
