import {
    useEffect,
    useState,
} from 'react'
import {
    useNavigate,
} from 'react-router'
import CampoComVoz from '../componentes/CampoComVoz.jsx'
import './AppMobile.css'

const API_URL =
    import.meta.env.VITE_API_URL
    ?? 'http://localhost:8080/api/v1'

function limparSessao() {
    localStorage.removeItem('agrogestao_token')
    localStorage.removeItem('agrogestao_tipo_token')
    localStorage.removeItem('agrogestao_usuario')
    localStorage.removeItem('agrogestao_token_expira_em')
}

function obterSessao() {
    try {
        const token =
            localStorage.getItem('agrogestao_token')

        const tipoToken =
            localStorage.getItem('agrogestao_tipo_token') ?? 'Bearer'

        const usuarioSalvo =
            localStorage.getItem('agrogestao_usuario')

        const expiraEm =
            Number(localStorage.getItem('agrogestao_token_expira_em'))

        if (!token || !usuarioSalvo) {
            return null
        }

        if (expiraEm && Date.now() >= expiraEm) {
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

function completarComZero(numero) {
    return String(numero).padStart(2, '0')
}

function obterDataAtual() {
    const hoje = new Date()

    return [
        hoje.getFullYear(),
        completarComZero(hoje.getMonth() + 1),
        completarComZero(hoje.getDate()),
    ].join('-')
}

function formatarDinheiro(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(valor ?? 0)
}

async function obterMensagemDeErro(resposta, mensagemPadrao) {
    const dados =
        await resposta.json().catch(() => null)

    if (dados?.mensagem) {
        return dados.mensagem
    }

    if (dados?.campos) {
        const mensagens =
            Object.values(dados.campos)

        if (mensagens.length > 0) {
            return mensagens.join(' ')
        }
    }

    return mensagemPadrao
}

function AppMobile() {
    const navigate = useNavigate()

    const [sessao] =
        useState(obterSessao)

    const [tipo, setTipo] =
        useState('RECEITA')

    const [descricao, setDescricao] =
        useState('')

    const [valor, setValor] =
        useState('')

    const [dataMovimentacao, setDataMovimentacao] =
        useState(obterDataAtual)

    const [observacao, setObservacao] =
        useState('')

    const [categorias, setCategorias] =
        useState([])

    const [categoriaId, setCategoriaId] =
        useState('')

    const [resumo, setResumo] =
        useState(null)

    const [carregando, setCarregando] =
        useState(true)

    const [salvando, setSalvando] =
        useState(false)

    const [mensagem, setMensagem] =
        useState('')

    const [erro, setErro] =
        useState('')

    const empresaId =
        sessao?.usuario?.empresaId

    useEffect(() => {
        if (!sessao || !empresaId) {
            navigate('/login', {
                replace: true,
            })
        }
    }, [
        empresaId,
        navigate,
        sessao,
    ])

    useEffect(() => {
        if (!sessao || !empresaId) {
            return undefined
        }

        let ativo = true

        async function carregarDados() {
            try {
                setCarregando(true)
                setErro('')

                const cabecalhos = {
                    Authorization:
                        `${sessao.tipoToken} ${sessao.token}`,
                }

                const [
                    respostaCategorias,
                    respostaResumo,
                ] = await Promise.all([
                    fetch(
                        `${API_URL}/empresas/${empresaId}/categorias?tipo=${tipo}`,
                        {
                            headers: cabecalhos,
                        },
                    ),

                    fetch(
                        `${API_URL}/empresas/${empresaId}/dashboard/resumo`,
                        {
                            headers: cabecalhos,
                        },
                    ),
                ])

                if (
                    respostaCategorias.status === 401
                    || respostaCategorias.status === 403
                    || respostaResumo.status === 401
                    || respostaResumo.status === 403
                ) {
                    limparSessao()
                    navigate('/login', {
                        replace: true,
                    })
                    return
                }

                if (!respostaCategorias.ok) {
                    throw new Error(
                        await obterMensagemDeErro(
                            respostaCategorias,
                            'Nao foi possivel carregar as categorias.',
                        ),
                    )
                }

                if (!respostaResumo.ok) {
                    throw new Error(
                        await obterMensagemDeErro(
                            respostaResumo,
                            'Nao foi possivel carregar o resumo.',
                        ),
                    )
                }

                const [
                    dadosCategorias,
                    dadosResumo,
                ] = await Promise.all([
                    respostaCategorias.json(),
                    respostaResumo.json(),
                ])

                if (!ativo) {
                    return
                }

                const listaCategorias =
                    Array.isArray(dadosCategorias)
                        ? dadosCategorias
                        : dadosCategorias.content ?? []

                setCategorias(listaCategorias)
                setCategoriaId(
                    listaCategorias[0]?.id
                        ? String(listaCategorias[0].id)
                        : '',
                )
                setResumo(dadosResumo)
            } catch (erroDaRequisicao) {
                if (!ativo) {
                    return
                }

                setErro(
                    erroDaRequisicao instanceof Error
                        ? erroDaRequisicao.message
                        : 'Nao foi possivel carregar o app.',
                )
            } finally {
                if (ativo) {
                    setCarregando(false)
                }
            }
        }

        carregarDados()

        return () => {
            ativo = false
        }
    }, [
        empresaId,
        navigate,
        sessao,
        tipo,
    ])

    function trocarTipo(novoTipo) {
        setTipo(novoTipo)
        setMensagem('')
        setErro('')
    }

    async function salvarMovimentacao(evento) {
        evento.preventDefault()

        if (!sessao || !empresaId) {
            limparSessao()
            navigate('/login', {
                replace: true,
            })
            return
        }

        if (!descricao.trim() || !valor || Number(valor) <= 0 || !categoriaId) {
            setErro('Preencha descricao, valor e categoria.')
            return
        }

        try {
            setSalvando(true)
            setErro('')
            setMensagem('')

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
                        body: JSON.stringify({
                            descricao: descricao.trim(),
                            valor: Number(valor),
                            tipo,
                            categoriaId: Number(categoriaId),
                            dataMovimentacao,
                            observacao: observacao.trim() || null,
                        }),
                    },
                )

            if (resposta.status === 401 || resposta.status === 403) {
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
                        'Nao foi possivel salvar.',
                    ),
                )
            }

            setDescricao('')
            setValor('')
            setObservacao('')
            setMensagem('Lancamento salvo no dashboard.')
        } catch (erroDaRequisicao) {
            setErro(
                erroDaRequisicao instanceof Error
                    ? erroDaRequisicao.message
                    : 'Nao foi possivel salvar.',
            )
        } finally {
            setSalvando(false)
        }
    }

    if (!sessao) {
        return null
    }

    return (
        <div className="app-mobile">
            <header className="app-mobile-topo">
                <div>
                    <span>AgroGestao</span>
                    <strong>
                        {sessao.usuario.nomeEmpresa}
                    </strong>
                </div>

                <button
                    onClick={() => navigate('/dashboard')}
                    type="button"
                >
                    Site completo
                </button>
            </header>

            <main className="app-mobile-conteudo">
                <section className="app-mobile-resumo">
                    <p>Hoje na propriedade</p>

                    <div>
                        <strong>
                            Entrou
                            <span>
                                {formatarDinheiro(resumo?.totalEntrou)}
                            </span>
                        </strong>

                        <strong>
                            Saiu
                            <span>
                                {formatarDinheiro(resumo?.totalSaiu)}
                            </span>
                        </strong>
                    </div>
                </section>

                <section className="app-mobile-formulario">
                    <p className="app-mobile-etiqueta">
                        Lancamento rapido
                    </p>

                    <h1>
                        Fale ou digite o que aconteceu
                    </h1>

                    <div className="app-mobile-tipos">
                        <button
                            className={tipo === 'RECEITA' ? 'ativo' : ''}
                            onClick={() => trocarTipo('RECEITA')}
                            type="button"
                        >
                            Recebi dinheiro
                        </button>

                        <button
                            className={tipo === 'DESPESA' ? 'ativo despesa' : ''}
                            onClick={() => trocarTipo('DESPESA')}
                            type="button"
                        >
                            Gastei dinheiro
                        </button>
                    </div>

                    <form onSubmit={salvarMovimentacao}>
                        <CampoComVoz
                            disabled={salvando}
                            label="Descricao"
                            maxLength="150"
                            onChange={setDescricao}
                            placeholder="Ex.: venda de milho"
                            required
                            value={descricao}
                        />

                        <CampoComVoz
                            disabled={salvando}
                            inputMode="decimal"
                            label="Valor"
                            min="0.01"
                            onChange={setValor}
                            placeholder="0.00"
                            required
                            step="0.01"
                            type="number"
                            value={valor}
                        />

                        <label className="app-mobile-campo">
                            Categoria
                            <select
                                disabled={carregando || salvando}
                                onChange={(evento) =>
                                    setCategoriaId(evento.target.value)
                                }
                                required
                                value={categoriaId}
                            >
                                <option value="">
                                    Escolha
                                </option>

                                {categorias.map((categoria) => (
                                    <option
                                        key={categoria.id}
                                        value={categoria.id}
                                    >
                                        {categoria.nome}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="app-mobile-campo">
                            Data
                            <input
                                disabled={salvando}
                                max={obterDataAtual()}
                                onChange={(evento) =>
                                    setDataMovimentacao(evento.target.value)
                                }
                                required
                                type="date"
                                value={dataMovimentacao}
                            />
                        </label>

                        <CampoComVoz
                            disabled={salvando}
                            label="Observacao"
                            maxLength="500"
                            multiline
                            onChange={setObservacao}
                            placeholder="Opcional"
                            value={observacao}
                        />

                        {erro && (
                            <p className="app-mobile-erro">
                                {erro}
                            </p>
                        )}

                        {mensagem && (
                            <p className="app-mobile-sucesso">
                                {mensagem}
                            </p>
                        )}

                        <button
                            className="app-mobile-salvar"
                            disabled={salvando || carregando}
                            type="submit"
                        >
                            {salvando ? 'Salvando...' : 'Salvar'}
                        </button>
                    </form>
                </section>
            </main>
        </div>
    )
}

export default AppMobile
