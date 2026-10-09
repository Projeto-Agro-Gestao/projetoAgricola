import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { useNavigate } from 'react-router'
import { API_BASE_URL as API_URL } from '../config.js'
import ModalAnimado from '../componentes/ModalAnimado.jsx'
import './ProdutorColaborativo.css'
import { apiFetch } from '../servicos/api.js'
import { obterSessao } from '../servicos/sessao.js'

async function mensagemErro(resposta, padrao) {
    const dados = await resposta.json().catch(() => null)
    return dados?.mensagem ?? padrao
}

async function jsonOpcional(resposta, padrao) {
    if (!resposta.ok) return padrao
    try {
        return await resposta.json()
    } catch {
        return padrao
    }
}

function formatarDinheiro(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(Number(valor ?? 0))
}

function formatarData(data) {
    if (!data) {
        return '-'
    }

    return new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'UTC',
    }).format(new Date(`${data}T00:00:00`))
}

function formatarDataHora(data) {
    if (!data) return 'Data não informada'

    const valor = new Date(data)
    const hoje = new Date()
    const ontem = new Date()
    ontem.setDate(hoje.getDate() - 1)

    const horario = new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(valor)

    if (valor.toDateString() === hoje.toDateString()) return `Hoje às ${horario}`
    if (valor.toDateString() === ontem.toDateString()) return `Ontem às ${horario}`

    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).format(valor)
}

function formatarTipoAtividade(tipo) {
    return {
        AGRICULTURA: 'Agricultura',
        PECUARIA: 'Pecuária',
        MISTA: 'Mista',
        OUTRA: 'Outra',
    }[tipo] ?? tipo
}

function formatarTipoPendencia(tipo) {
    return ({
        DOCUMENTO_AUSENTE: 'Documento ausente',
        DOCUMENTO_SOLICITADO: 'Documento solicitado',
        SEM_CLASSIFICACAO: 'Classificar lançamento bancário',
        INFORMACAO_INCOMPLETA: 'Informação incompleta',
        ALERTA_TRIBUTARIO: 'Atenção tributária',
        OUTRA: 'Solicitação do contador',
    })[tipo] ?? 'Pendência'
}

function prazoPendencia(data) {
    if (!data) return null
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const vencimento = new Date(`${data}T00:00:00`)
    return Math.ceil((vencimento - hoje) / 86400000)
}

function categoriaPendencia(pendencia) {
    if (['DOCUMENTO_AUSENTE', 'DOCUMENTO_SOLICITADO'].includes(pendencia.tipo)) {
        return 'DOCUMENTOS'
    }
    if (pendencia.tipo === 'SEM_CLASSIFICACAO') {
        return 'CLASSIFICACAO'
    }
    if (/comprovante|ted|pix/i.test(`${pendencia.tipo} ${pendencia.titulo} ${pendencia.descricao}`)) {
        return 'COMPROVANTES'
    }
    return 'OUTRAS'
}

