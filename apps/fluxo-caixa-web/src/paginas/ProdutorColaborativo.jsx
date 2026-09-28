import {
    useEffect,
    useMemo,
    useState,
} from 'react'
import { useNavigate } from 'react-router'
import AlternadorModulos from '../componentes/AlternadorModulos.jsx'
import { API_BASE_URL as API_URL } from '../config.js'
import { voltarPaginaAnterior } from '../navegacao.js'
import './ProdutorColaborativo.css'

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

        const usuario = JSON.parse(usuarioSalvo)

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

async function mensagemErro(resposta, padrao) {
    const dados = await resposta.json().catch(() => null)
    return dados?.mensagem ?? padrao
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

function obterHeaders(sessao) {
    return {
        Authorization: `${sessao.tipoToken} ${sessao.token}`,
    }
}

function ProdutorColaborativo() {
    const navigate = useNavigate()
    const [sessao] = useState(obterSessao)
    const [dashboard, setDashboard] = useState(null)
    const [pendencias, setPendencias] = useState([])
    const [documentos, setDocumentos] = useState([])
    const [propriedades, setPropriedades] = useState([])
    const [atividades, setAtividades] = useState([])
    const [mensagem, setMensagem] = useState('')
    const [erro, setErro] = useState('')
    const [carregando, setCarregando] = useState(false)
    const [arquivo, setArquivo] = useState(null)
    const [documentoTipo, setDocumentoTipo] = useState('OUTRO')
    const [documentoObservacao, setDocumentoObservacao] = useState('')
    const [novaPropriedade, setNovaPropriedade] = useState('')
    const [novaAtividade, setNovaAtividade] = useState('')
    const [tipoAtividade, setTipoAtividade] = useState('AGRICULTURA')

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

    async function carregarTudo() {
        if (!sessao || !empresaId) {
            return
        }

        setCarregando(true)
        setErro('')

        try {
            const headers = obterHeaders(sessao)
            const [
                respostaDashboard,
                respostaPendencias,
                respostaDocumentos,
                respostaPropriedades,
                respostaAtividades,
            ] = await Promise.all([
                fetch(`${baseUrl}/produtor/dashboard`, { headers }),
                fetch(`${baseUrl}/pendencias`, { headers }),
                fetch(`${baseUrl}/documentos`, { headers }),
                fetch(`${baseUrl}/propriedades`, { headers }),
                fetch(`${baseUrl}/atividades`, { headers }),
            ])

            if (!respostaDashboard.ok) {
                throw new Error(
                    await mensagemErro(
                        respostaDashboard,
                        'Nao foi possivel carregar o painel.',
                    ),
                )
            }

            setDashboard(await respostaDashboard.json())
            setPendencias(
                respostaPendencias.ok ? await respostaPendencias.json() : [],
            )
            setDocumentos(
                respostaDocumentos.ok ? await respostaDocumentos.json() : [],
            )
            setPropriedades(
                respostaPropriedades.ok
                    ? await respostaPropriedades.json()
                    : [],
            )
            setAtividades(
                respostaAtividades.ok ? await respostaAtividades.json() : [],
            )
        } catch (error) {
            setErro(error.message)
        } finally {
            setCarregando(false)
        }
    }

    useEffect(() => {
        carregarTudo()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [empresaId])

    async function criarPropriedade(evento) {
        evento.preventDefault()

        if (!novaPropriedade.trim()) {
            setErro('Informe o nome da propriedade.')
            return
        }

        setMensagem('')
        setErro('')

        const resposta = await fetch(`${baseUrl}/propriedades`, {
            method: 'POST',
            headers: {
                ...obterHeaders(sessao),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                nome: novaPropriedade.trim(),
            }),
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
        carregarTudo()
    }

    async function criarAtividade(evento) {
        evento.preventDefault()

        if (!novaAtividade.trim()) {
            setErro('Informe o nome da atividade.')
            return
        }

        setMensagem('')
        setErro('')

        const resposta = await fetch(`${baseUrl}/atividades`, {
            method: 'POST',
            headers: {
                ...obterHeaders(sessao),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                nome: novaAtividade.trim(),
                tipo: tipoAtividade,
            }),
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
        carregarTudo()
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

        const resposta = await fetch(`${baseUrl}/documentos`, {
            method: 'POST',
            headers: obterHeaders(sessao),
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
        setDocumentoObservacao('')
        setMensagem('Documento enviado para analise.')
        carregarTudo()
    }

    async function baixarDocumento(documento) {
        setMensagem('')
        setErro('')

        try {
            const resposta = await fetch(
                `${baseUrl}/documentos/${documento.id}/download`,
                {
                    headers: obterHeaders(sessao),
                },
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

    return (
        <div className="produtor-colaborativo-pagina">
            <div className="produtor-colaborativo-conteudo">
                <header className="produtor-colaborativo-cabecalho">
                    <div className="produtor-colaborativo-navegacao">
                        <button
                            type="button"
                            onClick={() => voltarPaginaAnterior(navigate)}
                        >
                            Voltar
                        </button>

                        <AlternadorModulos />
                    </div>

                    <p>AgroGestao colaborativo</p>
                    <h1>Inicio do produtor</h1>
                    <span>
                        Lancamentos simples, documentos e pendencias em um
                        unico lugar para facilitar a conversa com o contador.
                    </span>
                </header>

                {(mensagem || erro) && (
                    <div
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
                    <article>
                        <small>Receitas do mes</small>
                        <strong>
                            {formatarDinheiro(dashboard?.receitasMes)}
                        </strong>
                    </article>
                    <article>
                        <small>Despesas do mes</small>
                        <strong>
                            {formatarDinheiro(dashboard?.despesasMes)}
                        </strong>
                    </article>
                    <article>
                        <small>Resultado</small>
                        <strong>
                            {formatarDinheiro(dashboard?.resultadoMes)}
                        </strong>
                    </article>
                    <article>
                        <small>Pendencias</small>
                        <strong>{dashboard?.pendenciasAbertas ?? 0}</strong>
                    </article>
                </section>

                <section className="produtor-colaborativo-atalhos">
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard/movimentacoes/nova')}
                    >
                        + Lançar receita ou despesa
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard/financeiro')}
                    >
                        Ver financeiro
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard/contas')}
                    >
                        Ver contas futuras
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard/plano')}
                    >
                        Plano e pagamentos
                    </button>
                </section>

                <div className="produtor-colaborativo-grade">
                    <section className="produtor-colaborativo-card">
                        <div className="produtor-colaborativo-card-topo">
                            <div>
                                <small>Documentos</small>
                                <h2>Enviar ao contador</h2>
                            </div>
                        </div>

                        <form
                            className="produtor-colaborativo-form"
                            onSubmit={enviarDocumento}
                        >
                            <label>
                                Tipo do documento *
                                <select
                                    value={documentoTipo}
                                    onChange={(evento) =>
                                        setDocumentoTipo(evento.target.value)
                                    }
                                >
                                    <option value="NOTA_FISCAL">
                                        Nota fiscal
                                    </option>
                                    <option value="XML">XML</option>
                                    <option value="COMPROVANTE">
                                        Comprovante
                                    </option>
                                    <option value="RECIBO">Recibo</option>
                                    <option value="OUTRO">Outro</option>
                                </select>
                            </label>

                            <label>
                                Arquivo *
                                <input
                                    type="file"
                                    accept="image/*,.pdf,.xml,.txt"
                                    onChange={(evento) =>
                                        setArquivo(
                                            evento.target.files?.[0] ?? null,
                                        )
                                    }
                                />
                            </label>

                            <label>
                                Observacao
                                <textarea
                                    value={documentoObservacao}
                                    onChange={(evento) =>
                                        setDocumentoObservacao(
                                            evento.target.value,
                                        )
                                    }
                                    placeholder="Ex.: nota da compra de sementes"
                                />
                            </label>

                            <button type="submit">
                                Enviar documento
                            </button>
                            <small>* Campo obrigatorio</small>
                        </form>
                    </section>

                    <section className="produtor-colaborativo-card">
                        <div className="produtor-colaborativo-card-topo">
                            <div>
                                <small>Organizacao</small>
                                <h2>Propriedades e atividades</h2>
                            </div>
                        </div>

                        <form
                            className="produtor-colaborativo-inline"
                            onSubmit={criarPropriedade}
                        >
                            <input
                                value={novaPropriedade}
                                onChange={(evento) =>
                                    setNovaPropriedade(evento.target.value)
                                }
                                placeholder="Nova propriedade *"
                            />
                            <button type="submit">Salvar</button>
                        </form>

                        <form
                            className="produtor-colaborativo-inline"
                            onSubmit={criarAtividade}
                        >
                            <input
                                value={novaAtividade}
                                onChange={(evento) =>
                                    setNovaAtividade(evento.target.value)
                                }
                                placeholder="Nova atividade *"
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

                        <div className="produtor-colaborativo-listas">
                            <div>
                                <strong>Propriedades</strong>
                                {propriedades.length === 0 ? (
                                    <p>Nenhuma propriedade cadastrada.</p>
                                ) : (
                                    <ul>
                                        {propriedades.map((item) => (
                                            <li key={item.id}>{item.nome}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div>
                                <strong>Atividades</strong>
                                {atividades.length === 0 ? (
                                    <p>Nenhuma atividade cadastrada.</p>
                                ) : (
                                    <ul>
                                        {atividades.map((item) => (
                                            <li key={item.id}>
                                                {item.nome} · {item.tipo}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </section>
                </div>

                <section className="produtor-colaborativo-duas-colunas">
                    <article className="produtor-colaborativo-card">
                        <div className="produtor-colaborativo-card-topo">
                            <div>
                                <small>Pendencias</small>
                                <h2>O que o contador precisa</h2>
                            </div>
                        </div>

                        {pendencias.length === 0 ? (
                            <p className="produtor-colaborativo-vazio">
                                Nenhuma pendencia aberta.
                            </p>
                        ) : (
                            <div className="produtor-colaborativo-lista">
                                {pendencias.map((pendencia) => (
                                    <div key={pendencia.id}>
                                        <strong>{pendencia.titulo}</strong>
                                        <span>
                                            {pendencia.tipo} ·{' '}
                                            {pendencia.status} · vence em{' '}
                                            {formatarData(pendencia.dataLimite)}
                                        </span>
                                        <p>{pendencia.descricao}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </article>

                    <article className="produtor-colaborativo-card">
                        <div className="produtor-colaborativo-card-topo">
                            <div>
                                <small>Inbox</small>
                                <h2>Documentos enviados</h2>
                            </div>
                            <span>{documentos.length} itens</span>
                        </div>

                        {documentos.length === 0 ? (
                            <p className="produtor-colaborativo-vazio">
                                Nenhum documento enviado.
                            </p>
                        ) : (
                            <div className="produtor-colaborativo-lista">
                                {documentos.map((documento) => (
                                    <button
                                        key={documento.id}
                                        type="button"
                                        onClick={() =>
                                            baixarDocumento(documento)
                                        }
                                    >
                                        <strong>{documento.nomeArquivo}</strong>
                                        <span>
                                            {documento.tipo} ·{' '}
                                            {documento.status}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </article>
                </section>

                {carregando && (
                    <p className="produtor-colaborativo-carregando">
                        Atualizando informacoes...
                    </p>
                )}
            </div>
        </div>
    )
}

export default ProdutorColaborativo
