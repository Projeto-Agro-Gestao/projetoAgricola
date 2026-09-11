import {
    useCallback,
    useEffect,
    useState,
} from 'react'
import {
    Link,
    useNavigate,
} from 'react-router'
import { API_BASE_URL } from '../config.js'
import './Categorias.css'

const AREAS_CATEGORIA = [
    {
        valor: 'GERAL',
        rotulo: 'Geral',
    },
    {
        valor: 'AGRICULTURA',
        rotulo: 'Agricultura',
    },
    {
        valor: 'PECUARIA',
        rotulo: 'Pecuaria',
    },
]

function obterRotuloArea(area) {
    return AREAS_CATEGORIA.find(
        (item) => item.valor === area,
    )?.rotulo ?? 'Geral'
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

function criarErro(mensagem, status) {
    const erro = new Error(mensagem)
    erro.status = status
    return erro
}

async function obterMensagemDeErro(
    resposta,
    mensagemPadrao,
) {
    const dadosErro = await resposta
        .json()
        .catch(() => null)

    if (dadosErro?.mensagem) {
        return dadosErro.mensagem
    }

    if (dadosErro?.campos) {
        const mensagensDosCampos =
            Object.values(dadosErro.campos)

        if (mensagensDosCampos.length > 0) {
            return mensagensDosCampos.join(' ')
        }
    }

    return mensagemPadrao
}

function Categorias() {
    const navigate = useNavigate()
    const [sessao] = useState(obterSessao)
    const [categorias, setCategorias] = useState([])
    const [carregando, setCarregando] = useState(true)
    const [salvando, setSalvando] = useState(false)
    const [alterandoId, setAlterandoId] = useState(null)
    const [excluindoId, setExcluindoId] = useState(null)

    const [
        categoriaEmEdicao,
        setCategoriaEmEdicao,
    ] = useState(null)

    const [nome, setNome] = useState('')
    const [tipo, setTipo] = useState('RECEITA')
    const [area, setArea] = useState('GERAL')
    const [erro, setErro] = useState('')
    const [sucesso, setSucesso] = useState('')
    const [confirmacao, setConfirmacao] =
        useState(null)
    const [
        avisoCategoriaBloqueada,
        setAvisoCategoriaBloqueada,
    ] = useState('')

    const empresaId =
        sessao?.usuario?.empresaId

    const apiUrl = empresaId
        ? `${API_BASE_URL}/empresas/${empresaId}/categorias`
        : null

    const criarCabecalhos = useCallback(
        (possuiCorpo = false) => {
            const cabecalhos = {
                Authorization:
                    `${sessao.tipoToken} ${sessao.token}`,
            }

            if (possuiCorpo) {
                cabecalhos['Content-Type'] =
                    'application/json; charset=utf-8'
            }

            return cabecalhos
        },
        [sessao],
    )

    const tratarFalhaDeAutenticacao = useCallback(
        (status) => {
            if (status === 401 || status === 403) {
                limparSessao()

                navigate('/login', {
                    replace: true,
                })

                return true
            }

            return false
        },
        [navigate],
    )

    const buscarCategoriasNaApi = useCallback(
        async () => {
            if (!sessao || !apiUrl) {
                throw criarErro(
                    'Faça login para acessar as categorias.',
                    401,
                )
            }

            const resposta = await fetch(
                `${apiUrl}/todas`,
                {
                    headers: criarCabecalhos(),
                },
            )

            if (!resposta.ok) {
                const mensagem =
                    await obterMensagemDeErro(
                        resposta,
                        'Não foi possível carregar as categorias.',
                    )

                throw criarErro(
                    mensagem,
                    resposta.status,
                )
            }

            return resposta.json()
        },
        [
            apiUrl,
            criarCabecalhos,
            sessao,
        ],
    )

    const carregarCategorias = useCallback(
        async () => {
            try {
                const dados =
                    await buscarCategoriasNaApi()

                setCategorias(dados)
                setErro('')
            } catch (erroDaRequisicao) {
                if (
                    tratarFalhaDeAutenticacao(
                        erroDaRequisicao.status,
                    )
                ) {
                    return
                }

                setErro(
                    erroDaRequisicao.message ??
                    'Não foi possível carregar as categorias.',
                )
            }
        },
        [
            buscarCategoriasNaApi,
            tratarFalhaDeAutenticacao,
        ],
    )

    useEffect(() => {
        if (!sessao) {
            navigate('/login', {
                replace: true,
            })

            return undefined
        }

        let componenteAtivo = true

        buscarCategoriasNaApi()
            .then((dados) => {
                if (componenteAtivo) {
                    setCategorias(dados)
                    setErro('')
                }
            })
            .catch((erroDaRequisicao) => {
                if (!componenteAtivo) {
                    return
                }

                if (
                    tratarFalhaDeAutenticacao(
                        erroDaRequisicao.status,
                    )
                ) {
                    return
                }

                setErro(
                    erroDaRequisicao.message ??
                    'Não foi possível carregar as categorias.',
                )
            })
            .finally(() => {
                if (componenteAtivo) {
                    setCarregando(false)
                }
            })

        return () => {
            componenteAtivo = false
        }
    }, [
        buscarCategoriasNaApi,
        navigate,
        sessao,
        tratarFalhaDeAutenticacao,
    ])

    const categoriasDeReceita = categorias.filter(
        (categoria) =>
            categoria.tipo === 'RECEITA',
    )

    const categoriasDeDespesa = categorias.filter(
        (categoria) =>
            categoria.tipo === 'DESPESA',
    )

    function limparFormulario() {
        setCategoriaEmEdicao(null)
        setNome('')
        setTipo('RECEITA')
        setArea('GERAL')
        setErro('')
    }

    function iniciarEdicao(categoria) {
        setCategoriaEmEdicao(categoria)
        setNome(categoria.nome)
        setTipo(categoria.tipo)
        setArea(categoria.area ?? 'GERAL')
        setErro('')
        setSucesso('')

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        })
    }

    function criarEnderecoDaCategoria(categoria) {
        const nomeCodificado =
            encodeURIComponent(categoria.nome)

        return (
            '/dashboard/movimentacoes' +
            `?categoriaId=${categoria.id}` +
            `&categoriaNome=${nomeCodificado}`
        )
    }

    async function salvarCategoria(evento) {
        evento.preventDefault()

        setErro('')
        setSucesso('')

        if (!nome.trim()) {
            setErro('Digite o nome da categoria.')
            return
        }

        if (!sessao || !apiUrl) {
            limparSessao()

            navigate('/login', {
                replace: true,
            })

            return
        }

        const editando =
            categoriaEmEdicao !== null

        const endereco = editando
            ? `${apiUrl}/${categoriaEmEdicao.id}`
            : apiUrl

        const corpo = editando
            ? {
                nome: nome.trim(),
                area,
            }
            : {
                nome: nome.trim(),
                tipo,
                area,
            }

        try {
            setSalvando(true)

            const resposta = await fetch(endereco, {
                method: editando ? 'PUT' : 'POST',
                headers: criarCabecalhos(true),
                body: JSON.stringify(corpo),
            })

            if (!resposta.ok) {
                const mensagem =
                    await obterMensagemDeErro(
                        resposta,
                        'Não foi possível salvar a categoria.',
                    )

                throw criarErro(
                    mensagem,
                    resposta.status,
                )
            }

            setSucesso(
                editando
                    ? 'Categoria atualizada com sucesso.'
                    : 'Categoria cadastrada com sucesso.',
            )

            setCategoriaEmEdicao(null)
            setNome('')
            setTipo('RECEITA')
            setArea('GERAL')

            await carregarCategorias()
        } catch (erroDaRequisicao) {
            if (
                tratarFalhaDeAutenticacao(
                    erroDaRequisicao.status,
                )
            ) {
                return
            }

            setErro(
                erroDaRequisicao.message ??
                'Não foi possível salvar a categoria.',
            )
        } finally {
            setSalvando(false)
        }
    }

    async function alterarSituacao(categoria) {
        const acao = categoria.ativo
            ? 'desativar'
            : 'ativar'

        try {
            setAlterandoId(categoria.id)
            setErro('')
            setSucesso('')

            const resposta = await fetch(
                `${apiUrl}/${categoria.id}/${acao}`,
                {
                    method: 'PATCH',
                    headers: criarCabecalhos(),
                },
            )

            if (!resposta.ok) {
                const mensagem =
                    await obterMensagemDeErro(
                        resposta,
                        'Não foi possível alterar a categoria.',
                    )

                throw criarErro(
                    mensagem,
                    resposta.status,
                )
            }

            const categoriaAtualizada =
                await resposta.json()

            setCategorias((categoriasAtuais) =>
                categoriasAtuais
                    .map((item) =>
                        item.id === categoriaAtualizada.id
                            ? categoriaAtualizada
                            : item,
                    )
                    .sort((primeira, segunda) => {
                        if (
                            primeira.ativo !==
                            segunda.ativo
                        ) {
                            return primeira.ativo
                                ? -1
                                : 1
                        }

                        return primeira.nome.localeCompare(
                            segunda.nome,
                            'pt-BR',
                        )
                    }),
            )

            setSucesso(
                categoria.ativo
                    ? 'Categoria desativada com sucesso.'
                    : 'Categoria reativada com sucesso.',
            )

            if (
                categoriaEmEdicao?.id === categoria.id
            ) {
                limparFormulario()
            }
        } catch (erroDaRequisicao) {
            if (
                tratarFalhaDeAutenticacao(
                    erroDaRequisicao.status,
                )
            ) {
                return
            }

            setErro(
                erroDaRequisicao.message ??
                'Não foi possível alterar a categoria.',
            )
        } finally {
            setAlterandoId(null)
        }
    }

    async function excluirCategoria(categoria) {
        try {
            setExcluindoId(categoria.id)
            setErro('')
            setSucesso('')

            const resposta = await fetch(
                `${apiUrl}/${categoria.id}`,
                {
                    method: 'DELETE',
                    headers: criarCabecalhos(),
                },
            )

            if (!resposta.ok) {
                const mensagem =
                    await obterMensagemDeErro(
                        resposta,
                        'Não foi possível excluir a categoria.',
                    )

                throw criarErro(
                    mensagem,
                    resposta.status,
                )
            }

            setCategorias((categoriasAtuais) =>
                categoriasAtuais.filter(
                    (item) =>
                        item.id !== categoria.id,
                ),
            )

            if (
                categoriaEmEdicao?.id === categoria.id
            ) {
                limparFormulario()
            }

            setSucesso(
                `A categoria "${categoria.nome}" foi excluída definitivamente.`,
            )
        } catch (erroDaRequisicao) {
            if (
                tratarFalhaDeAutenticacao(
                    erroDaRequisicao.status,
                )
            ) {
                return
            }

            if (erroDaRequisicao.status === 409) {
                await carregarCategorias()
                setAvisoCategoriaBloqueada(
                    erroDaRequisicao.message ??
                    'Só pode deletar essa categoria após deletar todas as movimentações.',
                )
                return
            }

            setErro(
                erroDaRequisicao.message ??
                'Não foi possível excluir a categoria.',
            )
        } finally {
            setExcluindoId(null)
        }
    }

    function solicitarAlteracaoSituacao(categoria) {
        if (!categoria.ativo) {
            void alterarSituacao(categoria)
            return
        }

        setErro('')
        setSucesso('')
        setConfirmacao({
            tipo: 'desativar',
            categoria,
        })
    }

    function solicitarExclusao(categoria) {
        setErro('')
        setSucesso('')
        setConfirmacao({
            tipo: 'excluir',
            categoria,
        })
    }

    function fecharConfirmacao() {
        if (
            confirmacao?.categoria?.id === alterandoId ||
            confirmacao?.categoria?.id === excluindoId
        ) {
            return
        }

            setConfirmacao(null)
    }

    async function confirmarAcao() {
        if (!confirmacao) {
            return
        }

        if (confirmacao.tipo === 'desativar') {
            await alterarSituacao(
                confirmacao.categoria,
            )
        } else {
            await excluirCategoria(
                confirmacao.categoria,
            )
        }

        setConfirmacao(null)
    }

    function renderizarCategoria(categoria) {
        const ocupada =
            alterandoId === categoria.id ||
            excluindoId === categoria.id

        return (
            <article
                className={`categoria-card ${
                    categoria.ativo
                        ? ''
                        : 'categoria-card-inativa'
                }`}
                key={categoria.id}
            >
                <div className="categoria-card-topo">
                    <span
                        className={`categoria-tipo ${
                            categoria.tipo === 'DESPESA'
                                ? 'categoria-tipo-despesa'
                                : ''
                        }`}
                    >
                        {categoria.tipo === 'RECEITA'
                            ? 'Receita'
                            : 'Despesa'}
                    </span>

                    <span
                        className={`categoria-situacao ${
                            categoria.ativo
                                ? ''
                                : 'categoria-situacao-inativa'
                        }`}
                    >
                        {categoria.ativo
                            ? 'Ativa'
                            : 'Desativada'}
                    </span>
                </div>

                <span className="categoria-area">
                    {obterRotuloArea(categoria.area)}
                </span>

                <h4>{categoria.nome}</h4>
                <p>{categoria.explicacao}</p>

                <Link
                    className="categoria-ver-movimentacoes"
                    to={criarEnderecoDaCategoria(
                        categoria,
                    )}
                >
                    Ver movimentações →
                </Link>

                <div className="categoria-card-acoes">
                    <button
                        className="categoria-editar"
                        disabled={
                            !categoria.ativo ||
                            ocupada
                        }
                        onClick={() =>
                            iniciarEdicao(categoria)
                        }
                        type="button"
                    >
                        Editar
                    </button>

                    <button
                        className={
                            categoria.ativo
                                ? 'categoria-desativar'
                                : 'categoria-ativar'
                        }
                        disabled={ocupada}
                        onClick={() =>
                            solicitarAlteracaoSituacao(
                                categoria,
                            )
                        }
                        type="button"
                    >
                        {alterandoId === categoria.id
                            ? 'Aguarde...'
                            : categoria.ativo
                                ? 'Desativar'
                                : 'Reativar'}
                    </button>

                    <button
                        className="categoria-excluir"
                        disabled={ocupada}
                        onClick={() =>
                            solicitarExclusao(
                                categoria,
                            )
                        }
                        type="button"
                    >
                        {excluindoId === categoria.id
                            ? 'Excluindo...'
                            : 'Excluir'}
                    </button>
                </div>
            </article>
        )
    }

    if (!sessao) {
        return null
    }

    return (
        <main className="categorias-pagina">
            <header className="categorias-cabecalho">
                <Link to="/dashboard">
                    ← Voltar ao dashboard
                </Link>

                <p>AgroGestão</p>
                <h1>Gerenciar categorias</h1>

                <span>
                    Organize as entradas e saídas financeiras
                    da sua propriedade.
                </span>
            </header>

            <section className="categorias-formulario-card">
                <div>
                    <p className="categorias-etiqueta">
                        {categoriaEmEdicao
                            ? 'EDITAR CATEGORIA'
                            : 'NOVA CATEGORIA'}
                    </p>

                    <h2>
                        {categoriaEmEdicao
                            ? 'Alterar nome da categoria'
                            : 'Cadastrar categoria'}
                    </h2>

                    {categoriaEmEdicao && (
                        <p className="categorias-aviso-tipo">
                            O tipo da categoria não pode ser
                            alterado para preservar o histórico
                            financeiro.
                        </p>
                    )}
                </div>

                <form onSubmit={salvarCategoria}>
                    <div className="categorias-formulario-campos">
                        <div className="categorias-campo">
                            <label htmlFor="nomeCategoria">
                                Nome da categoria
                            </label>

                            <input
                                disabled={salvando}
                                id="nomeCategoria"
                                maxLength="100"
                                onChange={(evento) =>
                                    setNome(
                                        evento.target.value,
                                    )
                                }
                                placeholder="Ex.: Ração, insumos ou venda de leite"
                                required
                                type="text"
                                value={nome}
                            />
                        </div>

                        <div className="categorias-campo">
                            <label htmlFor="tipoCategoria">
                                Tipo
                            </label>

                            <select
                                disabled={
                                    categoriaEmEdicao !==
                                    null ||
                                    salvando
                                }
                                id="tipoCategoria"
                                onChange={(evento) =>
                                    setTipo(
                                        evento.target.value,
                                    )
                                }
                                value={tipo}
                            >
                                <option value="RECEITA">
                                    Receita — entrou dinheiro
                                </option>

                                <option value="DESPESA">
                                    Despesa — saiu dinheiro
                                </option>
                            </select>
                        </div>

                        <div className="categorias-campo">
                            <label htmlFor="areaCategoria">
                                Area
                            </label>

                            <select
                                disabled={salvando}
                                id="areaCategoria"
                                onChange={(evento) =>
                                    setArea(
                                        evento.target.value,
                                    )
                                }
                                value={area}
                            >
                                {AREAS_CATEGORIA.map(
                                    (item) => (
                                        <option
                                            key={item.valor}
                                            value={item.valor}
                                        >
                                            {item.rotulo}
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>
                    </div>

                    <div className="categorias-formulario-acoes">
                        {categoriaEmEdicao && (
                            <button
                                className="categorias-cancelar"
                                disabled={salvando}
                                onClick={limparFormulario}
                                type="button"
                            >
                                Cancelar edição
                            </button>
                        )}

                        <button
                            className="categorias-salvar"
                            disabled={salvando}
                            type="submit"
                        >
                            {salvando
                                ? 'Salvando...'
                                : categoriaEmEdicao
                                    ? 'Salvar alteração'
                                    : 'Cadastrar categoria'}
                        </button>
                    </div>
                </form>
            </section>

            {erro && (
                <p
                    className="categorias-mensagem categorias-erro"
                    role="alert"
                >
                    {erro}
                </p>
            )}

            {sucesso && (
                <p
                    className="categorias-mensagem categorias-sucesso"
                    role="status"
                >
                    {sucesso}
                </p>
            )}

            <section className="categorias-listagem">
                <div className="categorias-listagem-topo">
                    <div>
                        <p className="categorias-etiqueta">
                            CATEGORIAS CADASTRADAS
                        </p>

                        <h2>Receitas e Despesas</h2>
                    </div>

                    <span>
                        {categorias.length} categorias
                    </span>
                </div>

                {carregando ? (
                    <p className="categorias-vazio">
                        Carregando categorias...
                    </p>
                ) : (
                    <div className="categorias-colunas">
                        <section className="categorias-grupo categorias-grupo-receitas">
                            <div className="categorias-grupo-cabecalho">
                                <div>
                                    <span>↓</span>
                                    <h3>Receitas</h3>
                                </div>

                                <strong>
                                    {
                                        categoriasDeReceita.length
                                    }
                                </strong>
                            </div>

                            <div className="categorias-grupo-lista">
                                {categoriasDeReceita.length ===
                                0 ? (
                                    <p className="categorias-vazio categorias-vazio-grupo">
                                        Nenhuma categoria de
                                        receita.
                                    </p>
                                ) : (
                                    categoriasDeReceita.map(
                                        renderizarCategoria,
                                    )
                                )}
                            </div>
                        </section>

                        <section className="categorias-grupo categorias-grupo-despesas">
                            <div className="categorias-grupo-cabecalho">
                                <div>
                                    <span>↑</span>
                                    <h3>Despesas</h3>
                                </div>

                                <strong>
                                    {
                                        categoriasDeDespesa.length
                                    }
                                </strong>
                            </div>

                            <div className="categorias-grupo-lista">
                                {categoriasDeDespesa.length ===
                                0 ? (
                                    <p className="categorias-vazio categorias-vazio-grupo">
                                        Nenhuma categoria de
                                        despesa.
                                    </p>
                                ) : (
                                    categoriasDeDespesa.map(
                                        renderizarCategoria,
                                    )
                                )}
                            </div>
                        </section>
                    </div>
                )}
            </section>

            {confirmacao && (
                <div
                    className="categorias-modal-fundo"
                    role="presentation"
                >
                    <section
                        aria-modal="true"
                        className="categorias-modal"
                        role="dialog"
                    >
                        <div className="categorias-modal-topo">
                            <p className="categorias-etiqueta">
                                Confirmação necessária
                            </p>

                            <button
                                aria-label="Fechar confirmação"
                                onClick={fecharConfirmacao}
                                type="button"
                            >
                                ×
                            </button>
                        </div>

                        <h2>
                            {confirmacao.tipo === 'desativar'
                                ? 'Desativar categoria?'
                                : 'Excluir categoria?'}
                        </h2>

                        <p>
                            {confirmacao.tipo === 'desativar'
                                ? `A categoria "${confirmacao.categoria.nome}" será desativada. As movimentações antigas serão preservadas.`
                                : `A categoria "${confirmacao.categoria.nome}" será excluída se nunca tiver sido usada. Se já possuir movimentações, ela será arquivada e só poderá ser revisada após 36 horas.`}
                        </p>

                        {confirmacao.tipo === 'excluir' && (
                            <strong>
                                Depois de excluir uma categoria
                                sem movimentações, não será
                                possível recuperar essa ação.
                            </strong>
                        )}

                        <div className="categorias-modal-acoes">
                            <button
                                className="categorias-modal-cancelar"
                                onClick={fecharConfirmacao}
                                type="button"
                            >
                                Voltar
                            </button>

                            <button
                                className="categorias-modal-confirmar"
                                disabled={
                                    confirmacao.categoria.id ===
                                    alterandoId ||
                                    confirmacao.categoria.id ===
                                    excluindoId
                                }
                                onClick={confirmarAcao}
                                type="button"
                            >
                                {confirmacao.categoria.id ===
                                    alterandoId ||
                                confirmacao.categoria.id ===
                                    excluindoId
                                    ? 'Aguarde...'
                                    : confirmacao.tipo === 'desativar'
                                      ? 'Sim, desativar'
                                      : 'Sim, excluir'}
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {avisoCategoriaBloqueada && (
                <div
                    className="categorias-modal-fundo"
                    role="presentation"
                >
                    <section
                        aria-modal="true"
                        className="categorias-modal"
                        role="dialog"
                    >
                        <div className="categorias-modal-topo">
                            <p className="categorias-etiqueta">
                                Categoria não excluída
                            </p>
                        </div>

                        <h2>Antes, esvazie a categoria</h2>

                        <p>{avisoCategoriaBloqueada}</p>

                        <div className="categorias-modal-acoes">
                            <button
                                className="categorias-modal-confirmar"
                                onClick={() =>
                                    setAvisoCategoriaBloqueada(
                                        '',
                                    )
                                }
                                type="button"
                            >
                                OK
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </main>
    )
}

export default Categorias
