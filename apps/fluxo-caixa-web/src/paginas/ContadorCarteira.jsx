import {
    useEffect,
    useMemo,
    useState,
} from 'react'
import { useNavigate } from 'react-router'
import AlternadorModulos from '../componentes/AlternadorModulos.jsx'
import { API_BASE_URL as API_URL } from '../config.js'
import { voltarPaginaAnterior } from '../navegacao.js'
import './ContadorCarteira.css'
import { apiFetch } from '../servicos/api.js'
import { obterSessao } from '../servicos/sessao.js'
import CarregamentoTela from '../componentes/CarregamentoTela.jsx'

const ABAS = [
    ['GERAL', 'Visao geral'],
    ['MOVIMENTACOES', 'Movimentacoes'],
    ['DOCUMENTOS', 'Documentos'],
    ['PENDENCIAS', 'Pendencias'],
    ['CLASSIFICACAO', 'Classificacao'],
    ['TRIBUTARIO', 'Tributario'],
    ['SIMULACOES', 'Simulacoes'],
    ['RELATORIOS', 'Relatorios'],
]

const TRATAMENTOS = [
    'PENDENTE_ANALISE',
    'POTENCIALMENTE_DEDUTIVEL',
    'VALIDADO_PELO_CONTADOR',
    'NAO_DEDUTIVEL',
    'PARCIALMENTE_CONSIDERADO',
    'DOCUMENTO_INSUFICIENTE',
    'PENDENTE_DOCUMENTO',
]

const STATUS_ANALISE = [
    'PENDENTE',
    'EM_ANALISE',
    'AGUARDANDO_CLIENTE',
    'VALIDADO',
    'REJEITADO',
    'CORRIGIR',
    'CONCLUIDO',
]

const REGIMES = [
    'MEI',
    'SIMPLES_NACIONAL',
    'LUCRO_PRESUMIDO',
    'LUCRO_REAL',
    'PESSOA_FISICA',
    'PRODUTOR_RURAL_PF',
    'OUTRO',
]

const REFERENCIAS_TRIBUTARIAS = {
    MEI: {
        titulo: 'MEI - DAS mensal',
        descricao:
            'Consulte os valores oficiais do DAS-MEI para a competencia atual antes de salvar o parametro.',
        links: [
            [
                'Portal gov.br - valores do DAS-MEI',
                'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/perguntas-frequentes/pagamento-da-contribuicao-mensal-carne-mensal/qual-o-valor-das-contribuicoes',
            ],
            [
                'Portal do Simples Nacional',
                'https://www8.receita.fazenda.gov.br/SimplesNacional/',
            ],
        ],
    },
    SIMPLES_NACIONAL: {
        titulo: 'Simples Nacional - anexos e faixas',
        descricao:
            'Use os anexos, faixa de receita, aliquota nominal e parcela a deduzir validados pelo contador.',
        links: [
            [
                'Portal oficial do Simples Nacional',
                'https://www8.receita.fazenda.gov.br/SimplesNacional/',
            ],
            [
                'Anexos e tabelas do Simples Nacional',
                'https://normas.receita.fazenda.gov.br/sijut2consulta/normas..receita.fazenda.gov.br/sijut2consulta/anexoOutros.action?idArquivoBinario=48430',
            ],
        ],
    },
    LUCRO_PRESUMIDO: {
        titulo: 'Lucro Presumido - IRPJ/CSLL',
        descricao:
            'Confira aliquotas, adicional, percentuais de presuncao e parametros aplicaveis ao cliente.',
        links: [
            [
                'Receita Federal - IRPJ',
                'https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/tributos/IRPJ',
            ],
            [
                'Receita Federal - CSLL',
                'https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/tributos/CSLL',
            ],
        ],
    },
    LUCRO_REAL: {
        titulo: 'Lucro Real - apuracao por resultado',
        descricao:
            'Configure os parametros a partir do resultado ajustado, sem misturar resultado financeiro com base tributaria definitiva.',
        links: [
            [
                'Receita Federal - IRPJ',
                'https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/tributos/IRPJ',
            ],
            [
                'Receita Federal - CSLL',
                'https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/tributos/CSLL',
            ],
        ],
    },
    PESSOA_FISICA: {
        titulo: 'Pessoa fisica - orientacoes Receita Federal',
        descricao:
            'Valide a regra aplicavel ao contribuinte antes de informar parametros de simulacao.',
        links: [
            [
                'Receita Federal - Meu Imposto de Renda',
                'https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda',
            ],
        ],
    },
    PRODUTOR_RURAL_PF: {
        titulo: 'Produtor rural PF - atividade rural',
        descricao:
            'Use as orientacoes do Livro Caixa da Atividade Rural e LCDPR quando aplicavel.',
        links: [
            [
                'Livro Caixa da Atividade Rural',
                'https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/download/pgd/lcar',
            ],
            [
                'Apurar resultado da atividade rural',
                'https://www.gov.br/pt-br/servicos/apurar-resultado-da-atividade-rural',
            ],
        ],
    },
    OUTRO: {
        titulo: 'Outro regime - parametro manual',
        descricao:
            'Cadastre a aliquota e deducao somente depois de validar a regra aplicavel.',
        links: [
            [
                'Receita Federal - orientacao tributaria',
                'https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria',
            ],
        ],
    },
}

function formatarDinheiro(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(Number(valor ?? 0))
}

function clienteDaSessao(sessao) {
    const usuario = sessao?.usuario

    if (!usuario?.empresaId) {
        return null
    }

    return {
        empresaId: usuario.empresaId,
        empresaNome: usuario.nomeEmpresa ?? 'Minha propriedade',
        statusEmpresa: 'ATIVO',
        pendenciasAbertas: 0,
        despesasSemDocumento: 0,
        movimentacoesSemClassificacao: 0,
        documentosNovos: 0,
        resultadoMes: 0,
        ultimaAtividade: null,
        visaoPropria: true,
    }
}

function formatarData(data) {
    if (!data) {
        return '-'
    }

    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
    }).format(new Date(`${data}T12:00:00`))
}

function formatarDataHora(data) {
    if (!data) {
        return '-'
    }

    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'America/Sao_Paulo',
    }).format(new Date(data))
}

function rotulo(valor) {
    return String(valor ?? '-').replaceAll('_', ' ').toLowerCase()
}

function hojeCompetencia() {
    const data = new Date()
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
}

function referenciaTributaria(regime) {
    return (
        REFERENCIAS_TRIBUTARIAS[regime] ??
        REFERENCIAS_TRIBUTARIAS.OUTRO
    )
}

