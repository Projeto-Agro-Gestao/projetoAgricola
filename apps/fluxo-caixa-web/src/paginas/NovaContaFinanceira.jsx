import {
    useEffect,
    useMemo,
    useState,
} from 'react'
import {
    useNavigate,
    useSearchParams,
} from 'react-router'
import { API_BASE_URL as API_URL } from '../config.js'
import './NovaContaFinanceira.css'

function completarComZero(numero) {
    return String(numero).padStart(2, '0')
}

function obterDataAtual() {
    const hoje = new Date()

    const ano = hoje.getFullYear()

    const mes =
        completarComZero(
            hoje.getMonth() + 1,
        )

    const dia =
        completarComZero(
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
    const dados =
        await resposta
            .json()
            .catch(() => null)

    if (dados?.campos) {
        const mensagens =
            Object.values(dados.campos)

        if (mensagens.length > 0) {
            return mensagens[0]
        }
    }

    return dados?.mensagem
        ?? mensagemPadrao
}

function NovaContaFinanceira() {
    const navigate = useNavigate()

    const [parametros] =
        useSearchParams()

    const [sessao] =
        useState(obterSessao)

    const tipoInicial =
        parametros.get('tipo')
        === 'RECEBER'
            ? 'RECEBER'
            : 'PAGAR'

    const [tipo, setTipo] =
        useState(tipoInicial)

    const [categorias, setCategorias] =
        useState([])

    const [
        categoriaId,
        setCategoriaId,
    ] = useState('')

    const [descricao, setDescricao] =
        useState('')

    const [favorecido, setFavorecido] =
        useState('')

    const [
        numeroDocumento,
        setNumeroDocumento,
    ] = useState('')

    const [valorTotal, setValorTotal] =
        useState('')

    const [
        dataEmissao,
        setDataEmissao,
    ] = useState(obterDataAtual)

    const [
        dataVencimento,
        setDataVencimento,
    ] = useState(obterDataAtual)

    const [
        lembreteAtivo,
        setLembreteAtivo,
    ] = useState(true)

    const [
        antecedenciaLembreteDias,
        setAntecedenciaLembreteDias,
    ] = useState('2')

    const [observacao, setObservacao] =
        useState('')

    const [
        carregandoCategorias,
        setCarregandoCategorias,
    ] = useState(true)

    const [salvando, setSalvando] =
        useState(false)

    const [erro, setErro] =
        useState('')

    const tipoCategoria =
        tipo === 'PAGAR'
            ? 'DESPESA'
            : 'RECEITA'

    const textoTipo =
        tipo === 'PAGAR'
            ? 'Conta a pagar'
            : 'Conta a receber'

    const explicacaoTipo =
        tipo === 'PAGAR'
            ? 'Dinheiro que deverá sair'
            : 'Dinheiro que deverá entrar'

    const formularioValido =
        useMemo(
            () =>
                descricao.trim().length > 0
                && categoriaId
                && Number(valorTotal) > 0
                && dataEmissao
                && dataVencimento,
            [
                categoriaId,
                dataEmissao,
                dataVencimento,
                descricao,
                valorTotal,
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

        async function carregarCategorias() {
            try {
                setCarregandoCategorias(true)
                setErro('')

                const empresaId =
                    sessao.usuario.empresaId

                const resposta =
                    await fetch(
                        `${API_URL}/empresas/${empresaId}/categorias?tipo=${tipoCategoria}`,
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
                        : []

                setCategorias(lista)

                setCategoriaId(
                    lista.length > 0
                        ? String(lista[0].id)
                        : '',
                )
            } catch (erroDaRequisicao) {
                if (!componenteAtivo) {
                    return
                }

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
        navigate,
        sessao,
        tipoCategoria,
    ])

    function mudarTipo(novoTipo) {
        setTipo(novoTipo)
        setCategoriaId('')
        setErro('')
    }

    async function salvarConta(evento) {
        evento.preventDefault()

        if (
            !sessao
            || !formularioValido
            || salvando
        ) {
            return
        }

        try {
            setSalvando(true)
            setErro('')

            const empresaId =
                sessao.usuario.empresaId

            const corpo = {
                categoriaId:
                    Number(categoriaId),

                descricao:
                    descricao.trim(),

                favorecido:
                    favorecido.trim()
                    || null,

                numeroDocumento:
                    numeroDocumento.trim()
                    || null,

                tipo,

                valorTotal:
                    Number(valorTotal),

                dataEmissao,

                dataVencimento,

                lembreteAtivo,

                antecedenciaLembreteDias:
                    lembreteAtivo
                        ? Number(
                            antecedenciaLembreteDias,
                        )
                        : 2,

                observacao:
                    observacao.trim()
                    || null,
            }

            const resposta =
                await fetch(
                    `${API_URL}/empresas/${empresaId}/contas-financeiras`,
                    {
                        method: 'POST',

                        headers: {
                            Authorization:
                                `${sessao.tipoToken} ${sessao.token}`,

                            'Content-Type':
                                'application/json',
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
                        'Não foi possível cadastrar a conta.',
                    ),
                )
            }

            navigate(
                '/dashboard/contas',
                {
                    replace: true,
                },
            )
        } catch (erroDaRequisicao) {
            setErro(
                erroDaRequisicao
                instanceof Error
                    ? erroDaRequisicao.message
                    : 'Não foi possível cadastrar a conta.',
            )
        } finally {
            setSalvando(false)
        }
    }

    function cancelar() {
        navigate('/dashboard/contas')
    }

    function abrirCategorias() {
        navigate('/dashboard/categorias')
    }

    if (!sessao) {
        return null
    }

    return (
        <div className="nova-conta-pagina">
            <div className="nova-conta-conteudo">
                <header className="nova-conta-cabecalho">
                    <button
                        onClick={cancelar}
                        type="button"
                    >
                        ← Voltar para as contas
                    </button>

                    <p>
                        Planejamento financeiro
                    </p>

                    <h1>{textoTipo}</h1>

                    <span>
                        {explicacaoTipo}. Informe os
                        dados para acompanhar o
                        vencimento e a previsão
                        financeira.
                    </span>
                </header>

                <section className="nova-conta-card">
                    <div className="nova-conta-tipos">
                        <button
                            className={
                                tipo === 'PAGAR'
                                    ? 'nova-conta-tipo-ativo nova-conta-tipo-pagar'
                                    : ''
                            }
                            onClick={() =>
                                mudarTipo('PAGAR')
                            }
                            type="button"
                        >
                            <strong>
                                Conta a pagar
                            </strong>

                            <small>
                                Dinheiro que deverá sair
                            </small>
                        </button>

                        <button
                            className={
                                tipo === 'RECEBER'
                                    ? 'nova-conta-tipo-ativo nova-conta-tipo-receber'
                                    : ''
                            }
                            onClick={() =>
                                mudarTipo('RECEBER')
                            }
                            type="button"
                        >
                            <strong>
                                Conta a receber
                            </strong>

                            <small>
                                Dinheiro que deverá entrar
                            </small>
                        </button>
                    </div>

                    <form onSubmit={salvarConta}>
                        <div className="nova-conta-campo">
                            <label htmlFor="descricao">
                                Descrição da conta
                            </label>

                            <input
                                id="descricao"
                                maxLength="150"
                                onChange={(evento) =>
                                    setDescricao(
                                        evento.target.value,
                                    )
                                }
                                placeholder={
                                    tipo === 'PAGAR'
                                        ? 'Ex.: Compra de sementes'
                                        : 'Ex.: Venda da produção'
                                }
                                required
                                type="text"
                                value={descricao}
                            />
                        </div>

                        <div className="nova-conta-linha">
                            <div className="nova-conta-campo">
                                <label htmlFor="categoria">
                                    Categoria
                                </label>

                                <select
                                    disabled={
                                        carregandoCategorias
                                    }
                                    id="categoria"
                                    onChange={(evento) =>
                                        setCategoriaId(
                                            evento.target.value,
                                        )
                                    }
                                    required
                                    value={categoriaId}
                                >
                                    {carregandoCategorias ? (
                                        <option value="">
                                            Carregando categorias...
                                        </option>
                                    ) : categorias.length === 0 ? (
                                        <option value="">
                                            Nenhuma categoria disponível
                                        </option>
                                    ) : (
                                        categorias.map(
                                            (categoria) => (
                                                <option
                                                    key={categoria.id}
                                                    value={categoria.id}
                                                >
                                                    {categoria.nome}
                                                </option>
                                            ),
                                        )
                                    )}
                                </select>

                                <button
                                    className="nova-conta-link-categoria"
                                    onClick={abrirCategorias}
                                    type="button"
                                >
                                    Gerenciar categorias
                                </button>
                            </div>

                            <div className="nova-conta-campo">
                                <label htmlFor="valorTotal">
                                    Valor total
                                </label>

                                <input
                                    id="valorTotal"
                                    min="0.01"
                                    onChange={(evento) =>
                                        setValorTotal(
                                            evento.target.value,
                                        )
                                    }
                                    placeholder="0,00"
                                    required
                                    step="0.01"
                                    type="number"
                                    value={valorTotal}
                                />
                            </div>
                        </div>

                        <div className="nova-conta-linha">
                            <div className="nova-conta-campo">
                                <label htmlFor="favorecido">
                                    Favorecido ou cliente
                                </label>

                                <input
                                    id="favorecido"
                                    maxLength="150"
                                    onChange={(evento) =>
                                        setFavorecido(
                                            evento.target.value,
                                        )
                                    }
                                    placeholder="Nome opcional"
                                    type="text"
                                    value={favorecido}
                                />
                            </div>

                            <div className="nova-conta-campo">
                                <label htmlFor="numeroDocumento">
                                    Número do documento
                                </label>

                                <input
                                    id="numeroDocumento"
                                    maxLength="80"
                                    onChange={(evento) =>
                                        setNumeroDocumento(
                                            evento.target.value,
                                        )
                                    }
                                    placeholder="Nota, boleto ou referência"
                                    type="text"
                                    value={numeroDocumento}
                                />
                            </div>
                        </div>

                        <div className="nova-conta-linha">
                            <div className="nova-conta-campo">
                                <label htmlFor="dataEmissao">
                                    Data de emissão
                                </label>

                                <input
                                    id="dataEmissao"
                                    onChange={(evento) =>
                                        setDataEmissao(
                                            evento.target.value,
                                        )
                                    }
                                    required
                                    type="date"
                                    value={dataEmissao}
                                />
                            </div>

                            <div className="nova-conta-campo">
                                <label htmlFor="dataVencimento">
                                    Data de vencimento
                                </label>

                                <input
                                    id="dataVencimento"
                                    onChange={(evento) =>
                                        setDataVencimento(
                                            evento.target.value,
                                        )
                                    }
                                    required
                                    type="date"
                                    value={dataVencimento}
                                />
                            </div>
                        </div>

                        <div className="nova-conta-lembrete">
                            <label>
                                <input
                                    checked={lembreteAtivo}
                                    onChange={(evento) =>
                                        setLembreteAtivo(
                                            evento.target.checked,
                                        )
                                    }
                                    type="checkbox"
                                />

                                <span>
                                    <strong>
                                        Avisar antes do vencimento
                                    </strong>

                                    <small>
                                        O alerta aparecerá ao entrar no sistema.
                                    </small>
                                </span>
                            </label>

                            {lembreteAtivo && (
                                <div>
                                    <label htmlFor="antecedencia">
                                        Avisar com
                                    </label>

                                    <input
                                        id="antecedencia"
                                        max="365"
                                        min="0"
                                        onChange={(evento) =>
                                            setAntecedenciaLembreteDias(
                                                evento.target.value,
                                            )
                                        }
                                        type="number"
                                        value={
                                            antecedenciaLembreteDias
                                        }
                                    />

                                    <span>
                                        dias de antecedência
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="nova-conta-campo">
                            <label htmlFor="observacao">
                                Observação
                            </label>

                            <textarea
                                id="observacao"
                                maxLength="500"
                                onChange={(evento) =>
                                    setObservacao(
                                        evento.target.value,
                                    )
                                }
                                placeholder="Informações adicionais sobre a conta"
                                value={observacao}
                            />
                        </div>

                        {erro && (
                            <p className="nova-conta-erro">
                                {erro}
                            </p>
                        )}

                        {categorias.length === 0
                            && !carregandoCategorias && (
                                <div className="nova-conta-sem-categoria">
                                    <strong>
                                        É necessário ter uma categoria
                                    </strong>

                                    <span>
                                        Crie uma categoria de {
                                        tipoCategoria
                                        === 'DESPESA'
                                            ? 'despesa'
                                            : 'receita'
                                    } antes de cadastrar esta conta.
                                    </span>

                                    <button
                                        onClick={abrirCategorias}
                                        type="button"
                                    >
                                        Criar categoria
                                    </button>
                                </div>
                            )}

                        <div className="nova-conta-acoes">
                            <button
                                className="nova-conta-cancelar"
                                onClick={cancelar}
                                type="button"
                            >
                                Cancelar
                            </button>

                            <button
                                className="nova-conta-salvar"
                                disabled={
                                    !formularioValido
                                    || salvando
                                    || categorias.length === 0
                                }
                                type="submit"
                            >
                                {salvando
                                    ? 'Salvando...'
                                    : `Cadastrar ${textoTipo.toLowerCase()}`}
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </div>
    )
}

export default NovaContaFinanceira
