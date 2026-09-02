import {
    useEffect,
    useState,
} from 'react'
import {
    Link,
    useNavigate,
    useSearchParams,
} from 'react-router'
import './Movimentacoes.css'

import { API_BASE_URL as API_URL } from '../config.js'

function formatarDinheiro(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(valor ?? 0)
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
        movimentacaoParaExcluir,
        setMovimentacaoParaExcluir,
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
        carregandoCategoriasConversao,
        setCarregandoCategoriasConversao,
    ] = useState(false)

    const empresaId =
        sessao?.usuario?.empresaId

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

    async function confirmarExclusao() {
        if (!movimentacaoParaExcluir) {
            return
        }

        await excluirMovimentacao(
            movimentacaoParaExcluir,
        )

        setMovimentacaoParaExcluir(null)
    }

    async function abrirConversao(movimentacao) {
        if (!sessao || !empresaId) {
            limparSessao()

            navigate('/login', {
                replace: true,
            })

            return
        }

        const tipoDestino =
            movimentacao.tipo === 'RECEITA'
                ? 'DESPESA'
                : 'RECEITA'

        setErro('')
        setMovimentacaoParaConverter(movimentacao)
        setCategoriaConversaoId('')
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

            if (categoriasAtivas.length > 0) {
                setCategoriaConversaoId(
                    String(categoriasAtivas[0].id),
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

    function fecharConversao() {
        if (convertendoId) {
            return
        }

        setMovimentacaoParaConverter(null)
        setCategoriasConversao([])
        setCategoriaConversaoId('')
    }

    async function confirmarConversao(evento) {
        evento.preventDefault()

        if (
            !movimentacaoParaConverter ||
            !categoriaConversaoId
        ) {
            setErro(
                'Escolha uma categoria para concluir a troca.',
            )
            return
        }

        const tipoDestino =
            movimentacaoParaConverter.tipo === 'RECEITA'
                ? 'DESPESA'
                : 'RECEITA'

        const corpo = {
            descricao:
                movimentacaoParaConverter.descricao,
            valor: movimentacaoParaConverter.valor,
            tipo: tipoDestino,
            categoriaId: Number(categoriaConversaoId),
            dataMovimentacao:
                movimentacaoParaConverter.dataMovimentacao,
            observacao:
                movimentacaoParaConverter.observacao
                ?? null,
        }

        try {
            setConvertendoId(
                movimentacaoParaConverter.id,
            )
            setErro('')

            const resposta = await fetch(
                `${API_URL}/empresas/${empresaId}/movimentacoes/${movimentacaoParaConverter.id}`,
                {
                    method: 'PUT',
                    headers: criarCabecalhos(true),
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
                throw new Error(
                    await obterMensagemDeErro(
                        resposta,
                        'Não foi possível trocar o tipo da movimentação.',
                    ),
                )
            }

            const movimentacaoAtualizada =
                await resposta.json()

            setMovimentacoes(
                (movimentacoesAtuais) =>
                    movimentacoesAtuais.map((item) =>
                        item.id ===
                        movimentacaoAtualizada.id
                            ? movimentacaoAtualizada
                            : item,
                    ),
            )

            fecharConversao()
        } catch (erroDaRequisicao) {
            setErro(
                erroDaRequisicao instanceof Error
                    ? erroDaRequisicao.message
                    : 'Não foi possível trocar o tipo da movimentação.',
            )
        } finally {
            setConvertendoId(null)
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
                    <Link
                        className="movimentacoes-voltar"
                        to={
                            categoriaId
                                ? '/dashboard/categorias'
                                : '/dashboard'
                        }
                    >
                        {categoriaId
                            ? '← Voltar às categorias'
                            : '← Voltar ao dashboard'}
                    </Link>

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

                <Link
                    className="movimentacoes-nova"
                    to="/dashboard/movimentacoes/nova?tipo=RECEITA"
                >
                    + Nova movimentação
                </Link>
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
                {movimentacoes.length === 0 ? (
                    <div className="movimentacoes-vazio">
                        <h2>
                            {categoriaId
                                ? 'Esta categoria ainda não possui movimentações'
                                : 'Nenhuma movimentação encontrada'}
                        </h2>

                        <p>
                            {categoriaId
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
                            {movimentacoes.map(
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
                                            <div className="movimentacoes-acoes">
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

                        <h2>Excluir movimentação?</h2>

                        <p>
                            A movimentação "
                            {movimentacaoParaExcluir.descricao}
                            " será removida definitivamente.
                            Depois disso, não será possível
                            recuperar esse lançamento.
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
                                    : 'Sim, excluir'}
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
                                Trocar tipo
                            </p>

                            <button
                                aria-label="Fechar troca de tipo"
                                onClick={fecharConversao}
                                type="button"
                            >
                                ×
                            </button>
                        </div>

                        <h2>
                            {movimentacaoParaConverter.tipo ===
                            'RECEITA'
                                ? 'Mover para despesa'
                                : 'Mover para receita'}
                        </h2>

                        <p>
                            Escolha a nova categoria para "
                            {movimentacaoParaConverter.descricao}
                            ". O valor e a data serão mantidos.
                        </p>

                        <form
                            className="movimentacoes-modal-form"
                            onSubmit={confirmarConversao}
                        >
                            <label htmlFor="categoriaConversao">
                                Categoria de destino
                            </label>

                            <select
                                disabled={
                                    carregandoCategoriasConversao ||
                                    Boolean(convertendoId)
                                }
                                id="categoriaConversao"
                                onChange={(evento) =>
                                    setCategoriaConversaoId(
                                        evento.target.value,
                                    )
                                }
                                required
                                value={categoriaConversaoId}
                            >
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

                            {categoriasConversao.length === 0 &&
                                !carregandoCategoriasConversao && (
                                    <button
                                        className="movimentacoes-modal-link"
                                        onClick={() =>
                                            navigate(
                                                '/dashboard/categorias',
                                            )
                                        }
                                        type="button"
                                    >
                                        Criar categoria
                                    </button>
                                )}

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
                                        !categoriaConversaoId
                                    }
                                    type="submit"
                                >
                                    {convertendoId
                                        ? 'Salvando...'
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