function ContadorCarteira() {
    const navigate = useNavigate()
    const [sessao] = useState(obterSessao)
    const [clientes, setClientes] = useState([])
    const [clienteSelecionado, setClienteSelecionado] = useState(null)
    const [pendencias, setPendencias] = useState([])
    const [documentos, setDocumentos] = useState([])
    const [movimentacoes, setMovimentacoes] = useState([])
    const [classificacoes, setClassificacoes] = useState([])
    const [regimes, setRegimes] = useState([])
    const [parametros, setParametros] = useState([])
    const [visao, setVisao] = useState(null)
    const [dashboardFiscal, setDashboardFiscal] = useState(null)
    const [simulacao, setSimulacao] = useState(null)
    const [cenarios, setCenarios] = useState([])
    const [filtro, setFiltro] = useState('TODOS')
    const [aba, setAba] = useState('GERAL')
    const [filtroMovimentacao, setFiltroMovimentacao] = useState('TODAS')
    const [busca, setBusca] = useState('')
    const [selecionadas, setSelecionadas] = useState([])
    const [vinculosDocumento, setVinculosDocumento] = useState({})
    const [analiseEditando, setAnaliseEditando] = useState(null)
    const [formAnalise, setFormAnalise] = useState({
        classificacaoContabilId: '',
        tratamentoFiscal: 'PENDENTE_ANALISE',
        status: 'PENDENTE',
        valorConsiderado: '',
        observacao: '',
    })
    const [formRegime, setFormRegime] = useState({
        regime: 'PRODUTOR_RURAL_PF',
        dataInicio: new Date().toISOString().slice(0, 10),
        competencia: hojeCompetencia(),
        observacao: '',
    })
    const [formParametro, setFormParametro] = useState({
        regime: 'PRODUTOR_RURAL_PF',
        competencia: hojeCompetencia(),
        nome: '',
        aliquotaPercentual: '',
        parcelaDeduzir: '',
        observacao: '',
    })
    const [erro, setErro] = useState('')
    const [mensagem, setMensagem] = useState('')
    const [carregando, setCarregando] = useState(false)
    const [carregandoCliente, setCarregandoCliente] = useState(false)
    const [salvando, setSalvando] = useState(false)

    const usuarioLogado = sessao?.usuario
    const exibindoVisaoPropria =
        clienteSelecionado?.visaoPropria ||
        (usuarioLogado?.empresaId &&
            clienteSelecionado?.empresaId === usuarioLogado.empresaId &&
            usuarioLogado?.papel !== 'CONTADOR')

    const regimeAtual = useMemo(
        () =>
            regimes.find((regime) => regime.situacao === 'ATIVO') ??
            regimes[0] ??
            null,
        [regimes],
    )

    const referenciaAtual = useMemo(
        () =>
            referenciaTributaria(
                formParametro.regime ||
                    formRegime.regime ||
                    regimeAtual?.regime,
            ),
        [formParametro.regime, formRegime.regime, regimeAtual],
    )

    const clientesFiltrados = useMemo(() => {
        if (filtro === 'TODOS') {
            return clientes
        }

        if (filtro === 'PENDENCIAS') {
            return clientes.filter((cliente) => cliente.pendenciasAbertas > 0)
        }

        if (filtro === 'SEM_DOCUMENTO') {
            return clientes.filter((cliente) => cliente.despesasSemDocumento > 0)
        }

        if (filtro === 'SEM_CLASSIFICACAO') {
            return clientes.filter(
                (cliente) => cliente.movimentacoesSemClassificacao > 0,
            )
        }

        return clientes
    }, [clientes, filtro])

    const documentosSemMovimentacao = useMemo(
        () => documentos.filter((documento) => !documento.movimentacaoId),
        [documentos],
    )

    const movimentacoesFiltradas = useMemo(() => {
        const termo = busca.trim().toLowerCase()

        return movimentacoes.filter((movimentacao) => {
            const atendeFiltro =
                filtroMovimentacao === 'TODAS' ||
                (filtroMovimentacao === 'RECEITAS' &&
                    movimentacao.tipo === 'RECEITA') ||
                (filtroMovimentacao === 'DESPESAS' &&
                    movimentacao.tipo === 'DESPESA') ||
                (filtroMovimentacao === 'SEM_DOCUMENTO' &&
                    movimentacao.tipo === 'DESPESA' &&
                    !movimentacao.possuiDocumento) ||
                (filtroMovimentacao === 'SEM_CLASSIFICACAO' &&
                    movimentacao.tipo === 'DESPESA' &&
                    !movimentacao.classificacaoContabilId) ||
                (filtroMovimentacao === 'POTENCIALMENTE_DEDUTIVEL' &&
                    movimentacao.tratamentoFiscal ===
                        'POTENCIALMENTE_DEDUTIVEL') ||
                (filtroMovimentacao === 'SIMULACAO' &&
                    movimentacao.incluidoNaSimulacao)

            if (!atendeFiltro) {
                return false
            }

            if (!termo) {
                return true
            }

            return [
                movimentacao.descricao,
                movimentacao.fornecedor,
                movimentacao.categoriaFinanceira,
                movimentacao.classificacaoContabilNome,
                movimentacao.propriedade,
                movimentacao.atividade,
            ]
                .filter(Boolean)
                .some((valor) => valor.toLowerCase().includes(termo))
        })
    }, [busca, filtroMovimentacao, movimentacoes])

    useEffect(() => {
        if (!sessao) {
            navigate('/login', {
                replace: true,
            })
        }
    }, [navigate, sessao])

    async function requisicaoJson(url, opcoes = {}) {
        const resposta = await apiFetch(url, {
            method: opcoes.method ?? 'GET',
            body: opcoes.body,
        })

        if (!resposta.ok) {
            const texto = await resposta.text()
            throw new Error(texto || 'Nao foi possivel concluir a operacao.')
        }

        if (resposta.status === 204) {
            return null
        }

        return resposta.json()
    }

    async function carregarCarteira() {
        if (!sessao) {
            return
        }

        setCarregando(true)
        setErro('')

        try {
            const dados = await requisicaoJson(`${API_URL}/contador/clientes`)
            const fallbackProprio = clienteDaSessao(sessao)
            const lista =
                dados.length > 0
                    ? dados.map((cliente) =>
                          fallbackProprio &&
                          cliente.empresaId === fallbackProprio.empresaId
                              ? {
                                    ...cliente,
                                    visaoPropria: true,
                                }
                              : cliente,
                      )
                    : fallbackProprio
                      ? [fallbackProprio]
                      : []

            setClientes(lista)

            if (lista.length > 0 && !clienteSelecionado) {
                setClienteSelecionado(lista[0])
            }
        } catch (error) {
            const fallbackProprio = clienteDaSessao(sessao)

            if (fallbackProprio) {
                setClientes([fallbackProprio])

                if (!clienteSelecionado) {
                    setClienteSelecionado(fallbackProprio)
                }

                setMensagem(
                    'Sua empresa foi carregada diretamente para a area fiscal.',
                )
            } else {
                setErro(
                    error.message || 'Nao foi possivel carregar a carteira.',
                )
            }
        } finally {
            setCarregando(false)
        }
    }

    async function carregarCliente(cliente) {
        if (!sessao || !cliente) {
            return
        }

        setClienteSelecionado(cliente)
        setErro('')
        setMensagem('')
        setCarregandoCliente(true)

        const base = `${API_URL}/contador/clientes/${cliente.empresaId}`
        const buscar = (nome, url) =>
            requisicaoJson(url)
                .then((dados) => ({
                    nome,
                    dados,
                    erro: null,
                }))
                .catch((error) => ({
                    nome,
                    dados: null,
                    erro: error,
                }))

        try {
            const resultados = await Promise.all([
                buscar('pendencias', `${base}/pendencias`),
                buscar('documentos', `${base}/documentos`),
                buscar('visao', `${base}/visao-tributaria`),
                buscar('dashboardFiscal', `${base}/dashboard-contabil`),
                buscar('movimentacoes', `${base}/movimentacoes-fiscais`),
                buscar('classificacoes', `${base}/classificacoes-contabeis`),
                buscar('regimes', `${base}/regimes-tributarios`),
                buscar('parametros', `${base}/parametros-tributarios`),
                buscar('simulacao', `${base}/simulacao-tributaria`),
            ])
            const porNome = Object.fromEntries(
                resultados.map((resultado) => [resultado.nome, resultado]),
            )

            setPendencias(porNome.pendencias.dados ?? [])
            setDocumentos(porNome.documentos.dados ?? [])
            setVisao(porNome.visao.dados)
            setDashboardFiscal(porNome.dashboardFiscal.dados)
            setMovimentacoes(porNome.movimentacoes.dados ?? [])
            setClassificacoes(porNome.classificacoes.dados ?? [])
            setRegimes(porNome.regimes.dados ?? [])
            setParametros(porNome.parametros.dados ?? [])
            setSimulacao(porNome.simulacao.dados)

            const dashboardDados = porNome.dashboardFiscal.dados

            if (dashboardDados) {
                const clienteAtualizado = {
                    ...cliente,
                    pendenciasAbertas:
                        dashboardDados.documentosPendentes ??
                        cliente.pendenciasAbertas,
                    despesasSemDocumento:
                        dashboardDados.despesasSemDocumento ??
                        cliente.despesasSemDocumento,
                    movimentacoesSemClassificacao:
                        dashboardDados.despesasPendentesClassificacao ??
                        cliente.movimentacoesSemClassificacao,
                    documentosNovos:
                        dashboardDados.documentosRecebidos ??
                        cliente.documentosNovos,
                    resultadoMes:
                        dashboardDados.resultadoFinanceiro ??
                        cliente.resultadoMes,
                }

                setClienteSelecionado(clienteAtualizado)
                setClientes((atuais) =>
                    atuais.map((item) =>
                        item.empresaId === clienteAtualizado.empresaId
                            ? {
                                  ...item,
                                  ...clienteAtualizado,
                              }
                            : item,
                    ),
                )
            }

            const falhas = resultados.filter((resultado) => resultado.erro)

            if (falhas.length > 0) {
                setMensagem(
                    'Cliente selecionado. Alguns detalhes fiscais nao carregaram, mas os dados principais foram mantidos na tela.',
                )
            }
        } catch (error) {
            setErro(error.message || 'Nao foi possivel carregar o cliente.')
        } finally {
            setCarregandoCliente(false)
        }
    }

    function abrirLista(filtroLista, abaDestino = 'MOVIMENTACOES') {
        setFiltroMovimentacao(filtroLista)
        setAba(abaDestino)
        setBusca('')
    }

    function abrirAnalise(movimentacao) {
        setAnaliseEditando(movimentacao)
        setFormAnalise({
            classificacaoContabilId:
                movimentacao.classificacaoContabilId?.toString() ?? '',
            tratamentoFiscal:
                movimentacao.tratamentoFiscal ?? 'PENDENTE_ANALISE',
            status: movimentacao.statusFiscal ?? 'PENDENTE',
            valorConsiderado:
                movimentacao.valorConsiderado?.toString() ??
                movimentacao.valor?.toString() ??
                '',
            observacao: movimentacao.observacaoFiscal ?? '',
        })
    }

    async function salvarAnalise(event) {
        event?.preventDefault()
        if (!clienteSelecionado || !analiseEditando) {
            return
        }

        setSalvando(true)
        setErro('')

        const payload = {
            classificacaoContabilId: formAnalise.classificacaoContabilId
                ? Number(formAnalise.classificacaoContabilId)
                : null,
            tratamentoFiscal: formAnalise.tratamentoFiscal,
            status: formAnalise.status,
            valorConsiderado: formAnalise.valorConsiderado
                ? Number(formAnalise.valorConsiderado)
                : null,
            observacao: formAnalise.observacao || null,
        }

        try {
            await requisicaoJson(
                `${API_URL}/contador/clientes/${clienteSelecionado.empresaId}/movimentacoes/${analiseEditando.id}/analise-fiscal`,
                {
                    method: 'PUT',
                    json: true,
                    body: JSON.stringify(payload),
                },
            )
            setMensagem('Analise fiscal atualizada.')
            setAnaliseEditando(null)
            await carregarCliente(clienteSelecionado)
        } catch (error) {
            setErro(error.message || 'Nao foi possivel salvar a analise.')
        } finally {
            setSalvando(false)
        }
    }

    async function aplicarAnaliseRapida(movimentacao, tratamento, status) {
        setAnaliseEditando(movimentacao)
        setFormAnalise({
            classificacaoContabilId:
                movimentacao.classificacaoContabilId?.toString() ?? '',
            tratamentoFiscal: tratamento,
            status,
            valorConsiderado:
                tratamento === 'NAO_DEDUTIVEL'
                    ? '0'
                    : movimentacao.valor?.toString() ?? '',
            observacao:
                tratamento === 'NAO_DEDUTIVEL'
                    ? 'Item nao considerado na simulacao pelo contador.'
                    : 'Item incluido na simulacao para revisao do contador.',
        })
    }

    async function solicitarDocumento(movimentacao) {
        if (!clienteSelecionado) {
            return
        }

        setSalvando(true)
        setErro('')

        try {
            await requisicaoJson(
                `${API_URL}/contador/clientes/${clienteSelecionado.empresaId}/movimentacoes/${movimentacao.id}/solicitar-documento`,
                {
                    method: 'POST',
                },
            )
            setMensagem('Documento solicitado ao produtor.')
            await carregarCliente(clienteSelecionado)
        } catch (error) {
            setErro(error.message || 'Nao foi possivel solicitar documento.')
        } finally {
            setSalvando(false)
        }
    }

    async function vincularDocumento(documento) {
        const movimentacaoId = vinculosDocumento[documento.id]

        if (!clienteSelecionado || !movimentacaoId) {
            setErro('Selecione uma movimentacao para vincular o documento.')
            return
        }

        setSalvando(true)
        setErro('')

        try {
            await requisicaoJson(
                `${API_URL}/contador/clientes/${clienteSelecionado.empresaId}/documentos/${documento.id}/vincular/${movimentacaoId}`,
                {
                    method: 'POST',
                },
            )
            setMensagem('Documento vinculado a movimentacao.')
            setVinculosDocumento((atuais) => ({
                ...atuais,
                [documento.id]: '',
            }))
            await carregarCliente(clienteSelecionado)
        } catch (error) {
            setErro(error.message || 'Nao foi possivel vincular documento.')
        } finally {
            setSalvando(false)
        }
    }

    async function classificarSelecionadas() {
        const ids = new Set(selecionadas)
        const primeira = movimentacoes.find((movimentacao) =>
            ids.has(movimentacao.id),
        )

        if (!primeira) {
            setErro('Selecione ao menos uma movimentacao.')
            return
        }

        abrirAnalise(primeira)
        setMensagem(
            'Preencha a classificacao. A aplicacao em lote usara estes dados nas movimentacoes selecionadas.',
        )
    }

    async function salvarLote(event) {
        event.preventDefault()
        if (!clienteSelecionado || selecionadas.length === 0) {
            return
        }

        setSalvando(true)
        setErro('')

        const payload = {
            classificacaoContabilId: formAnalise.classificacaoContabilId
                ? Number(formAnalise.classificacaoContabilId)
                : null,
            tratamentoFiscal: formAnalise.tratamentoFiscal,
            status: formAnalise.status,
            valorConsiderado: formAnalise.valorConsiderado
                ? Number(formAnalise.valorConsiderado)
                : null,
            observacao: formAnalise.observacao || null,
        }

        try {
            await Promise.all(
                selecionadas.map((movimentacaoId) =>
                    requisicaoJson(
                        `${API_URL}/contador/clientes/${clienteSelecionado.empresaId}/movimentacoes/${movimentacaoId}/analise-fiscal`,
                        {
                            method: 'PUT',
                            json: true,
                            body: JSON.stringify(payload),
                        },
                    ),
                ),
            )
            setMensagem('Classificacao em lote aplicada.')
            setSelecionadas([])
            setAnaliseEditando(null)
            await carregarCliente(clienteSelecionado)
        } catch (error) {
            setErro(error.message || 'Nao foi possivel classificar em lote.')
        } finally {
            setSalvando(false)
        }
    }

    async function salvarRegime(event) {
        event.preventDefault()
        if (!clienteSelecionado) {
            return
        }

        setSalvando(true)
        setErro('')

        try {
            const regimeSalvo = await requisicaoJson(
                `${API_URL}/contador/clientes/${clienteSelecionado.empresaId}/regimes-tributarios`,
                {
                    method: 'POST',
                    json: true,
                    body: JSON.stringify({
                        regime: formRegime.regime,
                        dataInicio: formRegime.dataInicio,
                        dataFim: null,
                        competencia: formRegime.competencia,
                        observacao: formRegime.observacao || null,
                    }),
                },
            )
            setFormParametro((atual) => ({
                ...atual,
                regime: regimeSalvo.regime,
                competencia:
                    regimeSalvo.competencia ||
                    atual.competencia ||
                    formRegime.competencia,
                nome:
                    atual.nome ||
                    `Parametro ${regimeSalvo.regime}`,
            }))
            setMensagem('Configuracao tributaria salva.')
            await carregarCliente(clienteSelecionado)
        } catch (error) {
            setErro(error.message || 'Nao foi possivel salvar o regime.')
        } finally {
            setSalvando(false)
        }
    }

    async function salvarParametro(event) {
        event.preventDefault()
        if (!clienteSelecionado) {
            return
        }

        setSalvando(true)
        setErro('')

        try {
            await requisicaoJson(
                `${API_URL}/contador/clientes/${clienteSelecionado.empresaId}/parametros-tributarios`,
                {
                    method: 'POST',
                    json: true,
                    body: JSON.stringify({
                        regime: formParametro.regime,
                        competencia: formParametro.competencia,
                        nome: formParametro.nome || null,
                        aliquotaPercentual: formParametro.aliquotaPercentual
                            ? Number(formParametro.aliquotaPercentual)
                            : null,
                        parcelaDeduzir: formParametro.parcelaDeduzir
                            ? Number(formParametro.parcelaDeduzir)
                            : null,
                        observacao: formParametro.observacao || null,
                    }),
                },
            )
            setMensagem('Parametro tributario salvo.')
            await carregarCliente(clienteSelecionado)
        } catch (error) {
            setErro(error.message || 'Nao foi possivel salvar o parametro.')
        } finally {
            setSalvando(false)
        }
    }

    async function recalcularSimulacao() {
        if (!clienteSelecionado) {
            return
        }

        setSalvando(true)
        setErro('')

        try {
            const dados = await requisicaoJson(
                `${API_URL}/contador/clientes/${clienteSelecionado.empresaId}/simulacao-tributaria`,
            )
            setSimulacao(dados)
            setDashboardFiscal((atual) =>
                atual
                    ? {
                          ...atual,
                          tributoEstimado: dados.tributoEstimado,
                          baseEstimadaSimulacao: dados.baseEstimada,
                      }
                    : atual,
            )
            setMensagem('Simulacao recalculada com os parametros atuais.')
        } catch (error) {
            setErro(error.message || 'Nao foi possivel recalcular.')
        } finally {
            setSalvando(false)
        }
    }

    function salvarCenario() {
        if (!simulacao) {
            setErro('Calcule uma simulacao antes de salvar o cenario.')
            return
        }

        setCenarios((atuais) => [
            {
                id: Date.now(),
                nome: `Cenario ${atuais.length + 1}`,
                criadoEm: new Date().toISOString(),
                ...simulacao,
            },
            ...atuais,
        ])
        setMensagem('Cenario salvo para comparacao nesta sessao.')
    }

    async function baixarDocumento(documento) {
        if (!clienteSelecionado) {
            return
        }

        setErro('')

        try {
            const resposta = await apiFetch(
                `${API_URL}/colaboracao/empresas/${clienteSelecionado.empresaId}/documentos/${documento.id}/download`,
            )

            if (!resposta.ok) {
                throw new Error('Nao foi possivel baixar o documento.')
            }

            const blob = await resposta.blob()
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = documento.nomeArquivo
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            setErro(error.message)
        }
    }

    function exportarRelatorioCsv() {
        const linhas = [
            [
                'data',
                'tipo',
                'descricao',
                'fornecedor',
                'valor',
                'categoria_financeira',
                'classificacao_fiscal',
                'tratamento_fiscal',
                'status_fiscal',
                'valor_considerado',
                'documentos',
            ],
            ...movimentacoesFiltradas.map((movimentacao) => [
                movimentacao.data,
                movimentacao.tipo,
                movimentacao.descricao,
                movimentacao.fornecedor ?? '',
                movimentacao.valor ?? 0,
                movimentacao.categoriaFinanceira ?? '',
                movimentacao.classificacaoContabilNome ?? '',
                movimentacao.tratamentoFiscal ?? '',
                movimentacao.statusFiscal ?? '',
                movimentacao.valorConsiderado ?? '',
                movimentacao.documentos ?? 0,
            ]),
        ]

        const csv = linhas
            .map((linha) =>
                linha
                    .map((valor) => `"${String(valor).replaceAll('"', '""')}"`)
                    .join(';'),
            )
            .join('\n')
        const blob = new Blob([csv], {
            type: 'text/csv;charset=utf-8',
        })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `relatorio-fiscal-${clienteSelecionado?.empresaId ?? 'cliente'}.csv`
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
    }

    useEffect(() => {
        carregarCarteira()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessao])

    useEffect(() => {
        if (clienteSelecionado) {
            carregarCliente(clienteSelecionado)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clienteSelecionado?.empresaId])

    useEffect(() => {
        if (!regimeAtual?.regime) {
            return
        }

        setFormRegime((atual) => ({
            ...atual,
            regime: regimeAtual.regime,
            dataInicio:
                regimeAtual.dataInicio ?? atual.dataInicio,
            competencia:
                regimeAtual.competencia ||
                atual.competencia ||
                hojeCompetencia(),
            observacao:
                atual.observacao || regimeAtual.observacao || '',
        }))
        setFormParametro((atual) => ({
            ...atual,
            regime: regimeAtual.regime,
            competencia:
                regimeAtual.competencia ||
                atual.competencia ||
                hojeCompetencia(),
        }))
    }, [regimeAtual?.id])

    if (!sessao) {
        return null
    }

    const analiseEmLote = selecionadas.length > 0 && analiseEditando

    return (
        <div className="contador-carteira-pagina">
            <div className="contador-carteira-conteudo">
                <header className="contador-carteira-cabecalho">
                    <div className="contador-carteira-navegacao">
                        <button
                            type="button"
                            onClick={() => voltarPaginaAnterior(navigate)}
                        >
                            Voltar
                        </button>

                        <AlternadorModulos />
                    </div>

                    <p>
                        {exibindoVisaoPropria
                            ? 'Area fiscal da propriedade'
                            : 'Area do contador'}
                    </p>
                    <h1>
                        {exibindoVisaoPropria
                            ? 'Minha analise contabil e fiscal'
                            : 'Carteira e trabalho fiscal'}
                    </h1>
                    <span>
                        {exibindoVisaoPropria
                            ? 'Veja a mesma base de movimentacoes, documentos, classificacoes, regimes, simulacoes e relatorios que fica disponivel para o contador.'
                            : 'Trabalhe sobre as movimentacoes reais do produtor: documentos, classificacoes, pendencias, regimes, simulacoes e relatorios em uma unica base.'}
                    </span>
                </header>

                {erro && (
                    <div className="contador-carteira-alerta">{erro}</div>
                )}

                {mensagem && (
                    <div className="contador-carteira-sucesso">{mensagem}</div>
                )}

                <section className="contador-carteira-filtros">
                    {[
                        ['TODOS', 'Todos'],
                        ['PENDENCIAS', 'Com pendencias'],
                        ['SEM_DOCUMENTO', 'Sem documento'],
                        ['SEM_CLASSIFICACAO', 'Sem classificacao'],
                    ].map(([valor, texto]) => (
                        <button
                            key={valor}
                            className={filtro === valor ? 'ativo' : ''}
                            type="button"
                            onClick={() => setFiltro(valor)}
                        >
                            {texto}
                        </button>
                    ))}
                </section>

                <div className="contador-carteira-grade">
                    <section className="contador-carteira-card">
                        <div className="contador-carteira-card-topo">
                            <div>
                                <small>Clientes</small>
                                <h2>
                                    {exibindoVisaoPropria
                                        ? 'Minha empresa'
                                        : 'Produtores atendidos'}
                                </h2>
                            </div>
                            <span>{clientesFiltrados.length}</span>
                        </div>

                        <div className="contador-carteira-clientes">
                            {clientesFiltrados.length === 0 ? (
                                <p>
                                    {exibindoVisaoPropria
                                        ? 'Sua empresa ainda nao foi carregada.'
                                        : 'Nenhum cliente vinculado.'}
                                </p>
                            ) : (
                                clientesFiltrados.map((cliente) => (
                                    <button
                                        key={cliente.empresaId}
                                        className={
                                            clienteSelecionado?.empresaId ===
                                            cliente.empresaId
                                                ? 'ativo'
                                                : ''
                                        }
                                        type="button"
                                        onClick={() => carregarCliente(cliente)}
                                    >
                                        <strong>{cliente.empresaNome}</strong>
                                        <span>
                                            {cliente.statusEmpresa} -{' '}
                                            {cliente.pendenciasAbertas}{' '}
                                            pendencias
                                        </span>
                                        <small>
                                            Resultado do mes:{' '}
                                            {formatarDinheiro(
                                                cliente.resultadoMes,
                                            )}
                                        </small>
                                    </button>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="contador-carteira-card">
                        <div className="contador-carteira-card-topo">
                            <div>
                                <small>Mesa fiscal</small>
                                <h2>
                                    {clienteSelecionado?.empresaNome ??
                                        'Selecione um cliente'}
                                </h2>
                            </div>
                        </div>

                        {carregandoCliente && (
                            <CarregamentoTela
                                compacto
                                texto="Carregando dados do cliente"
                            />
                        )}

                        <div className="contador-carteira-indicadores">
                            <button
                                type="button"
                                onClick={() => abrirLista('TODAS')}
                            >
                                <small>Pendencias</small>
                                <strong>
                                    {clienteSelecionado?.pendenciasAbertas ?? 0}
                                </strong>
                            </button>
                            <button
                                type="button"
                                onClick={() => abrirLista('SEM_DOCUMENTO')}
                            >
                                <small>Sem documento</small>
                                <strong>
                                    {dashboardFiscal?.despesasSemDocumento ??
                                        clienteSelecionado
                                            ?.despesasSemDocumento ??
                                        0}
                                </strong>
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    abrirLista('SEM_CLASSIFICACAO')
                                }
                            >
                                <small>Sem classificacao fiscal</small>
                                <strong>
                                    {dashboardFiscal
                                        ?.despesasPendentesClassificacao ??
                                        clienteSelecionado
                                            ?.movimentacoesSemClassificacao ??
                                        0}
                                </strong>
                            </button>
                            <button
                                type="button"
                                onClick={() => setAba('DOCUMENTOS')}
                            >
                                <small>Documentos recebidos</small>
                                <strong>{documentos.length}</strong>
                            </button>
                        </div>

                        <div className="contador-carteira-tributaria">
                            <h3>Resultado do periodo</h3>
                            <p>
                                Estes valores saem do financeiro real do
                                produtor. A base tributaria so muda depois das
                                classificacoes, documentos e parametros.
                            </p>
                            <div>
                                <button
                                    type="button"
                                    onClick={() => abrirLista('RECEITAS')}
                                >
                                    Receitas:{' '}
                                    {formatarDinheiro(visao?.receitasAno)}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => abrirLista('DESPESAS')}
                                >
                                    Despesas:{' '}
                                    {formatarDinheiro(visao?.despesasAno)}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => abrirLista('TODAS')}
                                >
                                    Resultado:{' '}
                                    {formatarDinheiro(
                                        visao?.resultadoAcumulado,
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAba('SIMULACOES')}
                                >
                                    Projecao:{' '}
                                    {formatarDinheiro(
                                        visao?.resultadoProjetado,
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="contador-carteira-tributaria">
                            <h3>Painel contabil e fiscal</h3>
                            <div>
                                <button
                                    type="button"
                                    onClick={() => abrirLista('SIMULACAO')}
                                >
                                    Base estimada:{' '}
                                    {formatarDinheiro(
                                        dashboardFiscal?.baseEstimadaSimulacao,
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAba('SIMULACOES')}
                                >
                                    Tributo estimado:{' '}
                                    {formatarDinheiro(
                                        dashboardFiscal?.tributoEstimado,
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        abrirLista(
                                            'POTENCIALMENTE_DEDUTIVEL',
                                        )
                                    }
                                >
                                    Potencialmente dedutivel:{' '}
                                    {formatarDinheiro(
                                        dashboardFiscal
                                            ?.valorPotencialmenteDedutivel,
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAba('TRIBUTARIO')}
                                >
                                    Regime:{' '}
                                    {dashboardFiscal?.regimeAtual ?? 'nao configurado'}
                                </button>
                            </div>
                            <small>
                                {dashboardFiscal?.aviso ??
                                    'Valores estimados para apoio a analise. A apuracao fiscal definitiva deve ser validada pelo profissional responsavel.'}
                            </small>
                        </div>
                    </section>
                </div>

                <section className="contador-carteira-abas">
                    {ABAS.map(([valor, texto]) => (
                        <button
                            key={valor}
                            type="button"
                            className={aba === valor ? 'ativo' : ''}
                            onClick={() => setAba(valor)}
                        >
                            {texto}
                        </button>
                    ))}
                </section>

                {aba === 'GERAL' && (
                    <section className="contador-carteira-duas-colunas">
                        <article className="contador-carteira-card">
                            <div className="contador-carteira-card-topo">
                                <div>
                                    <small>Composicao</small>
                                    <h2>Memoria do resultado</h2>
                                </div>
                            </div>
                            <div className="contador-memoria">
                                <span>
                                    Receitas brutas
                                    <strong>
                                        {formatarDinheiro(
                                            dashboardFiscal?.receitaBruta,
                                        )}
                                    </strong>
                                </span>
                                <span>
                                    Despesas registradas
                                    <strong>
                                        {formatarDinheiro(
                                            dashboardFiscal
                                                ?.despesasRegistradas,
                                        )}
                                    </strong>
                                </span>
                                <span>
                                    Resultado financeiro
                                    <strong>
                                        {formatarDinheiro(
                                            dashboardFiscal
                                                ?.resultadoFinanceiro,
                                        )}
                                    </strong>
                                </span>
                                <span>
                                    Nao considerado
                                    <strong>
                                        {formatarDinheiro(
                                            dashboardFiscal
                                                ?.valorNaoConsiderado,
                                        )}
                                    </strong>
                                </span>
                                <span>
                                    Base estimada
                                    <strong>
                                        {formatarDinheiro(
                                            dashboardFiscal
                                                ?.baseEstimadaSimulacao,
                                        )}
                                    </strong>
                                </span>
                            </div>
                        </article>

                        <article className="contador-carteira-card">
                            <div className="contador-carteira-card-topo">
                                <div>
                                    <small>Proximas acoes</small>
                                    <h2>O que precisa de atencao</h2>
                                </div>
                            </div>
                            <div className="contador-carteira-lista">
                                <button
                                    type="button"
                                    onClick={() => abrirLista('SEM_DOCUMENTO')}
                                >
                                    Solicitar documentos faltantes
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        abrirLista('SEM_CLASSIFICACAO')
                                    }
                                >
                                    Classificar movimentacoes pendentes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAba('TRIBUTARIO')}
                                >
                                    Revisar regime e parametros
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAba('SIMULACOES')}
                                >
                                    Calcular simulacao e memoria
                                </button>
                            </div>
                        </article>
                    </section>
                )}

                {(aba === 'MOVIMENTACOES' || aba === 'CLASSIFICACAO') && (
                    <section className="contador-carteira-card">
                        <div className="contador-carteira-card-topo">
                            <div>
                                <small>Movimentacoes reais</small>
                                <h2>Mesa de classificacao fiscal</h2>
                            </div>
                            <span>{movimentacoesFiltradas.length}</span>
                        </div>

                        <div className="contador-toolbar">
                            <select
                                value={filtroMovimentacao}
                                onChange={(event) =>
                                    setFiltroMovimentacao(event.target.value)
                                }
                            >
                                <option value="TODAS">Todas</option>
                                <option value="RECEITAS">Receitas</option>
                                <option value="DESPESAS">Despesas</option>
                                <option value="SEM_DOCUMENTO">
                                    Sem documento
                                </option>
                                <option value="SEM_CLASSIFICACAO">
                                    Sem classificacao fiscal
                                </option>
                                <option value="POTENCIALMENTE_DEDUTIVEL">
                                    Potencialmente dedutivel
                                </option>
                                <option value="SIMULACAO">
                                    Incluidas na simulacao
                                </option>
                            </select>
                            <input
                                value={busca}
                                onChange={(event) =>
                                    setBusca(event.target.value)
                                }
                                placeholder="Buscar descricao, fornecedor, categoria ou propriedade"
                            />
                            <button
                                type="button"
                                onClick={classificarSelecionadas}
                            >
                                Classificar selecionadas
                            </button>
                            <button
                                type="button"
                                onClick={exportarRelatorioCsv}
                            >
                                Exportar CSV
                            </button>
                        </div>

                        {movimentacoesFiltradas.length === 0 ? (
                            <p>Nenhuma movimentacao para este periodo.</p>
                        ) : (
                            <div className="contador-tabela-wrap">
                                <table className="contador-tabela">
                                    <thead>
                                        <tr>
                                            <th></th>
                                            <th>Data</th>
                                            <th>Tipo</th>
                                            <th>Descricao</th>
                                            <th>Fornecedor</th>
                                            <th>Valor</th>
                                            <th>Categoria</th>
                                            <th>Documento</th>
                                            <th>Fiscal</th>
                                            <th>Valor considerado</th>
                                            <th>Acoes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {movimentacoesFiltradas.map(
                                            (movimentacao) => (
                                                <tr key={movimentacao.id}>
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            checked={selecionadas.includes(
                                                                movimentacao.id,
                                                            )}
                                                            onChange={(
                                                                event,
                                                            ) =>
                                                                setSelecionadas(
                                                                    (atuais) =>
                                                                        event
                                                                            .target
                                                                            .checked
                                                                            ? [
                                                                                  ...atuais,
                                                                                  movimentacao.id,
                                                                              ]
                                                                            : atuais.filter(
                                                                                  (
                                                                                      id,
                                                                                  ) =>
                                                                                      id !==
                                                                                      movimentacao.id,
                                                                              ),
                                                                )
                                                            }
                                                        />
                                                    </td>
                                                    <td>
                                                        {formatarData(
                                                            movimentacao.data,
                                                        )}
                                                    </td>
                                                    <td>{movimentacao.tipo}</td>
                                                    <td>
                                                        <strong>
                                                            {
                                                                movimentacao.descricao
                                                            }
                                                        </strong>
                                                        <small>
                                                            {movimentacao.propriedade ??
                                                                'Sem propriedade'}{' '}
                                                            -{' '}
                                                            {movimentacao.atividade ??
                                                                'Sem atividade'}
                                                        </small>
                                                    </td>
                                                    <td>
                                                        {movimentacao.fornecedor ??
                                                            '-'}
                                                    </td>
                                                    <td>
                                                        {formatarDinheiro(
                                                            movimentacao.valor,
                                                        )}
                                                    </td>
                                                    <td>
                                                        {movimentacao.categoriaFinanceira ??
                                                            '-'}
                                                    </td>
                                                    <td>
                                                        {movimentacao.possuiDocumento
                                                            ? `${movimentacao.documentos} doc.`
                                                            : 'Sem documento'}
                                                    </td>
                                                    <td>
                                                        <strong>
                                                            {movimentacao.classificacaoContabilNome ??
                                                                'Sem classificacao'}
                                                        </strong>
                                                        <small>
                                                            {rotulo(
                                                                movimentacao.tratamentoFiscal,
                                                            )}{' '}
                                                            -{' '}
                                                            {rotulo(
                                                                movimentacao.statusFiscal,
                                                            )}
                                                        </small>
                                                    </td>
                                                    <td>
                                                        {formatarDinheiro(
                                                            movimentacao.valorConsiderado,
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="contador-acoes">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    abrirAnalise(
                                                                        movimentacao,
                                                                    )
                                                                }
                                                            >
                                                                Classificar
                                                            </button>
                                                            {!movimentacao.possuiDocumento && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        solicitarDocumento(
                                                                            movimentacao,
                                                                        )
                                                                    }
                                                                >
                                                                    Solicitar doc.
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    aplicarAnaliseRapida(
                                                                        movimentacao,
                                                                        'POTENCIALMENTE_DEDUTIVEL',
                                                                        'EM_ANALISE',
                                                                    )
                                                                }
                                                            >
                                                                Incluir
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    aplicarAnaliseRapida(
                                                                        movimentacao,
                                                                        'NAO_DEDUTIVEL',
                                                                        'VALIDADO',
                                                                    )
                                                                }
                                                            >
                                                                Nao considerar
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                )}

                {analiseEditando && (
                    <section className="contador-carteira-card contador-editor">
                        <div className="contador-carteira-card-topo">
                            <div>
                                <small>
                                    {analiseEmLote
                                        ? 'Classificacao em lote'
                                        : 'Analise fiscal'}
                                </small>
                                <h2>
                                    {analiseEmLote
                                        ? `${selecionadas.length} movimentacoes selecionadas`
                                        : analiseEditando.descricao}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAnaliseEditando(null)}
                            >
                                Fechar
                            </button>
                        </div>

                        <form
                            className="contador-form-grid"
                            onSubmit={
                                analiseEmLote ? salvarLote : salvarAnalise
                            }
                        >
                            <label>
                                Categoria contabil
                                <select
                                    value={formAnalise.classificacaoContabilId}
                                    onChange={(event) =>
                                        setFormAnalise((atual) => ({
                                            ...atual,
                                            classificacaoContabilId:
                                                event.target.value,
                                        }))
                                    }
                                >
                                    <option value="">
                                        Selecionar classificacao
                                    </option>
                                    {classificacoes.map((classificacao) => (
                                        <option
                                            key={classificacao.id}
                                            value={classificacao.id}
                                        >
                                            {classificacao.nome}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Tratamento fiscal
                                <select
                                    value={formAnalise.tratamentoFiscal}
                                    onChange={(event) =>
                                        setFormAnalise((atual) => ({
                                            ...atual,
                                            tratamentoFiscal:
                                                event.target.value,
                                        }))
                                    }
                                >
                                    {TRATAMENTOS.map((tratamento) => (
                                        <option key={tratamento}>
                                            {tratamento}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Status
                                <select
                                    value={formAnalise.status}
                                    onChange={(event) =>
                                        setFormAnalise((atual) => ({
                                            ...atual,
                                            status: event.target.value,
                                        }))
                                    }
                                >
                                    {STATUS_ANALISE.map((status) => (
                                        <option key={status}>{status}</option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Valor considerado
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formAnalise.valorConsiderado}
                                    onChange={(event) =>
                                        setFormAnalise((atual) => ({
                                            ...atual,
                                            valorConsiderado:
                                                event.target.value,
                                        }))
                                    }
                                />
                            </label>
                            <label className="contador-form-largo">
                                Observacao do contador
                                <textarea
                                    value={formAnalise.observacao}
                                    onChange={(event) =>
                                        setFormAnalise((atual) => ({
                                            ...atual,
                                            observacao: event.target.value,
                                        }))
                                    }
                                    placeholder="Justifique classificacao, exclusao ou valor parcial."
                                />
                            </label>
                            <button type="submit" disabled={salvando}>
                                {salvando ? 'Salvando...' : 'Salvar analise'}
                            </button>
                        </form>
                    </section>
                )}

                {aba === 'DOCUMENTOS' && (
                    <section className="contador-carteira-duas-colunas">
                        <article className="contador-carteira-card">
                            <div className="contador-carteira-card-topo">
                                <div>
                                    <small>Inbox fiscal</small>
                                    <h2>Documentos sem movimentacao</h2>
                                </div>
                                <span>{documentosSemMovimentacao.length}</span>
                            </div>
                            {documentosSemMovimentacao.length === 0 ? (
                                <p>Nenhum documento solto no inbox fiscal.</p>
                            ) : (
                                <div className="contador-carteira-lista">
                                    {documentosSemMovimentacao.map(
                                        (documento) => (
                                            <div key={documento.id}>
                                                <strong>
                                                    {documento.nomeArquivo}
                                                </strong>
                                                <span>
                                                    {documento.tipoDocumento} -{' '}
                                                    {documento.status}
                                                </span>
                                                <small>
                                                    Enviado em{' '}
                                                    {formatarDataHora(
                                                        documento.criadoEm,
                                                    )}
                                                </small>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        baixarDocumento(
                                                            documento,
                                                        )
                                                    }
                                                >
                                                    Visualizar documento
                                                </button>
                                                <div className="contador-vinculo-documento">
                                                    <select
                                                        value={
                                                            vinculosDocumento[
                                                                documento.id
                                                            ] ?? ''
                                                        }
                                                        onChange={(event) =>
                                                            setVinculosDocumento(
                                                                (atuais) => ({
                                                                    ...atuais,
                                                                    [documento.id]:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                    >
                                                        <option value="">
                                                            Vincular a movimentacao
                                                        </option>
                                                        {movimentacoes.map(
                                                            (movimentacao) => (
                                                                <option
                                                                    key={
                                                                        movimentacao.id
                                                                    }
                                                                    value={
                                                                        movimentacao.id
                                                                    }
                                                                >
                                                                    {formatarData(
                                                                        movimentacao.data,
                                                                    )}{' '}
                                                                    -{' '}
                                                                    {
                                                                        movimentacao.descricao
                                                                    }{' '}
                                                                    -{' '}
                                                                    {formatarDinheiro(
                                                                        movimentacao.valor,
                                                                    )}
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            vincularDocumento(
                                                                documento,
                                                            )
                                                        }
                                                        disabled={salvando}
                                                    >
                                                        Vincular
                                                    </button>
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            )}
                        </article>

                        <article className="contador-carteira-card">
                            <div className="contador-carteira-card-topo">
                                <div>
                                    <small>Documentos</small>
                                    <h2>Todos os documentos do cliente</h2>
                                </div>
                                <span>{documentos.length}</span>
                            </div>
                            {documentos.length === 0 ? (
                                <p>Nenhum documento enviado.</p>
                            ) : (
                                <div className="contador-carteira-lista">
                                    {documentos.map((documento) => (
                                        <div key={documento.id}>
                                            <strong>
                                                {documento.nomeArquivo}
                                            </strong>
                                            <span>
                                                {documento.tipoDocumento} -{' '}
                                                {documento.status}
                                            </span>
                                            <small>
                                                Movimentacao:{' '}
                                                {documento.movimentacaoId ??
                                                    'sem vinculo'}
                                            </small>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    baixarDocumento(documento)
                                                }
                                            >
                                                Baixar documento
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </article>
                    </section>
                )}

                {aba === 'PENDENCIAS' && (
                    <section className="contador-carteira-card">
                        <div className="contador-carteira-card-topo">
                            <div>
                                <small>Pendencias fiscais</small>
                                <h2>Itens para resolver</h2>
                            </div>
                            <span>{pendencias.length}</span>
                        </div>
                        {pendencias.length === 0 ? (
                            <p>Nenhuma pendencia para este cliente.</p>
                        ) : (
                            <div className="contador-carteira-lista">
                                {pendencias.map((pendencia) => (
                                    <div key={pendencia.id}>
                                        <strong>{pendencia.titulo}</strong>
                                        <span>
                                            {pendencia.tipo} -{' '}
                                            {pendencia.prioridade} -{' '}
                                            {pendencia.status}
                                        </span>
                                        <p>{pendencia.descricao}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {aba === 'TRIBUTARIO' && (
                    <section className="contador-carteira-duas-colunas">
                        <article className="contador-carteira-card">
                            <div className="contador-carteira-card-topo">
                                <div>
                                    <small>Configuracao tributaria</small>
                                    <h2>Regime do cliente</h2>
                                </div>
                            </div>
                            <form
                                className="contador-form-grid"
                                onSubmit={salvarRegime}
                            >
                                <label>
                                    Regime
                                    <select
                                        value={formRegime.regime}
                                        onChange={(event) =>
                                            setFormRegime((atual) => ({
                                                ...atual,
                                                regime: event.target.value,
                                            }))
                                        }
                                    >
                                        {REGIMES.map((regime) => (
                                            <option key={regime}>
                                                {regime}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label>
                                    Inicio
                                    <input
                                        type="date"
                                        value={formRegime.dataInicio}
                                        onChange={(event) =>
                                            setFormRegime((atual) => ({
                                                ...atual,
                                                dataInicio:
                                                    event.target.value,
                                            }))
                                        }
                                    />
                                </label>
                                <label>
                                    Competencia
                                    <input
                                        value={formRegime.competencia}
                                        onChange={(event) =>
                                            setFormRegime((atual) => ({
                                                ...atual,
                                                competencia:
                                                    event.target.value,
                                            }))
                                        }
                                        placeholder="2026-10"
                                    />
                                </label>
                                <label className="contador-form-largo">
                                    Observacao
                                    <textarea
                                        value={formRegime.observacao}
                                        onChange={(event) =>
                                            setFormRegime((atual) => ({
                                                ...atual,
                                                observacao:
                                                    event.target.value,
                                            }))
                                        }
                                    />
                                </label>
                                <button type="submit" disabled={salvando}>
                                    Salvar configuracao
                                </button>
                            </form>
                            <div className="contador-carteira-lista">
                                {regimes.map((regime) => (
                                    <button
                                        type="button"
                                        key={regime.id}
                                        onClick={() => {
                                            setFormRegime((atual) => ({
                                                ...atual,
                                                regime: regime.regime,
                                                dataInicio:
                                                    regime.dataInicio ??
                                                    atual.dataInicio,
                                                competencia:
                                                    regime.competencia ||
                                                    atual.competencia,
                                                observacao:
                                                    regime.observacao || '',
                                            }))
                                            setFormParametro((atual) => ({
                                                ...atual,
                                                regime: regime.regime,
                                                competencia:
                                                    regime.competencia ||
                                                    atual.competencia,
                                                nome:
                                                    atual.nome ||
                                                    `Parametro ${regime.regime}`,
                                            }))
                                        }}
                                    >
                                        <strong>{regime.regime}</strong>
                                        <span>
                                            Inicio {formatarData(regime.dataInicio)} -{' '}
                                            {regime.situacao}
                                        </span>
                                        <p>{regime.observacao}</p>
                                    </button>
                                ))}
                            </div>
                        </article>

                        <article className="contador-carteira-card">
                            <div className="contador-carteira-card-topo">
                                <div>
                                    <small>Parametros</small>
                                    <h2>Motor de simulacao</h2>
                                </div>
                            </div>
                            <form
                                className="contador-form-grid"
                                onSubmit={salvarParametro}
                            >
                                <label>
                                    Regime
                                    <select
                                        value={formParametro.regime}
                                        onChange={(event) =>
                                            setFormParametro((atual) => ({
                                                ...atual,
                                                regime: event.target.value,
                                            }))
                                        }
                                    >
                                        {REGIMES.map((regime) => (
                                            <option key={regime}>
                                                {regime}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label>
                                    Competencia
                                    <input
                                        value={formParametro.competencia}
                                        onChange={(event) =>
                                            setFormParametro((atual) => ({
                                                ...atual,
                                                competencia:
                                                    event.target.value,
                                            }))
                                        }
                                        placeholder="2026-10"
                                    />
                                </label>
                                <label>
                                    Nome
                                    <input
                                        value={formParametro.nome}
                                        onChange={(event) =>
                                            setFormParametro((atual) => ({
                                                ...atual,
                                                nome: event.target.value,
                                            }))
                                        }
                                        placeholder="Ex.: parametro validado pelo contador"
                                    />
                                </label>
                                <label>
                                    Aliquota %
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={
                                            formParametro.aliquotaPercentual
                                        }
                                        onChange={(event) =>
                                            setFormParametro((atual) => ({
                                                ...atual,
                                                aliquotaPercentual:
                                                    event.target.value,
                                            }))
                                        }
                                    />
                                </label>
                                <label>
                                    Parcela a deduzir
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formParametro.parcelaDeduzir}
                                        onChange={(event) =>
                                            setFormParametro((atual) => ({
                                                ...atual,
                                                parcelaDeduzir:
                                                    event.target.value,
                                            }))
                                        }
                                    />
                                </label>
                                <label className="contador-form-largo">
                                    Observacao
                                    <textarea
                                        value={formParametro.observacao}
                                        onChange={(event) =>
                                            setFormParametro((atual) => ({
                                                ...atual,
                                                observacao:
                                                    event.target.value,
                                            }))
                                        }
                                    />
                                </label>
                                <button type="submit" disabled={salvando}>
                                    Salvar parametro
                                </button>
                            </form>
                            <div className="contador-carteira-lista">
                                <div className="contador-referencia-tributaria">
                                    <small>Referencias oficiais</small>
                                    <strong>{referenciaAtual.titulo}</strong>
                                    <p>{referenciaAtual.descricao}</p>
                                    <div>
                                        {referenciaAtual.links.map(
                                            ([texto, url]) => (
                                                <a
                                                    key={url}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    {texto}
                                                </a>
                                            ),
                                        )}
                                    </div>
                                    <small>
                                        O AgroGestao nao define aliquota
                                        automaticamente. O contador valida a
                                        fonte e salva os parametros versionados
                                        da competencia.
                                    </small>
                                </div>

                                {parametros.map((parametro) => (
                                    <div key={parametro.id}>
                                        <strong>
                                            {parametro.nome ??
                                                parametro.regime}
                                        </strong>
                                        <span>
                                            {parametro.regime} -{' '}
                                            {parametro.competencia}
                                        </span>
                                        <small>
                                            Aliquota:{' '}
                                            {parametro.aliquotaPercentual ??
                                                0}
                                            % - Deduzir:{' '}
                                            {formatarDinheiro(
                                                parametro.parcelaDeduzir,
                                            )}
                                        </small>
                                    </div>
                                ))}
                            </div>
                        </article>
                    </section>
                )}

                {aba === 'SIMULACOES' && (
                    <section className="contador-carteira-duas-colunas">
                        <article className="contador-carteira-card">
                            <div className="contador-carteira-card-topo">
                                <div>
                                    <small>Simulacao tributaria</small>
                                    <h2>Calculo executavel</h2>
                                </div>
                            </div>
                            <div className="contador-memoria">
                                <span>
                                    Regime
                                    <strong>
                                        {simulacao?.regime ??
                                            'Nao configurado'}
                                    </strong>
                                </span>
                                <span>
                                    Receita considerada
                                    <strong>
                                        {formatarDinheiro(
                                            simulacao?.receitaConsiderada,
                                        )}
                                    </strong>
                                </span>
                                <span>
                                    Despesas consideradas
                                    <strong>
                                        {formatarDinheiro(
                                            simulacao?.despesasConsideradas,
                                        )}
                                    </strong>
                                </span>
                                <span>
                                    Base estimada
                                    <strong>
                                        {formatarDinheiro(
                                            simulacao?.baseEstimada,
                                        )}
                                    </strong>
                                </span>
                                <span>
                                    Tributo estimado
                                    <strong>
                                        {formatarDinheiro(
                                            simulacao?.tributoEstimado,
                                        )}
                                    </strong>
                                </span>
                                <span>
                                    Carga efetiva
                                    <strong>
                                        {simulacao?.cargaEfetivaPercentual ??
                                            0}
                                        %
                                    </strong>
                                </span>
                            </div>
                            <p>{simulacao?.premissas}</p>
                            <small>{simulacao?.aviso}</small>
                            <div className="contador-toolbar">
                                <button
                                    type="button"
                                    onClick={recalcularSimulacao}
                                    disabled={salvando}
                                >
                                    Calcular simulacao
                                </button>
                                <button
                                    type="button"
                                    onClick={salvarCenario}
                                >
                                    Salvar cenario
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAba('TRIBUTARIO')}
                                >
                                    Editar premissas
                                </button>
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                >
                                    Exportar PDF
                                </button>
                            </div>
                        </article>

                        <article className="contador-carteira-card">
                            <div className="contador-carteira-card-topo">
                                <div>
                                    <small>Cenarios</small>
                                    <h2>Comparacao salva</h2>
                                </div>
                                <span>{cenarios.length}</span>
                            </div>
                            {cenarios.length === 0 ? (
                                <p>Nenhum cenario salvo nesta sessao.</p>
                            ) : (
                                <div className="contador-carteira-lista">
                                    {cenarios.map((cenario) => (
                                        <div key={cenario.id}>
                                            <strong>{cenario.nome}</strong>
                                            <span>
                                                {cenario.regime} - Base{' '}
                                                {formatarDinheiro(
                                                    cenario.baseEstimada,
                                                )}
                                            </span>
                                            <small>
                                                Tributo:{' '}
                                                {formatarDinheiro(
                                                    cenario.tributoEstimado,
                                                )}{' '}
                                                -{' '}
                                                {formatarDataHora(
                                                    cenario.criadoEm,
                                                )}
                                            </small>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </article>
                    </section>
                )}

                {aba === 'RELATORIOS' && (
                    <section className="contador-carteira-card">
                        <div className="contador-carteira-card-topo">
                            <div>
                                <small>Relatorios</small>
                                <h2>Exportacoes e memoria</h2>
                            </div>
                        </div>
                        <div className="contador-relatorios">
                            <button type="button" onClick={exportarRelatorioCsv}>
                                Movimentacoes classificadas CSV
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    abrirLista('SEM_CLASSIFICACAO')
                                }}
                            >
                                Movimentacoes sem classificacao
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    abrirLista('SEM_DOCUMENTO')
                                }}
                            >
                                Despesas sem documento
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setAba('SIMULACOES')
                                    window.setTimeout(() => window.print(), 50)
                                }}
                            >
                                Memoria de calculo PDF
                            </button>
                        </div>
                    </section>
                )}

                {carregando && (
                    <p className="contador-carteira-carregando">
                        Atualizando carteira...
                    </p>
                )}
            </div>
        </div>
    )
}

export default ContadorCarteira
