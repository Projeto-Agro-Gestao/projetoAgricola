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
import { voltarPaginaAnterior } from '../navegacao.js'
import './NovaContaFinanceira.css'
import { apiFetch } from '../servicos/api.js'
import { obterSessao } from '../servicos/sessao.js'

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

    const [
        fornecedores,
        setFornecedores,
    ] = useState([])

    const [
        fornecedorId,
        setFornecedorId,
    ] = useState('')

    const [
        carregandoFornecedores,
        setCarregandoFornecedores,
    ] = useState(false)

    const [
        criandoFornecedor,
        setCriandoFornecedor,
    ] = useState(false)

    const [
        novoFornecedorNome,
        setNovoFornecedorNome,
    ] = useState('')

    const [
        salvandoFornecedor,
        setSalvandoFornecedor,
    ] = useState(false)

    const [
        sucessoFornecedor,
        setSucessoFornecedor,
    ] = useState('')

    const [produtoNome, setProdutoNome] =
        useState('')

    const [
        produtoClassificacao,
        setProdutoClassificacao,
    ] = useState('')

    const [quantidade, setQuantidade] =
        useState('')

    const [unidadeMedida, setUnidadeMedida] =
        useState('')

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
                    await apiFetch(
                        `${API_URL}/empresas/${empresaId}/categorias?tipo=${tipoCategoria}`,
                    )

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

    useEffect(() => {
        if (!sessao) {
            return undefined
        }

        if (tipo !== 'PAGAR') {
            setFornecedorId('')
            setCriandoFornecedor(false)
            setNovoFornecedorNome('')
            setSucessoFornecedor('')

            return undefined
        }

        let componenteAtivo = true

        async function carregarFornecedores() {
            try {
                setCarregandoFornecedores(true)

                const empresaId =
                    sessao.usuario.empresaId

                const resposta =
                    await apiFetch(
                        `${API_URL}/empresas/${empresaId}/fornecedores`,
                    )

                if (!resposta.ok) {
                    throw new Error(
                        await obterMensagemDeErro(
                            resposta,
                            'Nao foi possivel carregar os fornecedores.',
                        ),
                    )
                }

                const dados =
                    await resposta.json()

                if (componenteAtivo) {
                    setFornecedores(
                        Array.isArray(dados)
                            ? dados
                            : [],
                    )
                }
            } catch (erroDaRequisicao) {
                if (componenteAtivo) {
                    setErro(
                        erroDaRequisicao instanceof Error
                            ? erroDaRequisicao.message
                            : 'Nao foi possivel carregar os fornecedores.',
                    )
                }
            } finally {
                if (componenteAtivo) {
                    setCarregandoFornecedores(false)
                }
            }
        }

        carregarFornecedores()

        return () => {
            componenteAtivo = false
        }
    }, [
        navigate,
        sessao,
        tipo,
    ])

    function mudarTipo(novoTipo) {
        setTipo(novoTipo)
        setCategoriaId('')
        setFornecedorId('')
        setCriandoFornecedor(false)
        setNovoFornecedorNome('')
        setSucessoFornecedor('')
        setProdutoNome('')
        setProdutoClassificacao('')
        setQuantidade('')
        setUnidadeMedida('')
        setErro('')
    }

    function abrirNovoFornecedor() {
        setCriandoFornecedor(true)
        setNovoFornecedorNome('')
        setSucessoFornecedor('')
        setErro('')
    }

    function cancelarNovoFornecedor() {
        if (salvandoFornecedor) {
            return
        }

        setCriandoFornecedor(false)
        setNovoFornecedorNome('')
        setErro('')
    }

    async function criarFornecedor(evento) {
        evento.preventDefault()

        const nomeNormalizado =
            novoFornecedorNome
                .trim()
                .replace(/\s+/g, ' ')

        if (!nomeNormalizado || !sessao) {
            setErro('Informe o nome do fornecedor.')

            return
        }

        try {
            setSalvandoFornecedor(true)
            setErro('')
            setSucessoFornecedor('')

            const empresaId =
                sessao.usuario.empresaId

            const resposta =
                await apiFetch(
                    `${API_URL}/empresas/${empresaId}/fornecedores`,
                    {
                        method: 'POST',
                        body: {
                            nome: nomeNormalizado,
                        },
                    },
                )

            if (!resposta.ok) {
                throw new Error(
                    await obterMensagemDeErro(
                        resposta,
                        'Nao foi possivel criar o fornecedor.',
                    ),
                )
            }

            const fornecedorCriado =
                await resposta.json()

            setFornecedores((listaAtual) =>
                [...listaAtual, fornecedorCriado]
                    .sort((primeiro, segundo) =>
                        primeiro.nome.localeCompare(
                            segundo.nome,
                            'pt-BR',
                        ),
                    ),
            )

            setFornecedorId(
                String(fornecedorCriado.id),
            )
            setCriandoFornecedor(false)
            setNovoFornecedorNome('')
            setSucessoFornecedor(
                `Fornecedor "${fornecedorCriado.nome}" criado e selecionado.`,
            )
        } catch (erroDaRequisicao) {
            setErro(
                erroDaRequisicao instanceof Error
                    ? erroDaRequisicao.message
                    : 'Nao foi possivel criar o fornecedor.',
            )
        } finally {
            setSalvandoFornecedor(false)
        }
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

                fornecedorId:
                    tipo === 'PAGAR' && fornecedorId
                        ? Number(fornecedorId)
                        : null,

                compradorNome:
                    tipo === 'PAGAR'
                        ? sessao.usuario.nome
                        : null,

                produtoNome:
                    tipo === 'PAGAR'
                        ? produtoNome.trim() || null
                        : null,

                produtoClassificacao:
                    tipo === 'PAGAR'
                        ? produtoClassificacao.trim() || null
                        : null,

                quantidade:
                    tipo === 'PAGAR' && quantidade
                        ? Number(quantidade)
                        : null,

                unidadeMedida:
                    tipo === 'PAGAR'
                        ? unidadeMedida.trim() || null
                        : null,
            }

            const resposta =
                await apiFetch(
                    `${API_URL}/empresas/${empresaId}/contas-financeiras`,
                    {
                        method: 'POST',
                        body: corpo,
                    },
                )

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
        voltarPaginaAnterior(
            navigate,
            '/dashboard/contas',
        )
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

                        {tipo === 'PAGAR' && (
                            <div className="nova-conta-campo">
                                <div className="nova-conta-campo-topo">
                                    <label htmlFor="fornecedor">
                                        Onde comprou
                                    </label>

                                    {!criandoFornecedor && (
                                        <button
                                            className="nova-conta-link-categoria"
                                            disabled={
                                                salvando
                                                || salvandoFornecedor
                                            }
                                            onClick={
                                                abrirNovoFornecedor
                                            }
                                            type="button"
                                        >
                                            Criar fornecedor
                                        </button>
                                    )}
                                </div>

                                <select
                                    disabled={
                                        carregandoFornecedores
                                        || salvando
                                    }
                                    id="fornecedor"
                                    onChange={(evento) => {
                                        setFornecedorId(
                                            evento.target.value,
                                        )

                                        setSucessoFornecedor('')
                                    }}
                                    value={fornecedorId}
                                >
                                    <option value="">
                                        {carregandoFornecedores
                                            ? 'Carregando fornecedores...'
                                            : fornecedores.length === 0
                                                ? 'Fornecedor opcional'
                                                : 'Selecione um fornecedor'}
                                    </option>

                                    {fornecedores.map(
                                        (fornecedor) => (
                                            <option
                                                key={fornecedor.id}
                                                value={fornecedor.id}
                                            >
                                                {fornecedor.nome}
                                            </option>
                                        ),
                                    )}
                                </select>

                                {criandoFornecedor && (
                                    <div className="nova-conta-fornecedor-rapido">
                                        <div>
                                            <strong>
                                                Novo fornecedor
                                            </strong>

                                            <span>
                                                So o nome e obrigatorio. O comprador sera registrado automaticamente.
                                            </span>
                                        </div>

                                        <input
                                            aria-label="Nome do novo fornecedor"
                                            disabled={salvandoFornecedor}
                                            maxLength="150"
                                            onChange={(evento) =>
                                                setNovoFornecedorNome(
                                                    evento.target.value,
                                                )
                                            }
                                            placeholder="Ex.: Agropecuaria Central"
                                            type="text"
                                            value={novoFornecedorNome}
                                        />

                                        <div>
                                            <button
                                                className="nova-conta-cancelar"
                                                disabled={salvandoFornecedor}
                                                onClick={
                                                    cancelarNovoFornecedor
                                                }
                                                type="button"
                                            >
                                                Cancelar
                                            </button>

                                            <button
                                                className="nova-conta-salvar"
                                                disabled={
                                                    salvandoFornecedor
                                                    || !novoFornecedorNome.trim()
                                                }
                                                onClick={criarFornecedor}
                                                type="button"
                                            >
                                                {salvandoFornecedor
                                                    ? 'Criando...'
                                                    : 'Criar e selecionar'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {sucessoFornecedor && (
                                    <p className="nova-conta-sucesso">
                                        OK {sucessoFornecedor}
                                    </p>
                                )}
                            </div>
                        )}

                        {tipo === 'PAGAR' && (
                            <div className="nova-conta-campo">
                                <label htmlFor="produtoNome">
                                    Mercadoria comprada
                                </label>

                                <input
                                    disabled={salvando}
                                    id="produtoNome"
                                    maxLength="150"
                                    onChange={(evento) =>
                                        setProdutoNome(
                                            evento.target.value,
                                        )
                                    }
                                    placeholder="Ex.: Semente de soja"
                                    type="text"
                                    value={produtoNome}
                                />

                                <div className="nova-conta-grade-menor">
                                    <div>
                                        <label htmlFor="produtoClassificacao">
                                            Classificacao
                                        </label>

                                        <input
                                            disabled={salvando}
                                            id="produtoClassificacao"
                                            list="classificacoesProdutoConta"
                                            maxLength="100"
                                            onChange={(evento) =>
                                                setProdutoClassificacao(
                                                    evento.target.value,
                                                )
                                            }
                                            placeholder="Ex.: Sementes"
                                            type="text"
                                            value={produtoClassificacao}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="quantidadeProduto">
                                            Quantidade
                                        </label>

                                        <input
                                            disabled={salvando}
                                            id="quantidadeProduto"
                                            min="0.001"
                                            onChange={(evento) =>
                                                setQuantidade(
                                                    evento.target.value,
                                                )
                                            }
                                            placeholder="Ex.: 10"
                                            step="0.001"
                                            type="number"
                                            value={quantidade}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="unidadeMedida">
                                            Unidade
                                        </label>

                                        <input
                                            disabled={salvando}
                                            id="unidadeMedida"
                                            list="unidadesProdutoConta"
                                            maxLength="30"
                                            onChange={(evento) =>
                                                setUnidadeMedida(
                                                    evento.target.value,
                                                )
                                            }
                                            placeholder="Ex.: saco"
                                            type="text"
                                            value={unidadeMedida}
                                        />
                                    </div>
                                </div>

                                <datalist id="classificacoesProdutoConta">
                                    <option value="Sementes" />
                                    <option value="Adubo" />
                                    <option value="Defensivo" />
                                    <option value="Combustivel" />
                                    <option value="Racao" />
                                    <option value="Medicamento animal" />
                                    <option value="Pecas e manutencao" />
                                    <option value="Outros" />
                                </datalist>

                                <datalist id="unidadesProdutoConta">
                                    <option value="unidade" />
                                    <option value="kg" />
                                    <option value="saco" />
                                    <option value="litro" />
                                    <option value="tonelada" />
                                    <option value="caixa" />
                                </datalist>
                            </div>
                        )}

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
                                    || salvandoFornecedor
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
