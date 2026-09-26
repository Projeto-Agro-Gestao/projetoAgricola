import {
    useEffect,
    useState,
} from 'react'
import {
    Link,
    useNavigate,
    useParams,
} from 'react-router'
import { API_BASE_URL as API_URL } from '../config.js'
import { voltarPaginaAnterior } from '../navegacao.js'
import './NovaMovimentacao.css'

function completarComZero(numero) {
    return String(numero).padStart(2, '0')
}

function obterDataAtual() {
    const hoje = new Date()

    const ano = hoje.getFullYear()

    const mes = completarComZero(
        hoje.getMonth() + 1,
    )

    const dia = completarComZero(
        hoje.getDate(),
    )

    return `${ano}-${mes}-${dia}`
}

function limparSessao() {
    localStorage.removeItem('agrogestao_token')
    localStorage.removeItem('agrogestao_tipo_token')
    localStorage.removeItem('agrogestao_usuario')

    localStorage.removeItem(
        'agrogestao_token_expira_em',
    )
}

function obterSessao() {
    try {
        const token =
            localStorage.getItem('agrogestao_token')

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
    const dadosErro = await resposta
        .json()
        .catch(() => null)

    if (dadosErro?.campos) {
        const mensagensDosCampos =
            Object.values(dadosErro.campos)

        if (mensagensDosCampos.length > 0) {
            return mensagensDosCampos.join(' ')
        }
    }

    return dadosErro?.mensagem ?? mensagemPadrao
}

function EditarMovimentacao() {
    const navigate = useNavigate()

    const { movimentacaoId } = useParams()

    const [sessao] = useState(obterSessao)

    const [tipo, setTipo] =
        useState('RECEITA')

    const [
        descricao,
        setDescricao,
    ] = useState('')

    const [valor, setValor] = useState('')

    const [
        categoriaId,
        setCategoriaId,
    ] = useState('')

    const [
        dataMovimentacao,
        setDataMovimentacao,
    ] = useState('')

    const [
        observacao,
        setObservacao,
    ] = useState('')

    const [
        categorias,
        setCategorias,
    ] = useState([])

    const [
        carregando,
        setCarregando,
    ] = useState(true)

    const [
        salvando,
        setSalvando,
    ] = useState(false)

    const [erro, setErro] = useState('')

    const empresaId =
        sessao?.usuario?.empresaId

    useEffect(() => {
        if (!sessao || !empresaId) {
            navigate('/login', {
                replace: true,
            })

            return undefined
        }

        let componenteAtivo = true

        const cabecalhos = {
            Authorization:
                `${sessao.tipoToken} ${sessao.token}`,
        }

        async function carregarDados() {
            try {
                const [
                    respostaMovimentacao,
                    respostaCategorias,
                ] = await Promise.all([
                    fetch(
                        `${API_URL}/empresas/${empresaId}/movimentacoes/${movimentacaoId}`,
                        {
                            headers: cabecalhos,
                        },
                    ),

                    fetch(
                        `${API_URL}/empresas/${empresaId}/categorias/todas`,
                        {
                            headers: cabecalhos,
                        },
                    ),
                ])

                if (
                    respostaMovimentacao.status === 401 ||
                    respostaMovimentacao.status === 403 ||
                    respostaCategorias.status === 401 ||
                    respostaCategorias.status === 403
                ) {
                    limparSessao()

                    navigate('/login', {
                        replace: true,
                    })

                    return
                }

                if (!respostaMovimentacao.ok) {
                    const mensagem =
                        await obterMensagemDeErro(
                            respostaMovimentacao,
                            'Não foi possível carregar a movimentação.',
                        )

                    throw new Error(mensagem)
                }

                if (!respostaCategorias.ok) {
                    const mensagem =
                        await obterMensagemDeErro(
                            respostaCategorias,
                            'Não foi possível carregar as categorias.',
                        )

                    throw new Error(mensagem)
                }

                const movimentacao =
                    await respostaMovimentacao.json()

                const dadosCategorias =
                    await respostaCategorias.json()

                if (!componenteAtivo) {
                    return
                }

                setTipo(movimentacao.tipo)

                setDescricao(
                    movimentacao.descricao,
                )

                setValor(
                    String(movimentacao.valor),
                )

                setCategoriaId(
                    String(
                        movimentacao.categoriaId,
                    ),
                )

                setDataMovimentacao(
                    movimentacao.dataMovimentacao,
                )

                setObservacao(
                    movimentacao.observacao ?? '',
                )

                setCategorias(
                    Array.isArray(dadosCategorias)
                        ? dadosCategorias
                        : dadosCategorias.content ?? [],
                )

                setErro('')
            } catch (erroDaRequisicao) {
                if (!componenteAtivo) {
                    return
                }

                setErro(
                    erroDaRequisicao instanceof Error
                        ? erroDaRequisicao.message
                        : 'Não foi possível carregar a movimentação.',
                )
            } finally {
                if (componenteAtivo) {
                    setCarregando(false)
                }
            }
        }

        carregarDados()

        return () => {
            componenteAtivo = false
        }
    }, [
        empresaId,
        movimentacaoId,
        navigate,
        sessao,
    ])

    const categoriasDoTipo =
        categorias.filter((categoria) => {
            const pertenceAoTipo =
                categoria.tipo === tipo

            const estaAtiva =
                categoria.ativo !== false

            const categoriaAtual =
                String(categoria.id) ===
                String(categoriaId)

            return (
                pertenceAoTipo &&
                (estaAtiva || categoriaAtual)
            )
        })

    function alterarTipo(novoTipo) {
        if (novoTipo === tipo) {
            return
        }

        setTipo(novoTipo)
        setCategoriaId('')
        setErro('')
    }

    async function atualizarMovimentacao(evento) {
        evento.preventDefault()

        setErro('')

        if (!descricao.trim()) {
            setErro(
                'Informe a descrição da movimentação.',
            )

            return
        }

        if (!valor || Number(valor) <= 0) {
            setErro(
                'Informe um valor maior que zero.',
            )

            return
        }

        if (!categoriaId) {
            setErro('Selecione uma categoria.')
            return
        }

        if (!dataMovimentacao) {
            setErro(
                'Informe a data da movimentação.',
            )

            return
        }

        if (
            dataMovimentacao > obterDataAtual()
        ) {
            setErro(
                'A data da movimentação não pode estar no futuro.',
            )

            return
        }

        if (!sessao || !empresaId) {
            limparSessao()

            navigate('/login', {
                replace: true,
            })

            return
        }

        const corpo = {
            descricao: descricao.trim(),
            valor: Number(valor),
            tipo,
            categoriaId: Number(categoriaId),
            dataMovimentacao,
            observacao:
                observacao.trim() || null,
        }

        try {
            setSalvando(true)

            const resposta = await fetch(
                `${API_URL}/empresas/${empresaId}/movimentacoes/${movimentacaoId}`,
                {
                    method: 'PUT',
                    headers: {
                        Authorization:
                            `${sessao.tipoToken} ${sessao.token}`,

                        'Content-Type':
                            'application/json; charset=utf-8',
                    },
                    body: JSON.stringify(corpo),
                },
            )

            if (
                resposta.status === 401 ||
                resposta.status === 403
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
                        'Não foi possível atualizar a movimentação.',
                    )

                throw new Error(mensagem)
            }

            navigate(
                '/dashboard/movimentacoes',
                {
                    replace: true,
                },
            )
        } catch (erroDaRequisicao) {
            setErro(
                erroDaRequisicao instanceof Error
                    ? erroDaRequisicao.message
                    : 'Não foi possível atualizar a movimentação.',
            )
        } finally {
            setSalvando(false)
        }
    }

    if (!sessao) {
        return null
    }

    if (carregando) {
        return (
            <div className="movimentacao-pagina">
                <div className="movimentacao-conteudo">
                    <main className="movimentacao-card">
                        <p>
                            Carregando movimentação...
                        </p>
                    </main>
                </div>
            </div>
        )
    }

    return (
        <div className="movimentacao-pagina">
            <div className="movimentacao-conteudo">
                <header className="movimentacao-cabecalho">
                    <button
                        onClick={() =>
                            voltarPaginaAnterior(
                                navigate,
                                '/dashboard/movimentacoes',
                            )
                        }
                        type="button"
                    >
                        ← Voltar às movimentações
                    </button>

                    <p>AgroGestão</p>

                    <h1>Editar movimentação</h1>

                    <span>
                        Altere as informações da receita
                        ou despesa selecionada.
                    </span>
                </header>

                <main className="movimentacao-card">
                    {erro && !descricao ? (
                        <div>
                            <p
                                className="formulario-erro"
                                role="alert"
                            >
                                {erro}
                            </p>

                            <div className="formulario-acoes">
                                <button
                                    onClick={() =>
                                        voltarPaginaAnterior(
                                            navigate,
                                            '/dashboard/movimentacoes',
                                        )
                                    }
                                    type="button"
                                >
                                    Voltar para movimentações
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="movimentacao-tipos">
                                <button
                                    className={
                                        tipo === 'RECEITA'
                                            ? 'tipo-ativo'
                                            : ''
                                    }
                                    disabled={salvando}
                                    onClick={() =>
                                        alterarTipo(
                                            'RECEITA',
                                        )
                                    }
                                    type="button"
                                >
                                    Receita — entrou dinheiro
                                </button>

                                <button
                                    className={
                                        tipo === 'DESPESA'
                                            ? 'tipo-ativo tipo-despesa'
                                            : ''
                                    }
                                    disabled={salvando}
                                    onClick={() =>
                                        alterarTipo(
                                            'DESPESA',
                                        )
                                    }
                                    type="button"
                                >
                                    Despesa — saiu dinheiro
                                </button>
                            </div>

                            <form
                                onSubmit={
                                    atualizarMovimentacao
                                }
                            >
                                <div className="formulario-campo">
                                    <label htmlFor="descricao">
                                        Descrição
                                    </label>

                                    <input
                                        disabled={salvando}
                                        id="descricao"
                                        maxLength="150"
                                        onChange={(evento) =>
                                            setDescricao(
                                                evento.target.value,
                                            )
                                        }
                                        required
                                        type="text"
                                        value={descricao}
                                    />
                                </div>

                                <div className="formulario-linha">
                                    <div className="formulario-campo">
                                        <label htmlFor="valor">
                                            Valor
                                        </label>

                                        <input
                                            disabled={salvando}
                                            id="valor"
                                            min="0.01"
                                            onChange={(evento) =>
                                                setValor(
                                                    evento.target.value,
                                                )
                                            }
                                            required
                                            step="0.01"
                                            type="number"
                                            value={valor}
                                        />
                                    </div>

                                    <div className="formulario-campo">
                                        <label htmlFor="dataMovimentacao">
                                            Data
                                        </label>

                                        <input
                                            disabled={salvando}
                                            id="dataMovimentacao"
                                            max={obterDataAtual()}
                                            onChange={(evento) =>
                                                setDataMovimentacao(
                                                    evento.target.value,
                                                )
                                            }
                                            required
                                            type="date"
                                            value={
                                                dataMovimentacao
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="formulario-campo">
                                    <label htmlFor="categoria">
                                        Categoria
                                    </label>

                                    <select
                                        disabled={salvando}
                                        id="categoria"
                                        onChange={(evento) =>
                                            setCategoriaId(
                                                evento.target.value,
                                            )
                                        }
                                        required
                                        value={categoriaId}
                                    >
                                        <option value="">
                                            Selecione uma categoria
                                        </option>

                                        {categoriasDoTipo.map(
                                            (categoria) => (
                                                <option
                                                    key={
                                                        categoria.id
                                                    }
                                                    value={
                                                        categoria.id
                                                    }
                                                >
                                                    {
                                                        categoria.nome
                                                    }

                                                    {categoria.ativo ===
                                                    false
                                                        ? ' (desativada)'
                                                        : ''}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </div>

                                <div className="formulario-campo">
                                    <label htmlFor="observacao">
                                        Observação
                                    </label>

                                    <textarea
                                        disabled={salvando}
                                        id="observacao"
                                        maxLength="500"
                                        onChange={(evento) =>
                                            setObservacao(
                                                evento.target.value,
                                            )
                                        }
                                        placeholder="Informações adicionais, se necessário"
                                        rows="4"
                                        value={observacao}
                                    />
                                </div>

                                {erro && (
                                    <p
                                        className="formulario-erro"
                                        role="alert"
                                    >
                                        {erro}
                                    </p>
                                )}

                                <div className="formulario-acoes">
                                    <Link to="/dashboard/movimentacoes">
                                        Cancelar
                                    </Link>

                                    <button
                                        disabled={salvando}
                                        type="submit"
                                    >
                                        {salvando
                                            ? 'Salvando...'
                                            : 'Salvar alterações'}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </main>
            </div>
        </div>
    )
}

export default EditarMovimentacao
