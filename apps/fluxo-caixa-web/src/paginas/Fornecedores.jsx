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

function formatarNumero(valor) {
    if (valor === null || valor === undefined) {
        return '-'
    }

    return new Intl.NumberFormat('pt-BR', {
        maximumFractionDigits: 4,
    }).format(Number(valor))
}

function hojeIso() {
    return new Date().toISOString().slice(0, 10)
}

function Fornecedores() {
    const navigate = useNavigate()
    const [sessao] = useState(obterSessao)

    const [fornecedores, setFornecedores] = useState([])
    const [lixeira, setLixeira] = useState([])
    const [categoriasProduto, setCategoriasProduto] = useState([])
    const [produtos, setProdutos] = useState([])
    const [cotacoes, setCotacoes] = useState([])
    const [comparativos, setComparativos] = useState([])
    const [compras, setCompras] = useState([])
    const [fornecedorSelecionado, setFornecedorSelecionado] =
        useState(null)

    const [mostrarLixeira, setMostrarLixeira] = useState(false)
    const [carregando, setCarregando] = useState(true)
    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState('')
    const [sucesso, setSucesso] = useState('')
    const [confirmacao, setConfirmacao] = useState(null)
    const [migracao, setMigracao] = useState(null)

    const [fornecedorForm, setFornecedorForm] = useState({
        id: null,
        nome: '',
        telefone: '',
        observacao: '',
    })

    const [categoriaProdutoNome, setCategoriaProdutoNome] =
        useState('')

    const [produtoForm, setProdutoForm] = useState({
        categoriaProdutoId: '',
        nome: '',
        unidadeBase: 'saca',
        pesoPadraoKg: '',
    })

    const [cotacaoForm, setCotacaoForm] = useState({
        fornecedorId: '',
        produtoId: '',
        compradorNome: '',
        dataCotacao: hojeIso(),
        quantidade: '',
        unidadeMedida: 'saca',
        pesoTotalKg: '',
        valorTotal: '',
        frete: '',
        desconto: '',
        observacao: '',
    })

    const [migracaoForm, setMigracaoForm] = useState({
        categoriaId: '',
        novaCategoriaNome: '',
        dataMovimentacao: hojeIso(),
        dataVencimento: hojeIso(),
        numeroDocumento: '',
        observacao: '',
    })

    const empresaId = sessao?.usuario?.empresaId

    const produtosPorCategoria = useMemo(
        () => {
            const grupos = new Map()

            produtos.forEach((produto) => {
                if (!grupos.has(produto.categoriaNome)) {
                    grupos.set(produto.categoriaNome, [])
                }

                grupos.get(produto.categoriaNome).push(produto)
            })

            return Array.from(grupos.entries())
        },
        [produtos],
    )

    const cotacoesPorProduto = useMemo(
        () => {
            const grupos = new Map()

            cotacoes.forEach((cotacao) => {
                const chave =
                    `${cotacao.produtoId}|${cotacao.produtoNome}`

                if (!grupos.has(chave)) {
                    grupos.set(chave, [])
                }

                grupos.get(chave).push(cotacao)
            })

            return Array.from(grupos.entries()).map(
                ([chave, itens]) => {
                    const [, produtoNome] = chave.split('|')
                    const ordenados = [...itens].sort(
                        (primeiro, segundo) =>
                            Number(
                                primeiro.valorPorKg
                                ?? primeiro.valorPorUnidade
                                ?? primeiro.valorPorLote
                                ?? 0,
                            )
                            - Number(
                                segundo.valorPorKg
                                ?? segundo.valorPorUnidade
                                ?? segundo.valorPorLote
                                ?? 0,
                            ),
                    )

                    return {
                        produtoNome,
                        itens: ordenados,
                        melhor: ordenados[0],
                    }
                },
            )
        },
        [cotacoes],
    )

    useEffect(() => {
        if (!sessao || !empresaId) {
            navigate('/login', {
                replace: true,
            })

            return
        }

        void carregarTudo()
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

    async function carregarTudo() {
        try {
            setCarregando(true)
            setErro('')

            const respostas = await Promise.all([
                requisitar('/fornecedores'),
                requisitar('/fornecedores/lixeira'),
                requisitar('/fornecedores/categorias-produto'),
                requisitar('/fornecedores/produtos'),
                requisitar('/fornecedores/cotacoes'),
                requisitar('/fornecedores/comparativo-cotacoes'),
            ])

            const mensagens = [
                'Não foi possível carregar fornecedores.',
                'Não foi possível carregar a lixeira.',
                'Não foi possível carregar categorias de produto.',
                'Não foi possível carregar produtos.',
                'Não foi possível carregar cotações.',
                'Não foi possível carregar comparativos.',
            ]

            for (let indice = 0; indice < respostas.length; indice++) {
                if (!respostas[indice].ok) {
                    throw new Error(
                        await obterMensagemDeErro(
                            respostas[indice],
                            mensagens[indice],
                        ),
                    )
                }
            }

            const [
                fornecedoresDados,
                lixeiraDados,
                categoriasDados,
                produtosDados,
                cotacoesDados,
                comparativosDados,
            ] = await Promise.all(
                respostas.map((resposta) => resposta.json()),
            )

            setFornecedores(fornecedoresDados)
            setLixeira(lixeiraDados)
            setCategoriasProduto(categoriasDados)
            setProdutos(produtosDados)
            setCotacoes(cotacoesDados)
            setComparativos(comparativosDados)
        } catch (erroDaRequisicao) {
            setErro(
                erroDaRequisicao instanceof Error
                    ? erroDaRequisicao.message
                    : 'Não foi possível carregar os dados.',
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
                        'Não foi possível carregar as compras.',
                    ),
                )
            }

            setCompras(await resposta.json())
        } catch (erroDaRequisicao) {
            setErro(
                erroDaRequisicao instanceof Error
                    ? erroDaRequisicao.message
                    : 'Não foi possível carregar as compras.',
            )
        }
    }

    async function salvarFornecedor(evento) {
        evento.preventDefault()

        const nome = fornecedorForm.nome
            .trim()
            .replace(/\s+/g, ' ')

        if (!nome) {
            setErro('Informe o nome do fornecedor.')
            return
        }

        await executarSalvamento(
            fornecedorForm.id
                ? `/fornecedores/${fornecedorForm.id}`
                : '/fornecedores',
            fornecedorForm.id ? 'PUT' : 'POST',
            {
                nome,
                telefone: fornecedorForm.telefone.trim() || null,
                observacao:
                    fornecedorForm.observacao.trim() || null,
            },
            fornecedorForm.id
                ? 'Fornecedor atualizado.'
                : 'Fornecedor cadastrado.',
        )

        setFornecedorForm({
            id: null,
            nome: '',
            telefone: '',
            observacao: '',
        })
    }

    async function salvarCategoriaProduto(evento) {
        evento.preventDefault()

        await executarSalvamento(
            '/fornecedores/categorias-produto',
            'POST',
            {
                nome: categoriaProdutoNome.trim(),
            },
            'Categoria de produto cadastrada.',
        )

        setCategoriaProdutoNome('')
    }

    async function salvarProduto(evento) {
        evento.preventDefault()

        await executarSalvamento(
            '/fornecedores/produtos',
            'POST',
            {
                categoriaProdutoId:
                    Number(produtoForm.categoriaProdutoId),
                nome: produtoForm.nome.trim(),
                unidadeBase: produtoForm.unidadeBase.trim(),
                pesoPadraoKg:
                    produtoForm.pesoPadraoKg
                        ? Number(produtoForm.pesoPadraoKg)
                        : null,
            },
            'Produto cadastrado.',
        )

        setProdutoForm({
            categoriaProdutoId:
                produtoForm.categoriaProdutoId,
            nome: '',
            unidadeBase: 'saca',
            pesoPadraoKg: '',
        })
    }

    async function salvarCotacao(evento) {
        evento.preventDefault()

        await executarSalvamento(
            '/fornecedores/cotacoes',
            'POST',
            {
                fornecedorId: Number(cotacaoForm.fornecedorId),
                produtoId: Number(cotacaoForm.produtoId),
                compradorNome:
                    cotacaoForm.compradorNome.trim() || null,
                dataCotacao: cotacaoForm.dataCotacao,
                quantidade: Number(cotacaoForm.quantidade),
                unidadeMedida: cotacaoForm.unidadeMedida.trim(),
                pesoTotalKg:
                    cotacaoForm.pesoTotalKg
                        ? Number(cotacaoForm.pesoTotalKg)
                        : null,
                valorTotal: Number(cotacaoForm.valorTotal),
                frete:
                    cotacaoForm.frete
                        ? Number(cotacaoForm.frete)
                        : null,
                desconto:
                    cotacaoForm.desconto
                        ? Number(cotacaoForm.desconto)
                        : null,
                observacao:
                    cotacaoForm.observacao.trim() || null,
            },
            'Cotação cadastrada. Ela ainda não altera gráficos financeiros.',
        )

        setCotacaoForm({
            ...cotacaoForm,
            quantidade: '',
            pesoTotalKg: '',
            valorTotal: '',
            frete: '',
            desconto: '',
            observacao: '',
        })
    }

    async function executarSalvamento(
        caminho,
        metodo,
        corpo,
        mensagem,
    ) {
        try {
            setSalvando(true)
            setErro('')
            setSucesso('')

            const resposta = await requisitar(
                caminho,
                {
                    method: metodo,
                    headers: {
                        'Content-Type':
                            'application/json; charset=utf-8',
                    },
                    body: JSON.stringify(corpo),
                },
            )

            if (!resposta.ok) {
                throw new Error(
                    await obterMensagemDeErro(
                        resposta,
                        'Não foi possível salvar.',
                    ),
                )
            }

            setSucesso(mensagem)
            await carregarTudo()
        } catch (erroDaRequisicao) {
            setErro(
                erroDaRequisicao instanceof Error
                    ? erroDaRequisicao.message
                    : 'Não foi possível salvar.',
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
                        'Não foi possível concluir.',
                    ),
                )
            }

            setSucesso(confirmacao.sucesso)
            setConfirmacao(null)
            setFornecedorSelecionado(null)
            setCompras([])
            await carregarTudo()
        } catch (erroDaRequisicao) {
            setErro(
                erroDaRequisicao instanceof Error
                    ? erroDaRequisicao.message
                    : 'Não foi possível concluir.',
            )
        } finally {
            setSalvando(false)
        }
    }

    async function executarMigracao(evento) {
        evento.preventDefault()

        if (!migracao) {
            return
        }

        const caminho =
            migracao.destino === 'financeiro'
                ? `/fornecedores/cotacoes/${migracao.cotacao.id}/enviar-financeiro`
                : `/fornecedores/cotacoes/${migracao.cotacao.id}/enviar-contas`

        const corpo =
            migracao.destino === 'financeiro'
                ? {
                    categoriaId:
                        migracaoForm.categoriaId
                            ? Number(migracaoForm.categoriaId)
                            : null,
                    novaCategoriaNome:
                        migracaoForm.novaCategoriaNome.trim()
                        || null,
                    dataMovimentacao:
                        migracaoForm.dataMovimentacao,
                    observacao:
                        migracaoForm.observacao.trim() || null,
                }
                : {
                    categoriaId:
                        migracaoForm.categoriaId
                            ? Number(migracaoForm.categoriaId)
                            : null,
                    novaCategoriaNome:
                        migracaoForm.novaCategoriaNome.trim()
                        || null,
                    dataVencimento:
                        migracaoForm.dataVencimento,
                    numeroDocumento:
                        migracaoForm.numeroDocumento.trim()
                        || null,
                    observacao:
                        migracaoForm.observacao.trim() || null,
                }

        try {
            setSalvando(true)
            setErro('')
            setSucesso('')

            const resposta = await requisitar(
                caminho,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type':
                            'application/json; charset=utf-8',
                    },
                    body: JSON.stringify(corpo),
                },
            )

            if (!resposta.ok) {
                throw new Error(
                    await obterMensagemDeErro(
                        resposta,
                        'Não foi possível enviar a cotação.',
                    ),
                )
            }

            setSucesso(
                migracao.destino === 'financeiro'
                    ? 'Cotação enviada ao dashboard financeiro.'
                    : 'Cotação enviada para contas a pagar.',
            )
            setMigracao(null)
            await carregarTudo()
        } catch (erroDaRequisicao) {
            setErro(
                erroDaRequisicao instanceof Error
                    ? erroDaRequisicao.message
                    : 'Não foi possível enviar a cotação.',
            )
        } finally {
            setSalvando(false)
        }
    }

    async function baixarRelatorio(tipo) {
        const caminho =
            tipo === 'pdf'
                ? '/fornecedores/relatorio-pdf'
                : '/fornecedores/relatorio-excel'

        const resposta = await requisitar(caminho)

        if (!resposta.ok) {
            setErro(
                await obterMensagemDeErro(
                    resposta,
                    'Não foi possível baixar o relatório.',
                ),
            )
            return
        }

        const blob = await resposta.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download =
            tipo === 'pdf'
                ? 'comparativo-fornecedores.pdf'
                : 'comparativo-fornecedores.xlsx'
        link.click()
        URL.revokeObjectURL(url)
    }

    function abrirMigracao(cotacao, destino) {
        setMigracao({
            cotacao,
            destino,
        })
        setMigracaoForm({
            categoriaId: '',
            novaCategoriaNome:
                cotacao.categoriaProdutoNome ?? '',
            dataMovimentacao: hojeIso(),
            dataVencimento: hojeIso(),
            numeroDocumento: '',
            observacao: '',
        })
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
                            Cadastre fornecedores, produtos, cotacoes
                            e compare onde a compra fica mais em conta.
                        </span>
                    </div>

                    <AlternadorModulos />
                </header>

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

                <main className="fornecedores-grade">
                    <section className="fornecedores-card">
                        <div className="fornecedores-card-topo">
                            <div>
                                <small>Fornecedores</small>
                                <h2>
                                    {fornecedorForm.id
                                        ? 'Editar fornecedor'
                                        : 'Novo fornecedor'}
                                </h2>
                            </div>
                        </div>

                        <form onSubmit={salvarFornecedor}>
                            <label htmlFor="nomeFornecedor">
                                Nome do fornecedor *
                            </label>
                            <input
                                id="nomeFornecedor"
                                maxLength="150"
                                onChange={(evento) =>
                                    setFornecedorForm({
                                        ...fornecedorForm,
                                        nome: evento.target.value,
                                    })
                                }
                                placeholder="Ex.: Agropecuária Central"
                                required
                                type="text"
                                value={fornecedorForm.nome}
                            />

                            <label htmlFor="telefoneFornecedor">
                                Telefone
                            </label>
                            <input
                                id="telefoneFornecedor"
                                maxLength="30"
                                onChange={(evento) =>
                                    setFornecedorForm({
                                        ...fornecedorForm,
                                        telefone: evento.target.value,
                                    })
                                }
                                placeholder="Opcional"
                                type="text"
                                value={fornecedorForm.telefone}
                            />

                            <label htmlFor="observacaoFornecedor">
                                Observação
                            </label>
                            <textarea
                                id="observacaoFornecedor"
                                maxLength="500"
                                onChange={(evento) =>
                                    setFornecedorForm({
                                        ...fornecedorForm,
                                        observacao: evento.target.value,
                                    })
                                }
                                placeholder="Opcional"
                                value={fornecedorForm.observacao}
                            />

                            <div className="fornecedores-acoes-form">
                                {fornecedorForm.id && (
                                    <button
                                        onClick={() =>
                                            setFornecedorForm({
                                                id: null,
                                                nome: '',
                                                telefone: '',
                                                observacao: '',
                                            })
                                        }
                                        type="button"
                                    >
                                        Cancelar
                                    </button>
                                )}

                                <button
                                    disabled={salvando}
                                    type="submit"
                                >
                                    Salvar fornecedor
                                </button>
                            </div>

                            <small>* Campo obrigatório</small>
                        </form>
                    </section>

                    <section className="fornecedores-card fornecedores-lista">
                        <div className="fornecedores-card-topo">
                            <div>
                                <small>Lista</small>
                                <h2>
                                    {mostrarLixeira
                                        ? 'Lixeira'
                                        : 'Fornecedores ativos'}
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
                                Carregando...
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
                                                                setFornecedorForm({
                                                                    id: fornecedor.id,
                                                                    nome: fornecedor.nome,
                                                                    telefone:
                                                                        fornecedor.telefone
                                                                        ?? '',
                                                                    observacao:
                                                                        fornecedor.observacao
                                                                        ?? '',
                                                                })
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
                                                                        'Ele poderá ser restaurado depois.',
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
                                                                        'Ele volta para a lista ativa.',
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
                                                                        'Depois disso não será possível recuperar.',
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

                    <section className="fornecedores-card">
                        <div className="fornecedores-card-topo">
                            <div>
                                <small>Produtos</small>
                                <h2>Categorias e produtos</h2>
                            </div>
                        </div>

                        <form onSubmit={salvarCategoriaProduto}>
                            <label htmlFor="categoriaProduto">
                                Categoria de produto *
                            </label>
                            <div className="fornecedores-linha-form">
                                <input
                                    id="categoriaProduto"
                                    onChange={(evento) =>
                                        setCategoriaProdutoNome(
                                            evento.target.value,
                                        )
                                    }
                                    placeholder="Ex.: Sementes"
                                    required
                                    type="text"
                                    value={categoriaProdutoNome}
                                />
                                <button
                                    disabled={salvando}
                                    type="submit"
                                >
                                    Criar
                                </button>
                            </div>
                        </form>

                        <form
                            className="fornecedores-form-bloco"
                            onSubmit={salvarProduto}
                        >
                            <label htmlFor="produtoCategoria">
                                Categoria *
                            </label>
                            <select
                                id="produtoCategoria"
                                onChange={(evento) =>
                                    setProdutoForm({
                                        ...produtoForm,
                                        categoriaProdutoId:
                                            evento.target.value,
                                    })
                                }
                                required
                                value={produtoForm.categoriaProdutoId}
                            >
                                <option value="">
                                    Selecione
                                </option>
                                {categoriasProduto.map((categoria) => (
                                    <option
                                        key={categoria.id}
                                        value={categoria.id}
                                    >
                                        {categoria.nome}
                                    </option>
                                ))}
                            </select>

                            <label htmlFor="produtoNome">
                                Produto *
                            </label>
                            <input
                                id="produtoNome"
                                onChange={(evento) =>
                                    setProdutoForm({
                                        ...produtoForm,
                                        nome: evento.target.value,
                                    })
                                }
                                placeholder="Ex.: Semente de soja"
                                required
                                type="text"
                                value={produtoForm.nome}
                            />

                            <div className="fornecedores-grade-form">
                                <label>
                                    Unidade base *
                                    <input
                                        onChange={(evento) =>
                                            setProdutoForm({
                                                ...produtoForm,
                                                unidadeBase:
                                                    evento.target.value,
                                            })
                                        }
                                        placeholder="saca, kg, lote"
                                        required
                                        type="text"
                                        value={produtoForm.unidadeBase}
                                    />
                                </label>

                                <label>
                                    Peso padrao kg
                                    <input
                                        min="0"
                                        onChange={(evento) =>
                                            setProdutoForm({
                                                ...produtoForm,
                                                pesoPadraoKg:
                                                    evento.target.value,
                                            })
                                        }
                                        placeholder="Ex.: 40"
                                        step="0.001"
                                        type="number"
                                        value={produtoForm.pesoPadraoKg}
                                    />
                                </label>
                            </div>

                            <button
                                disabled={salvando}
                                type="submit"
                            >
                                Salvar produto
                            </button>
                        </form>
                    </section>

                    <section className="fornecedores-card fornecedores-lista">
                        <div className="fornecedores-card-topo">
                            <div>
                                <small>Produtos cadastrados</small>
                                <h2>Organizacao</h2>
                            </div>
                        </div>

                        {produtosPorCategoria.length === 0 ? (
                            <p className="fornecedores-vazio">
                                Crie uma categoria e cadastre produtos
                                dentro dela.
                            </p>
                        ) : (
                            <div className="fornecedores-itens">
                                {produtosPorCategoria.map(
                                    ([categoria, itens]) => (
                                        <article
                                            className="fornecedores-produto"
                                            key={categoria}
                                        >
                                            <div className="fornecedores-produto-topo">
                                                <strong>
                                                    {categoria}
                                                </strong>
                                                <span>
                                                    {itens.length}
                                                    {' '}
                                                    produtos
                                                </span>
                                            </div>

                                            <div className="fornecedores-tags">
                                                {itens.map((produto) => (
                                                    <span
                                                        key={produto.id}
                                                    >
                                                        {produto.nome}
                                                    </span>
                                                ))}
                                            </div>
                                        </article>
                                    ),
                                )}
                            </div>
                        )}
                    </section>

                    <section className="fornecedores-card fornecedores-cotacao">
                        <div className="fornecedores-card-topo">
                            <div>
                                <small>Cotação</small>
                                <h2>Registrar preco de fornecedor</h2>
                            </div>
                        </div>

                        <form onSubmit={salvarCotacao}>
                            <div className="fornecedores-grade-form">
                                <label>
                                    Fornecedor *
                                    <select
                                        onChange={(evento) =>
                                            setCotacaoForm({
                                                ...cotacaoForm,
                                                fornecedorId:
                                                    evento.target.value,
                                            })
                                        }
                                        required
                                        value={cotacaoForm.fornecedorId}
                                    >
                                        <option value="">
                                            Selecione
                                        </option>
                                        {fornecedores.map((fornecedor) => (
                                            <option
                                                key={fornecedor.id}
                                                value={fornecedor.id}
                                            >
                                                {fornecedor.nome}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Produto *
                                    <select
                                        onChange={(evento) =>
                                            setCotacaoForm({
                                                ...cotacaoForm,
                                                produtoId:
                                                    evento.target.value,
                                            })
                                        }
                                        required
                                        value={cotacaoForm.produtoId}
                                    >
                                        <option value="">
                                            Selecione
                                        </option>
                                        {produtos.map((produto) => (
                                            <option
                                                key={produto.id}
                                                value={produto.id}
                                            >
                                                {produto.categoriaNome}
                                                {' - '}
                                                {produto.nome}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Data *
                                    <input
                                        onChange={(evento) =>
                                            setCotacaoForm({
                                                ...cotacaoForm,
                                                dataCotacao:
                                                    evento.target.value,
                                            })
                                        }
                                        required
                                        type="date"
                                        value={cotacaoForm.dataCotacao}
                                    />
                                </label>

                                <label>
                                    Comprador
                                    <input
                                        onChange={(evento) =>
                                            setCotacaoForm({
                                                ...cotacaoForm,
                                                compradorNome:
                                                    evento.target.value,
                                            })
                                        }
                                        placeholder="Opcional"
                                        type="text"
                                        value={cotacaoForm.compradorNome}
                                    />
                                </label>

                                <label>
                                    Quantidade *
                                    <input
                                        min="0"
                                        onChange={(evento) =>
                                            setCotacaoForm({
                                                ...cotacaoForm,
                                                quantidade:
                                                    evento.target.value,
                                            })
                                        }
                                        required
                                        step="0.001"
                                        type="number"
                                        value={cotacaoForm.quantidade}
                                    />
                                </label>

                                <label>
                                    Unidade *
                                    <input
                                        onChange={(evento) =>
                                            setCotacaoForm({
                                                ...cotacaoForm,
                                                unidadeMedida:
                                                    evento.target.value,
                                            })
                                        }
                                        placeholder="saca, kg, lote"
                                        required
                                        type="text"
                                        value={cotacaoForm.unidadeMedida}
                                    />
                                </label>

                                <label>
                                    Peso total em kg
                                    <input
                                        min="0"
                                        onChange={(evento) =>
                                            setCotacaoForm({
                                                ...cotacaoForm,
                                                pesoTotalKg:
                                                    evento.target.value,
                                            })
                                        }
                                        placeholder="Opcional"
                                        step="0.001"
                                        type="number"
                                        value={cotacaoForm.pesoTotalKg}
                                    />
                                </label>

                                <label>
                                    Valor total *
                                    <input
                                        min="0"
                                        onChange={(evento) =>
                                            setCotacaoForm({
                                                ...cotacaoForm,
                                                valorTotal:
                                                    evento.target.value,
                                            })
                                        }
                                        required
                                        step="0.01"
                                        type="number"
                                        value={cotacaoForm.valorTotal}
                                    />
                                </label>

                                <label>
                                    Frete
                                    <input
                                        min="0"
                                        onChange={(evento) =>
                                            setCotacaoForm({
                                                ...cotacaoForm,
                                                frete: evento.target.value,
                                            })
                                        }
                                        step="0.01"
                                        type="number"
                                        value={cotacaoForm.frete}
                                    />
                                </label>

                                <label>
                                    Desconto
                                    <input
                                        min="0"
                                        onChange={(evento) =>
                                            setCotacaoForm({
                                                ...cotacaoForm,
                                                desconto:
                                                    evento.target.value,
                                            })
                                        }
                                        step="0.01"
                                        type="number"
                                        value={cotacaoForm.desconto}
                                    />
                                </label>
                            </div>

                            <label htmlFor="observacaoCotacao">
                                Observação
                            </label>
                            <textarea
                                id="observacaoCotacao"
                                onChange={(evento) =>
                                    setCotacaoForm({
                                        ...cotacaoForm,
                                        observacao:
                                            evento.target.value,
                                    })
                                }
                                value={cotacaoForm.observacao}
                            />

                            <button
                                disabled={salvando}
                                type="submit"
                            >
                                Salvar cotação
                            </button>

                            <small>
                                * Campo obrigatório. Cotações não entram
                                nos gráficos financeiros até serem
                                enviadas.
                            </small>
                        </form>
                    </section>

                    <section className="fornecedores-card fornecedores-comparativo">
                        <div className="fornecedores-card-topo">
                            <div>
                                <small>Comparação</small>
                                <h2>Produto igual com produto igual</h2>
                            </div>

                            <div className="fornecedores-acoes-item">
                                <button
                                    onClick={() =>
                                        baixarRelatorio('pdf')
                                    }
                                    type="button"
                                >
                                    Baixar PDF
                                </button>
                                <button
                                    onClick={() =>
                                        baixarRelatorio('excel')
                                    }
                                    type="button"
                                >
                                    Baixar Excel
                                </button>
                            </div>
                        </div>

                        {cotacoesPorProduto.length === 0 ? (
                            <p className="fornecedores-vazio">
                                Cadastre cotacoes para comparar
                                fornecedores.
                            </p>
                        ) : (
                            <div className="fornecedores-comparativo-lista">
                                {cotacoesPorProduto.map((grupo) => (
                                    <article
                                        className="fornecedores-produto"
                                        key={grupo.produtoNome}
                                    >
                                        <div className="fornecedores-produto-topo">
                                            <div>
                                                <strong>
                                                    {grupo.produtoNome}
                                                </strong>
                                                <span>
                                                    Melhor opção:{' '}
                                                    {grupo.melhor?.fornecedorNome}
                                                </span>
                                            </div>

                                            <strong>
                                                {grupo.melhor?.valorPorKg
                                                    ? `${formatarDinheiro(
                                                        grupo.melhor.valorPorKg,
                                                    )}/kg`
                                                    : `${formatarDinheiro(
                                                        grupo.melhor?.valorPorUnidade
                                                        ?? grupo.melhor?.valorPorLote,
                                                    )}/unid.`}
                                            </strong>
                                        </div>

                                        <div className="fornecedores-cotacoes-lista">
                                            {grupo.itens.map((cotacao) => (
                                                <article
                                                    className="fornecedores-cotacao-item"
                                                    key={cotacao.id}
                                                >
                                                    <div>
                                                        <strong>
                                                            {cotacao.fornecedorNome}
                                                        </strong>
                                                        <span>
                                                            {formatarData(
                                                                cotacao.dataCotacao,
                                                            )}
                                                            {' - '}
                                                            {cotacao.status}
                                                        </span>
                                                        <small>
                                                            {formatarNumero(
                                                                cotacao.quantidade,
                                                            )}
                                                            {' '}
                                                            {cotacao.unidadeMedida}
                                                            {' | '}
                                                            {formatarNumero(
                                                                cotacao.pesoTotalKg,
                                                            )}
                                                            {' kg'}
                                                        </small>
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {formatarDinheiro(
                                                                cotacao.valorLiquido,
                                                            )}
                                                        </strong>
                                                        <span>
                                                            {cotacao.valorPorKg
                                                                ? `${formatarDinheiro(
                                                                    cotacao.valorPorKg,
                                                                )}/kg`
                                                                : '-'}
                                                        </span>
                                                        <span>
                                                            {cotacao.valorPorUnidade
                                                                ? `${formatarDinheiro(
                                                                    cotacao.valorPorUnidade,
                                                                )}/${cotacao.unidadeMedida}`
                                                                : '-'}
                                                        </span>
                                                    </div>

                                                    {cotacao.status
                                                        === 'COTACAO' && (
                                                        <div className="fornecedores-acoes-item">
                                                            <button
                                                                onClick={() =>
                                                                    abrirMigracao(
                                                                        cotacao,
                                                                        'financeiro',
                                                                    )
                                                                }
                                                                type="button"
                                                            >
                                                                Enviar ao dashboard
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    abrirMigracao(
                                                                        cotacao,
                                                                        'contas',
                                                                    )
                                                                }
                                                                type="button"
                                                            >
                                                                Enviar a pagar
                                                            </button>
                                                        </div>
                                                    )}
                                                </article>
                                            ))}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="fornecedores-card fornecedores-compras">
                        <div className="fornecedores-card-topo">
                            <div>
                                <small>Compras registradas</small>
                                <h2>
                                    {fornecedorSelecionado
                                        ? fornecedorSelecionado.nome
                                        : 'Selecione um fornecedor'}
                                </h2>
                            </div>
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
                                            {compra.produtoNome && (
                                                <span>
                                                    {compra.produtoNome}
                                                    {' - '}
                                                    {compra.produtoClassificacao}
                                                </span>
                                            )}
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
                            aria-modal="true"
                            className="fornecedores-modal"
                            role="dialog"
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

                {migracao && (
                    <div className="fornecedores-modal-fundo">
                        <form
                            aria-modal="true"
                            className="fornecedores-modal"
                            onSubmit={executarMigracao}
                            role="dialog"
                        >
                            <h2>
                                {migracao.destino === 'financeiro'
                                    ? 'Enviar ao dashboard financeiro'
                                    : 'Enviar para contas a pagar'}
                            </h2>
                            <p>
                                Essa ação é opcional. Só depois dela a
                                cotação passa a afetar gráficos
                                financeiros ou previsão futura.
                            </p>

                            <label>
                                Categoria financeira existente
                                <input
                                    onChange={(evento) =>
                                        setMigracaoForm({
                                            ...migracaoForm,
                                            categoriaId:
                                                evento.target.value,
                                        })
                                    }
                                    placeholder="ID da categoria, se souber"
                                    type="number"
                                    value={migracaoForm.categoriaId}
                                />
                            </label>

                            <label>
                                Ou criar nova categoria
                                <input
                                    onChange={(evento) =>
                                        setMigracaoForm({
                                            ...migracaoForm,
                                            novaCategoriaNome:
                                                evento.target.value,
                                        })
                                    }
                                    placeholder="Ex.: Sementes"
                                    type="text"
                                    value={migracaoForm.novaCategoriaNome}
                                />
                            </label>

                            {migracao.destino === 'financeiro' ? (
                                <label>
                                    Data da movimentação
                                    <input
                                        onChange={(evento) =>
                                            setMigracaoForm({
                                                ...migracaoForm,
                                                dataMovimentacao:
                                                    evento.target.value,
                                            })
                                        }
                                        type="date"
                                        value={migracaoForm.dataMovimentacao}
                                    />
                                </label>
                            ) : (
                                <>
                                    <label>
                                        Data de vencimento
                                        <input
                                            onChange={(evento) =>
                                                setMigracaoForm({
                                                    ...migracaoForm,
                                                    dataVencimento:
                                                        evento.target.value,
                                                })
                                            }
                                            type="date"
                                            value={migracaoForm.dataVencimento}
                                        />
                                    </label>

                                    <label>
                                        Documento
                                        <input
                                            onChange={(evento) =>
                                                setMigracaoForm({
                                                    ...migracaoForm,
                                                    numeroDocumento:
                                                        evento.target.value,
                                                })
                                            }
                                            type="text"
                                            value={migracaoForm.numeroDocumento}
                                        />
                                    </label>
                                </>
                            )}

                            <label>
                                Observação
                                <textarea
                                    onChange={(evento) =>
                                        setMigracaoForm({
                                            ...migracaoForm,
                                            observacao:
                                                evento.target.value,
                                        })
                                    }
                                    value={migracaoForm.observacao}
                                />
                            </label>

                            <div>
                                <button
                                    onClick={() => setMigracao(null)}
                                    type="button"
                                >
                                    Cancelar
                                </button>
                                <button
                                    disabled={salvando}
                                    type="submit"
                                >
                                    Confirmar envio
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Fornecedores
