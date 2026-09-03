import {
    useEffect,
    useState,
} from 'react'
import {
    Link,
    useNavigate,
    useSearchParams,
} from 'react-router'
import { API_BASE_URL as API_URL } from '../config.js'
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
    const dadosErro =
        await resposta
            .json()
            .catch(() => null)

    if (dadosErro?.mensagem) {
        return dadosErro.mensagem
    }

    if (dadosErro?.campos) {
        const mensagens =
            Object.values(
                dadosErro.campos,
            )

        if (mensagens.length > 0) {
            return mensagens.join(' ')
        }
    }

    return mensagemPadrao
}

function NovaMovimentacao() {
    const navigate = useNavigate()

    const [parametros] =
        useSearchParams()

    const [sessao] =
        useState(obterSessao)

    const tipoInicial =
        parametros.get('tipo') === 'DESPESA'
            ? 'DESPESA'
            : 'RECEITA'

    const [tipo, setTipo] =
        useState(tipoInicial)

    const [descricao, setDescricao] =
        useState('')

    const [valor, setValor] =
        useState('')

    const [
        categoriaId,
        setCategoriaId,
    ] = useState('')

    const [
        dataMovimentacao,
        setDataMovimentacao,
    ] = useState(obterDataAtual)

    const [
        observacao,
        setObservacao,
    ] = useState('')

    const [
        categorias,
        setCategorias,
    ] = useState([])

    const [
        carregandoCategorias,
        setCarregandoCategorias,
    ] = useState(true)

    const [
        criandoCategoria,
        setCriandoCategoria,
    ] = useState(false)

    const [
        novaCategoriaNome,
        setNovaCategoriaNome,
    ] = useState('')

    const [
        salvandoCategoria,
        setSalvandoCategoria,
    ] = useState(false)

    const [
        sucessoCategoria,
        setSucessoCategoria,
    ] = useState('')

    const [salvando, setSalvando] =
        useState(false)

    const [erro, setErro] =
        useState('')

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

        async function carregarCategorias() {
            try {
                setCarregandoCategorias(true)

                const resposta =
                    await fetch(
                        `${API_URL}/empresas/${empresaId}/categorias?tipo=${tipo}`,
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
                    throw new Error(
                        await obterMensagemDeErro(
                            resposta,
                            'Não foi possível carregar as categorias.',
                        ),
                    )
                }

                const dados =
                    await resposta.json()

                if (!componenteAtivo) {
                    return
                }

                const lista =
                    Array.isArray(dados)
                        ? dados
                        : dados.content ?? []

                setCategorias(lista)
                setCategoriaId('')
                setErro('')
            } catch (erroDaRequisicao) {
                if (!componenteAtivo) {
                    return
                }

                setCategorias([])
                setCategoriaId('')

                setErro(
                    erroDaRequisicao
                    instanceof Error
                        ? erroDaRequisicao.message
                        : 'Não foi possível carregar as categorias.',
                )
            } finally {
                if (componenteAtivo) {
                    setCarregandoCategorias(false)
                }
            }
        }

        carregarCategorias()

        return () => {
            componenteAtivo = false
        }
    }, [
        empresaId,
        navigate,
        sessao,
        tipo,
    ])

    function alterarTipo(novoTipo) {
        if (novoTipo === tipo) {
            return
        }

        setTipo(novoTipo)
        setCategoriaId('')
        setCategorias([])
        setCarregandoCategorias(true)
        setCriandoCategoria(false)
        setNovaCategoriaNome('')
        setSucessoCategoria('')
        setErro('')
    }

    function abrirNovaCategoria() {
        setCriandoCategoria(true)
        setNovaCategoriaNome('')
        setSucessoCategoria('')
        setErro('')
    }

    function cancelarNovaCategoria() {
        if (salvandoCategoria) {
            return
        }

        setCriandoCategoria(false)
        setNovaCategoriaNome('')
        setErro('')
    }

    async function criarCategoria(evento) {
        evento.preventDefault()

        setErro('')
        setSucessoCategoria('')

        const nomeNormalizado =
            novaCategoriaNome
                .trim()
                .replace(/\s+/g, ' ')

        if (!nomeNormalizado) {
            setErro(
                'Digite o nome da nova categoria.',
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

        try {
            setSalvandoCategoria(true)

            const resposta =
                await fetch(
                    `${API_URL}/empresas/${empresaId}/categorias`,
                    {
                        method: 'POST',

                        headers: {
                            Authorization:
                                `${sessao.tipoToken} ${sessao.token}`,

                            'Content-Type':
                                'application/json; charset=utf-8',
                        },

                        body:
                            JSON.stringify({
                                nome:
                                nomeNormalizado,

                                tipo,
                            }),
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
                throw new Error(
                    await obterMensagemDeErro(
                        resposta,
                        'Não foi possível criar a categoria.',
                    ),
                )
            }

            const categoriaCriada =
                await resposta.json()

            setCategorias(
                (categoriasAtuais) =>
                    [
                        ...categoriasAtuais,
                        categoriaCriada,
                    ].sort(
                        (
                            primeira,
                            segunda,
                        ) =>
                            primeira.nome.localeCompare(
                                segunda.nome,
                                'pt-BR',
                            ),
                    ),
            )

            setCategoriaId(
                String(
                    categoriaCriada.id,
                ),
            )

            setCriandoCategoria(false)
            setNovaCategoriaNome('')

            setSucessoCategoria(
                `Categoria "${categoriaCriada.nome}" criada e selecionada.`,
            )
        } catch (erroDaRequisicao) {
            setErro(
                erroDaRequisicao
                instanceof Error
                    ? erroDaRequisicao.message
                    : 'Não foi possível criar a categoria.',
            )
        } finally {
            setSalvandoCategoria(false)
        }
    }

    async function salvarMovimentacao(
        evento,
    ) {
        evento.preventDefault()
        setErro('')

        if (!descricao.trim()) {
            setErro(
                'Informe a descrição da movimentação.',
            )

            return
        }

        if (
            !valor
            || Number(valor) <= 0
        ) {
            setErro(
                'Informe um valor maior que zero.',
            )

            return
        }

        if (!categoriaId) {
            setErro(
                'Selecione ou crie uma categoria.',
            )

            return
        }

        if (!dataMovimentacao) {
            setErro(
                'Informe a data da movimentação.',
            )

            return
        }

        if (
            dataMovimentacao
            > obterDataAtual()
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
            descricao:
                descricao.trim(),

            valor:
                Number(valor),

            tipo,

            categoriaId:
                Number(categoriaId),

            dataMovimentacao,

            observacao:
                observacao.trim()
                || null,
        }

        try {
            setSalvando(true)

            const resposta =
                await fetch(
                    `${API_URL}/empresas/${empresaId}/movimentacoes`,
                    {
                        method: 'POST',

                        headers: {
                            Authorization:
                                `${sessao.tipoToken} ${sessao.token}`,

                            'Content-Type':
                                'application/json; charset=utf-8',
                        },

                        body:
                            JSON.stringify(corpo),
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
                throw new Error(
                    await obterMensagemDeErro(
                        resposta,
                        'Não foi possível salvar a movimentação.',
                    ),
                )
            }

            navigate('/dashboard', {
                replace: true,
            })
        } catch (erroDaRequisicao) {
            setErro(
                erroDaRequisicao
                instanceof Error
                    ? erroDaRequisicao.message
                    : 'Não foi possível salvar a movimentação.',
            )
        } finally {
            setSalvando(false)
        }
    }

    if (!sessao) {
        return null
    }

    return (
        <div className="movimentacao-pagina">
            <div className="movimentacao-conteudo">
                <header className="movimentacao-cabecalho">
                    <Link to="/dashboard">
                        ← Voltar ao dashboard
                    </Link>

                    <p>AgroGestão</p>

                    <h1>
                        Nova movimentação
                    </h1>

                    <span>
                        Registre uma entrada ou saída
                        financeira da sua propriedade.
                    </span>
                </header>

                <main className="movimentacao-card">
                    <div className="movimentacao-tipos">
                        <button
                            className={
                                tipo === 'RECEITA'
                                    ? 'tipo-ativo'
                                    : ''
                            }
                            disabled={
                                salvando
                                || salvandoCategoria
                            }
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
                            disabled={
                                salvando
                                || salvandoCategoria
                            }
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
                            salvarMovimentacao
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
                                        evento
                                            .target
                                            .value,
                                    )
                                }
                                placeholder={
                                    tipo === 'RECEITA'
                                        ? 'Ex.: Venda de milho'
                                        : 'Ex.: Abastecimento do trator'
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
                                            evento
                                                .target
                                                .value,
                                        )
                                    }
                                    placeholder="0,00"
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
                                    max={
                                        obterDataAtual()
                                    }
                                    onChange={(evento) =>
                                        setDataMovimentacao(
                                            evento
                                                .target
                                                .value,
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
                                disabled={
                                    carregandoCategorias
                                    || salvando
                                    || salvandoCategoria
                                }
                                id="categoria"
                                onChange={(evento) => {
                                    setCategoriaId(
                                        evento
                                            .target
                                            .value,
                                    )

                                    setSucessoCategoria(
                                        '',
                                    )
                                }}
                                required
                                value={categoriaId}
                            >
                                <option value="">
                                    {carregandoCategorias
                                        ? 'Carregando categorias...'
                                        : categorias.length === 0
                                            ? 'Crie sua primeira categoria'
                                            : 'Selecione uma categoria'}
                                </option>

                                {categorias.map(
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
                                        </option>
                                    ),
                                )}
                            </select>

                            {!carregandoCategorias
                                && categorias.length > 0
                                && !criandoCategoria
                                && (
                                    <div className="categoria-convite-criacao">
                                        <p className="categoria-ajuda-criacao">
                                            <strong>
                                                Não encontrou a categoria desejada?
                                            </strong>

                                            <span>
                                                Você pode criar outra categoria sem sair desta página.
                                            </span>
                                        </p>

                                        <button
                                            className="categoria-criar-destaque"
                                            disabled={
                                                salvando
                                                || salvandoCategoria
                                            }
                                            onClick={
                                                abrirNovaCategoria
                                            }
                                            type="button"
                                        >
                                            <span>＋</span>

                                            <strong>
                                                Nova categoria
                                            </strong>
                                        </button>
                                    </div>
                                )}

                            {!carregandoCategorias
                                && categorias.length === 0
                                && !criandoCategoria
                                && (
                                    <div className="categoria-sem-opcoes">
                                        <span>＋</span>

                                        <div>
                                            <strong>
                                                Nenhuma categoria de{' '}
                                                {tipo === 'RECEITA'
                                                    ? 'receita'
                                                    : 'despesa'}{' '}
                                                cadastrada
                                            </strong>

                                            <p>
                                                Para continuar, clique no botão Nova categoria e crie uma categoria sem perder os dados preenchidos.
                                            </p>
                                        </div>

                                        <button
                                            onClick={
                                                abrirNovaCategoria
                                            }
                                            type="button"
                                        >
                                            Nova categoria
                                        </button>
                                    </div>
                                )}

                            {criandoCategoria && (
                                <div className="categoria-criacao-rapida">
                                    <div>
                                        <p>
                                            Nova categoria de{' '}
                                            {tipo === 'RECEITA'
                                                ? 'receita'
                                                : 'despesa'}
                                        </p>

                                        <span>
                                            Ela será criada e
                                            selecionada
                                            automaticamente.
                                        </span>
                                    </div>

                                    <input
                                        autoFocus
                                        disabled={
                                            salvandoCategoria
                                        }
                                        maxLength="100"
                                        onChange={(evento) =>
                                            setNovaCategoriaNome(
                                                evento
                                                    .target
                                                    .value,
                                            )
                                        }
                                        placeholder={
                                            tipo === 'RECEITA'
                                                ? 'Ex.: Venda de milho'
                                                : 'Ex.: Combustível'
                                        }
                                        type="text"
                                        value={
                                            novaCategoriaNome
                                        }
                                    />

                                    <div className="categoria-criacao-acoes">
                                        <button
                                            className="categoria-criacao-cancelar"
                                            disabled={
                                                salvandoCategoria
                                            }
                                            onClick={
                                                cancelarNovaCategoria
                                            }
                                            type="button"
                                        >
                                            Cancelar
                                        </button>

                                        <button
                                            className="categoria-criacao-confirmar"
                                            disabled={
                                                salvandoCategoria
                                                || !novaCategoriaNome.trim()
                                            }
                                            onClick={
                                                criarCategoria
                                            }
                                            type="button"
                                        >
                                            {salvandoCategoria
                                                ? 'Criando...'
                                                : 'Criar e selecionar'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {sucessoCategoria && (
                                <p
                                    className="categoria-criada-sucesso"
                                    role="status"
                                >
                                    ✓ {sucessoCategoria}
                                </p>
                            )}

                            <p className="categoria-gerenciar-link">
                                Para editar, desativar ou
                                organizar todas as categorias,
                                acesse{' '}

                                <Link to="/dashboard/categorias">
                                    Gerenciar categorias
                                </Link>
                            </p>
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
                                        evento
                                            .target
                                            .value,
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
                            <Link to="/dashboard">
                                Cancelar
                            </Link>

                            <button
                                disabled={
                                    salvando
                                    || carregandoCategorias
                                    || salvandoCategoria
                                }
                                type="submit"
                            >
                                {salvando
                                    ? 'Salvando...'
                                    : 'Salvar movimentação'}
                            </button>
                        </div>
                    </form>
                </main>
            </div>
        </div>
    )
}

export default NovaMovimentacao
