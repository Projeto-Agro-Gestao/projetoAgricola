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

function limparSessao() {
    localStorage.removeItem('agrogestao_token')
    localStorage.removeItem('agrogestao_tipo_token')
    localStorage.removeItem('agrogestao_usuario')
    localStorage.removeItem('agrogestao_token_expira_em')
}

function obterSessao() {
    try {
        const token = localStorage.getItem('agrogestao_token')
        const tipoToken =
            localStorage.getItem('agrogestao_tipo_token') ?? 'Bearer'
        const usuarioSalvo = localStorage.getItem('agrogestao_usuario')
        const expiraEm = Number(
            localStorage.getItem('agrogestao_token_expira_em'),
        )

        if (!token || !usuarioSalvo) {
            return null
        }

        if (expiraEm && Date.now() >= expiraEm) {
            limparSessao()
            return null
        }

        return {
            token,
            tipoToken,
            usuario: JSON.parse(usuarioSalvo),
        }
    } catch {
        limparSessao()
        return null
    }
}

function headers(sessao) {
    return {
        Authorization: `${sessao.tipoToken} ${sessao.token}`,
    }
}

function formatarDinheiro(valor) {
    if (valor === null || valor === undefined) return 'Ainda não calculado'
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(Number(valor ?? 0))
}

function formatarDataHora(data) {
    if (!data) {
        return '-'
    }

    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(data))
}