function ProdutorColaborativo() {
    const navigate = useNavigate()
    const [sessao] = useState(obterSessao)
    const [dashboard, setDashboard] = useState(null)
    const [pendencias, setPendencias] = useState([])
    const [documentos, setDocumentos] = useState([])
    const [propriedades, setPropriedades] = useState([])
    const [atividades, setAtividades] = useState([])
    const [movimentacoes, setMovimentacoes] = useState([])
    const [mensagem, setMensagem] = useState('')
    const [erro, setErro] = useState('')
    const [carregando, setCarregando] = useState(
        Boolean(sessao?.usuario?.empresaId),
    )
    const [arquivo, setArquivo] = useState(null)
    const [documentoTipo, setDocumentoTipo] = useState('OUTRO')
    const [documentoMovimentacaoId, setDocumentoMovimentacaoId] =
        useState('')
    const [documentoObservacao, setDocumentoObservacao] = useState('')
    const [novaPropriedade, setNovaPropriedade] = useState('')
    const [novaAtividade, setNovaAtividade] = useState('')
    const [tipoAtividade, setTipoAtividade] = useState('AGRICULTURA')
    const [modalPendenciasAberto, setModalPendenciasAberto] = useState(false)
    const [telaModalPendencias, setTelaModalPendencias] = useState('lista')
    const [pendenciaSelecionadaParaAnexo, setPendenciaSelecionadaParaAnexo] = useState(null)
    const [arquivoAnexoPendencia, setArquivoAnexoPendencia] = useState(null)
    const [tipoAnexoPendencia, setTipoAnexoPendencia] = useState('RECIBO')
    const [observacaoAnexoPendencia, setObservacaoAnexoPendencia] = useState('')
    const [filtroPendenciasModal, setFiltroPendenciasModal] = useState('TODAS')
    const [pendenciaEmAcaoId, setPendenciaEmAcaoId] = useState(null)
    const formularioDocumentoRef = useRef(null)
    const arquivoRef = useRef(null)
    const arquivosPendenciasRef = useRef(null)
    const arquivoAnexoPendenciaRef = useRef(null)
    const [enviandoArquivosPendencias, setEnviandoArquivosPendencias] = useState(false)
    const [enviandoAnexoPendencia, setEnviandoAnexoPendencia] = useState(false)
    const carregamentoIdRef = useRef(0)

    const fecharModalPendencias = useCallback(() => {
        setModalPendenciasAberto(false)
    }, [])

    const empresaId = sessao?.usuario?.empresaId

    const baseUrl = useMemo(
        () => `${API_URL}/colaboracao/empresas/${empresaId}`,
        [empresaId],
    )

    useEffect(() => {
        if (!sessao) {
            navigate('/login', {
                replace: true,
            })
        }
    }, [navigate, sessao])

    const buscarDados = useCallback(async () => {
        if (!sessao || !empresaId) {
            return null
        }

        const [
            respostaDashboard,
            respostaPendencias,
            respostaDocumentos,
            respostaPropriedades,
            respostaAtividades,
            respostaMovimentacoes,
        ] = await Promise.all([
            apiFetch(`${baseUrl}/produtor/dashboard`),
            apiFetch(`${baseUrl}/pendencias`),
            apiFetch(`${baseUrl}/documentos`),
            apiFetch(`${baseUrl}/propriedades`),
            apiFetch(`${baseUrl}/atividades`),
            apiFetch(`${API_URL}/empresas/${empresaId}/movimentacoes?size=50`),
        ])

        if (!respostaDashboard.ok) {
            throw new Error(
                await mensagemErro(
                    respostaDashboard,
                    'Nao foi possivel carregar o painel.',
                ),
            )
        }

        const [
            dashboard,
            pendencias,
            documentos,
            propriedades,
            atividades,
            movimentacoes,
        ] = await Promise.all([
            respostaDashboard.json(),
            jsonOpcional(respostaPendencias, []),
            jsonOpcional(respostaDocumentos, []),
            jsonOpcional(respostaPropriedades, []),
            jsonOpcional(respostaAtividades, []),
            jsonOpcional(respostaMovimentacoes, { content: [] }),
        ])

        return {
            dashboard,
            pendencias,
            documentos,
            propriedades,
            atividades,
            movimentacoes: movimentacoes.content ?? [],
        }
    }, [baseUrl, empresaId, sessao])

    const aplicarDados = useCallback((dados) => {
        if (!dados) return
        setErro('')
        setDashboard(dados.dashboard)
        setPendencias(dados.pendencias)
        setDocumentos(dados.documentos)
        setPropriedades(dados.propriedades)
        setAtividades(dados.atividades)
        setMovimentacoes(dados.movimentacoes)
    }, [])

    async function atualizarDados() {
        if (!sessao || !empresaId) return
        const carregamentoId = ++carregamentoIdRef.current
        setCarregando(true)
        setErro('')

        try {
            const dados = await buscarDados()
            if (carregamentoId === carregamentoIdRef.current) {
                aplicarDados(dados)
            }
        } catch (error) {
            if (carregamentoId === carregamentoIdRef.current) {
                setErro(error.message)
            }
        } finally {
            if (carregamentoId === carregamentoIdRef.current) {
                setCarregando(false)
            }
        }
    }

    useEffect(() => {
        let ativo = true
        const carregamentoId = ++carregamentoIdRef.current

        async function carregarInicial() {
            try {
                const dados = await buscarDados()
                if (ativo && carregamentoId === carregamentoIdRef.current) {
                    aplicarDados(dados)
                }
            } catch (error) {
                if (ativo && carregamentoId === carregamentoIdRef.current) {
                    setErro(error.message)
                }
            } finally {
                if (ativo && carregamentoId === carregamentoIdRef.current) {
                    setCarregando(false)
                }
            }
        }

        carregarInicial()
        return () => {
            ativo = false
            if (carregamentoId === carregamentoIdRef.current) {
                carregamentoIdRef.current += 1
            }
        }
    }, [aplicarDados, buscarDados])

    async function criarPropriedade(evento) {
        evento.preventDefault()

        if (!novaPropriedade.trim()) {
            setErro('Informe o nome da propriedade.')
            return
        }

        setMensagem('')
        setErro('')

        const resposta = await apiFetch(`${baseUrl}/propriedades`, {
            method: 'POST',
            body: {
                nome: novaPropriedade.trim(),
            },
        })

        if (!resposta.ok) {
            setErro(
                await mensagemErro(
                    resposta,
                    'Nao foi possivel salvar a propriedade.',
                ),
            )
            return
        }

        setNovaPropriedade('')
        setMensagem('Propriedade cadastrada.')
        atualizarDados()
    }

    async function criarAtividade(evento) {
        evento.preventDefault()

        if (!novaAtividade.trim()) {
            setErro('Informe o nome da atividade.')
            return
        }

        setMensagem('')
        setErro('')

        const resposta = await apiFetch(`${baseUrl}/atividades`, {
            method: 'POST',
            body: {
                nome: novaAtividade.trim(),
                tipo: tipoAtividade,
            },
        })

        if (!resposta.ok) {
            setErro(
                await mensagemErro(
                    resposta,
                    'Nao foi possivel salvar a atividade.',
                ),
            )
            return
        }

        setNovaAtividade('')
        setMensagem('Atividade cadastrada.')
        atualizarDados()
    }

    async function enviarDocumento(evento) {
        evento.preventDefault()

        if (!arquivo) {
            setErro('Selecione um documento para enviar.')
            return
        }

        setMensagem('')
        setErro('')

        const dados = new FormData()
        dados.append('arquivo', arquivo)
        dados.append('tipo', documentoTipo)

        if (documentoObservacao.trim()) {
            dados.append('observacao', documentoObservacao.trim())
        }

        if (documentoMovimentacaoId) {
            dados.append('movimentacaoId', documentoMovimentacaoId)
        }

        const resposta = await apiFetch(`${baseUrl}/documentos`, {
            method: 'POST',
            body: dados,
        })

        if (!resposta.ok) {
            setErro(
                await mensagemErro(
                    resposta,
                    'Nao foi possivel enviar o documento.',
                ),
            )
            return
        }

        setArquivo(null)
        setDocumentoMovimentacaoId('')
        setDocumentoObservacao('')
        if (arquivoRef.current) arquivoRef.current.value = ''
        setMensagem(
            documentoMovimentacaoId
                ? 'Documento vinculado a movimentacao e enviado para analise.'
                : 'Documento enviado para analise.',
        )
        atualizarDados()
    }

    function selecionarArquivo(arquivoSelecionado) {
        if (!arquivoSelecionado) return
        if (arquivoSelecionado.size > 25 * 1024 * 1024) {
            setErro('O arquivo precisa ter até 25 MB.')
            return
        }

        setErro('')
        setArquivo(arquivoSelecionado)
    }

    function iniciarAnexoPendencia(pendencia) {
        const contexto = `${pendencia.titulo ?? ''} ${pendencia.descricao ?? ''}`
        setPendenciaSelecionadaParaAnexo(pendencia)
        setTipoAnexoPendencia(/recibo/i.test(contexto)
            ? 'RECIBO'
            : /nota|nf-e|nfe/i.test(contexto) ? 'NOTA_FISCAL' : 'OUTRO')
        setArquivoAnexoPendencia(null)
        setObservacaoAnexoPendencia('')
        if (arquivoAnexoPendenciaRef.current) {
            arquivoAnexoPendenciaRef.current.value = ''
        }
        setErro('')
        setTelaModalPendencias('anexo')
        setModalPendenciasAberto(true)
    }

    function selecionarAnexoPendencia(arquivoSelecionado) {
        if (!arquivoSelecionado) return
        if (arquivoSelecionado.size > 25 * 1024 * 1024) {
            setErro('O arquivo precisa ter até 25 MB.')
            return
        }
        setErro('')
        setArquivoAnexoPendencia(arquivoSelecionado)
    }

    async function enviarAnexoPendencia(evento) {
        evento.preventDefault()
        if (!arquivoAnexoPendencia || !pendenciaSelecionadaParaAnexo) return

        setEnviandoAnexoPendencia(true)
        setErro('')
        setMensagem('')
        const dados = new FormData()
        dados.append('arquivo', arquivoAnexoPendencia)
        dados.append('tipo', tipoAnexoPendencia)
        if (observacaoAnexoPendencia.trim()) {
            dados.append('observacao', observacaoAnexoPendencia.trim())
        }
        if (pendenciaSelecionadaParaAnexo.movimentacaoId) {
            dados.append('movimentacaoId', pendenciaSelecionadaParaAnexo.movimentacaoId)
        }

        try {
            const resposta = await apiFetch(`${baseUrl}/documentos`, {
                method: 'POST',
                body: dados,
            })
            if (!resposta.ok) {
                throw new Error(await mensagemErro(resposta, 'Não foi possível enviar o documento.'))
            }
            setMensagem('Documento enviado ao contador.')
            setTelaModalPendencias('lista')
            setPendenciaSelecionadaParaAnexo(null)
            setArquivoAnexoPendencia(null)
            await atualizarDados()
        } catch (error) {
            setErro(error.message)
        } finally {
            setEnviandoAnexoPendencia(false)
        }
    }

    async function enviarArquivosDasPendencias(evento) {
        const arquivosSelecionados = Array.from(evento.target.files ?? [])
        evento.target.value = ''
        if (arquivosSelecionados.length === 0) return

        const arquivoInvalido = arquivosSelecionados.find(
            (item) => item.size > 25 * 1024 * 1024,
        )
        if (arquivoInvalido) {
            setErro(`O arquivo ${arquivoInvalido.name} excede o limite de 25 MB.`)
            return
        }

        setEnviandoArquivosPendencias(true)
        setErro('')
        setMensagem('')
        let enviados = 0

        try {
            for (const arquivoSelecionado of arquivosSelecionados) {
                const dados = new FormData()
                dados.append('arquivo', arquivoSelecionado)
                dados.append('tipo', 'OUTRO')
                const resposta = await apiFetch(`${baseUrl}/documentos`, {
                    method: 'POST',
                    body: dados,
                })
                if (!resposta.ok) {
                    throw new Error(await mensagemErro(resposta, 'Não foi possível enviar os arquivos.'))
                }
                enviados += 1
            }
            setMensagem(`${enviados} arquivo${enviados === 1 ? '' : 's'} enviado${enviados === 1 ? '' : 's'} ao inbox do contador.`)
            await atualizarDados()
            fecharModalPendencias()
        } catch (error) {
            setErro(enviados > 0
                ? `${enviados} arquivo${enviados === 1 ? '' : 's'} enviado${enviados === 1 ? '' : 's'}. ${error.message}`
                : error.message)
        } finally {
            setEnviandoArquivosPendencias(false)
        }
    }

    async function resolverPendencia(pendencia) {
        setPendenciaEmAcaoId(pendencia.id)
        setErro('')

        try {
            const resposta = await apiFetch(
                `${baseUrl}/pendencias/${pendencia.id}/resolver`,
                { method: 'POST' },
            )
            if (!resposta.ok) {
                throw new Error(
                    await mensagemErro(resposta, 'Não foi possível resolver a pendência.'),
                )
            }
            setMensagem('Pendência resolvida.')
            await atualizarDados()
        } catch (error) {
            setErro(error.message)
        } finally {
            setPendenciaEmAcaoId(null)
        }
    }

    async function baixarDocumento(documento) {
        setMensagem('')
        setErro('')

        try {
            const resposta = await apiFetch(
                `${baseUrl}/documentos/${documento.id}/download`,
            )

            if (!resposta.ok) {
                throw new Error(
                    await mensagemErro(
                        resposta,
                        'Nao foi possivel baixar o documento.',
                    ),
                )
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
            setMensagem('Documento baixado.')
        } catch (error) {
            setErro(error.message)
        }
    }

    if (!sessao) {
        return null
    }

    const pendenciasAtivas = pendencias.filter(
        (item) => !['RESOLVIDA', 'CANCELADA'].includes(item.status),
    )
    const pendenciasVisiveis = pendenciasAtivas.slice(0, 3)
    const pendenciasUrgentes = pendenciasAtivas.filter(
        (item) => item.prioridade === 'URGENTE',
    ).length
    const filtrosPendencias = [
        { id: 'TODAS', label: 'Todas', contar: () => pendenciasAtivas.length },
        { id: 'DOCUMENTOS', label: 'Documentos ausentes', contar: () => pendenciasAtivas.filter((item) => categoriaPendencia(item) === 'DOCUMENTOS').length },
        { id: 'CLASSIFICACAO', label: 'Classificar lançamento', contar: () => pendenciasAtivas.filter((item) => categoriaPendencia(item) === 'CLASSIFICACAO').length },
        { id: 'COMPROVANTES', label: 'Comprovantes TED/Pix', contar: () => pendenciasAtivas.filter((item) => categoriaPendencia(item) === 'COMPROVANTES').length },
    ]
    const pendenciasFiltradasModal = pendenciasAtivas
        .filter((item) => filtroPendenciasModal === 'TODAS' || categoriaPendencia(item) === filtroPendenciasModal)
        .sort((a, b) => {
            const prioridade = { URGENTE: 0, ALTA: 1 }
            const diferencaPrioridade = (prioridade[a.prioridade] ?? 2) - (prioridade[b.prioridade] ?? 2)
            if (diferencaPrioridade !== 0) return diferencaPrioridade
            return (prazoPendencia(a.vencimento) ?? Infinity) - (prazoPendencia(b.vencimento) ?? Infinity)
        })
    const documentosRecentes = [...documentos]
        .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
        .slice(0, 2)

    const painelPendencias = (
        <article className="produtor-colaborativo-card">
            <div className="produtor-colaborativo-card-topo">
                <div>
                    <small>Atenção necessária</small>
                    <h2>O que o contador precisa</h2>
                </div>
                {pendenciasUrgentes > 0 && (
                    <span className="produtor-colaborativo-urgentes">{pendenciasUrgentes} urgentes</span>
                )}
            </div>
            {pendenciasAtivas.length === 0 ? (
                <p className="produtor-colaborativo-vazio">Nenhuma pendência aberta.</p>
            ) : (
                <div className="produtor-colaborativo-lista">
                    {pendenciasVisiveis.map((pendencia) => {
                        const prazo = prazoPendencia(pendencia.vencimento)
                        const exigeDocumento = ['DOCUMENTO_AUSENTE', 'DOCUMENTO_SOLICITADO'].includes(pendencia.tipo)
                        const exigeClassificacao = pendencia.tipo === 'SEM_CLASSIFICACAO'

                        return (
                            <div className="produtor-colaborativo-pendencia" key={pendencia.id}>
                                <div className="produtor-colaborativo-pendencia-topo">
                                    <strong>{formatarTipoPendencia(pendencia.tipo)}</strong>
                                    <span className={`produtor-colaborativo-status produtor-status-${pendencia.prioridade?.toLowerCase() ?? 'normal'}`}>
                                        {pendencia.prioridade === 'URGENTE' ? 'Urgente' : pendencia.prioridade === 'ALTA' ? 'Alta' : 'Aberta'}
                                    </span>
                                    {pendencia.tipo.includes('DOCUMENTO') && <span className="produtor-colaborativo-tipo-doc">Documento</span>}
                                </div>
                                <p>{pendencia.descricao || pendencia.titulo}</p>
                                <div className="produtor-colaborativo-pendencia-rodape">
                                    {prazo !== null && (
                                        <small className={prazo <= 2 ? 'produtor-prazo-urgente' : ''}>
                                            {prazo < 0 ? `Venceu há ${Math.abs(prazo)} dias` : prazo === 0 ? 'Vence hoje' : `Vence em ${prazo} dias`}
                                        </small>
                                    )}
                                    <button
                                        disabled={pendenciaEmAcaoId === pendencia.id}
                                        onClick={() => exigeDocumento
                                            ? iniciarAnexoPendencia(pendencia)
                                            : exigeClassificacao
                                                ? navigate('/dashboard/movimentacoes')
                                                : resolverPendencia(pendencia)}
                                        type="button"
                                    >
                                        {pendenciaEmAcaoId === pendencia.id
                                            ? 'Salvando...'
                                            : exigeDocumento
                                                ? 'Anexar nota'
                                                : exigeClassificacao
                                                    ? 'Classificar'
                                                    : 'Resolver'}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                    {pendenciasAtivas.length > 3 && (
                        <button
                            className="produtor-colaborativo-ver-mais"
                            onClick={() => {
                                setTelaModalPendencias('lista')
                                setModalPendenciasAberto(true)
                            }}
                            type="button"
                        >
                            Ver mais pendências ({pendenciasAtivas.length - 3} restantes)
                            <span aria-hidden="true" className="material-symbols-outlined">expand_more</span>
                        </button>
                    )}
                </div>
            )}
        </article>
    )

    const painelDocumentos = (
        <article className="produtor-colaborativo-card">
            <div className="produtor-colaborativo-card-topo">
                <div>
                    <small>Inbox e rastreabilidade</small>
                    <h2>Documentos enviados</h2>
                </div>
                <span className="produtor-colaborativo-historico">Histórico recente</span>
            </div>
            {documentosRecentes.length === 0 ? (
                <p className="produtor-colaborativo-vazio">Nenhum documento enviado.</p>
            ) : (
                <div className="produtor-colaborativo-lista">
                    {documentosRecentes.map((documento) => (
                        <button
                            className="produtor-colaborativo-documento"
                            key={documento.id}
                            onClick={() => baixarDocumento(documento)}
                            type="button"
                        >
                            <span aria-hidden="true" className={`produtor-colaborativo-documento-icone produtor-doc-${documento.status?.toLowerCase()}`}>
                                <span className="material-symbols-outlined">
                                    {documento.status === 'ANALISADO' ? 'task_alt' : documento.status === 'REJEITADO' ? 'error' : 'schedule'}
                                </span>
                            </span>
                            <span className="produtor-colaborativo-documento-info">
                                <strong>{documento.nomeArquivo}</strong>
                                <small>{formatarDataHora(documento.criadoEm)} · {documento.tipoDocumento?.replaceAll('_', ' ')}</small>
                            </span>
                            <span className={`produtor-colaborativo-documento-status produtor-doc-status-${documento.status?.toLowerCase()}`}>
                                {({
                                    ENVIADO: 'Enviado ao contador',
                                    VINCULADO: 'Vinculado à movimentação',
                                    AGUARDANDO_ANALISE: 'Em análise contador',
                                    ANALISADO: 'Analisado pelo contador',
                                    REJEITADO: 'Precisa de correção',
                                    ARQUIVADO: 'Arquivado',
                                })[documento.status] ?? 'Recebido'}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </article>
    )

    return (
        <div className="produtor-colaborativo-pagina">
            <div className="produtor-colaborativo-conteudo">
                <header className="produtor-colaborativo-cabecalho">
                    <div className="produtor-colaborativo-identificador">
                        <span>AgroGestão colaborativo</span>
                        <i aria-hidden="true">•</i>
                        <span>Canal integrado com contabilidade</span>
                    </div>
                    <h1>Início do produtor</h1>
                    <p>
                        Lançamentos simples, documentos e pendências em um único lugar para facilitar a conversa com o contador.
                    </p>
                </header>

                {(mensagem || erro) && (
                    <div
                        role={erro ? 'alert' : 'status'}
                        className={
                            erro
                                ? 'produtor-colaborativo-alerta erro'
                                : 'produtor-colaborativo-alerta'
                        }
                    >
                        {erro || mensagem}
                    </div>
                )}

                <section className="produtor-colaborativo-indicadores">
                    <article className="produtor-indicador-receitas">
                        <div className="produtor-indicador-topo">
                            <small>Receitas do mês</small>
                            <span aria-hidden="true" className="material-symbols-outlined">trending_up</span>
                        </div>
                        <strong>{formatarDinheiro(dashboard?.receitasMes)}</strong>
                        <span className="produtor-indicador-nota">
                            <b>Mês atual</b> · entradas registradas
                        </span>
                    </article>
                    <article className="produtor-indicador-despesas">
                        <div className="produtor-indicador-topo">
                            <small>Despesas do mês</small>
                            <span aria-hidden="true" className="material-symbols-outlined">trending_down</span>
                        </div>
                        <strong>{formatarDinheiro(dashboard?.despesasMes)}</strong>
                        <span className="produtor-indicador-nota">
                            <b>Safra em curso</b> · saídas registradas
                        </span>
                    </article>
                    <article className="produtor-indicador-resultado">
                        <div className="produtor-indicador-topo">
                            <small>Resultado operacional</small>
                            <span aria-hidden="true" className="material-symbols-outlined">paid</span>
                        </div>
                        <strong>{formatarDinheiro(dashboard?.resultadoMes)}</strong>
                        <span className="produtor-indicador-nota">
                            Saldo entre receitas e despesas
                        </span>
                    </article>
                    <article className="produtor-indicador-pendencias">
                        <div className="produtor-indicador-topo">
                            <small>Pendências do contador</small>
                            <span aria-hidden="true">
                                <span className="material-symbols-outlined">priority_high</span>
                            </span>
                        </div>
                        <strong>{dashboard?.pendenciasAbertas ?? pendenciasAtivas.length} itens</strong>
                        <span className="produtor-indicador-nota">
                            Aguardando comprovantes ou notas
                        </span>
                    </article>
                </section>

                <section className="produtor-colaborativo-atalhos">
                    <div className="produtor-colaborativo-atalhos-principais">
                        <button onClick={() => navigate('/dashboard/movimentacoes/nova')} type="button">
                            <span aria-hidden="true" className="material-symbols-outlined">add</span>
                            Lançar receita ou despesa
                        </button>
                        <button onClick={() => navigate('/dashboard/financeiro')} type="button">
                            <span aria-hidden="true" className="material-symbols-outlined">monitoring</span>
                            Ver financeiro
                        </button>
                        <button onClick={() => navigate('/dashboard/contas')} type="button">
                            <span aria-hidden="true" className="material-symbols-outlined">calendar_month</span>
                            Ver contas futuras
                        </button>
                    </div>
                    <button className="produtor-colaborativo-atalho-plano" onClick={() => navigate('/dashboard/plano')} type="button">
                        <span aria-hidden="true" className="material-symbols-outlined">credit_card</span>
                        Plano e pagamentos
                    </button>
                </section>

                <div className="produtor-colaborativo-grade">
                    <div className="produtor-colaborativo-coluna">
                    <section className="produtor-colaborativo-card produtor-colaborativo-card-documento" ref={formularioDocumentoRef}>
                        <div className="produtor-colaborativo-card-topo">
                            <div>
                                <small>Documentos e comprovantes</small>
                                <h2>Enviar ao contador</h2>
                            </div>
                        </div>

                        <form
                            className="produtor-colaborativo-form"
                            onSubmit={enviarDocumento}
                        >
                            <label>
                                <span className="produtor-colaborativo-label-titulo">
                                    Tipo do documento <b>*</b>
                                </span>
                                <select
                                    value={documentoTipo}
                                    onChange={(evento) =>
                                        setDocumentoTipo(evento.target.value)
                                    }
                                >
                                    <option value="NOTA_FISCAL">Nota fiscal</option>
                                    <option value="XML">XML</option>
                                    <option value="COMPROVANTE">Comprovante</option>
                                    <option value="RECIBO">Recibo</option>
                                    <option value="CONTRATO">Contrato</option>
                                    <option value="OUTRO">Outro documento</option>
                                </select>
                            </label>

                            <label>
                                <span className="produtor-colaborativo-label-titulo">
                                    Arquivo ou foto do comprovante <b>*</b>
                                </span>
                                <span
                                    className="produtor-colaborativo-upload"
                                    onDragOver={(evento) => evento.preventDefault()}
                                    onDrop={(evento) => {
                                        evento.preventDefault()
                                        selecionarArquivo(evento.dataTransfer.files?.[0])
                                    }}
                                >
                                    <input
                                        accept=".pdf,.jpeg,.jpg,.png,.xml"
                                        aria-label="Selecionar arquivo ou foto do comprovante"
                                        onChange={(evento) => selecionarArquivo(evento.target.files?.[0])}
                                        ref={arquivoRef}
                                        type="file"
                                    />
                                    <span aria-hidden="true" className="material-symbols-outlined">cloud_upload</span>
                                    <strong>{arquivo ? arquivo.name : 'Clique para selecionar ou arraste o arquivo aqui'}</strong>
                                    <small>Formatos aceitos: PDF, JPEG, PNG, XML até 25 MB</small>
                                </span>
                            </label>

                            <label>
                                Vincular a uma movimentação
                                <select
                                    value={documentoMovimentacaoId}
                                    onChange={(evento) =>
                                        setDocumentoMovimentacaoId(
                                            evento.target.value,
                                        )
                                    }
                                >
                                    <option value="">
                                        Deixar no inbox do contador (Classificação automática)
                                    </option>

                                    {movimentacoes.map((movimentacao) => (
                                        <option
                                            key={movimentacao.id}
                                            value={movimentacao.id}
                                        >
                                            {formatarData(
                                                movimentacao.dataMovimentacao,
                                            )}{' '}
                                            - {movimentacao.descricao} -{' '}
                                            {formatarDinheiro(
                                                movimentacao.valor,
                                            )}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                Observação para o contador
                                <textarea
                                    value={documentoObservacao}
                                    onChange={(evento) =>
                                        setDocumentoObservacao(
                                            evento.target.value,
                                        )
                                    }
                                    placeholder="Ex.: Nota fiscal referente à compra de sementes desta safra..."
                                />
                            </label>

                            <button className="produtor-colaborativo-enviar" type="submit">
                                Enviar documento ao contador
                                <span aria-hidden="true" className="material-symbols-outlined">send</span>
                            </button>
                            <small className="produtor-colaborativo-obrigatorio">* Campo obrigatório para conformidade fiscal</small>
                        </form>
                    </section>

                    {painelPendencias}
                    </div>
                    <div className="produtor-colaborativo-coluna">
                    <section className="produtor-colaborativo-card">
                        <div className="produtor-colaborativo-card-topo">
                            <div>
                                <small>Organização da safra</small>
                                <h2>Propriedades e atividades</h2>
                            </div>
                        </div>

                        <div className="produtor-colaborativo-campo-inline">
                            <label htmlFor="produtor-nova-propriedade">Cadastrar nova propriedade</label>
                        <form
                            className="produtor-colaborativo-inline produtor-form-propriedade"
                            onSubmit={criarPropriedade}
                        >
                            <input
                                id="produtor-nova-propriedade"
                                value={novaPropriedade}
                                onChange={(evento) =>
                                    setNovaPropriedade(evento.target.value)
                                }
                                placeholder="Nome da fazenda ou sítio..."
                                required
                            />
                            <button type="submit">Salvar</button>
                        </form>
                        </div>

                        <div className="produtor-colaborativo-campo-inline">
                            <label htmlFor="produtor-nova-atividade">Cadastrar nova atividade / cultura</label>
                        <form
                            className="produtor-colaborativo-inline produtor-form-atividade"
                            onSubmit={criarAtividade}
                        >
                            <input
                                id="produtor-nova-atividade"
                                value={novaAtividade}
                                onChange={(evento) =>
                                    setNovaAtividade(evento.target.value)
                                }
                                placeholder="Ex.: Café Arábica 2027..."
                                required
                            />
                            <select
                                value={tipoAtividade}
                                onChange={(evento) =>
                                    setTipoAtividade(evento.target.value)
                                }
                            >
                                <option value="AGRICULTURA">
                                    Agricultura
                                </option>
                                <option value="PECUARIA">Pecuaria</option>
                                <option value="MISTA">Mista</option>
                                <option value="OUTRA">Outra</option>
                            </select>
                            <button type="submit">Salvar</button>
                        </form>
                        </div>

                        <div className="produtor-colaborativo-listas">
                            <div className="produtor-colaborativo-lista-propriedades">
                                <strong>Propriedades ativas</strong>
                                {propriedades.length === 0 ? (
                                    <p>Nenhuma propriedade cadastrada.</p>
                                ) : (
                                    <ul>
                                        {propriedades.map((item, indice) => (
                                            <li key={item.id}>
                                                <strong>{item.nome}</strong>
                                                {indice === 0 && <small>Principal</small>}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className="produtor-colaborativo-lista-atividades">
                                <strong>Atividades da safra</strong>
                                {atividades.length === 0 ? (
                                    <p>Nenhuma atividade cadastrada.</p>
                                ) : (
                                    <ul>
                                        {atividades.map((item) => (
                                            <li key={item.id}>
                                                <strong>{item.nome}</strong>
                                                <small>{formatarTipoAtividade(item.tipo)}</small>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </section>
                    {painelDocumentos}
                </div>
                </div>

                {carregando && (
                    <p className="produtor-colaborativo-carregando">
                        Atualizando informações...
                    </p>
                )}
            </div>
            <ModalAnimado
                aberto={modalPendenciasAberto}
                aoFechar={fecharModalPendencias}
                classeFundo="produtor-pendencias-modal-fundo"
            >
                <section
                    aria-describedby={telaModalPendencias === 'lista' ? 'produtor-pendencias-modal-descricao' : 'produtor-anexo-modal-descricao'}
                    aria-labelledby={telaModalPendencias === 'lista' ? 'produtor-pendencias-modal-titulo' : 'produtor-anexo-modal-titulo'}
                    aria-modal="true"
                    className="produtor-pendencias-modal"
                    role="dialog"
                >
                    {telaModalPendencias === 'lista' ? (
                    <>
                    <header className="produtor-pendencias-modal-cabecalho">
                        <div className="produtor-pendencias-modal-resumos">
                            <span className="produtor-pendencias-modal-selo produtor-pendencias-modal-selo-alerta">
                                Atenção necessária · contador
                            </span>
                            <span className="produtor-pendencias-modal-selo produtor-pendencias-modal-selo-total">
                                {pendenciasAtivas.length} pendências no total: {pendenciasUrgentes} urgentes, {pendenciasAtivas.length - pendenciasUrgentes} regulares
                            </span>
                        </div>
                        <button
                            aria-label="Fechar pendências do contador"
                            className="produtor-pendencias-modal-fechar"
                            onClick={fecharModalPendencias}
                            type="button"
                        >
                            <span aria-hidden="true" className="material-symbols-outlined">close</span>
                        </button>
                        <h2 id="produtor-pendencias-modal-titulo">Todas as pendências do contador</h2>
                        <p id="produtor-pendencias-modal-descricao">
                            Classifique lançamentos, anexe notas fiscais e envie comprovantes para a escrituração da safra e conciliação contábil.
                        </p>
                        <div className="produtor-pendencias-modal-filtros">
                            <div aria-label="Filtrar pendências" className="produtor-pendencias-modal-abas" role="group">
                                {filtrosPendencias.map((filtro) => (
                                    <button
                                        aria-pressed={filtroPendenciasModal === filtro.id}
                                        className={filtroPendenciasModal === filtro.id ? 'ativo' : ''}
                                        key={filtro.id}
                                        onClick={() => setFiltroPendenciasModal(filtro.id)}
                                        type="button"
                                    >
                                        {filtro.label} ({filtro.contar()})
                                    </button>
                                ))}
                            </div>
                        </div>
                    </header>

                    <div className="produtor-pendencias-modal-lista">
                        {pendenciasFiltradasModal.length === 0 ? (
                            <p className="produtor-colaborativo-vazio">
                                {pendenciasAtivas.length === 0 ? 'Nenhuma pendência aberta.' : 'Nenhuma pendência encontrada.'}
                            </p>
                        ) : pendenciasFiltradasModal.map((pendencia) => {
                            const prazo = prazoPendencia(pendencia.vencimento)
                            const exigeDocumento = ['DOCUMENTO_AUSENTE', 'DOCUMENTO_SOLICITADO'].includes(pendencia.tipo)
                            const exigeClassificacao = pendencia.tipo === 'SEM_CLASSIFICACAO'
                            const valor = pendencia.valor ?? pendencia.movimentacao?.valor ?? pendencia.valorMovimentacao
                            const nomeAcao = exigeDocumento
                                ? /recibo/i.test(`${pendencia.titulo} ${pendencia.descricao}`) ? 'Anexar recibo' : 'Anexar nota'
                                : exigeClassificacao ? 'Classificar' : 'Resolver'

                            return (
                                <article className="produtor-pendencias-modal-item" key={pendencia.id}>
                                    <div className="produtor-pendencias-modal-item-conteudo">
                                        <div className="produtor-pendencias-modal-item-titulo">
                                            <strong>{formatarTipoPendencia(pendencia.tipo)}</strong>
                                            {prazo !== null && (
                                                <span className={prazo <= 2 ? 'produtor-pendencias-modal-prazo urgente' : 'produtor-pendencias-modal-prazo'}>
                                                    {prazo < 0 ? `Venceu há ${Math.abs(prazo)} dias` : prazo === 0 ? 'Vence hoje' : `Vence em ${prazo} dias`}
                                                </span>
                                            )}
                                            {exigeDocumento && /nfe|nf-e|nota fiscal/i.test(`${pendencia.titulo} ${pendencia.descricao}`) && (
                                                <span className="produtor-pendencias-modal-tipo-doc">NF-e</span>
                                            )}
                                            {valor != null && <strong>{formatarDinheiro(valor)}</strong>}
                                        </div>
                                        <p>{pendencia.descricao || pendencia.titulo}</p>
                                    </div>
                                    <button
                                        className={exigeDocumento ? 'produtor-pendencias-modal-acao principal' : 'produtor-pendencias-modal-acao'}
                                        disabled={pendenciaEmAcaoId === pendencia.id}
                                        onClick={() => {
                                            if (exigeDocumento) {
                                                iniciarAnexoPendencia(pendencia)
                                            } else if (exigeClassificacao) {
                                                fecharModalPendencias()
                                                navigate('/dashboard/movimentacoes')
                                            } else {
                                                resolverPendencia(pendencia)
                                            }
                                        }}
                                        type="button"
                                    >
                                        <span aria-hidden="true" className="material-symbols-outlined">
                                            {exigeDocumento ? 'attach_file' : exigeClassificacao ? 'bar_chart' : 'check_circle'}
                                        </span>
                                        {pendenciaEmAcaoId === pendencia.id ? 'Salvando...' : nomeAcao}
                                    </button>
                                </article>
                            )
                        })}
                    </div>

                    {erro && <p className="produtor-pendencias-modal-erro" role="alert">{erro}</p>}

                    <footer className="produtor-pendencias-modal-rodape">
                        <span>
                            Mostrando <strong>{pendenciasFiltradasModal.length}</strong> {filtroPendenciasModal === 'TODAS' ? 'itens prioritários' : 'itens filtrados'} de <strong>{pendenciasAtivas.length}</strong> pendências
                        </span>
                        <div>
                            <button className="produtor-pendencias-modal-fechar-rodape" onClick={fecharModalPendencias} type="button">Fechar</button>
                            <input
                                accept=".pdf,.jpeg,.jpg,.png,.xml"
                                hidden
                                multiple
                                onChange={enviarArquivosDasPendencias}
                                ref={arquivosPendenciasRef}
                                type="file"
                            />
                            <button
                                className="produtor-pendencias-modal-anexar-lote"
                                disabled={enviandoArquivosPendencias}
                                onClick={() => arquivosPendenciasRef.current?.click()}
                                type="button"
                            >
                                <span aria-hidden="true" className="material-symbols-outlined">upload</span>
                                {enviandoArquivosPendencias ? 'Enviando arquivos...' : 'Anexar múltiplos arquivos'}
                            </button>
                        </div>
                    </footer>
                    </>
                    ) : (
                    <>
                        <header className="produtor-pendencias-modal-cabecalho produtor-anexo-modal-cabecalho">
                            <button
                                className="produtor-anexo-modal-voltar"
                                onClick={() => setTelaModalPendencias('lista')}
                                type="button"
                            >
                                <span aria-hidden="true" className="material-symbols-outlined">arrow_back</span>
                                Voltar às pendências
                            </button>
                            <button
                                aria-label="Fechar pendências do contador"
                                className="produtor-pendencias-modal-fechar"
                                onClick={fecharModalPendencias}
                                type="button"
                            >
                                <span aria-hidden="true" className="material-symbols-outlined">close</span>
                            </button>
                            <span className="produtor-pendencias-modal-selo produtor-pendencias-modal-selo-alerta">
                                Anexo da pendência
                            </span>
                            <h2 id="produtor-anexo-modal-titulo">
                                {tipoAnexoPendencia === 'RECIBO' ? 'Anexar recibo' : 'Anexar documento'}
                            </h2>
                            <p id="produtor-anexo-modal-descricao">
                                Envie o arquivo solicitado para o contador continuar a escrituração.
                            </p>
                        </header>

                        <form className="produtor-anexo-modal-form" onSubmit={enviarAnexoPendencia}>
                            <div className="produtor-anexo-modal-pendencia">
                                <strong>{formatarTipoPendencia(pendenciaSelecionadaParaAnexo?.tipo)}</strong>
                                <p>{pendenciaSelecionadaParaAnexo?.descricao || pendenciaSelecionadaParaAnexo?.titulo}</p>
                            </div>

                            <label>
                                Tipo do documento
                                <select
                                    onChange={(evento) => setTipoAnexoPendencia(evento.target.value)}
                                    value={tipoAnexoPendencia}
                                >
                                    <option value="RECIBO">Recibo</option>
                                    <option value="NOTA_FISCAL">Nota fiscal</option>
                                    <option value="COMPROVANTE">Comprovante</option>
                                    <option value="XML">XML</option>
                                    <option value="OUTRO">Outro documento</option>
                                </select>
                            </label>

                            <label>
                                Arquivo ou foto do {tipoAnexoPendencia === 'RECIBO' ? 'recibo' : 'documento'}
                                <span
                                    className="produtor-colaborativo-upload produtor-anexo-modal-upload"
                                    onDragOver={(evento) => evento.preventDefault()}
                                    onDrop={(evento) => {
                                        evento.preventDefault()
                                        selecionarAnexoPendencia(evento.dataTransfer.files?.[0])
                                    }}
                                >
                                    <input
                                        accept=".pdf,.jpeg,.jpg,.png,.xml"
                                        aria-label="Selecionar arquivo ou foto do recibo"
                                        onChange={(evento) => selecionarAnexoPendencia(evento.target.files?.[0])}
                                        ref={arquivoAnexoPendenciaRef}
                                        required={!arquivoAnexoPendencia}
                                        type="file"
                                    />
                                    <span aria-hidden="true" className="material-symbols-outlined">cloud_upload</span>
                                    <strong>{arquivoAnexoPendencia?.name ?? 'Clique para selecionar ou arraste o arquivo aqui'}</strong>
                                    <small>PDF, JPEG, PNG ou XML · até 25 MB</small>
                                </span>
                            </label>

                            <label>
                                Observação para o contador <span className="produtor-anexo-modal-opcional">Opcional</span>
                                <textarea
                                    onChange={(evento) => setObservacaoAnexoPendencia(evento.target.value)}
                                    placeholder="Inclua uma observação sobre este documento..."
                                    value={observacaoAnexoPendencia}
                                />
                            </label>

                            {erro && <p className="produtor-pendencias-modal-erro" role="alert">{erro}</p>}

                            <footer className="produtor-pendencias-modal-rodape">
                                <button
                                    className="produtor-pendencias-modal-fechar-rodape"
                                    onClick={() => setTelaModalPendencias('lista')}
                                    type="button"
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="produtor-pendencias-modal-anexar-lote"
                                    disabled={!arquivoAnexoPendencia || enviandoAnexoPendencia}
                                    type="submit"
                                >
                                    <span aria-hidden="true" className="material-symbols-outlined">send</span>
                                    {enviandoAnexoPendencia ? 'Enviando...' : 'Enviar ao contador'}
                                </button>
                            </footer>
                        </form>
                    </>
                    )}
                </section>
            </ModalAnimado>
        </div>
    )
}

export default ProdutorColaborativo
