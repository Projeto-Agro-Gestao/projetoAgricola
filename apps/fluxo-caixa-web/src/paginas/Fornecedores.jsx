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
import { voltarPaginaAnterior } from '../navegacao.js'
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

    const [mostrarLixeira, setMostrarLixeira] = useState(false)
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
            setCategoriasFinanceiras(
                categoriasFinanceirasDados.filter(
                    (categoria) => categoria.ativo,
                ),
            )
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

    if (!sessao) {
        return null
    }

    return (
        <div className="fornecedores-pagina">
            <div className="fornecedores-conteudo">
                <header className="fornecedores-cabecalho">
                    <button
                        onClick={() =>
                            voltarPaginaAnterior(
                                navigate,
                                '/dashboard',
                            )
                        }
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

                <section className="fornecedores-atalhos-painel">
                    <div className="fornecedores-card-topo">
                        <div>
                            <small>Acesso rápido</small>
                            <h2>Fornecedores, produtos e preços</h2>
                        </div>
                    </div>

                    <div className="fornecedores-atalhos">
                        <a href="#fornecedor-formulario">
                            <span>+</span>
                            Novo fornecedor
                        </a>
                        <a href="#fornecedores-cadastrados">
                            <span>F</span>
                            Ver fornecedores
                        </a>
                        <a href="#categorias-produtos">
                            <span>≡</span>
                            Categorias e produtos
                        </a>
                        <a href="#registrar-cotacao">
                            <span>R$</span>
                            Registrar preço
                        </a>
                        <a href="#comparar-precos">
                            <span>%</span>
                            Comparar preços
                        </a>
                        <a href="#compras-fornecedor">
                            <span>▦</span>
                            Compras
                        </a>
                        <button
                            onClick={() => setMostrarLixeira(true)}
                            type="button"
                        >
                            <span>♲</span>
                            Lixeira
                        </button>
                        <button
                            onClick={() => baixarRelatorio('excel')}
                            type="button"
                        >
                            <span>▦</span>
                            Excel
                        </button>
                        <button
                            onClick={() => baixarRelatorio('pdf')}
                            type="button"
                        >
                            <span>▤</span>
                            PDF
                        </button>
                    </div>
                </section>

                <section className="fornecedores-painel-precos">
                    <div className="fornecedores-card-topo">
                        <div>
                            <small>Leitura de compra</small>
                            <h2>Comparativo para decidir melhor</h2>
                        </div>
                    </div>

                    <div className="fornecedores-indicadores">
                        <article>
                            <span>C</span>
                            <small>Cotações registradas</small>
                            <strong>
                                {analiseCotacoes.totalCotacoes}
                            </strong>
                        </article>
                        <article>
                            <span>P</span>
                            <small>Produtos comparáveis</small>
                            <strong>
                                {analiseCotacoes.produtosComparados}
                            </strong>
                        </article>
                        <article>
                            <span>R$</span>
                            <small>Diferença por unidade base</small>
                            <strong>
                                {formatarDinheiro(
                                    analiseCotacoes.economiaPotencial,
                                )}
                            </strong>
                        </article>
                        <article>
                            <span>F</span>
                            <small>Fornecedor mais vantajoso</small>
                            <strong>
                                {analiseCotacoes.fornecedorDestaque}
                            </strong>
                        </article>
                    </div>

                    {graficoCotacoesDetalhado.length === 0 ? (
                        <p className="fornecedores-vazio">
                            Cadastre duas ou mais cotações do mesmo produto
                            para formar o gráfico de comparação.
                        </p>
                    ) : (
                        <div className="fornecedores-grafico-precos">
                            {graficoCotacoesDetalhado.map((grupo) => (
                                <article key={grupo.produtoNome}>
                                    <header>
                                        <div>
                                            <strong>
                                                {grupo.produtoNome}
                                            </strong>
                                            <span>
                                                Produto igual comparado com
                                                produto igual.
                                            </span>
                                        </div>
                                        <small>
                                            Melhor:{' '}
                                            {grupo.melhor?.fornecedorNome}
                                        </small>
                                    </header>

                                    <div className="fornecedores-grafico-ranking">
                                        {grupo.itens.map((cotacao) => (
                                            <div
                                                className={
                                                    cotacao.id
                                                        === grupo.melhor?.id
                                                        ? 'melhor'
                                                        : ''
                                                }
                                                key={cotacao.id}
                                            >
                                                <span>
                                                    {cotacao.fornecedorNome}
                                                </span>
                                                <div className="fornecedores-grafico-barra">
                                                    <i
                                                        style={{
                                                            width:
                                                                `${cotacao.largura}%`,
                                                        }}
                                                    />
                                                </div>
                                                <strong>
                                                    {formatarDinheiro(
                                                        cotacao.valorComparavel,
                                                    )}
                                                    /
                                                    {cotacao.unidadeComparavel}
                                                </strong>
                                            </div>
                                        ))}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                <main className="fornecedores-grade">
                    <section
                        className="fornecedores-card"
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

                            <small>* Campo obrigatório</small>
                        </form>
                    </section>

                    <section
                        className="fornecedores-card fornecedores-lista"
                        id="fornecedores-cadastrados"
                    >
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
                            <CarregamentoTela compacto texto="Carregando fornecedores" />
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
                                                    #{fornecedor.codigoCadastro}{' '}
                                                    {fornecedor.nome}
                                                </strong>
                                                <span>
                                                    {fornecedor.documento
                                                        || 'Sem CPF/CNPJ'}{' '}
                                                    ·{' '}
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

                    <section
                        className="fornecedores-card fornecedores-cotacao"
                        id="registrar-cotacao"
                    >
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

                    <section
                        className="fornecedores-card fornecedores-comparativo"
                        id="comparar-precos"
                    >
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

                    <section
                        className="fornecedores-card fornecedores-compras"
                        id="compras-fornecedor"
                    >
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
                            <div className="fornecedores-modal-acoes">
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
    )
}

export default Fornecedores
