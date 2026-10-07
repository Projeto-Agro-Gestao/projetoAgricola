import {
    Fragment,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import {
    useNavigate,
} from 'react-router'
import ShellDashboard from '../componentes/ShellDashboard.jsx'
import { API_BASE_URL as API_URL } from '../config.js'
import './Fornecedores.css'
import { apiFetch } from '../servicos/api.js'
import { obterSessao } from '../servicos/sessao.js'
import CarregamentoTela from '../componentes/CarregamentoTela.jsx'

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

function obterTonalidadeCategoria(nome) {
    const hash = Array.from(nome).reduce(
        (hash, caractere) => (hash * 31 + caractere.charCodeAt(0)) >>> 0,
        0,
    )

    return [105, 50, 28][hash % 3]
}

function hojeIso() {
    return new Date().toISOString().slice(0, 10)
}

function criarFornecedorFormVazio() {
    return {
        id: null,
        nome: '',
        codigoCadastro: '',
        nomeFantasia: '',
        razaoSocial: '',
        tipoPessoa: 'JURIDICA',
        documento: '',
        inscricaoMunicipal: '',
        inscricaoEstadual: '',
        regimeTributario: '',
        telefone: '',
        telefoneWhatsapp: '',
        email: '',
        contatoComercial: '',
        site: '',
        observacao: '',
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        municipio: '',
        uf: '',
        pais: 'Brasil',
        prazoMedioEntregaDias: '',
        formasPagamento: '',
        prazoPagamento: '',
        condicaoFrete: '',
        valorMinimoPedido: '',
        observacoesComerciais: '',
        ativo: true,
    }
}

function criarCotacaoFormVazia() {
    return {
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
    }
}

function obterValorComparavel(cotacao) {
    return Number(
        cotacao?.valorPorKg
        ?? cotacao?.valorPorUnidade
        ?? cotacao?.valorPorLote
        ?? 0,
    )
}

function obterUnidadeComparavel(cotacao) {
    if (cotacao?.valorPorKg) {
        return 'kg'
    }

    if (cotacao?.valorPorUnidade) {
        return cotacao.unidadeMedida || 'unidade'
    }

    return 'lote'
}

function Fornecedores() {
    const navigate = useNavigate()
    const filtroCategoriaRef = useRef(null)
    const [sessao] = useState(obterSessao)

    const [fornecedores, setFornecedores] = useState([])
    const [lixeira, setLixeira] = useState([])
    const [categoriasProduto, setCategoriasProduto] = useState([])
    const [categoriasFinanceiras, setCategoriasFinanceiras] =
        useState([])
    const [produtos, setProdutos] = useState([])
    const [cotacoes, setCotacoes] = useState([])
    const [comparativos, setComparativos] = useState([])
    const [inteligenciaCompras, setInteligenciaCompras] =
        useState(null)
    const [compras, setCompras] = useState([])
    const [fornecedorSelecionado, setFornecedorSelecionado] =
        useState(null)
    const [filtroFornecedorCompras, setFiltroFornecedorCompras] = useState('todos')

    const [mostrarLixeira, setMostrarLixeira] = useState(false)
    const [mostrarFormularioFornecedor, setMostrarFormularioFornecedor] =
        useState(false)
    const [mostrarFormularioCotacao, setMostrarFormularioCotacao] =
        useState(false)
    const [buscaFornecedor, setBuscaFornecedor] = useState('')
    const [filtroCategoriaFornecedor, setFiltroCategoriaFornecedor] = useState('')
    const [mostrarOpcoesCategoria, setMostrarOpcoesCategoria] = useState(false)
    const [paginaFornecedores, setPaginaFornecedores] = useState(1)
    const [categoriaHistorico, setCategoriaHistorico] = useState('')
    const [paginaHistorico, setPaginaHistorico] = useState(1)
    const [cotacaoExpandida, setCotacaoExpandida] = useState(null)
    const [buscaCompra, setBuscaCompra] = useState('')
    const [filtroSituacaoCompra, setFiltroSituacaoCompra] = useState('')
    const [categoriaCompra, setCategoriaCompra] = useState('')
    const [compraExpandida, setCompraExpandida] = useState(null)
    const [paginaCompras, setPaginaCompras] = useState(1)
    const [carregandoCompras, setCarregandoCompras] = useState(false)
    const [carregando, setCarregando] = useState(true)
    const [salvando, setSalvando] = useState(false)
    const [consultandoCnpj, setConsultandoCnpj] = useState(false)
    const [erro, setErro] = useState('')
    const [sucesso, setSucesso] = useState('')
    const [confirmacao, setConfirmacao] = useState(null)
    const [migracao, setMigracao] = useState(null)

    const [fornecedorForm, setFornecedorForm] =
        useState(criarFornecedorFormVazio)

    const [categoriaProdutoNome, setCategoriaProdutoNome] =
        useState('')

    const [produtoForm, setProdutoForm] = useState({
        categoriaProdutoId: '',
        nome: '',
        unidadeBase: 'saca',
        pesoPadraoKg: '',
    })

    const [cotacaoForm, setCotacaoForm] = useState(criarCotacaoFormVazia)

    const [migracaoForm, setMigracaoForm] = useState({
        categoriaId: '',
        novaCategoriaNome: '',
        dataMovimentacao: hojeIso(),
        dataVencimento: hojeIso(),
        numeroDocumento: '',
        observacao: '',
    })

    const empresaId = sessao?.usuario?.empresaId

    const resumoFornecedor = useMemo(() => {
        const resumo = new Map()
        cotacoes.forEach((cotacao) => {
            const id = cotacao.fornecedorId
            if (id == null) return
            const atual = resumo.get(String(id)) || { categorias: new Set(), cotacoes: 0 }
            atual.cotacoes += 1
            if (cotacao.categoriaProdutoNome) atual.categorias.add(cotacao.categoriaProdutoNome)
            resumo.set(String(id), atual)
        })
        return resumo
    }, [cotacoes])

    const categoriasFornecedores = useMemo(
        () => Array.from(new Set([...resumoFornecedor.values()].flatMap((item) => [...item.categorias]))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
        [resumoFornecedor],
    )

    const fornecedoresVisiveis = useMemo(() => {
        const termo = buscaFornecedor.trim().toLocaleLowerCase('pt-BR')
        const lista = mostrarLixeira ? lixeira : fornecedores
        return lista.filter((fornecedor) => {
            const correspondeBusca = !termo || [fornecedor.nome, fornecedor.razaoSocial, fornecedor.documento, fornecedor.municipio, fornecedor.email]
                .some((valor) => String(valor ?? '').toLocaleLowerCase('pt-BR').includes(termo))
            const resumo = resumoFornecedor.get(String(fornecedor.id))
            const correspondeCategoria = !filtroCategoriaFornecedor || resumo?.categorias.has(filtroCategoriaFornecedor)
            return correspondeBusca && correspondeCategoria
        })
    }, [buscaFornecedor, filtroCategoriaFornecedor, fornecedores, lixeira, mostrarLixeira, resumoFornecedor])

    const totalPaginasFornecedores = Math.max(1, Math.ceil(fornecedoresVisiveis.length / 5))
    const paginaFornecedoresAtual = Math.min(paginaFornecedores, totalPaginasFornecedores)
    const inicioFornecedoresPagina = (paginaFornecedoresAtual - 1) * 5
    const fornecedoresPagina = fornecedoresVisiveis.slice(inicioFornecedoresPagina, inicioFornecedoresPagina + 5)

    useEffect(() => {
        setPaginaFornecedores(1)
    }, [buscaFornecedor, filtroCategoriaFornecedor, mostrarLixeira])

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

    const resumoCategoriasProduto = useMemo(
        () =>
            categoriasProduto.map((categoria) => {
                const produtosDaCategoria = produtos.filter(
                    (produto) =>
                        produto.categoriaId === categoria.id
                        || produto.categoriaNome === categoria.nome,
                )

                const cotacoesDaCategoria = cotacoes.filter(
                    (cotacao) =>
                        cotacao.categoriaProdutoNome === categoria.nome,
                )

                return {
                    ...categoria,
                    produtos: produtosDaCategoria.length,
                    cotacoes: cotacoesDaCategoria.length,
                }
            }),
        [
            categoriasProduto,
            cotacoes,
            produtos,
        ],
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

    const analiseCotacoes = useMemo(
        () => {
            const produtosComparados = cotacoesPorProduto.filter(
                (grupo) => grupo.itens.length > 1,
            )

            const economiaPotencial = produtosComparados.reduce(
                (total, grupo) => {
                    const melhor = Number(
                        grupo.itens[0]?.valorPorKg
                        ?? grupo.itens[0]?.valorPorUnidade
                        ?? grupo.itens[0]?.valorPorLote
                        ?? 0,
                    )
                    const pior = Number(
                        grupo.itens[grupo.itens.length - 1]?.valorPorKg
                        ?? grupo.itens[grupo.itens.length - 1]?.valorPorUnidade
                        ?? grupo.itens[grupo.itens.length - 1]?.valorPorLote
                        ?? 0,
                    )

                    return total + Math.max(0, pior - melhor)
                },
                0,
            )

            const fornecedorMaisBarato = new Map()

            produtosComparados.forEach((grupo) => {
                const nomeFornecedor =
                    grupo.melhor?.fornecedorNome ?? 'Sem fornecedor'

                fornecedorMaisBarato.set(
                    nomeFornecedor,
                    (fornecedorMaisBarato.get(nomeFornecedor) ?? 0) + 1,
                )
            })

            const fornecedorDestaque = Array.from(
                fornecedorMaisBarato.entries(),
            ).sort(
                (primeiro, segundo) => segundo[1] - primeiro[1],
            )[0]

            return {
                totalCotacoes: cotacoes.length,
                produtosComparados: produtosComparados.length,
                economiaPotencial,
                fornecedorDestaque: fornecedorDestaque?.[0] ?? '-',
            }
        },
        [
            cotacoes.length,
            cotacoesPorProduto,
        ],
    )

    const graficoCotacoesDetalhado = useMemo(
        () =>
            cotacoesPorProduto
                .filter((grupo) => grupo.itens.length > 1)
                .map((grupo) => {
                    const maiorValor = Math.max(
                        ...grupo.itens.map(obterValorComparavel),
                    )

                    return {
                        ...grupo,
                        maiorValor,
                        itens: grupo.itens.map((cotacao) => {
                            const valor = obterValorComparavel(cotacao)

                            return {
                                ...cotacao,
                                valorComparavel: valor,
                                unidadeComparavel:
                                    obterUnidadeComparavel(cotacao),
                                largura:
                                    maiorValor > 0
                                        ? Math.max(
                                            8,
                                            (valor / maiorValor) * 100,
                                        )
                                        : 0,
                            }
                        }),
                    }
                }),
        [cotacoesPorProduto],
    )

    const categoriasHistorico = useMemo(() => {
        const contagens = new Map()
        cotacoes.forEach((cotacao) => {
            const categoria = cotacao.categoriaProdutoNome || 'Outros'
            contagens.set(categoria, (contagens.get(categoria) ?? 0) + 1)
        })
        return Array.from(contagens, ([nome, total]) => ({ nome, total }))
            .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    }, [cotacoes])

    const linhasComparacao = useMemo(
        () => cotacoesPorProduto.flatMap((grupo) => {
            const media = grupo.itens.reduce((soma, cotacao) => soma + obterValorComparavel(cotacao), 0) / grupo.itens.length
            return grupo.itens.map((cotacao, indice) => ({
                cotacao,
                grupo,
                indice,
                media,
                fornecedor: fornecedores.find((item) => String(item.id) === String(cotacao.fornecedorId)),
            }))
        }),
        [cotacoesPorProduto, fornecedores],
    )

    const linhasComparacaoFiltradas = categoriaHistorico
        ? linhasComparacao.filter(({ cotacao }) => (cotacao.categoriaProdutoNome || 'Outros') === categoriaHistorico)
        : linhasComparacao
    const totalPaginasHistorico = Math.max(1, Math.ceil(linhasComparacaoFiltradas.length / 5))
    const paginaHistoricoAtual = Math.min(paginaHistorico, totalPaginasHistorico)
    const linhasHistoricoPagina = linhasComparacaoFiltradas.slice((paginaHistoricoAtual - 1) * 5, paginaHistoricoAtual * 5)

    useEffect(() => {
        setPaginaHistorico(1)
    }, [categoriaHistorico])

    const cotacoesAbertas = useMemo(
        () => cotacoes.filter((cotacao) => cotacao.status === 'COTACAO'),
        [cotacoes],
    )

    const melhorCotacao = useMemo(
        () => graficoCotacoesDetalhado[0]?.itens[0],
        [graficoCotacoesDetalhado],
    )

    useEffect(() => {
        if (!mostrarOpcoesCategoria) return undefined

        function fecharAoClicarFora(evento) {
            if (!filtroCategoriaRef.current?.contains(evento.target)) {
                setMostrarOpcoesCategoria(false)
            }
        }

        document.addEventListener('pointerdown', fecharAoClicarFora)
        return () => document.removeEventListener('pointerdown', fecharAoClicarFora)
    }, [mostrarOpcoesCategoria])

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

    function requisitar(
        caminho,
        opcoes = {},
    ) {
        return apiFetch(
            `${API_URL}/empresas/${empresaId}${caminho}`,
            {
                method: opcoes.method ?? 'GET',
                body: opcoes.body,
            },
        )
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
                requisitar('/fornecedores/inteligencia-compras'),
                requisitar('/categorias?tipo=DESPESA'),
            ])

            const mensagens = [
                'Não foi possível carregar fornecedores.',
                'Não foi possível carregar a lixeira.',
                'Não foi possível carregar categorias de produto.',
                'Não foi possível carregar produtos.',
                'Não foi possível carregar cotações.',
                'Não foi possível carregar comparativos.',
                'Não foi possível carregar inteligência de compras.',
                'Não foi possível carregar categorias financeiras.',
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
                inteligenciaDados,
                categoriasFinanceirasDados,
            ] = await Promise.all(
                respostas.map((resposta) => resposta.json()),
            )

            setFornecedores(fornecedoresDados)
            setLixeira(lixeiraDados)
            setCategoriasProduto(categoriasDados)
            setProdutos(produtosDados)
            setCotacoes(cotacoesDados)
            setComparativos(comparativosDados)
            setInteligenciaCompras(inteligenciaDados)
            setFiltroFornecedorCompras('todos')
            setCategoriasFinanceiras(
                categoriasFinanceirasDados.filter(
                    (categoria) => categoria.ativo,
                ),
            )
            carregarTodasCompras(fornecedoresDados)
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
        setFiltroFornecedorCompras(String(fornecedor.id))
        setCompras([])
        setBuscaCompra('')
        setFiltroSituacaoCompra('')
        setCategoriaCompra('')
        setCompraExpandida(null)
        setPaginaCompras(1)
        setCarregandoCompras(true)
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

            setCompras((await resposta.json()).map((compra) => ({
                ...compra,
                fornecedorId: fornecedor.id,
                fornecedorNome: fornecedor.nome,
                municipio: fornecedor.municipio,
                uf: fornecedor.uf,
            })))
        } catch (erroDaRequisicao) {
            setErro(
                erroDaRequisicao instanceof Error
                    ? erroDaRequisicao.message
                    : 'Não foi possível carregar as compras.',
            )
        } finally {
            setCarregandoCompras(false)
        }
    }

    async function carregarTodasCompras(listaFornecedores = fornecedores) {
        setFornecedorSelecionado(null)
        setFiltroFornecedorCompras('todos')
        setCompras([])
        setBuscaCompra('')
        setFiltroSituacaoCompra('')
        setCategoriaCompra('')
        setCompraExpandida(null)
        setPaginaCompras(1)
        setCarregandoCompras(true)
        setErro('')

        try {
            const respostas = await Promise.all(listaFornecedores.map((fornecedor) =>
                requisitar(`/fornecedores/${fornecedor.id}/compras`),
            ))
            const comprasPorFornecedor = await Promise.all(respostas.map(async (resposta, indice) => {
                if (!resposta.ok) {
                    throw new Error(await obterMensagemDeErro(resposta, 'Não foi possível carregar as compras.'))
                }
                const fornecedor = listaFornecedores[indice]
                const itens = await resposta.json()
                return itens.map((compra) => ({
                    ...compra,
                    fornecedorId: fornecedor.id,
                    fornecedorNome: fornecedor.nome,
                    municipio: fornecedor.municipio,
                    uf: fornecedor.uf,
                }))
            }))
            setCompras(comprasPorFornecedor.flat().sort((a, b) => {
                if (!a.data) return 1
                if (!b.data) return -1
                return b.data.localeCompare(a.data)
            }))
            if (listaFornecedores.length === 0) {
                setCompras([])
            }
        } catch (erroDaRequisicao) {
            setErro(erroDaRequisicao instanceof Error ? erroDaRequisicao.message : 'Não foi possível carregar as compras.')
        } finally {
            setCarregandoCompras(false)
        }
    }

    function selecionarFornecedorCompras(id) {
        if (id === 'todos') {
            carregarTodasCompras()
            return
        }

        const fornecedor = fornecedores.find((item) => String(item.id) === id)
        if (fornecedor) carregarCompras(fornecedor)
    }

    async function salvarFornecedor(evento) {
        evento.preventDefault()

        const nome = fornecedorForm.nome
            .trim()
            .replace(/\s+/g, ' ')
        const documento = fornecedorForm.documento
            .replace(/\D/g, '')
        const camposObrigatorios = [
            [
                documento,
                'Informe o CPF/CNPJ do fornecedor.',
            ],
            [
                fornecedorForm.razaoSocial,
                'Informe a razao social.',
            ],
            [
                fornecedorForm.cep,
                'Informe o CEP.',
            ],
            [
                fornecedorForm.logradouro,
                'Informe o endereco.',
            ],
            [
                fornecedorForm.numero,
                'Informe o numero.',
            ],
            [
                fornecedorForm.bairro,
                'Informe o bairro.',
            ],
            [
                fornecedorForm.municipio,
                'Informe a cidade.',
            ],
            [
                fornecedorForm.uf,
                'Informe a UF.',
            ],
            [
                fornecedorForm.pais,
                'Informe o pais.',
            ],
        ]

        if (!nome) {
            setErro('Informe o nome do fornecedor.')
            return
        }

        for (const [valor, mensagem] of camposObrigatorios) {
            if (!String(valor ?? '').trim()) {
                setErro(mensagem)
                return
            }
        }

        if (
            fornecedorForm.tipoPessoa === 'FISICA'
            && documento.length !== 11
        ) {
            setErro('CPF deve conter 11 digitos.')
            return
        }

        if (
            fornecedorForm.tipoPessoa === 'JURIDICA'
            && documento.length !== 14
        ) {
            setErro('CNPJ deve conter 14 digitos.')
            return
        }

        await executarSalvamento(
            fornecedorForm.id
                ? `/fornecedores/${fornecedorForm.id}`
                : '/fornecedores',
            fornecedorForm.id ? 'PUT' : 'POST',
            {
                nome,
                nomeFantasia:
                    fornecedorForm.nomeFantasia.trim() || null,
                razaoSocial:
                    fornecedorForm.razaoSocial.trim() || null,
                inscricaoMunicipal:
                    fornecedorForm.inscricaoMunicipal.trim() || null,
                inscricaoEstadual:
                    fornecedorForm.inscricaoEstadual.trim() || null,
                regimeTributario:
                    fornecedorForm.regimeTributario.trim() || null,
                tipoPessoa: fornecedorForm.tipoPessoa || null,
                documento,
                telefone: fornecedorForm.telefone.trim() || null,
                telefoneWhatsapp:
                    fornecedorForm.telefoneWhatsapp.trim() || null,
                email: fornecedorForm.email.trim() || null,
                contatoComercial:
                    fornecedorForm.contatoComercial.trim() || null,
                site: fornecedorForm.site.trim() || null,
                observacao:
                    fornecedorForm.observacao.trim() || null,
                ativo: fornecedorForm.ativo,
                cep: fornecedorForm.cep.trim() || null,
                logradouro:
                    fornecedorForm.logradouro.trim() || null,
                numero: fornecedorForm.numero.trim() || null,
                complemento:
                    fornecedorForm.complemento.trim() || null,
                bairro: fornecedorForm.bairro.trim() || null,
                municipio:
                    fornecedorForm.municipio.trim() || null,
                uf: fornecedorForm.uf.trim() || null,
                pais: fornecedorForm.pais.trim() || null,
                prazoMedioEntregaDias:
                    fornecedorForm.prazoMedioEntregaDias
                        ? Number(
                            fornecedorForm.prazoMedioEntregaDias,
                        )
                        : null,
                formasPagamento:
                    fornecedorForm.formasPagamento.trim() || null,
                prazoPagamento:
                    fornecedorForm.prazoPagamento.trim() || null,
                condicaoFrete:
                    fornecedorForm.condicaoFrete.trim() || null,
                valorMinimoPedido:
                    fornecedorForm.valorMinimoPedido
                        ? Number(fornecedorForm.valorMinimoPedido)
                        : null,
                observacoesComerciais:
                    fornecedorForm.observacoesComerciais.trim()
                    || null,
            },
            fornecedorForm.id
                ? 'Fornecedor atualizado.'
                : 'Fornecedor cadastrado.',
        )

        setFornecedorForm(criarFornecedorFormVazio())
        setMostrarFormularioFornecedor(false)
    }

    async function consultarCnpjFornecedor() {
        const cnpj = fornecedorForm.documento.replace(/\D/g, '')

        if (fornecedorForm.tipoPessoa !== 'JURIDICA') {
            setErro('A consulta automatica esta disponivel para CNPJ.')
            return
        }

        if (cnpj.length !== 14) {
            setErro('Informe um CNPJ com 14 digitos para consultar.')
            return
        }

        try {
            setConsultandoCnpj(true)
            setErro('')
            setSucesso('')

            const resposta = await requisitar(
                `/fornecedores/consulta-cnpj/${encodeURIComponent(cnpj)}`,
            )

            if (!resposta.ok) {
                throw new Error(
                    await obterMensagemDeErro(
                        resposta,
                        'Nao foi possivel consultar o CNPJ.',
                    ),
                )
            }

            const dados = await resposta.json()

            setFornecedorForm((formAtual) => ({
                ...formAtual,
                documento: dados.cnpj ?? formAtual.documento,
                nome: dados.nomeFantasia
                    || dados.razaoSocial
                    || formAtual.nome,
                nomeFantasia:
                    dados.nomeFantasia ?? formAtual.nomeFantasia,
                razaoSocial:
                    dados.razaoSocial ?? formAtual.razaoSocial,
                inscricaoMunicipal:
                    dados.inscricaoMunicipal
                    ?? formAtual.inscricaoMunicipal,
                inscricaoEstadual:
                    dados.inscricaoEstadual
                    ?? formAtual.inscricaoEstadual,
                regimeTributario:
                    dados.regimeTributario
                    ?? formAtual.regimeTributario,
                cep: dados.cep ?? formAtual.cep,
                logradouro:
                    dados.logradouro ?? formAtual.logradouro,
                numero: dados.numero ?? formAtual.numero,
                complemento:
                    dados.complemento ?? formAtual.complemento,
                bairro: dados.bairro ?? formAtual.bairro,
                municipio:
                    dados.municipio ?? formAtual.municipio,
                uf: dados.uf ?? formAtual.uf,
                pais: dados.pais ?? formAtual.pais,
            }))
            setSucesso('Dados do CNPJ preenchidos para revisao.')
        } catch (erroDaConsulta) {
            setErro(
                erroDaConsulta instanceof Error
                    ? erroDaConsulta.message
                    : 'Nao foi possivel consultar o CNPJ.',
            )
        } finally {
            setConsultandoCnpj(false)
        }
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

        const salvo = await executarSalvamento(
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

        if (salvo) {
            setCotacaoForm(criarCotacaoFormVazia())
            setMostrarFormularioCotacao(false)
        }
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
            return true
        } catch (erroDaRequisicao) {
            setErro(
                erroDaRequisicao instanceof Error
                    ? erroDaRequisicao.message
                    : 'Não foi possível salvar.',
            )
            return false
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

        if (
            !migracaoForm.categoriaId
            && !migracaoForm.novaCategoriaNome.trim()
        ) {
            setErro(
                'Escolha uma categoria existente ou informe uma nova categoria.',
            )
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

    const categoriasCompras = useMemo(
        () => [...new Set(compras.map((compra) => compra.categoriaNome).filter(Boolean))],
        [compras],
    )
    const situacoesCompras = useMemo(
        () => [...new Set(compras.map((compra) => compra.situacao).filter(Boolean))],
        [compras],
    )
    const comprasFiltradas = useMemo(() => {
        const termo = buscaCompra.trim().toLocaleLowerCase('pt-BR')
        return compras.filter((compra) => {
            const correspondeBusca = !termo || [
                compra.descricao,
                compra.produtoNome,
                compra.produtoClassificacao,
                compra.categoriaNome,
                compra.compradorNome,
                compra.origem,
                compra.situacao,
            ].some((valor) => String(valor ?? '').toLocaleLowerCase('pt-BR').includes(termo))
            return correspondeBusca
                && (!filtroSituacaoCompra || compra.situacao === filtroSituacaoCompra)
                && (!categoriaCompra || compra.categoriaNome === categoriaCompra)
        })
    }, [buscaCompra, categoriaCompra, compras, filtroSituacaoCompra])
    const totalPaginasCompras = Math.max(1, Math.ceil(comprasFiltradas.length / 5))
    const paginaComprasAtual = Math.min(paginaCompras, totalPaginasCompras)
    const comprasPagina = comprasFiltradas.slice((paginaComprasAtual - 1) * 5, paginaComprasAtual * 5)

    useEffect(() => {
        setPaginaCompras(1)
    }, [buscaCompra, categoriaCompra, filtroSituacaoCompra])

    if (!sessao) {
        return null
    }

    return (
        <ShellDashboard sessao={sessao} ativo="fornecedores">
        <div className={`fornecedores-pagina${mostrarFormularioFornecedor ? ' fornecedores-modal-fornecedor-aberta' : ''}${mostrarFormularioCotacao ? ' fornecedores-modal-cotacao-aberta' : ''}`}>
            <div className="fornecedores-conteudo">
                <header className="fornecedores-cabecalho">
                    <div>
                        <p>Suprimentos &amp; cotações <span>·</span> Gestão de compras estratégicas</p>
                        <h1>Controle de Fornecedores &amp; Cotações</h1>
                        <span>
                            Cadastre fornecedores, insumos e cotações de preços em tempo real para comparar onde a compra
                            <br className="fornecedores-quebra-desktop" /> gera maior rentabilidade e menor custo por hectare na safra ativa.
                        </span>
                    </div>

                    <div className="fornecedores-cabecalho-acoes">
                        <button
                            className="fornecedores-acao-secundaria"
                            onClick={() => {
                                setCotacaoForm(criarCotacaoFormVazia())
                                setMostrarFormularioCotacao(true)
                            }}
                            type="button"
                        >
                            <span className="material-symbols-outlined" aria-hidden="true">shopping_cart_checkout</span>
                            Nova cotação
                        </button>
                        <button
                            className="fornecedores-acao-principal"
                            onClick={() => {
                                setFornecedorForm(criarFornecedorFormVazio())
                                setMostrarFormularioFornecedor(true)
                            }}
                            type="button"
                        >
                            <span className="material-symbols-outlined" aria-hidden="true">group_add</span>
                            Novo fornecedor
                        </button>
                    </div>
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

                <section className="fornecedores-kpis" aria-label="Resumo de compras">
                    <article>
                        <div className="fornecedores-kpi-rotulo">Fornecedores ativos <span className="material-symbols-outlined">storefront</span></div>
                        <strong>{fornecedores.filter((item) => item.ativo !== false).length}</strong>
                        <small><i /> Cadastro da safra atual</small>
                    </article>
                    <article>
                        <div className="fornecedores-kpi-rotulo">Cotações em aberto <span className="material-symbols-outlined">request_quote</span></div>
                        <strong>{cotacoesAbertas.length}</strong>
                        <small className="fornecedores-kpi-alerta">{cotacoesAbertas.length ? 'Em análise' : 'Nenhuma cotação pendente'}</small>
                    </article>
                    <article>
                        <div className="fornecedores-kpi-rotulo">Economia identificada <span className="material-symbols-outlined">trending_down</span></div>
                        <strong className="fornecedores-kpi-verde">{formatarDinheiro(analiseCotacoes.economiaPotencial)}</strong>
                        <small>Entre ofertas do mesmo insumo</small>
                    </article>
                    <article>
                        <div className="fornecedores-kpi-rotulo">Melhor oferta atual <span className="material-symbols-outlined">military_tech</span></div>
                        <strong className="fornecedores-kpi-fornecedor">{melhorCotacao?.fornecedorNome || 'Aguardando cotações'}</strong>
                        <small>{melhorCotacao ? `${melhorCotacao.produtoNome} · ${formatarDinheiro(melhorCotacao.valorComparavel)}/${melhorCotacao.unidadeComparavel}` : 'Registre ofertas comparáveis'}</small>
                    </article>
                </section>

                <section className="fornecedores-painel-precos fornecedores-comparativo-destaque">
                    <div className="fornecedores-card-topo">
                        <div>
                            <small>Compra inteligente</small>
                            <h2><span className="material-symbols-outlined">compare_arrows</span> Comparativo Inteligente de Cotações</h2>
                            <p>Compare preço, frete e condições para identificar a compra mais vantajosa para sua propriedade.</p>
                        </div>
                    </div>

                    {graficoCotacoesDetalhado.length === 0 ? (
                        <div className="fornecedores-comparativo-vazio">
                            <span className="material-symbols-outlined">query_stats</span>
                            <div><strong>Seu comparativo aparece aqui</strong><p>Registre cotações de um mesmo insumo para visualizar a melhor oferta, as condições e a diferença de preço.</p></div>
                            <button onClick={() => {
                                setCotacaoForm(criarCotacaoFormVazia())
                                setMostrarFormularioCotacao(true)
                            }} type="button">Lançar cotação</button>
                        </div>
                    ) : (
                        <div className="fornecedores-comparativo-layout">
                            {(() => {
                                const grupo = graficoCotacoesDetalhado[0]
                                const melhor = grupo.itens[0]
                                const segundo = grupo.itens[1]
                                const terceiro = grupo.itens[2]
                                const fornecedorMelhor = fornecedores.find(
                                    (fornecedor) => String(fornecedor.id) === String(melhor?.fornecedorId),
                                )
                                const economiaUnitario = segundo
                                    ? Math.max(0, Number(segundo.valorComparavel) - Number(melhor.valorComparavel))
                                    : 0
                                const quantidadeComparavel = melhor?.valorPorKg
                                    ? Number(melhor.pesoTotalKg || 0)
                                    : melhor?.valorPorUnidade
                                        ? Number(melhor.quantidade || 0)
                                        : 1
                                const economiaTotal = economiaUnitario * quantidadeComparavel
                                const maiorValorCurva = Number(grupo.itens.at(-1)?.valorComparavel || 0)
                                const unidadeCurva = melhor?.valorPorKg
                                    ? Number(melhor.pesoTotalKg || 0)
                                    : melhor?.valorPorUnidade
                                        ? Number(melhor.quantidade || 0)
                                        : 1
                                const dispersaoTotal = Math.max(0, maiorValorCurva - Number(melhor?.valorComparavel || 0)) * unidadeCurva
                                return (
                                    <>
                                        <article className="fornecedores-oferta-melhor">
                                            <div className="fornecedores-selo-melhor"><span className="material-symbols-outlined">verified</span> Mais vantajoso · menor preço</div>
                                            <div className="fornecedores-oferta-identidade"><span>{melhor?.fornecedorNome?.slice(0, 2)?.toLocaleUpperCase('pt-BR') || 'OK'}</span><div><strong>{melhor?.fornecedorNome}</strong><small>{[fornecedorMelhor?.municipio, fornecedorMelhor?.uf, fornecedorMelhor?.documento ? `${fornecedorMelhor.tipoPessoa === 'FISICA' ? 'CPF' : 'CNPJ'}: ${fornecedorMelhor.documento}` : null].filter(Boolean).join(' · ') || grupo.produtoNome}</small></div></div>
                                            <div className="fornecedores-oferta-precos">
                                                <div className="fornecedores-oferta-preco-unitario"><small>Valor unitário ofertado</small><strong>{formatarDinheiro(melhor?.valorComparavel)}<span> / {melhor?.unidadeComparavel}{melhor?.unidadeMedida && melhor.unidadeComparavel !== 'kg' && melhor?.quantidade && melhor?.pesoTotalKg ? ` (${formatarNumero(Number(melhor.pesoTotalKg) / Number(melhor.quantidade))}kg)` : ''}</span></strong></div>
                                                <div className="fornecedores-oferta-total">
                                                    {economiaUnitario > 0 && <small className="fornecedores-oferta-diferenca">-{formatarDinheiro(economiaUnitario)}/{melhor?.unidadeComparavel} vs 2º lugar</small>}
                                                    <span>Total: <strong>{formatarDinheiro(melhor?.valorLiquido ?? melhor?.valorTotal)}</strong></span>
                                                    <small>({formatarNumero(melhor?.quantidade)} {melhor?.unidadeMedida})</small>
                                                </div>
                                            </div>
                                            <div className="fornecedores-oferta-condicoes">
                                                <div><small>Frete</small><strong>{fornecedorMelhor?.condicaoFrete || (melhor?.frete > 0 ? 'Valor cotado' : 'Não informado')}</strong></div>
                                                <div><small>Prazo</small><strong>{fornecedorMelhor?.prazoMedioEntregaDias ? `${fornecedorMelhor.prazoMedioEntregaDias} dias` : 'Não informado'}</strong></div>
                                                <div><small>Condição</small><strong>{fornecedorMelhor?.prazoPagamento || fornecedorMelhor?.formasPagamento || 'Não informado'}</strong></div>
                                            </div>
                                            {economiaTotal > 0 && <div className="fornecedores-oferta-veredito"><strong className="fornecedores-veredito-titulo">Veredito do Sistema:</strong> Economia total de <strong>{formatarDinheiro(economiaTotal)}</strong></div>}
                                            <div className="fornecedores-oferta-acoes">
                                                <button
                                                    className="fornecedores-oferta-aprovar"
                                                    disabled={melhor?.status !== 'COTACAO'}
                                                    onClick={() => abrirMigracao(melhor, 'contas')}
                                                    type="button"
                                                >
                                                    <span className="material-symbols-outlined" aria-hidden="true">check_circle</span>
                                                    {melhor?.status === 'COTACAO' ? 'Aprovar cotação' : 'Cotação já encaminhada'}
                                                </button>
                                                <button
                                                    className="fornecedores-oferta-historico"
                                                    onClick={() => document.getElementById('comparar-precos')?.scrollIntoView({ behavior: 'smooth' })}
                                                    type="button"
                                                >
                                                    Histórico
                                                </button>
                                            </div>
                                        </article>
                                        <div className="fornecedores-ofertas-secundarias">
                                            {[segundo, terceiro].filter(Boolean).map((cotacao, indice) => {
                                                const fornecedor = fornecedores.find(
                                                    (item) => String(item.id) === String(cotacao.fornecedorId),
                                                )

                                                return (
                                                    <article key={cotacao.id}>
                                                        <div className="fornecedores-oferta-secundaria-topo"><span>{indice === 0 ? '2ª Menor Oferta' : '3ª Oferta Registrada'}</span><small>+{(((cotacao.valorComparavel / (melhor.valorComparavel || 1)) - 1) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% mais caro</small></div>
                                                        <div className="fornecedores-oferta-secundaria-resumo">
                                                            <div className="fornecedores-oferta-secundaria-fornecedor"><strong>{cotacao.fornecedorNome}</strong><small>{[fornecedor?.municipio, fornecedor?.uf].filter(Boolean).join(' - ') || 'Local não informado'}</small></div>
                                                            <div className="fornecedores-oferta-secundaria-valor">{formatarDinheiro(cotacao.valorComparavel)}<small> / {cotacao.unidadeComparavel}</small></div>
                                                        </div>
                                                        <div className="fornecedores-oferta-secundaria-condicoes">
                                                            <span>Frete {fornecedor?.condicaoFrete || (cotacao.frete > 0 ? `${formatarDinheiro(Number(cotacao.frete) / Number(cotacao.quantidade || 1))}/${cotacao.unidadeMedida}` : 'não informado')}</span>
                                                            <span>Prazo: {fornecedor?.prazoMedioEntregaDias ? `${fornecedor.prazoMedioEntregaDias} dias` : 'não informado'}</span>
                                                            <span>{fornecedor?.prazoPagamento || fornecedor?.formasPagamento || 'Condição não informada'}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setCotacaoExpandida(cotacao.id)
                                                                document.getElementById(`cotacao-detalhe-${cotacao.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                                            }}
                                                            type="button"
                                                        >
                                                            Detalhes da Proposta
                                                        </button>
                                                    </article>
                                                )
                                            })}
                                        </div>
                                        <aside className="fornecedores-curva-precos">
                                            <div className="fornecedores-curva-cabecalho"><small>Curva de disparidade</small><span className="material-symbols-outlined" aria-hidden="true">analytics</span></div>
                                            <strong>Diferença de Valor</strong>
                                            <p>Variação entre as ofertas do mesmo insumo.</p>
                                            {grupo.itens.map((cotacao) => {
                                                const fornecedorCurva = fornecedores.find((item) => String(item.id) === String(cotacao.fornecedorId))
                                                return (
                                                    <div className="fornecedores-curva-linha" key={cotacao.id}>
                                                        <div><span>{cotacao.fornecedorNome}{fornecedorCurva?.condicaoFrete ? ` (${fornecedorCurva.condicaoFrete})` : ''}</span><strong>{formatarDinheiro(cotacao.valorComparavel)}</strong></div>
                                                        <i><b style={{ width: `${cotacao.largura}%` }} /></i>
                                                    </div>
                                                )
                                            })}
                                            <div className="fornecedores-curva-nota"><span className="material-symbols-outlined" aria-hidden="true">lightbulb</span><span>A variação representa <strong>{formatarDinheiro(dispersaoTotal)}</strong> de dispersão para a quantidade cotada.</span></div>
                                        </aside>
                                    </>
                                )
                            })()}
                        </div>
                    )}
                </section>

                <div className="fornecedores-grade">
                    <section
                        className="fornecedores-card fornecedores-formulario-fornecedor"
                        id="fornecedor-formulario"
                    >
                        <div className="fornecedores-card-topo">
                            <div>
                                <small>Fornecedores</small>
                                <h2>
                                    {fornecedorForm.id
                                        ? 'Editar fornecedor'
                                        : 'Novo fornecedor'}
                                </h2>
                            </div>
                            <button
                                aria-label="Fechar formulário de fornecedor"
                                className="fornecedores-fechar-formulario"
                                onClick={() => setMostrarFormularioFornecedor(false)}
                                type="button"
                            >
                                <span aria-hidden="true">×</span>
                            </button>
                        </div>

                        <form onSubmit={salvarFornecedor}>
                            <label>
                                Codigo do fornecedor
                                <input
                                    readOnly
                                    type="text"
                                    value={
                                        fornecedorForm.codigoCadastro
                                            ? `#${fornecedorForm.codigoCadastro}`
                                            : 'Gerado automaticamente ao salvar'
                                    }
                                />
                            </label>

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

                            <div className="fornecedores-grade-form">
                                <label>
                                    Tipo do fornecedor *
                                    <select
                                        onChange={(evento) =>
                                            setFornecedorForm({
                                                ...fornecedorForm,
                                                tipoPessoa:
                                                    evento.target.value,
                                            })
                                        }
                                        value={fornecedorForm.tipoPessoa}
                                        required
                                    >
                                        <option value="FISICA">
                                            Pessoa Fisica
                                        </option>
                                        <option value="JURIDICA">
                                            Pessoa Juridica
                                        </option>
                                    </select>
                                </label>

                                <label>
                                    CPF/CNPJ *
                                    <input
                                        maxLength="20"
                                        onChange={(evento) =>
                                            setFornecedorForm({
                                                ...fornecedorForm,
                                                documento:
                                                    evento.target.value,
                                            })
                                        }
                                        placeholder="Evita cadastro duplicado"
                                        required
                                        type="text"
                                        value={fornecedorForm.documento}
                                    />
                                </label>
                            </div>

                            {fornecedorForm.tipoPessoa === 'JURIDICA' && (
                                <div className="fornecedores-acoes-form fornecedores-acoes-inline">
                                    <button
                                        disabled={consultandoCnpj}
                                        onClick={consultarCnpjFornecedor}
                                        type="button"
                                    >
                                        {consultandoCnpj
                                            ? 'Consultando CNPJ...'
                                            : 'Buscar dados do CNPJ'}
                                    </button>
                                </div>
                            )}

                            <div className="fornecedores-grade-form">
                                <label>
                                    Razao social *
                                    <input
                                        maxLength="180"
                                        onChange={(evento) =>
                                            setFornecedorForm({
                                                ...fornecedorForm,
                                                razaoSocial:
                                                    evento.target.value,
                                            })
                                        }
                                        required
                                        type="text"
                                        value={fornecedorForm.razaoSocial}
                                    />
                                </label>

                                <label>
                                    Nome fantasia
                                    <input
                                        maxLength="150"
                                        onChange={(evento) =>
                                            setFornecedorForm({
                                                ...fornecedorForm,
                                                nomeFantasia:
                                                    evento.target.value,
                                            })
                                        }
                                        type="text"
                                        value={fornecedorForm.nomeFantasia}
                                    />
                                </label>
                            </div>

                            <div className="fornecedores-grade-form">
                                <label>
                                    Insc. municipal
                                    <input
                                        maxLength="40"
                                        onChange={(evento) =>
                                            setFornecedorForm({
                                                ...fornecedorForm,
                                                inscricaoMunicipal:
                                                    evento.target.value,
                                            })
                                        }
                                        type="text"
                                        value={
                                            fornecedorForm.inscricaoMunicipal
                                        }
                                    />
                                </label>

                                <label>
                                    Insc. estadual
                                    <input
                                        maxLength="40"
                                        onChange={(evento) =>
                                            setFornecedorForm({
                                                ...fornecedorForm,
                                                inscricaoEstadual:
                                                    evento.target.value,
                                            })
                                        }
                                        type="text"
                                        value={
                                            fornecedorForm.inscricaoEstadual
                                        }
                                    />
                                </label>

                                <label>
                                    Regime tributario
                                    <input
                                        maxLength="80"
                                        onChange={(evento) =>
                                            setFornecedorForm({
                                                ...fornecedorForm,
                                                regimeTributario:
                                                    evento.target.value,
                                            })
                                        }
                                        type="text"
                                        value={fornecedorForm.regimeTributario}
                                    />
                                </label>
                            </div>

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

                            <div className="fornecedores-grade-form">
                                <label>
                                    WhatsApp
                                    <input
                                        maxLength="30"
                                        onChange={(evento) =>
                                            setFornecedorForm({
                                                ...fornecedorForm,
                                                telefoneWhatsapp:
                                                    evento.target.value,
                                            })
                                        }
                                        type="text"
                                        value={fornecedorForm.telefoneWhatsapp}
                                    />
                                </label>

                                <label>
                                    E-mail
                                    <input
                                        maxLength="150"
                                        onChange={(evento) =>
                                            setFornecedorForm({
                                                ...fornecedorForm,
                                                email: evento.target.value,
                                            })
                                        }
                                        type="email"
                                        value={fornecedorForm.email}
                                    />
                                </label>
                            </div>

                            <div className="fornecedores-grade-form">
                                <label>
                                    CEP *
                                    <input
                                        maxLength="12"
                                        onChange={(evento) =>
                                            setFornecedorForm({
                                                ...fornecedorForm,
                                                cep: evento.target.value,
                                            })
                                        }
                                        required
                                        type="text"
                                        value={fornecedorForm.cep}
                                    />
                                </label>

                                <label>
                                    Cidade *
                                    <input
                                        maxLength="100"
                                        onChange={(evento) =>
                                            setFornecedorForm({
                                                ...fornecedorForm,
                                                municipio:
                                                    evento.target.value,
                                            })
                                        }
                                        required
                                        type="text"
                                        value={fornecedorForm.municipio}
                                    />
                                </label>

                                <label>
                                    UF *
                                    <input
                                        maxLength="2"
                                        onChange={(evento) =>
                                            setFornecedorForm({
                                                ...fornecedorForm,
                                                uf: evento.target.value,
                                            })
                                        }
                                        required
                                        type="text"
                                        value={fornecedorForm.uf}
                                    />
                                </label>

                                <label>
                                    Endereco *
                                    <input
                                        maxLength="180"
                                        onChange={(evento) =>
                                            setFornecedorForm({
                                                ...fornecedorForm,
                                                logradouro:
                                                    evento.target.value,
                                            })
                                        }
                                        required
                                        type="text"
                                        value={fornecedorForm.logradouro}
                                    />
                                </label>
                            </div>

                            <div className="fornecedores-grade-form">
                                <label>
                                    Numero *
                                    <input
                                        maxLength="30"
                                        onChange={(evento) =>
                                            setFornecedorForm({
                                                ...fornecedorForm,
                                                numero: evento.target.value,
                                            })
                                        }
                                        required
                                        type="text"
                                        value={fornecedorForm.numero}
                                    />
                                </label>

                                <label>
                                    Bairro *
                                    <input
                                        maxLength="100"
                                        onChange={(evento) =>
                                            setFornecedorForm({
                                                ...fornecedorForm,
                                                bairro: evento.target.value,
                                            })
                                        }
                                        required
                                        type="text"
                                        value={fornecedorForm.bairro}
                                    />
                                </label>

                                <label>
                                    Pais *
                                    <input
                                        maxLength="60"
                                        onChange={(evento) =>
                                            setFornecedorForm({
                                                ...fornecedorForm,
                                                pais: evento.target.value,
                                            })
                                        }
                                        required
                                        type="text"
                                        value={fornecedorForm.pais}
                                    />
                                </label>
                            </div>

                            <div className="fornecedores-grade-form">
                                <label>
                                    Prazo de entrega
                                    <input
                                        min="0"
                                        onChange={(evento) =>
                                            setFornecedorForm({
                                                ...fornecedorForm,
                                                prazoMedioEntregaDias:
                                                    evento.target.value,
                                            })
                                        }
                                        placeholder="Dias"
                                        type="number"
                                        value={
                                            fornecedorForm
                                                .prazoMedioEntregaDias
                                        }
                                    />
                                </label>

                                <label>
                                    Valor minimo
                                    <input
                                        min="0"
                                        onChange={(evento) =>
                                            setFornecedorForm({
                                                ...fornecedorForm,
                                                valorMinimoPedido:
                                                    evento.target.value,
                                            })
                                        }
                                        step="0.01"
                                        type="number"
                                        value={fornecedorForm.valorMinimoPedido}
                                    />
                                </label>

                                <label>
                                    Pagamento
                                    <input
                                        maxLength="250"
                                        onChange={(evento) =>
                                            setFornecedorForm({
                                                ...fornecedorForm,
                                                formasPagamento:
                                                    evento.target.value,
                                            })
                                        }
                                        type="text"
                                        value={fornecedorForm.formasPagamento}
                                    />
                                </label>

                                <label>
                                    Frete
                                    <input
                                        maxLength="150"
                                        onChange={(evento) =>
                                            setFornecedorForm({
                                                ...fornecedorForm,
                                                condicaoFrete:
                                                    evento.target.value,
                                            })
                                        }
                                        type="text"
                                        value={fornecedorForm.condicaoFrete}
                                    />
                                </label>
                            </div>

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
                                <small className="fornecedores-campo-obrigatorio">* Campo obrigatório</small>
                                {fornecedorForm.id && (
                                    <button
                                        onClick={() =>
                                            setFornecedorForm(
                                                criarFornecedorFormVazio(),
                                            )
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
                        </form>
                    </section>

                    <section
                        className="fornecedores-card fornecedores-lista"
                        id="fornecedores-cadastrados"
                    >
                        <div className="fornecedores-card-topo">
                            <div>
                                <h2>
                                    {mostrarLixeira
                                        ? 'Lixeira'
                                        : 'Fornecedores cadastrados'}
                                </h2>
                                {!mostrarLixeira && <span className="fornecedores-contagem">{fornecedoresPagina.length} registros exibidos</span>}
                                <p className="fornecedores-lista-descricao">
                                    Empresas agrícolas e parceiros de compra cadastrados.
                                </p>
                            </div>

                        </div>

                        <div className="fornecedores-lista-filtros">
                            <label className="fornecedores-busca" htmlFor="buscarFornecedor">
                                <span className="material-symbols-outlined" aria-hidden="true">search</span>
                                <input
                                    id="buscarFornecedor"
                                    onChange={(evento) => setBuscaFornecedor(evento.target.value)}
                                    placeholder="Buscar por razão social, CNPJ ou insumo..."
                                    type="search"
                                    value={buscaFornecedor}
                                />
                            </label>
                            <div className="fornecedores-filtro-categoria-wrap" ref={filtroCategoriaRef}>
                                <button
                                    aria-label="Filtrar fornecedores por categoria"
                                    aria-expanded={mostrarOpcoesCategoria}
                                    aria-controls="opcoes-categoria-fornecedor"
                                    className={`fornecedores-filtro-categoria${filtroCategoriaFornecedor ? ' ativo' : ''}`}
                                    onClick={() => setMostrarOpcoesCategoria((aberto) => !aberto)}
                                    type="button"
                                >
                                    <span className="material-symbols-outlined" aria-hidden="true">filter_list</span>
                                </button>
                                {mostrarOpcoesCategoria && (
                                    <div className="fornecedores-opcoes-categoria" id="opcoes-categoria-fornecedor" role="group" aria-label="Categorias de fornecedores">
                                        {['', ...categoriasFornecedores].map((categoria) => (
                                            <button
                                                aria-pressed={filtroCategoriaFornecedor === categoria}
                                                className={filtroCategoriaFornecedor === categoria ? 'selecionada' : ''}
                                                key={categoria || 'todas'}
                                                onClick={() => {
                                                    setFiltroCategoriaFornecedor(categoria)
                                                    setMostrarOpcoesCategoria(false)
                                                }}
                                                type="button"
                                            >
                                                {categoria || 'Todas Categorias'}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {carregando ? (
                            <CarregamentoTela compacto texto="Carregando fornecedores" />
                        ) : (
                            <div className="fornecedores-itens">
                                <div className="fornecedores-tabela-cabecalho" aria-hidden="true"><span>Fornecedor / identificação</span><span>Categoria</span><span>Localização</span><span>Cotações</span><span>Ações</span></div>
                                {fornecedoresVisiveis.length === 0 ? (
                                    <p className="fornecedores-vazio">
                                        {buscaFornecedor || filtroCategoriaFornecedor
                                            ? 'Nenhum fornecedor corresponde à busca.'
                                            : 'Nenhum fornecedor encontrado.'}
                                    </p>
                                ) : (
                                    fornecedoresPagina.map((fornecedor) => (
                                        <article
                                            className="fornecedores-item"
                                            key={fornecedor.id}
                                        >
                                            <div className="fornecedores-item-identidade">
                                                <span className="fornecedores-avatar" aria-hidden="true">
                                                    {fornecedor.nome
                                                        ?.trim()
                                                        ?.split(/\s+/)
                                                        ?.slice(0, 2)
                                                        ?.map((parte) => parte.charAt(0))
                                                        ?.join('')
                                                        ?.toLocaleUpperCase('pt-BR') || 'F'}
                                                </span>
                                                <div>
                                                    <strong>
                                                        {fornecedor.nome}
                                                    </strong>
                                                    <span>
                                                        {fornecedor.documento || 'Documento não informado'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="fornecedores-categorias-linha">
                                                {[...(resumoFornecedor.get(String(fornecedor.id))?.categorias || [])].length ? [...(resumoFornecedor.get(String(fornecedor.id))?.categorias || [])].map((categoria) => <span className="fornecedores-categoria-tag" key={categoria} style={{ '--categoria-hue': obterTonalidadeCategoria(categoria) }}>{categoria}</span>) : <span className="fornecedores-sem-categoria">Sem categoria</span>}
                                            </div>
                                            <div className="fornecedores-localizacao-linha">{fornecedor.municipio ? `${fornecedor.municipio}${fornecedor.uf ? ` - ${fornecedor.uf}` : ''}` : 'Local não informado'}</div>
                                            <div className="fornecedores-cotacoes-linha"><strong>{resumoFornecedor.get(String(fornecedor.id))?.cotacoes || 0}</strong><span>{(resumoFornecedor.get(String(fornecedor.id))?.cotacoes || 0) === 1 ? 'cotação' : 'cotações'}</span></div>

                                            <div className={`fornecedores-acoes-item${mostrarLixeira ? ' fornecedores-acoes-lixeira' : ''}`}>
                                                {!mostrarLixeira && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setFornecedorForm({
                                                                    id: fornecedor.id,
                                                                    codigoCadastro:
                                                                        fornecedor.codigoCadastro
                                                                        ?? '',
                                                                    nome: fornecedor.nome,
                                                                    nomeFantasia:
                                                                        fornecedor.nomeFantasia
                                                                        ?? '',
                                                                    razaoSocial:
                                                                        fornecedor.razaoSocial
                                                                        ?? '',
                                                                    inscricaoMunicipal:
                                                                        fornecedor.inscricaoMunicipal
                                                                        ?? '',
                                                                    inscricaoEstadual:
                                                                        fornecedor.inscricaoEstadual
                                                                        ?? '',
                                                                    regimeTributario:
                                                                        fornecedor.regimeTributario
                                                                        ?? '',
                                                                    tipoPessoa:
                                                                        fornecedor.tipoPessoa
                                                                        ?? 'JURIDICA',
                                                                    documento:
                                                                        fornecedor.documento
                                                                        ?? '',
                                                                    telefone:
                                                                        fornecedor.telefone
                                                                        ?? '',
                                                                    telefoneWhatsapp:
                                                                        fornecedor.telefoneWhatsapp
                                                                        ?? '',
                                                                    email:
                                                                        fornecedor.email
                                                                        ?? '',
                                                                    contatoComercial:
                                                                        fornecedor.contatoComercial
                                                                        ?? '',
                                                                    site:
                                                                        fornecedor.site
                                                                        ?? '',
                                                                    observacao:
                                                                        fornecedor.observacao
                                                                        ?? '',
                                                                    cep:
                                                                        fornecedor.cep
                                                                        ?? '',
                                                                    logradouro:
                                                                        fornecedor.logradouro
                                                                        ?? '',
                                                                    numero:
                                                                        fornecedor.numero
                                                                        ?? '',
                                                                    complemento:
                                                                        fornecedor.complemento
                                                                        ?? '',
                                                                    bairro:
                                                                        fornecedor.bairro
                                                                        ?? '',
                                                                    municipio:
                                                                        fornecedor.municipio
                                                                        ?? '',
                                                                    uf:
                                                                        fornecedor.uf
                                                                        ?? '',
                                                                    pais:
                                                                        fornecedor.pais
                                                                        ?? 'Brasil',
                                                                    prazoMedioEntregaDias:
                                                                        fornecedor.prazoMedioEntregaDias
                                                                        ?? '',
                                                                    formasPagamento:
                                                                        fornecedor.formasPagamento
                                                                        ?? '',
                                                                    prazoPagamento:
                                                                        fornecedor.prazoPagamento
                                                                        ?? '',
                                                                    condicaoFrete:
                                                                        fornecedor.condicaoFrete
                                                                        ?? '',
                                                                    valorMinimoPedido:
                                                                        fornecedor.valorMinimoPedido
                                                                        ?? '',
                                                                    observacoesComerciais:
                                                                        fornecedor.observacoesComerciais
                                                                        ?? '',
                                                                    ativo:
                                                                        fornecedor.ativo
                                                                        ?? true,
                                                                })
                                                                setMostrarFormularioFornecedor(true)
                                                            }}
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
                        {!carregando && fornecedoresVisiveis.length > 0 && (
                            <div className="fornecedores-paginacao">
                                <span>Mostrando {inicioFornecedoresPagina + 1} a {inicioFornecedoresPagina + fornecedoresPagina.length} de {fornecedoresVisiveis.length} {mostrarLixeira ? 'fornecedores arquivados' : 'fornecedores cadastrados'}</span>
                                <nav aria-label="Paginação de fornecedores">
                                    <button
                                        disabled={paginaFornecedoresAtual === 1}
                                        onClick={() => setPaginaFornecedores((pagina) => Math.max(1, pagina - 1))}
                                        type="button"
                                    >
                                        ‹ Anterior
                                    </button>
                                    {Array.from({ length: totalPaginasFornecedores }, (_, indice) => indice + 1).map((pagina) => (
                                        <button
                                            aria-current={pagina === paginaFornecedoresAtual ? 'page' : undefined}
                                            className={pagina === paginaFornecedoresAtual ? 'atual' : ''}
                                            key={pagina}
                                            onClick={() => setPaginaFornecedores(pagina)}
                                            type="button"
                                        >
                                            {pagina}
                                        </button>
                                    ))}
                                    <button
                                        disabled={paginaFornecedoresAtual === totalPaginasFornecedores}
                                        onClick={() => setPaginaFornecedores((pagina) => Math.min(totalPaginasFornecedores, pagina + 1))}
                                        type="button"
                                    >
                                        Próxima ›
                                    </button>
                                </nav>
                            </div>
                        )}
                    </section>

                    <section
                        className="fornecedores-card"
                        id="categorias-produtos"
                    >
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

                    <section className="fornecedores-card fornecedores-categorias-resumo">
                        <div className="fornecedores-card-topo">
                            <div>
                                <small>Categorias cadastradas</small>
                                <h2>Produtos por categoria</h2>
                            </div>
                        </div>

                        {resumoCategoriasProduto.length === 0 ? (
                            <p className="fornecedores-vazio">
                                Nenhuma categoria de produto cadastrada.
                            </p>
                        ) : (
                            <div className="fornecedores-cards-resumo">
                                {resumoCategoriasProduto.map((categoria) => (
                                    <article
                                        className="fornecedores-resumo-card"
                                        key={categoria.id}
                                    >
                                        <span>C</span>
                                        <div>
                                            <strong>
                                                {categoria.nome}
                                            </strong>
                                            <small>
                                                {categoria.produtos}{' '}
                                                produto(s)
                                            </small>
                                        </div>
                                        <p>
                                            {categoria.cotacoes}{' '}
                                            cotação(ões)
                                        </p>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="fornecedores-card fornecedores-lista" id="produtos-cadastrados">
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

                    <section
                        className="fornecedores-card fornecedores-cotacao"
                        id="registrar-cotacao"
                    >
                        <div className="fornecedores-card-topo">
                            <div>
                                <small>Cotação</small>
                                <h2>Registrar preco de fornecedor</h2>
                            </div>
                            <button
                                aria-label="Fechar formulário de cotação"
                                className="fornecedores-fechar-formulario"
                                onClick={() => setMostrarFormularioCotacao(false)}
                                type="button"
                            >
                                <span aria-hidden="true">×</span>
                            </button>
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

                    <section
                        className="fornecedores-card fornecedores-comparativo"
                        id="comparar-precos"
                    >
                        <div className="fornecedores-card-topo">
                            <div>
                                <small>Comparação</small>
                                <h2>Histórico de Comparação de Produtos</h2>
                                <p className="fornecedores-historico-descricao">Acompanhe cotações anteriores, confrontando o produto pesquisado com as empresas concorrentes, variação histórica de preço e status de decisão.</p>
                            </div>
                        </div>

                        {cotacoesPorProduto.length === 0 ? (
                            <p className="fornecedores-vazio">
                                Cadastre cotacoes para comparar
                                fornecedores.
                            </p>
                        ) : (
                            <>
                                <div className="fornecedores-historico-categorias">
                                    <button className={!categoriaHistorico ? 'selecionada' : ''} onClick={() => setCategoriaHistorico('')} type="button">
                                        <span className="material-symbols-outlined" aria-hidden="true">grid_view</span> Todos os Insumos <b>{cotacoes.length}</b>
                                    </button>
                                    {categoriasHistorico.map((categoria) => (
                                        <button className={categoriaHistorico === categoria.nome ? 'selecionada' : ''} key={categoria.nome} onClick={() => setCategoriaHistorico(categoria.nome)} type="button">
                                            <span className="material-symbols-outlined" aria-hidden="true">{categoria.nome.toLocaleLowerCase('pt-BR').includes('sement') ? 'grass' : categoria.nome.toLocaleLowerCase('pt-BR').includes('fert') ? 'science' : categoria.nome.toLocaleLowerCase('pt-BR').includes('defens') ? 'pest_control' : categoria.nome.toLocaleLowerCase('pt-BR').includes('combust') ? 'local_gas_station' : 'category'}</span> {categoria.nome} <b>{categoria.total}</b>
                                        </button>
                                    ))}
                                </div>
                                <div className="fornecedores-historico-tabela">
                                    <div className="fornecedores-historico-cabecalho" aria-hidden="true">
                                        <span>Produto / especificação</span><span>Empresa / fornecedor</span><span>Status / condição</span><span>Valor cotado / unidade</span><span>Economia / diferença</span><span>Ações</span>
                                    </div>
                                    {linhasHistoricoPagina.map(({ cotacao, grupo, indice, media, fornecedor }) => {
                                        const valor = obterValorComparavel(cotacao)
                                        const menorValor = obterValorComparavel(grupo.melhor)
                                        const variacao = grupo.itens.length > 1
                                            ? indice === 0
                                                ? `${((valor / (media || 1) - 1) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% vs média`
                                                : `+${((valor / (menorValor || 1) - 1) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% vs melhor`
                                            : 'Ref. safra'
                                        const status = cotacao.status === 'COTACAO'
                                            ? indice === 0 && grupo.itens.length > 1 ? 'Melhor oferta' : 'Em análise'
                                            : cotacao.status === 'ENVIADA_AO_FINANCEIRO' ? 'No financeiro' : 'Enviada a pagar'
                                        const expandida = String(cotacaoExpandida) === String(cotacao.id)

                                        return (
                                            <div className="fornecedores-historico-registro" key={cotacao.id}>
                                                <article className="fornecedores-historico-linha" id={`cotacao-detalhe-${cotacao.id}`}>
                                                    <div className="fornecedores-historico-produto">
                                                        <strong>{cotacao.produtoNome}</strong>
                                                        {indice === 0 && grupo.itens.length > 1 && <span className="fornecedores-historico-selo"><span className="material-symbols-outlined" aria-hidden="true">verified</span> Menor preço</span>}
                                                        <small>Lote: {formatarNumero(cotacao.quantidade)} {cotacao.unidadeMedida}{cotacao.pesoTotalKg ? ` (${formatarNumero(cotacao.pesoTotalKg)} kg)` : ''} · {cotacao.categoriaProdutoNome || 'Outros'}</small>
                                                    </div>
                                                    <div className="fornecedores-historico-fornecedor">
                                                        <strong>{cotacao.fornecedorNome}</strong>
                                                        <small>{[fornecedor?.municipio, fornecedor?.uf].filter(Boolean).join(' - ') || 'Local não informado'}</small>
                                                    </div>
                                                    <div className="fornecedores-historico-status"><span className={`fornecedores-status-tag ${cotacao.status === 'COTACAO' ? indice === 0 ? 'melhor' : 'analise' : 'enviada'}`}>{status}</span><small>{fornecedor?.condicaoFrete || 'Condição de frete não informada'}</small></div>
                                                    <div className="fornecedores-historico-valor"><strong>{formatarDinheiro(valor)} <small>/ {obterUnidadeComparavel(cotacao)}</small></strong><span>Total: {formatarDinheiro(cotacao.valorLiquido ?? cotacao.valorTotal)}</span></div>
                                                    <div className="fornecedores-historico-diferenca"><span className={indice === 0 && grupo.itens.length > 1 ? 'abaixo' : grupo.itens.length > 1 ? 'acima' : ''}>{variacao}</span></div>
                                                    <div className="fornecedores-historico-acoes">
                                                        <button aria-label={expandida ? 'Ocultar detalhes da cotação' : 'Ver detalhes da cotação'} onClick={() => setCotacaoExpandida(expandida ? null : cotacao.id)} type="button"><span className="material-symbols-outlined" aria-hidden="true">{expandida ? 'visibility_off' : 'visibility'}</span></button>
                                                        <button aria-label="Enviar cotação a pagar" disabled={cotacao.status !== 'COTACAO'} onClick={() => abrirMigracao(cotacao, 'contas')} type="button"><span className="material-symbols-outlined" aria-hidden="true">receipt_long</span></button>
                                                    </div>
                                                </article>
                                                {expandida && <div className="fornecedores-historico-detalhes"><span>Data: {formatarData(cotacao.dataCotacao)}</span><span>Quantidade: {formatarNumero(cotacao.quantidade)} {cotacao.unidadeMedida}</span><span>Frete: {formatarDinheiro(cotacao.frete)}</span><span>Desconto: {formatarDinheiro(cotacao.desconto)}</span>{fornecedor?.prazoMedioEntregaDias && <span>Prazo médio: {fornecedor.prazoMedioEntregaDias} dias</span>}{fornecedor?.prazoPagamento && <span>Pagamento: {fornecedor.prazoPagamento}</span>}{cotacao.observacao && <span>Observação: {cotacao.observacao}</span>}</div>}
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="fornecedores-historico-paginacao">
                                    <span>Mostrando {(paginaHistoricoAtual - 1) * 5 + 1} a {(paginaHistoricoAtual - 1) * 5 + linhasHistoricoPagina.length} de {linhasComparacaoFiltradas.length} cotações registradas</span>
                                    <nav aria-label="Paginação do histórico de cotações">
                                        <button disabled={paginaHistoricoAtual === 1} onClick={() => setPaginaHistorico((pagina) => Math.max(1, pagina - 1))} type="button">‹ Anterior</button>
                                        {Array.from({ length: totalPaginasHistorico }, (_, indice) => indice + 1).map((pagina) => (
                                            <button aria-current={pagina === paginaHistoricoAtual ? 'page' : undefined} className={pagina === paginaHistoricoAtual ? 'atual' : ''} key={pagina} onClick={() => setPaginaHistorico(pagina)} type="button">{pagina}</button>
                                        ))}
                                        <button disabled={paginaHistoricoAtual === totalPaginasHistorico} onClick={() => setPaginaHistorico((pagina) => Math.min(totalPaginasHistorico, pagina + 1))} type="button">Próxima ›</button>
                                    </nav>
                                </div>
                            </>
                        )}
                    </section>

                    <section
                        className="fornecedores-card fornecedores-compras"
                        id="compras-fornecedor"
                    >
                        <div className="fornecedores-card-topo">
                            <div>
                                <small>Compras registradas</small>
                                <h2>Histórico de compras</h2>
                            </div>
                            <div className="fornecedores-compras-topo-acoes">
                                <span className="fornecedores-compras-contagem">
                                    {comprasFiltradas.length} de {compras.length} registros
                                </span>
                            </div>
                        </div>

                        {carregandoCompras ? (
                            <p className="fornecedores-vazio">Carregando compras...</p>
                        ) : compras.length === 0 ? (
                            <p className="fornecedores-vazio">{filtroFornecedorCompras === 'todos' ? 'Nenhuma compra registrada.' : 'Nenhuma compra registrada para este fornecedor.'}</p>
                        ) : (
                            <>
                                <div className="fornecedores-compras-filtros">
                                    <label className="fornecedores-compras-busca">
                                        <span className="material-symbols-outlined" aria-hidden="true">search</span>
                                        <input aria-label="Buscar compras" onChange={(evento) => setBuscaCompra(evento.target.value)} placeholder="Buscar descrição, insumo ou categoria..." value={buscaCompra} />
                                    </label>
                                    <label className="fornecedores-compras-status-filtro">
                                        <span className="material-symbols-outlined" aria-hidden="true">filter_list</span>
                                        <select aria-label="Filtrar por situação" onChange={(evento) => setFiltroSituacaoCompra(evento.target.value)} value={filtroSituacaoCompra}>
                                            <option value="">Todas as situações</option>
                                            {situacoesCompras.map((situacao) => <option key={situacao} value={situacao}>{situacao}</option>)}
                                        </select>
                                    </label>
                                    <label className="fornecedores-compras-fornecedor">
                                        <span className="material-symbols-outlined" aria-hidden="true">storefront</span>
                                        <span>Fornecedor:</span>
                                        <select aria-label="Selecionar fornecedor das compras" disabled={carregandoCompras} onChange={(evento) => selecionarFornecedorCompras(evento.target.value)} value={filtroFornecedorCompras}>
                                            <option value="todos">Todos os Fornecedores</option>
                                            {fornecedores.map((fornecedor) => <option key={fornecedor.id} value={fornecedor.id}>{fornecedor.nome}</option>)}
                                        </select>
                                        <span className="material-symbols-outlined fornecedores-compras-seta" aria-hidden="true">expand_more</span>
                                    </label>
                                </div>
                                {categoriasCompras.length > 0 && (
                                    <div className="fornecedores-compras-categorias" aria-label="Filtrar compras por categoria">
                                        <strong>Categoria:</strong>
                                        <button aria-pressed={!categoriaCompra} className={!categoriaCompra ? 'ativa' : ''} onClick={() => setCategoriaCompra('')} type="button"><span className="material-symbols-outlined" aria-hidden="true">grid_view</span><span>Todos os Insumos</span><small>{compras.length}</small></button>
                                        {categoriasCompras.map((categoria) => (
                                            <button aria-pressed={categoriaCompra === categoria} className={categoriaCompra === categoria ? 'ativa' : ''} key={categoria} onClick={() => setCategoriaCompra(categoriaCompra === categoria ? '' : categoria)} type="button"><span className="material-symbols-outlined" aria-hidden="true">{/combust|diesel/i.test(categoria) ? 'local_gas_station' : /defensiv|sanidade/i.test(categoria) ? 'pest_control' : /fertiliz|nutrição|adubo/i.test(categoria) ? 'science' : /sement/i.test(categoria) ? 'grass' : /frete|serviço/i.test(categoria) ? 'local_shipping' : /máquina|peça|trator/i.test(categoria) ? 'agriculture' : 'category'}</span><span>{categoria}</span><small>{compras.filter((compra) => compra.categoriaNome === categoria).length}</small></button>
                                        ))}
                                    </div>
                                )}
                                {comprasFiltradas.length === 0 ? (
                                    <p className="fornecedores-vazio">Nenhuma compra corresponde aos filtros.</p>
                                ) : (
                                    <div className="fornecedores-compras-tabela-rolagem">
                                        <table className="fornecedores-compras-tabela">
                                            <thead><tr><th>Pedido / registro</th><th>Insumo / destinação</th><th>Fornecedor</th><th>Categoria / responsável</th><th>Valor total / unitário</th><th>Status</th><th>Ações</th></tr></thead>
                                            <tbody>
                                                {comprasPagina.map((compra) => {
                                                    const chave = `${compra.origem}-${compra.origemId}`
                                                    const expandida = compraExpandida === chave
                                                    const situacao = compra.situacao || 'Sem situação'
                                                    const situacaoNormalizada = situacao.toLocaleLowerCase('pt-BR')
                                                    const statusClasse = /saiu dinheiro/.test(situacaoNormalizada) ? 'saida' : /pendente/.test(situacaoNormalizada) ? 'pendente' : /pago|quitado|conclu|recebido/.test(situacaoNormalizada) ? 'concluido' : /vencid|atras/.test(situacaoNormalizada) ? 'atrasado' : 'aberto'
                                                    return (
                                                        <Fragment key={chave}>
                                                            <tr>
                                                                <td><strong>{compra.descricao || `${compra.origem} #${compra.origemId}`}</strong><small>{compra.origem} · {formatarData(compra.data)}</small></td>
                                                                <td><strong>{compra.produtoNome || 'Insumo não informado'}</strong><small>{[compra.produtoClassificacao, compra.quantidade != null ? `${formatarNumero(compra.quantidade)} ${compra.unidadeMedida || ''}` : null].filter(Boolean).join(' · ') || 'Destinação não informada'}</small></td>
                                                                <td><strong>{compra.fornecedorNome || fornecedorSelecionado?.nome || 'Fornecedor não informado'}</strong><small>{[compra.municipio || fornecedorSelecionado?.municipio, compra.uf || fornecedorSelecionado?.uf].filter(Boolean).join(' - ') || 'Local não informado'}</small></td>
                                                                <td><strong>{compra.categoriaNome || 'Sem categoria'}</strong><small>{compra.compradorNome || 'Responsável não informado'}</small></td>
                                                                <td className="fornecedores-compras-valor"><strong>{formatarDinheiro(compra.valor)}</strong><small>{compra.valorUnitario != null ? `${formatarDinheiro(compra.valorUnitario)} / ${compra.unidadeMedida || 'un.'}` : 'Valor unitário não informado'}</small></td>
                                                                <td><span className={`fornecedores-compra-status ${statusClasse}`}>{situacao}</span></td>
                                                                <td><button aria-label={expandida ? 'Ocultar detalhes da compra' : 'Ver detalhes da compra'} className="fornecedores-compra-detalhe" onClick={() => setCompraExpandida(expandida ? null : chave)} type="button"><span className="material-symbols-outlined" aria-hidden="true">{expandida ? 'visibility_off' : 'visibility'}</span></button></td>
                                                            </tr>
                                                            {expandida && <tr className="fornecedores-compras-detalhes"><td colSpan="7"><span>Descrição: {compra.descricao || 'Não informada'}</span><span>Origem: {compra.origem}</span><span>Comprador: {compra.compradorNome || 'Não informado'}</span><span>Categoria: {compra.categoriaNome || 'Não informada'}</span></td></tr>}
                                                        </Fragment>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                {comprasFiltradas.length > 0 && (
                                    <div className="fornecedores-compras-paginacao">
                                        <span>Mostrando {(paginaComprasAtual - 1) * 5 + 1} a {Math.min(paginaComprasAtual * 5, comprasFiltradas.length)} de {comprasFiltradas.length} compras</span>
                                        <nav aria-label="Paginação das compras registradas">
                                            <button disabled={paginaComprasAtual === 1} onClick={() => setPaginaCompras((pagina) => Math.max(1, pagina - 1))} type="button">‹ Anterior</button>
                                            <span>Página {paginaComprasAtual} de {totalPaginasCompras}</span>
                                            <button disabled={paginaComprasAtual === totalPaginasCompras} onClick={() => setPaginaCompras((pagina) => Math.min(totalPaginasCompras, pagina + 1))} type="button">Próxima ›</button>
                                        </nav>
                                    </div>
                                )}
                            </>
                        )}
                    </section>

                </div>

                <section className="fornecedores-atalhos-painel fornecedores-atalhos-rodape" aria-label="Mais recursos de compras">
                    <a href="#categorias-produtos"><span className="material-symbols-outlined">category</span><div><strong>Categorias de insumos</strong><small>Gerenciar grupos e unidades</small></div></a>
                    <a href="#comparar-precos"><span className="material-symbols-outlined">query_stats</span><div><strong>Histórico de preços</strong><small>Série de cotações registradas</small></div></a>
                    <button onClick={() => baixarRelatorio('excel')} type="button"><span className="material-symbols-outlined">description</span><div><strong>Relatório de compras</strong><small>Exportar dados da safra</small></div></button>
                    <button onClick={() => setMostrarLixeira(true)} type="button"><span className="material-symbols-outlined">inventory_2</span><div><strong>Lixeira &amp; inativos</strong><small>{lixeira.length} fornecedor(es) arquivado(s)</small></div></button>
                </section>

                {confirmacao && (
                    <div
                        className="fornecedores-modal-fundo fornecedores-confirmacao-fundo"
                        onClick={() => !salvando && setConfirmacao(null)}
                    >
                        <div
                            aria-modal="true"
                            aria-labelledby="fornecedores-confirmacao-titulo"
                            className="fornecedores-modal fornecedores-confirmacao-modal"
                            role="dialog"
                            onClick={(evento) => evento.stopPropagation()}
                        >
                            <div className="fornecedores-confirmacao-icone" aria-hidden="true">
                                <span className="material-symbols-outlined">
                                    {confirmacao.metodo === 'PATCH' ? 'restore_from_trash' : 'delete_outline'}
                                </span>
                            </div>
                            <h2 id="fornecedores-confirmacao-titulo">{confirmacao.titulo}</h2>
                            <p>{confirmacao.texto}</p>
                            <div className="fornecedores-modal-acoes">
                                <button
                                    className="fornecedores-confirmacao-cancelar"
                                    disabled={salvando}
                                    onClick={() =>
                                        setConfirmacao(null)
                                    }
                                    type="button"
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="fornecedores-confirmacao-confirmar"
                                    disabled={salvando}
                                    onClick={executarConfirmacao}
                                    type="button"
                                >
                                    {salvando
                                        ? 'Aguarde…'
                                        : confirmacao.metodo === 'PATCH'
                                            ? 'Restaurar fornecedor'
                                            : confirmacao.caminho.endsWith('/permanente')
                                                ? 'Excluir definitivamente'
                                                : 'Mover para lixeira'}
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

                            <div className="fornecedores-modal-resumo">
                                <strong>
                                    {migracao.cotacao.produtoNome}
                                </strong>
                                <span>
                                    {migracao.cotacao.fornecedorNome}
                                    {' - '}
                                    {formatarDinheiro(
                                        migracao.cotacao.valorLiquido,
                                    )}
                                </span>
                                <small>
                                    Escolha abaixo o local específico onde
                                    essa compra deve entrar.
                                </small>
                            </div>

                            <label>
                                Categoria financeira existente
                                <select
                                    onChange={(evento) =>
                                        setMigracaoForm({
                                            ...migracaoForm,
                                            categoriaId:
                                                evento.target.value,
                                            novaCategoriaNome:
                                                evento.target.value
                                                    ? ''
                                                    : migracaoForm.novaCategoriaNome,
                                        })
                                    }
                                    value={migracaoForm.categoriaId}
                                >
                                    <option value="">
                                        Escolher categoria existente
                                    </option>
                                    {categoriasFinanceiras.map(
                                        (categoria) => (
                                            <option
                                                key={categoria.id}
                                                value={categoria.id}
                                            >
                                                {categoria.nome}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </label>

                            <label>
                                Ou criar nova categoria
                                <input
                                    onChange={(evento) =>
                                        setMigracaoForm({
                                            ...migracaoForm,
                                            novaCategoriaNome:
                                                evento.target.value,
                                            categoriaId: evento.target.value
                                                ? ''
                                                : migracaoForm.categoriaId,
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

                            <div className="fornecedores-modal-acoes">
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
        </ShellDashboard>
    )
}

export default Fornecedores
