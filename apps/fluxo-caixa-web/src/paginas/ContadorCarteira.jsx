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
import { limparSessao } from '../servicos/sessao.js'

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
    const [dashboardFiscal, setDashboardFiscal] = useState(null)
    const [filtro, setFiltro] = useState('TODOS')
    const [erro, setErro] = useState('')
    const [carregando, setCarregando] = useState(false)

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

    async function carregarCarteira() {
        if (!sessao) {
            return
        }

        setCarregando(true)
        setErro('')

        try {
            const resposta = await fetch(`${API_URL}/contador/clientes`, {
                headers: headers(sessao),
            })

            if (!resposta.ok) {
                throw new Error('Nao foi possivel carregar a carteira.')
            }

            const dados = await resposta.json()
            setClientes(dados)

            if (dados.length > 0 && !clienteSelecionado) {
                setClienteSelecionado(dados[0])
            }
        } catch (error) {
            setErro(error.message)
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

        const base = `${API_URL}/contador/clientes/${cliente.empresaId}`
        const opcoes = {
            headers: headers(sessao),
        }

        try {
            const [
                respostaPendencias,
                respostaDocumentos,
                respostaVisao,
                respostaDashboardFiscal,
            ] = await Promise.all([
                fetch(`${base}/pendencias`, opcoes),
                fetch(`${base}/documentos`, opcoes),
                fetch(`${base}/visao-tributaria`, opcoes),
                fetch(`${base}/dashboard-contabil`, opcoes),
            ])

            setPendencias(
                respostaPendencias.ok ? await respostaPendencias.json() : [],
            )
            setDocumentos(
                respostaDocumentos.ok ? await respostaDocumentos.json() : [],
            )
            setVisao(respostaVisao.ok ? await respostaVisao.json() : null)
            setDashboardFiscal(
                respostaDashboardFiscal.ok
                    ? await respostaDashboardFiscal.json()
                    : null,
            )
        } catch {
            setErro('Nao foi possivel carregar os detalhes do cliente.')
        }
    }

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
        carregarCarteira()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessao])

    useEffect(() => {
        if (clienteSelecionado) {
            carregarCliente(clienteSelecionado)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clienteSelecionado?.empresaId])

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
                                        onClick={() => carregarCliente(cliente)}
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

                        <div className="contador-carteira-tributaria">
                            <h3>Painel contabil e fiscal</h3>
                            <p>
                                Usa o financeiro real como fonte de verdade e
                                acrescenta classificacao, documentos e
                                simulacao tributaria parametrizada.
                            </p>
                            <div>
                                <span>
                                    Receita bruta:{' '}
                                    {formatarDinheiro(
                                        dashboardFiscal?.receitaBruta,
                                    )}
                                </span>
                                <span>
                                    Despesas:{' '}
                                    {formatarDinheiro(
                                        dashboardFiscal?.despesasRegistradas,
                                    )}
                                </span>
                                <span>
                                    Resultado financeiro:{' '}
                                    {formatarDinheiro(
                                        dashboardFiscal?.resultadoFinanceiro,
                                    )}
                                </span>
                                <span>
                                    Base estimada:{' '}
                                    {formatarDinheiro(
                                        dashboardFiscal?.baseEstimadaSimulacao,
                                    )}
                                </span>
                                <span>
                                    Tributo estimado:{' '}
                                    {formatarDinheiro(
                                        dashboardFiscal?.tributoEstimado,
                                    )}
                                </span>
                                <span>
                                    Potencialmente dedutivel:{' '}
                                    {formatarDinheiro(
                                        dashboardFiscal
                                            ?.valorPotencialmenteDedutivel,
                                    )}
                                </span>
                                <span>
                                    Sem documento:{' '}
                                    {dashboardFiscal?.despesasSemDocumento ?? 0}
                                </span>
                                <span>
                                    Sem classificacao fiscal:{' '}
                                    {dashboardFiscal
                                        ?.despesasPendentesClassificacao ?? 0}
                                </span>
                            </div>
                            <small>
                                {dashboardFiscal?.aviso ??
                                    'Valores estimados para apoio a analise. A apuracao fiscal definitiva deve ser validada pelo profissional responsavel.'}
                            </small>
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
