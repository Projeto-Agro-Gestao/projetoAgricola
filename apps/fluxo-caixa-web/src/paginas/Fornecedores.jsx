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
import './Fornecedores.css'

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
        const usuarioSalvo =
            localStorage.getItem('agrogestao_usuario')
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

async function obterMensagemDeErro(
    resposta,
    mensagemPadrao,
) {
    const dados = await resposta.json().catch(() => null)

    if (dados?.campos) {
        const mensagens = Object.values(dados.campos)

        if (mensagens.length > 0) {
            return mensagens[0]
        }
    }

    return dados?.mensagem ?? mensagemPadrao
}

function formatarDinheiro(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(Number(valor ?? 0))
}

function formatarData(data) {
    if (!data) {
        return 'Sem data'
    }

    return new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'UTC',
    }).format(new Date(`${data}T00:00:00`))
}

function Fornecedores() {
    const navigate = useNavigate()
    const [sessao] = useState(obterSessao)
    const [fornecedores, setFornecedores] = useState([])
    const [lixeira, setLixeira] = useState([])
    const [compras, setCompras] = useState([])
    const [fornecedorSelecionado, setFornecedorSelecionado] =
        useState(null)
    const [fornecedorEmEdicao, setFornecedorEmEdicao] =
        useState(null)
    const [nome, setNome] = useState('')
    const [telefone, setTelefone] = useState('')
    const [observacao, setObservacao] = useState('')
    const [mostrarLixeira, setMostrarLixeira] = useState(false)
    const [carregando, setCarregando] = useState(true)
    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState('')
    const [sucesso, setSucesso] = useState('')
    const [confirmacao, setConfirmacao] = useState(null)

    const empresaId = sessao?.usuario?.empresaId

    const totalComprado = useMemo(
        () =>
            compras.reduce(
                (total, compra) =>
                    total + Number(compra.valor ?? 0),
                0,
            ),
        [compras],
    )

    useEffect(() => {
        if (!sessao || !empresaId) {
            navigate('/login', {
                replace: true,
            })

            return
        }

        void carregarFornecedores()
    }, [
        empresaId,
        navigate,
        sessao,
    ])

    async function requisitar(
        caminho,
        opcoes = {},
    ) {
        const resposta = await fetch(
            `${API_URL}/empresas/${empresaId}${caminho}`,
            {
                ...opcoes,
                headers: {
                    Authorization:
                        `${sessao.tipoToken} ${sessao.token}`,
                    ...(opcoes.headers ?? {}),
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
        }

        return resposta
    }

    async function carregarFornecedores() {
        try {
            setCarregando(true)
            setErro('')

            const [ativosResposta, lixeiraResposta] =
                await Promise.all([
                    requisitar('/fornecedores'),
                    requisitar('/fornecedores/lixeira'),
                ])

            if (!ativosResposta.ok) {
                throw new Error(
                    await obterMensagemDeErro(
                        ativosResposta,
                        'Nao foi possivel carregar fornecedores.',
                    ),
                )
            }

            if (!lixeiraResposta.ok) {
                throw new Error(
                    await obterMensagemDeErro(
                        lixeiraResposta,
                        'Nao foi possivel carregar a lixeira.',
                    ),
                )
            }

            const ativos = await ativosResposta.json()
            const excluidos = await lixeiraResposta.json()

            setFornecedores(ativos)
            setLixeira(excluidos)

            if (
                fornecedorSelecionado
                && !ativos.some(
                    (fornecedor) =>
                        fornecedor.id
                        === fornecedorSelecionado.id,
                )
            ) {
                setFornecedorSelecionado(null)
                setCompras([])
            }
        } catch (erroDaRequisicao) {
            setErro(
                erroDaRequisicao instanceof Error
                    ? erroDaRequisicao.message
                    : 'Nao foi possivel carregar fornecedores.',
            )
        } finally {
            setCarregando(false)
        }
    }

    async function carregarCompras(fornecedor) {
        setFornecedorSelecionado(fornecedor)
        setCompras([])
        setErro('')

        try {
            const resposta = await requisitar(
                `/fornecedores/${fornecedor.id}/compras`,
            )

            if (!resposta.ok) {
                throw new Error(
                    await obterMensagemDeErro(
                        resposta,
                        'Nao foi possivel carregar as compras.',
                    ),
                )
            }

            setCompras(await resposta.json())
        } catch (erroDaRequisicao) {
            setErro(
                erroDaRequisicao instanceof Error
                    ? erroDaRequisicao.message
                    : 'Nao foi possivel carregar as compras.',
            )
        }
    }

    function limparFormulario() {
        setFornecedorEmEdicao(null)
        setNome('')
        setTelefone('')
        setObservacao('')
    }

    function editarFornecedor(fornecedor) {
        setFornecedorEmEdicao(fornecedor)
        setNome(fornecedor.nome ?? '')
        setTelefone(fornecedor.telefone ?? '')
        setObservacao(fornecedor.observacao ?? '')
        setErro('')
        setSucesso('')
    }

    async function salvarFornecedor(evento) {
        evento.preventDefault()

        const nomeNormalizado =
            nome.trim().replace(/\s+/g, ' ')

        if (!nomeNormalizado) {
            setErro('Informe o nome do fornecedor.')
            return
        }

        try {
            setSalvando(true)
            setErro('')
            setSucesso('')

            const resposta = await requisitar(
                fornecedorEmEdicao
                    ? `/fornecedores/${fornecedorEmEdicao.id}`
                    : '/fornecedores',
                {
                    method: fornecedorEmEdicao
                        ? 'PUT'
                        : 'POST',
                    headers: {
                        'Content-Type':
                            'application/json; charset=utf-8',
                    },
                    body: JSON.stringify({
                        nome: nomeNormalizado,
                        telefone:
                            telefone.trim() || null,
                        observacao:
                            observacao.trim() || null,
                    }),
                },
            )

            if (!resposta.ok) {
                throw new Error(
                    await obterMensagemDeErro(
                        resposta,
                        'Nao foi possivel salvar o fornecedor.',
                    ),
                )
            }

            const fornecedorSalvo = await resposta.json()

            setSucesso(
                fornecedorEmEdicao
                    ? 'Fornecedor atualizado.'
                    : 'Fornecedor cadastrado.',
            )

            limparFormulario()
            await carregarFornecedores()
            await carregarCompras(fornecedorSalvo)
        } catch (erroDaRequisicao) {
            setErro(
                erroDaRequisicao instanceof Error
                    ? erroDaRequisicao.message
                    : 'Nao foi possivel salvar o fornecedor.',
            )
        } finally {
            setSalvando(false)
        }
    }

    async function executarConfirmacao() {
        if (!confirmacao) {
            return
        }

        try {
            setSalvando(true)
            setErro('')
            setSucesso('')

            const resposta = await requisitar(
                confirmacao.caminho,
                {
                    method: confirmacao.metodo,
                },
            )

            if (!resposta.ok) {
                throw new Error(
                    await obterMensagemDeErro(
                        resposta,
                        'Nao foi possivel concluir a acao.',
                    ),
                )
            }

            setSucesso(confirmacao.sucesso)
            setConfirmacao(null)
            await carregarFornecedores()

            if (fornecedorSelecionado) {
                setFornecedorSelecionado(null)
                setCompras([])
            }
        } catch (erroDaRequisicao) {
            setErro(
                erroDaRequisicao instanceof Error
                    ? erroDaRequisicao.message
                    : 'Nao foi possivel concluir a acao.',
            )
        } finally {
            setSalvando(false)
        }
    }

    if (!sessao) {
        return null
    }

    return (
        <div className="fornecedores-pagina">
            <div className="fornecedores-conteudo">
                <header className="fornecedores-cabecalho">
                    <button
                        onClick={() => navigate('/dashboard')}
                        type="button"
                    >
                        Voltar ao painel
                    </button>

                    <div>
                        <p>AgroGestao</p>
                        <h1>Controle de fornecedores</h1>
                        <span>
                            Veja onde comprou, por quanto e quem
                            registrou cada compra.
                        </span>
                    </div>

                    <AlternadorModulos />
                </header>

                <main className="fornecedores-grade">
                    <section className="fornecedores-card">
                        <div className="fornecedores-card-topo">
                            <div>
                                <small>Cadastro</small>
                                <h2>
                                    {fornecedorEmEdicao
                                        ? 'Editar fornecedor'
                                        : 'Novo fornecedor'}
                                </h2>
                            </div>
                        </div>

                        <form onSubmit={salvarFornecedor}>
                            <label htmlFor="nomeFornecedor">
                                Nome do fornecedor
                            </label>

                            <input
                                id="nomeFornecedor"
                                maxLength="150"
                                onChange={(evento) =>
                                    setNome(evento.target.value)
                                }
                                placeholder="Ex.: Agropecuaria Central"
                                required
                                type="text"
                                value={nome}
                            />

                            <label htmlFor="telefoneFornecedor">
                                Telefone
                            </label>

                            <input
                                id="telefoneFornecedor"
                                maxLength="30"
                                onChange={(evento) =>
                                    setTelefone(evento.target.value)
                                }
                                placeholder="Opcional"
                                type="text"
                                value={telefone}
                            />

                            <label htmlFor="observacaoFornecedor">
                                Observacao
                            </label>

                            <textarea
                                id="observacaoFornecedor"
                                maxLength="500"
                                onChange={(evento) =>
                                    setObservacao(evento.target.value)
                                }
                                placeholder="Opcional"
                                value={observacao}
                            />

                            {erro && (
                                <p className="fornecedores-alerta erro">
                                    {erro}
                                </p>
                            )}

                            {sucesso && (
                                <p className="fornecedores-alerta sucesso">
                                    {sucesso}
                                </p>
                            )}

                            <div className="fornecedores-acoes-form">
                                {fornecedorEmEdicao && (
                                    <button
                                        onClick={limparFormulario}
                                        type="button"
                                    >
                                        Cancelar edicao
                                    </button>
                                )}

                                <button
                                    disabled={salvando}
                                    type="submit"
                                >
                                    {salvando
                                        ? 'Salvando...'
                                        : 'Salvar fornecedor'}
                                </button>
                            </div>
                        </form>
                    </section>

                    <section className="fornecedores-card fornecedores-lista">
                        <div className="fornecedores-card-topo">
                            <div>
                                <small>Fornecedores</small>
                                <h2>
                                    {mostrarLixeira
                                        ? 'Lixeira'
                                        : 'Ativos'}
                                </h2>
                            </div>

                            <button
                                onClick={() =>
                                    setMostrarLixeira(
                                        (valor) => !valor,
                                    )
                                }
                                type="button"
                            >
                                {mostrarLixeira
                                    ? 'Ver ativos'
                                    : 'Ver lixeira'}
                            </button>
                        </div>

                        {carregando ? (
                            <p className="fornecedores-vazio">
                                Carregando fornecedores...
                            </p>
                        ) : (
                            <div className="fornecedores-itens">
                                {(mostrarLixeira
                                    ? lixeira
                                    : fornecedores
                                ).length === 0 ? (
                                    <p className="fornecedores-vazio">
                                        Nenhum fornecedor encontrado.
                                    </p>
                                ) : (
                                    (mostrarLixeira
                                        ? lixeira
                                        : fornecedores
                                    ).map((fornecedor) => (
                                        <article
                                            className="fornecedores-item"
                                            key={fornecedor.id}
                                        >
                                            <div>
                                                <strong>
                                                    {fornecedor.nome}
                                                </strong>
                                                <span>
                                                    {fornecedor.telefone
                                                        || 'Sem telefone'}
                                                </span>
                                            </div>

                                            <div className="fornecedores-acoes-item">
                                                {!mostrarLixeira && (
                                                    <>
                                                        <button
                                                            onClick={() =>
                                                                carregarCompras(
                                                                    fornecedor,
                                                                )
                                                            }
                                                            type="button"
                                                        >
                                                            Ver compras
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                editarFornecedor(
                                                                    fornecedor,
                                                                )
                                                            }
                                                            type="button"
                                                        >
                                                            Editar
                                                        </button>

                                                        <button
                                                            className="perigo"
                                                            onClick={() =>
                                                                setConfirmacao({
                                                                    titulo:
                                                                        'Mover fornecedor para a lixeira?',
                                                                    texto:
                                                                        'Ele podera ser restaurado depois.',
                                                                    metodo:
                                                                        'DELETE',
                                                                    caminho:
                                                                        `/fornecedores/${fornecedor.id}`,
                                                                    sucesso:
                                                                        'Fornecedor movido para a lixeira.',
                                                                })
                                                            }
                                                            type="button"
                                                        >
                                                            Excluir
                                                        </button>
                                                    </>
                                                )}

                                                {mostrarLixeira && (
                                                    <>
                                                        <button
                                                            onClick={() =>
                                                                setConfirmacao({
                                                                    titulo:
                                                                        'Restaurar fornecedor?',
                                                                    texto:
                                                                        'Ele voltara para a lista de fornecedores ativos.',
                                                                    metodo:
                                                                        'PATCH',
                                                                    caminho:
                                                                        `/fornecedores/${fornecedor.id}/restaurar`,
                                                                    sucesso:
                                                                        'Fornecedor restaurado.',
                                                                })
                                                            }
                                                            type="button"
                                                        >
                                                            Restaurar
                                                        </button>

                                                        <button
                                                            className="perigo"
                                                            onClick={() =>
                                                                setConfirmacao({
                                                                    titulo:
                                                                        'Excluir permanentemente?',
                                                                    texto:
                                                                        'Depois de excluir permanentemente, nao sera possivel recuperar.',
                                                                    metodo:
                                                                        'DELETE',
                                                                    caminho:
                                                                        `/fornecedores/${fornecedor.id}/permanente`,
                                                                    sucesso:
                                                                        'Fornecedor excluido permanentemente.',
                                                                })
                                                            }
                                                            type="button"
                                                        >
                                                            Excluir definitivo
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </article>
                                    ))
                                )}
                            </div>
                        )}
                    </section>

                    <section className="fornecedores-card fornecedores-compras">
                        <div className="fornecedores-card-topo">
                            <div>
                                <small>Compras</small>
                                <h2>
                                    {fornecedorSelecionado
                                        ? fornecedorSelecionado.nome
                                        : 'Selecione um fornecedor'}
                                </h2>
                            </div>

                            <strong>
                                {formatarDinheiro(totalComprado)}
                            </strong>
                        </div>

                        {compras.length === 0 ? (
                            <p className="fornecedores-vazio">
                                Nenhuma compra selecionada.
                            </p>
                        ) : (
                            <div className="fornecedores-compras-lista">
                                {compras.map((compra) => (
                                    <article
                                        className="fornecedores-compra"
                                        key={`${compra.origem}-${compra.origemId}`}
                                    >
                                        <div>
                                            <strong>
                                                {compra.descricao}
                                            </strong>
                                            <span>
                                                {formatarData(compra.data)}
                                                {' - '}
                                                {compra.categoriaNome}
                                            </span>
                                            <small>
                                                Comprador:{' '}
                                                {compra.compradorNome
                                                    || 'Nao informado'}
                                            </small>
                                        </div>

                                        <strong>
                                            {formatarDinheiro(
                                                compra.valor,
                                            )}
                                        </strong>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </main>

                {confirmacao && (
                    <div className="fornecedores-modal-fundo">
                        <div
                            className="fornecedores-modal"
                            role="dialog"
                            aria-modal="true"
                        >
                            <h2>{confirmacao.titulo}</h2>
                            <p>{confirmacao.texto}</p>

                            <div>
                                <button
                                    onClick={() =>
                                        setConfirmacao(null)
                                    }
                                    type="button"
                                >
                                    Cancelar
                                </button>

                                <button
                                    className="perigo"
                                    disabled={salvando}
                                    onClick={executarConfirmacao}
                                    type="button"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Fornecedores