function ContadorCarteira() {
    const navigate = useNavigate()
    const [sessao] = useState(obterSessao)
    const [clientes, setClientes] = useState([])
    const [clienteSelecionado, setClienteSelecionado] = useState(null)
    const [pendencias, setPendencias] = useState([])
    const [documentos, setDocumentos] = useState([])
    const [visao, setVisao] = useState(null)
    const [filtro, setFiltro] = useState('TODOS')
    const [erro, setErro] = useState('')
    const [carregando, setCarregando] = useState(Boolean(sessao))

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

    useEffect(() => {
        if (!sessao) {
            navigate('/login', {
                replace: true,
            })
        }
    }, [navigate, sessao])

    async function baixarDocumento(documento) {
        if (!clienteSelecionado) {
            return
        }

        setErro('')

        try {
            const resposta = await fetch(
                `${API_URL}/colaboracao/empresas/${clienteSelecionado.empresaId}/documentos/${documento.id}/download`,
                {
                    headers: headers(sessao),
                },
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

    useEffect(() => {
        if (!sessao) return undefined
        const controller = new AbortController()

        async function carregarCarteira() {
            try {
                const resposta = await fetch(`${API_URL}/contador/clientes`, {
                    headers: headers(sessao),
                    signal: controller.signal,
                })
                if (!resposta.ok) throw new Error('Não foi possível carregar a carteira.')
                const dados = await resposta.json()
                if (controller.signal.aborted) return
                setClientes(dados)
                setClienteSelecionado(atual => atual ?? dados[0] ?? null)
                setErro('')
            } catch (error) {
                if (!controller.signal.aborted) setErro(error.message)
            } finally {
                if (!controller.signal.aborted) setCarregando(false)
            }
        }
        void carregarCarteira()
        return () => controller.abort()
    }, [sessao])

    const empresaClienteId = clienteSelecionado?.empresaId

    useEffect(() => {
        if (!sessao || !empresaClienteId) return undefined
        const controller = new AbortController()

        async function carregarCliente() {
            const base = `${API_URL}/contador/clientes/${empresaClienteId}`
            const opcoes = { headers: headers(sessao), signal: controller.signal }
            try {
                const respostas = await Promise.all([
                    fetch(`${base}/pendencias`, opcoes),
                    fetch(`${base}/documentos`, opcoes),
                    fetch(`${base}/visao-tributaria`, opcoes),
                ])
                const [novasPendencias, novosDocumentos, novaVisao] = await Promise.all(
                    respostas.map((resposta, indice) => resposta.ok
                        ? resposta.json() : Promise.resolve(indice === 2 ? null : [])),
                )
                if (controller.signal.aborted) return
                setPendencias(novasPendencias)
                setDocumentos(novosDocumentos)
                setVisao(novaVisao)
                setErro('')
            } catch {
                if (!controller.signal.aborted) {
                    setErro('Não foi possível carregar os detalhes do cliente.')
                }
            }
        }
        void carregarCliente()
        return () => controller.abort()
    }, [empresaClienteId, sessao])

    function selecionarCliente(cliente) {
        if (cliente.empresaId === empresaClienteId) return
        setClienteSelecionado(cliente)
        setPendencias([])
        setDocumentos([])
        setVisao(null)
        setErro('')
    }

    if (!sessao) {
        return null
    }

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

                    <p>Area do contador</p>
                    <h1>Carteira de clientes</h1>
                    <span>
                        Acompanhe pendencias, documentos, classificacoes e
                        visao tributaria dos produtores vinculados.
                    </span>
                </header>

                {erro && (
                    <div className="contador-carteira-alerta">{erro}</div>
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
                                <h2>Produtores atendidos</h2>
                            </div>
                            <span>{clientesFiltrados.length}</span>
                        </div>

                        <div className="contador-carteira-clientes">
                            {clientesFiltrados.length === 0 ? (
                                <p>Nenhum cliente encontrado.</p>
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
                                        onClick={() => selecionarCliente(cliente)}
                                    >
                                        <strong>{cliente.empresaNome}</strong>
                                        <span>
                                            {cliente.statusEmpresa} ·{' '}
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
                                <small>Resumo</small>
                                <h2>
                                    {clienteSelecionado?.empresaNome ??
                                        'Selecione um cliente'}
                                </h2>
                            </div>
                        </div>

                        <div className="contador-carteira-indicadores">
                            <article>
                                <small>Pendencias</small>
                                <strong>
                                    {clienteSelecionado?.pendenciasAbertas ?? 0}
                                </strong>
                            </article>
                            <article>
                                <small>Sem documento</small>
                                <strong>
                                    {clienteSelecionado?.despesasSemDocumento ??
                                        0}
                                </strong>
                            </article>
                            <article>
                                <small>Sem classificacao</small>
                                <strong>
                                    {clienteSelecionado
                                        ?.movimentacoesSemClassificacao ?? 0}
                                </strong>
                            </article>
                            <article>
                                <small>Documentos novos</small>
                                <strong>
                                    {clienteSelecionado?.documentosNovos ?? 0}
                                </strong>
                            </article>
                        </div>

                        <div className="contador-carteira-tributaria">
                            <h3>Visao tributaria</h3>
                            <p>
                                Estimativa para apoio ao planejamento. A
                                validacao fiscal deve ser realizada pelo
                                contador responsavel.
                            </p>
                            <div>
                                <span>
                                    Receitas:{' '}
                                    {formatarDinheiro(visao?.receitasAno)}
                                </span>
                                <span>
                                    Despesas:{' '}
                                    {formatarDinheiro(visao?.despesasAno)}
                                </span>
                                <span>
                                    Resultado:{' '}
                                    {formatarDinheiro(visao?.resultadoAno)}
                                </span>
                                <span>
                                    Projecao:{' '}
                                    {formatarDinheiro(
                                        visao?.projecaoResultadoAno,
                                    )}
                                </span>
                            </div>
                        </div>
                    </section>
                </div>

                <section className="contador-carteira-duas-colunas">
                    <article className="contador-carteira-card">
                        <div className="contador-carteira-card-topo">
                            <div>
                                <small>Pendencias</small>
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
                                            {pendencia.tipo} ·{' '}
                                            {pendencia.prioridade} ·{' '}
                                            {pendencia.status}
                                        </span>
                                        <p>{pendencia.descricao}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </article>

                    <article className="contador-carteira-card">
                        <div className="contador-carteira-card-topo">
                            <div>
                                <small>Documentos</small>
                                <h2>Inbox do cliente</h2>
                            </div>
                            <span>{documentos.length}</span>
                        </div>

                        {documentos.length === 0 ? (
                            <p>Nenhum documento enviado.</p>
                        ) : (
                            <div className="contador-carteira-lista">
                                {documentos.map((documento) => (
                                    <div key={documento.id}>
                                        <strong>{documento.nomeArquivo}</strong>
                                        <span>
                                            {documento.tipo} ·{' '}
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
