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
import { voltarPaginaAnterior } from '../navegacao.js'
import './Movimentacoes.css'

function formatarDinheiro(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(valor ?? 0)
}

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

function formatarData(data) {
    if (!data) {
        return ''
    }

    const [ano, mes, dia] = data.split('-')
    return `${dia}/${mes}/${ano}`
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

    return dadosErro?.mensagem ?? mensagemPadrao
}

function normalizarParaComparacao(texto) {
    return String(texto ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase()
}

function categoriaEhOriginal(categoria, movimentacao) {
    return (
        categoria?.tipo === movimentacao?.tipo &&
        normalizarParaComparacao(categoria?.nome) ===
        normalizarParaComparacao(
            movimentacao?.categoriaNome,
        )
    )
}

function Movimentacoes() {
    const navigate = useNavigate()
    const [parametros] = useSearchParams()
    const [sessao] = useState(obterSessao)

    const categoriaId =
        parametros.get('categoriaId')

    const categoriaNome =
        parametros.get('categoriaNome')

    const [
        movimentacoes,
        setMovimentacoes,
    ] = useState([])

    const [
        movimentacoesLixeira,
        setMovimentacoesLixeira,
    ] = useState([])

    const [
        mostrandoLixeira,
        setMostrandoLixeira,
    ] = useState(false)

    const [
        carregando,
        setCarregando,
    ] = useState(true)

    const [erro, setErro] = useState('')

    const [
        excluindoId,
        setExcluindoId,
    ] = useState(null)

    const [
        convertendoId,
        setConvertendoId,
    ] = useState(null)

    const [
        restaurandoId,
        setRestaurandoId,
    ] = useState(null)

    const [
        movimentacaoParaExcluir,
        setMovimentacaoParaExcluir,
    ] = useState(null)

    const [
        movimentacaoParaExcluirPermanente,
        setMovimentacaoParaExcluirPermanente,
    ] = useState(null)

    const [
        movimentacaoParaConverter,
        setMovimentacaoParaConverter,
    ] = useState(null)

    const [
        categoriasConversao,
        setCategoriasConversao,
    ] = useState([])

    const [
        categoriaConversaoId,
        setCategoriaConversaoId,
    ] = useState('')

    const [
        novaCategoriaNome,
        setNovaCategoriaNome,
    ] = useState('')

    const [
        carregandoCategoriasConversao,
        setCarregandoCategoriasConversao,
    ] = useState(false)

    const empresaId =
        sessao?.usuario?.empresaId

    const movimentacoesExibidas = mostrandoLixeira
        ? movimentacoesLixeira
        : movimentacoes

    const categoriaOriginalRestauracao =
        movimentacaoParaConverter
            ?.acaoCategoria === 'restaurar'
            ? categoriasConversao.find((categoria) =>
                categoriaEhOriginal(
                    categoria,
                    movimentacaoParaConverter,
                ),
            )
            : null

    const usandoCategoriaOriginal =
        Boolean(categoriaOriginalRestauracao) &&
        categoriaConversaoId ===
        String(categoriaOriginalRestauracao.id) &&
        !novaCategoriaNome.trim()

    function criarCabecalhos(possuiCorpo = false) {
        const cabecalhos = {
            Authorization:
                `${sessao.tipoToken} ${sessao.token}`,
        }

        if (possuiCorpo) {
            cabecalhos['Content-Type'] =
                'application/json; charset=utf-8'
        }

        return cabecalhos
    }

    useEffect(() => {
        if (!sessao || !empresaId) {
            navigate('/login', {
                replace: true,
            })

            return undefined
        }

        let componenteAtivo = true

        const parametrosDaConsulta =
            new URLSearchParams()

        if (categoriaId) {
            parametrosDaConsulta.set(
                'categoriaId',
                categoriaId,
            )
        }

        const consulta =
            parametrosDaConsulta.toString()

        const endereco =
            `${API_URL}/empresas/${empresaId}/movimentacoes` +
            (consulta ? `?${consulta}` : '')

        async function carregarMovimentacoes() {
            try {
                const resposta = await fetch(endereco, {
                    headers: {
                        Authorization:
                            `${sessao.tipoToken} ${sessao.token}`,
                    },
                })

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
                            'Não foi possível carregar as movimentações.',
                        )

                    throw new Error(mensagem)
                }

                const dados = await resposta.json()

                if (!componenteAtivo) {
                    return
                }

                setMovimentacoes(
                    dados.content ?? [],
                )

                setErro('')
            } catch (erroDaRequisicao) {
                if (!componenteAtivo) {
                    return
                }

                setErro(
                    erroDaRequisicao instanceof Error
                        ? erroDaRequisicao.message
                        : 'Não foi possível carregar as movimentações.',
                )
            } finally {
                if (componenteAtivo) {
                    setCarregando(false)
                }
            }
        }

        carregarMovimentacoes()

        return () => {
            componenteAtivo = false
        }
    }, [
        categoriaId,
        empresaId,
        navigate,
        sessao,
    ])

    async function carregarLixeira() {
        if (!sessao || !empresaId) {
            limparSessao()

            navigate('/login', {
                replace: true,
            })

            return
        }

        setErro('')

        try {
            const resposta = await fetch(
                `${API_URL}/empresas/${empresaId}/movimentacoes/lixeira`,
                {
                    headers: criarCabecalhos(),
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
                throw new Error(
                    await obterMensagemDeErro(
                        resposta,
                        'Não foi possível carregar a lixeira.',
                    ),
                )
            }

            setMovimentacoesLixeira(
                await resposta.json(),
            )
            setMostrandoLixeira(true)
        } catch (erroDaRequisicao) {
            setErro(
                erroDaRequisicao instanceof Error
                    ? erroDaRequisicao.message
                    : 'Não foi possível carregar a lixeira.',
            )
        }
    }

    useEffect(() => {
        if (
            parametros.get('lixeira') === '1' &&
            !mostrandoLixeira
        ) {
            void carregarLixeira()
        }
    }, [
        parametros,
        mostrandoLixeira,
    ])

    async function excluirMovimentacao(
        movimentacao,
    ) {
        if (!sessao || !empresaId) {
            limparSessao()

            navigate('/login', {
                replace: true,
            })

            return
        }

        setExcluindoId(movimentacao.id)
        setErro('')

        try {
            const resposta = await fetch(
                `${API_URL}/empresas/${empresaId}/movimentacoes/${movimentacao.id}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization:
                            `${sessao.tipoToken} ${sessao.token}`,
                    },
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
                        'Não foi possível excluir a movimentação.',
                    )

                throw new Error(mensagem)
            }

            setMovimentacoes(
                (movimentacoesAtuais) =>
                    movimentacoesAtuais.filter(
                        (item) =>
                            item.id !== movimentacao.id,
                    ),
            )
        } catch (erroDaRequisicao) {
            setErro(
                erroDaRequisicao instanceof Error
                    ? erroDaRequisicao.message
                    : 'Não foi possível excluir a movimentação.',
            )
        } finally {
            setExcluindoId(null)
        }
    }

    async function excluirMovimentacaoPermanentemente(
        movimentacao,
    ) {
        if (!sessao || !empresaId) {
            limparSessao()

            navigate('/login', {
                replace: true,
            })

            return
        }

        setExcluindoId(movimentacao.id)
        setErro('')

        try {
            const resposta = await fetch(
                `${API_URL}/empresas/${empresaId}/movimentacoes/${movimentacao.id}/permanente`,
                {
                    method: 'DELETE',
                    headers: criarCabecalhos(),
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
                throw new Error(
                    await obterMensagemDeErro(
                        resposta,
                        'Não foi possível excluir permanentemente a movimentação.',
                    ),
                )
            }

            setMovimentacoesLixeira(
                (movimentacoesAtuais) =>
                    movimentacoesAtuais.filter(
                        (item) =>
                            item.id !== movimentacao.id,
                    ),
            )
        } catch (erroDaRequisicao) {
            setErro(
                erroDaRequisicao instanceof Error
                    ? erroDaRequisicao.message
                    : 'Não foi possível excluir permanentemente a movimentação.',
            )
        } finally {
            setExcluindoId(null)
        }
    }

    function abrirConfirmacaoExclusao(movimentacao) {
        setErro('')
        setMovimentacaoParaExcluir(movimentacao)
    }

    function fecharConfirmacaoExclusao() {
        if (excluindoId) {
            return
        }

        setMovimentacaoParaExcluir(null)
    }

    function fecharConfirmacaoExclusaoPermanente() {
        if (excluindoId) {
            return
        }

        setMovimentacaoParaExcluirPermanente(null)
    }

    async function confirmarExclusao() {
        if (!movimentacaoParaExcluir) {
            return
        }

        await excluirMovimentacao(
            movimentacaoParaExcluir,
        )

        setMovimentacaoParaExcluir(null)
    }

    async function confirmarExclusaoPermanente() {
        if (!movimentacaoParaExcluirPermanente) {
            return
        }

        await excluirMovimentacaoPermanentemente(
            movimentacaoParaExcluirPermanente,
        )

        setMovimentacaoParaExcluirPermanente(null)
    }

    async function prepararAcaoCategoria(
        movimentacao,
        tipoDestino,
        acao,
    ) {
        if (!sessao || !empresaId) {
            limparSessao()

            navigate('/login', {
                replace: true,
            })

            return
        }

        setErro('')
        setMovimentacaoParaConverter({
            ...movimentacao,
            acaoCategoria: acao,
            tipoDestino,
        })
        setCategoriaConversaoId('')
        setNovaCategoriaNome('')
        setCategoriasConversao([])

        try {
            setCarregandoCategoriasConversao(true)

            const resposta = await fetch(
                `${API_URL}/empresas/${empresaId}/categorias?tipo=${tipoDestino}`,
                {
                    headers: criarCabecalhos(),
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
                throw new Error(
                    await obterMensagemDeErro(
                        resposta,
                        'Não foi possível carregar as categorias.',
                    ),
                )
            }

            const dados = await resposta.json()
            const categoriasAtivas =
                Array.isArray(dados)
                    ? dados.filter(
                        (categoria) =>
                            categoria.ativo,
                    )
                    : []

            setCategoriasConversao(categoriasAtivas)

            const categoriaOriginal =
                acao === 'restaurar'
                    ? categoriasAtivas.find(
                        (categoria) =>
                            categoriaEhOriginal(
                                categoria,
                                movimentacao,
                            ),
                    )
                    : null

            const categoriaInicial =
                categoriaOriginal ?? categoriasAtivas[0]

            if (categoriaInicial) {
                setCategoriaConversaoId(
                    String(categoriaInicial.id),
                )
            }
        } catch (erroDaRequisicao) {
            setErro(
                erroDaRequisicao instanceof Error
                    ? erroDaRequisicao.message
                    : 'Não foi possível carregar as categorias.',
            )
        } finally {
            setCarregandoCategoriasConversao(false)
        }
    }

    async function abrirConversao(movimentacao) {
        const tipoDestino =
            movimentacao.tipo === 'RECEITA'
                ? 'DESPESA'
                : 'RECEITA'

        await prepararAcaoCategoria(
            movimentacao,
            tipoDestino,
            'converter',
        )
    }

    async function abrirTrocaCategoria(movimentacao) {
        await prepararAcaoCategoria(
            movimentacao,
            movimentacao.tipo,
            'categoria',
        )
    }

    async function abrirRestauracao(movimentacao) {
        await prepararAcaoCategoria(
            movimentacao,
            movimentacao.tipo,
            'restaurar',
        )
    }

    function fecharConversao() {
        if (convertendoId) {
            return
        }

        setMovimentacaoParaConverter(null)
        setCategoriasConversao([])
        setCategoriaConversaoId('')
        setNovaCategoriaNome('')
    }

    async function confirmarConversao(evento) {
        evento.preventDefault()

        if (
            !movimentacaoParaConverter ||
            (!categoriaConversaoId && !novaCategoriaNome.trim())
        ) {
            setErro(
                'Escolha uma categoria ou crie uma nova.',
            )
            return
        }

        const tipoDestino =
            movimentacaoParaConverter.tipoDestino
            ?? movimentacaoParaConverter.tipo

        try {
            if (
                movimentacaoParaConverter
                    .acaoCategoria === 'restaurar'
            ) {
                setRestaurandoId(
                    movimentacaoParaConverter.id,
                )
            } else {
                setConvertendoId(
                    movimentacaoParaConverter.id,
                )
            }

            setErro('')

            let categoriaDestinoId =
                categoriaConversaoId

            if (novaCategoriaNome.trim()) {
                const respostaCategoria = await fetch(
                    `${API_URL}/empresas/${empresaId}/categorias`,
                    {
                        method: 'POST',
                        headers: criarCabecalhos(true),
                        body: JSON.stringify({
                            nome: novaCategoriaNome.trim(),
                            tipo: tipoDestino,
                        }),
                    },
                )

                if (!respostaCategoria.ok) {
                    throw new Error(
                        await obterMensagemDeErro(
                            respostaCategoria,
                            'Não foi possível criar a categoria.',
                        ),
                    )
                }

                const categoriaCriada =
                    await respostaCategoria.json()

                categoriaDestinoId =
                    String(categoriaCriada.id)
            }

            const acao =
                movimentacaoParaConverter.acaoCategoria

            const caminho =
                acao === 'restaurar'
                    ? 'restaurar'
                    : acao === 'converter'
                        ? 'converter-tipo'
                        : 'categoria'

            const resposta = await fetch(
                `${API_URL}/empresas/${empresaId}/movimentacoes/${movimentacaoParaConverter.id}/${caminho}`,
                {
                    method: 'PATCH',
                    headers: criarCabecalhos(true),
                    body: JSON.stringify({
                        categoriaId:
                            Number(categoriaDestinoId),
                    }),
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
                throw new Error(
                    await obterMensagemDeErro(
                        resposta,
                        'Não foi possível trocar o tipo da movimentação.',
                    ),
                )
            }

            const movimentacaoAtualizada =
                await resposta.json()

            if (acao === 'restaurar') {
                setMovimentacoesLixeira(
                    (movimentacoesAtuais) =>
                        movimentacoesAtuais.filter(
                            (item) =>
                                item.id !==
                                movimentacaoAtualizada.id,
                        ),
                )
            } else {
                setMovimentacoes(
                    (movimentacoesAtuais) =>
                        movimentacoesAtuais.map((item) =>
                            item.id ===
                            movimentacaoAtualizada.id
                                ? movimentacaoAtualizada
                                : item,
                        ),
                )
            }

            fecharConversao()
        } catch (erroDaRequisicao) {
            setErro(
                erroDaRequisicao instanceof Error
                    ? erroDaRequisicao.message
                    : 'Não foi possível trocar o tipo da movimentação.',
            )
        } finally {
            setConvertendoId(null)
            setRestaurandoId(null)
        }
    }

    if (!sessao) {
        return null
    }

    if (carregando) {
        return (
            <main className="movimentacoes-pagina movimentacoes-estado">
                <p>Carregando movimentações...</p>
            </main>
        )
    }

    return (
        <main className="movimentacoes-pagina">
            <header className="movimentacoes-cabecalho">
                <div>
                    <button
                        className="movimentacoes-voltar"
                        onClick={() =>
                            voltarPaginaAnterior(
                                navigate,
                                categoriaId
                                    ? '/dashboard/categorias'
                                    : '/dashboard',
                            )
                        }
                        type="button"
                    >
                        {categoriaId
                            ? '← Voltar às categorias'
                            : '← Voltar ao dashboard'}
                    </button>

                    <p className="movimentacoes-etiqueta">
                        AGROGESTÃO
                    </p>

                    <h1>
                        {categoriaId
                            ? categoriaNome ||
                            'Categoria selecionada'
                            : 'Movimentações financeiras'}
                    </h1>

                    <p className="movimentacoes-descricao">
                        {categoriaId
                            ? 'Veja todas as movimentações vinculadas a esta categoria.'
                            : 'Consulte, altere ou exclua as receitas e despesas da sua propriedade rural.'}
                    </p>

                    {categoriaId && (
                        <Link
                            className="movimentacoes-limpar-filtro"
                            to="/dashboard/movimentacoes"
                        >
                            Ver todas as movimentações
                        </Link>
                    )}
                </div>

                <div className="movimentacoes-cabecalho-acoes">
                    <button
                        className="movimentacoes-lixeira"
                        onClick={() => {
                            if (mostrandoLixeira) {
                                setMostrandoLixeira(false)
                            } else {
                                void carregarLixeira()
                            }
                        }}
                        type="button"
                    >
                        <IconeLixeira />
                        {mostrandoLixeira
                            ? 'Ver movimentações'
                            : 'Lixeira'}
                    </button>

                    <Link
                        className="movimentacoes-nova"
                        to="/dashboard/movimentacoes/nova?tipo=RECEITA"
                    >
                        + Nova movimentação
                    </Link>
                </div>
            </header>

            {erro && (
                <div
                    className="movimentacoes-alerta"
                    role="alert"
                >
                    {erro}
                </div>
            )}

            <section className="movimentacoes-card">
                {movimentacoesExibidas.length === 0 ? (
                    <div className="movimentacoes-vazio">
                        <h2>
                            {mostrandoLixeira
                                ? 'A lixeira está vazia'
                                : categoriaId
                                ? 'Esta categoria ainda não possui movimentações'
                                : 'Nenhuma movimentação encontrada'}
                        </h2>

                        <p>
                            {mostrandoLixeira
                                ? 'As movimentações excluídas aparecerão aqui para restauração.'
                                : categoriaId
                                ? 'Cadastre uma movimentação utilizando esta categoria para que ela apareça aqui.'
                                : 'Cadastre uma receita ou despesa para começar o controle financeiro.'}
                        </p>
                    </div>
                ) : (
                    <div className="movimentacoes-tabela-container">
                        <table className="movimentacoes-tabela">
                            <thead>
                            <tr>
                                <th>Data</th>
                                <th>Descrição</th>
                                <th>Categoria</th>
                                <th>Tipo</th>
                                <th>Valor</th>
                                <th>Ações</th>
                            </tr>
                            </thead>

                            <tbody>
                            {movimentacoesExibidas.map(
                                (movimentacao) => (
                                    <tr
                                        key={
                                            movimentacao.id
                                        }
                                    >
                                        <td>
                                            {formatarData(
                                                movimentacao.dataMovimentacao,
                                            )}
                                        </td>

                                        <td>
                                            <strong>
                                                {
                                                    movimentacao.descricao
                                                }
                                            </strong>

                                            {movimentacao.observacao && (
                                                <small>
                                                    {
                                                        movimentacao.observacao
                                                    }
                                                </small>
                                            )}

                                            {movimentacao.fornecedorNome && (
                                                <small>
                                                    Fornecedor:{' '}
                                                    {movimentacao.fornecedorNome}
                                                    {movimentacao.compradorNome
                                                        ? ` - Comprador: ${movimentacao.compradorNome}`
                                                        : ''}
                                                </small>
                                            )}
                                        </td>

                                        <td>
                                            {
                                                movimentacao.categoriaNome
                                            }
                                        </td>

                                        <td>
                                                <span
                                                    className={
                                                        movimentacao.tipo ===
                                                        'RECEITA'
                                                            ? 'movimentacoes-tipo receita'
                                                            : 'movimentacoes-tipo despesa'
                                                    }
                                                >
                                                    {movimentacao.tipo ===
                                                    'RECEITA'
                                                        ? 'Receita'
                                                        : 'Despesa'}
                                                </span>
                                        </td>

                                        <td
                                            className={
                                                movimentacao.tipo ===
                                                'RECEITA'
                                                    ? 'movimentacoes-valor receita'
                                                    : 'movimentacoes-valor despesa'
                                            }
                                        >
                                            {movimentacao.tipo ===
                                            'RECEITA'
                                                ? '+'
                                                : '-'}{' '}

                                            {formatarDinheiro(
                                                movimentacao.valor,
                                            )}
                                        </td>

                                        <td>
                                            <div
                                                className={
                                                    mostrandoLixeira
                                                        ? 'movimentacoes-acoes movimentacoes-acoes-lixeira'
                                                        : 'movimentacoes-acoes'
                                                }
                                            >
                                                {mostrandoLixeira ? (
                                                    <>
                                                        <button
                                                            className="movimentacoes-trocar"
                                                            disabled={
                                                                restaurandoId ===
                                                                movimentacao.id
                                                            }
                                                            onClick={() =>
                                                                abrirRestauracao(
                                                                    movimentacao,
                                                                )
                                                            }
                                                            type="button"
                                                        >
                                                            {restaurandoId ===
                                                            movimentacao.id
                                                                ? 'Restaurando...'
                                                                : 'Restaurar movimentação'}
                                                        </button>

                                                        <button
                                                            className="movimentacoes-excluir"
                                                            disabled={
                                                                excluindoId ===
                                                                movimentacao.id
                                                            }
                                                            onClick={() =>
                                                                setMovimentacaoParaExcluirPermanente(
                                                                    movimentacao,
                                                                )
                                                            }
                                                            type="button"
                                                        >
                                                            {excluindoId ===
                                                            movimentacao.id
                                                                ? 'Excluindo...'
                                                                : 'Excluir permanentemente'}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Link
                                                            className="movimentacoes-editar"
                                                            to={`/dashboard/movimentacoes/${movimentacao.id}/editar`}
                                                        >
                                                            Editar
                                                        </Link>

                                                        <button
                                                            className="movimentacoes-trocar"
                                                            disabled={
                                                                convertendoId ===
                                                                movimentacao.id
                                                            }
                                                            onClick={() =>
                                                                abrirTrocaCategoria(
                                                                    movimentacao,
                                                                )
                                                            }
                                                            type="button"
                                                        >
                                                            Trocar categoria
                                                        </button>

                                                        <button
                                                            className="movimentacoes-trocar"
                                                            disabled={
                                                                convertendoId ===
                                                                movimentacao.id
                                                            }
                                                            onClick={() =>
                                                                abrirConversao(
                                                                    movimentacao,
                                                                )
                                                            }
                                                            type="button"
                                                        >
                                                            Trocar tipo
                                                        </button>

                                                        <button
                                                            className="movimentacoes-excluir"
                                                            disabled={
                                                                excluindoId ===
                                                                movimentacao.id
                                                            }
                                                            onClick={() =>
                                                                abrirConfirmacaoExclusao(
                                                                    movimentacao,
                                                                )
                                                            }
                                                            type="button"
                                                        >
                                                            {excluindoId ===
                                                            movimentacao.id
                                                                ? 'Excluindo...'
                                                                : 'Excluir'}
                                                        </button>
                                                    </>
                                                )}
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

            {movimentacaoParaExcluir && (
                <div
                    className="movimentacoes-modal-fundo"
                    role="presentation"
                >
                    <section
                        aria-modal="true"
                        className="movimentacoes-modal"
                        role="dialog"
                    >
                        <div className="movimentacoes-modal-topo">
                            <p className="movimentacoes-etiqueta">
                                Confirmação necessária
                            </p>

                            <button
                                aria-label="Fechar confirmação"
                                onClick={
                                    fecharConfirmacaoExclusao
                                }
                                type="button"
                            >
                                ×
                            </button>
                        </div>

                        <h2>Enviar para a lixeira?</h2>

                        <p>
                            A movimentação "
                            {movimentacaoParaExcluir.descricao}
                            " sairá das telas e relatórios, mas
                            poderá ser restaurada pela lixeira.
                        </p>

                        <div className="movimentacoes-modal-acoes">
                            <button
                                className="movimentacoes-modal-cancelar"
                                onClick={
                                    fecharConfirmacaoExclusao
                                }
                                type="button"
                            >
                                Voltar
                            </button>

                            <button
                                className="movimentacoes-modal-confirmar"
                                disabled={Boolean(
                                    excluindoId,
                                )}
                                onClick={confirmarExclusao}
                                type="button"
                            >
                                {excluindoId
                                    ? 'Excluindo...'
                                    : 'Sim, enviar para lixeira'}
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {movimentacaoParaExcluirPermanente && (
                <div
                    className="movimentacoes-modal-fundo"
                    role="presentation"
                >
                    <section
                        aria-modal="true"
                        className="movimentacoes-modal"
                        role="dialog"
                    >
                        <div className="movimentacoes-modal-topo">
                            <p className="movimentacoes-etiqueta">
                                Exclusão definitiva
                            </p>

                            <button
                                aria-label="Fechar confirmação"
                                onClick={
                                    fecharConfirmacaoExclusaoPermanente
                                }
                                type="button"
                            >
                                ×
                            </button>
                        </div>

                        <h2>Excluir permanentemente?</h2>

                        <p>
                            A movimentação "
                            {movimentacaoParaExcluirPermanente.descricao}
                            " será apagada de vez e não poderá ser
                            recuperada.
                        </p>

                        <div className="movimentacoes-modal-acoes">
                            <button
                                className="movimentacoes-modal-cancelar"
                                onClick={
                                    fecharConfirmacaoExclusaoPermanente
                                }
                                type="button"
                            >
                                Voltar
                            </button>

                            <button
                                className="movimentacoes-modal-confirmar"
                                disabled={Boolean(
                                    excluindoId,
                                )}
                                onClick={
                                    confirmarExclusaoPermanente
                                }
                                type="button"
                            >
                                {excluindoId
                                    ? 'Excluindo...'
                                    : 'Sim, excluir de vez'}
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {movimentacaoParaConverter && (
                <div
                    className="movimentacoes-modal-fundo"
                    role="presentation"
                >
                    <section
                        aria-modal="true"
                        className="movimentacoes-modal"
                        role="dialog"
                    >
                        <div className="movimentacoes-modal-topo">
                            <p className="movimentacoes-etiqueta">
                                {movimentacaoParaConverter.acaoCategoria ===
                                'restaurar'
                                          ? 'Restaurar movimentação'
                                    : movimentacaoParaConverter.acaoCategoria ===
                                        'categoria'
                                      ? 'Trocar categoria'
                                      : 'Trocar tipo'}
                            </p>

                            <button
                                aria-label="Fechar janela"
                                onClick={fecharConversao}
                                type="button"
                            >
                                ×
                            </button>
                        </div>

                        <h2>
                            {movimentacaoParaConverter.acaoCategoria ===
                            'restaurar'
                                ? 'Escolha onde restaurar'
                                : movimentacaoParaConverter.acaoCategoria ===
                                    'categoria'
                                  ? 'Escolha outra categoria'
                                  : movimentacaoParaConverter.tipo ===
                                    'RECEITA'
                                    ? 'Mover para despesa'
                                    : 'Mover para receita'}
                        </h2>

                        <p>
                            Escolha uma categoria existente ou crie uma nova para "
                            {movimentacaoParaConverter.descricao}
                            ". O valor e a data serão mantidos.
                        </p>

                        <form
                            className="movimentacoes-modal-form"
                            onSubmit={confirmarConversao}
                        >
                            {movimentacaoParaConverter.acaoCategoria ===
                                'restaurar' && (
                                <div className="movimentacoes-restauracao-opcoes">
                                    <strong>
                                        Categoria original
                                    </strong>

                                    {categoriaOriginalRestauracao ? (
                                        <button
                                            className={
                                                usandoCategoriaOriginal
                                                    ? 'movimentacoes-opcao-original selecionada'
                                                    : 'movimentacoes-opcao-original'
                                            }
                                            disabled={
                                                carregandoCategoriasConversao ||
                                                Boolean(restaurandoId)
                                            }
                                            onClick={() => {
                                                setCategoriaConversaoId(
                                                    String(
                                                        categoriaOriginalRestauracao.id,
                                                    ),
                                                )
                                                setNovaCategoriaNome('')
                                            }}
                                            type="button"
                                        >
                                            Restaurar em{' '}
                                            {
                                                categoriaOriginalRestauracao.nome
                                            }
                                        </button>
                                    ) : (
                                        <p>
                                            A categoria original "
                                            {
                                                movimentacaoParaConverter.categoriaNome
                                            }
                                            " não está ativa ou não
                                            existe mais. Escolha outra
                                            categoria abaixo ou crie uma
                                            nova.
                                        </p>
                                    )}
                                </div>
                            )}
                            <label htmlFor="categoriaConversao">
                                {movimentacaoParaConverter.acaoCategoria ===
                                'restaurar'
                                    ? 'Restaurar para outra categoria'
                                    : 'Categoria de destino'}
                            </label>

                            <select
                                disabled={
                                    carregandoCategoriasConversao ||
                                    Boolean(convertendoId) ||
                                    Boolean(restaurandoId)
                                }
                                id="categoriaConversao"
                                onChange={(evento) =>
                                    setCategoriaConversaoId(
                                        evento.target.value,
                                    )
                                }
                                value={categoriaConversaoId}
                            >
                                <option value="">
                                    Escolher categoria existente
                                </option>

                                {carregandoCategoriasConversao ? (
                                    <option value="">
                                        Carregando categorias...
                                    </option>
                                ) : categoriasConversao.length ===
                                0 ? (
                                    <option value="">
                                        Nenhuma categoria ativa
                                        encontrada
                                    </option>
                                ) : (
                                    categoriasConversao.map(
                                        (categoria) => (
                                            <option
                                                key={
                                                    categoria.id
                                                }
                                                value={
                                                    categoria.id
                                                }
                                            >
                                                {categoria.nome}
                                            </option>
                                        ),
                                    )
                                )}
                            </select>

                            <label htmlFor="novaCategoriaMovimentacao">
                                Ou criar nova categoria
                            </label>

                            <input
                                disabled={
                                    carregandoCategoriasConversao ||
                                    Boolean(convertendoId) ||
                                    Boolean(restaurandoId)
                                }
                                id="novaCategoriaMovimentacao"
                                maxLength="100"
                                onChange={(evento) =>
                                    setNovaCategoriaNome(
                                        evento.target.value,
                                    )
                                }
                                placeholder="Ex.: Venda de milho"
                                type="text"
                                value={novaCategoriaNome}
                            />

                            <div className="movimentacoes-modal-acoes">
                                <button
                                    className="movimentacoes-modal-cancelar"
                                    onClick={fecharConversao}
                                    type="button"
                                >
                                    Voltar
                                </button>

                                <button
                                    className="movimentacoes-modal-confirmar"
                                    disabled={
                                        carregandoCategoriasConversao ||
                                        Boolean(convertendoId) ||
                                        Boolean(restaurandoId) ||
                                        (!categoriaConversaoId &&
                                            !novaCategoriaNome.trim())
                                    }
                                    type="submit"
                                >
                                    {convertendoId || restaurandoId
                                        ? 'Salvando...'
                                        : movimentacaoParaConverter
                                            .acaoCategoria ===
                                          'restaurar'
                                          ? 'Restaurar movimentação'
                                          : 'Confirmar troca'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </main>
    )
}

export default Movimentacoes
