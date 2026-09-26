import {
    useEffect,
    useMemo,
    useState,
} from 'react'
import { useNavigate } from 'react-router'
import { API_BASE_URL as API_URL } from '../config.js'
import { voltarPaginaAnterior } from '../navegacao.js'
import './AdminAssinaturas.css'

const FILTROS = [
    { valor: 'TODOS', rotulo: 'Todos' },
    { valor: 'TRIAL', rotulo: 'Em teste' },
    { valor: 'TRIAL_EXPIRING', rotulo: 'Teste terminando' },
    { valor: 'TRIAL_EXPIRED', rotulo: 'Teste expirado' },
    { valor: 'ACTIVE', rotulo: 'Ativos' },
    { valor: 'PENDING', rotulo: 'Pendentes' },
    { valor: 'OVERDUE', rotulo: 'Vencidos' },
    { valor: 'SUSPENDED', rotulo: 'Bloqueados' },
    { valor: 'CANCELLED', rotulo: 'Cancelados' },
]

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

        if (!token || !usuarioSalvo) {
            return null
        }

        return {
            token,
            tipoToken,
            usuario: JSON.parse(usuarioSalvo),
        }
    } catch {
        limparSessao()
        return null
    }
}

function formatarDinheiro(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(valor ?? 0)
}

function formatarData(data) {
    if (!data) {
        return '-'
    }
    const [ano, mes, dia] = data.split('-')
    return `${dia}/${mes}/${ano}`
}

async function obterMensagemDeErro(resposta) {
    const dados = await resposta.json().catch(() => null)
    return dados?.mensagem ?? 'Nao foi possivel concluir a acao.'
}

function AdminAssinaturas() {
    const navigate = useNavigate()
    const [sessao] = useState(obterSessao)
    const [dados, setDados] = useState(null)
    const [filtro, setFiltro] = useState('TODOS')
    const [mensagem, setMensagem] = useState('')
    const [salvando, setSalvando] = useState(false)
    const [configuracao, setConfiguracao] = useState(null)
    const [diasPorEmpresa, setDiasPorEmpresa] = useState({})
    const [dataPorEmpresa, setDataPorEmpresa] = useState({})

    useEffect(() => {
        if (!sessao || sessao.usuario?.papel !== 'ADMINISTRADOR') {
            navigate('/dashboard', { replace: true })
            return
        }
        carregar()
    }, [])

    const clientesFiltrados = useMemo(() => {
        const clientes = dados?.clientes ?? []
        if (filtro === 'TODOS') {
            return clientes
        }
        return clientes.filter(
            (cliente) => cliente.statusAssinatura === filtro,
        )
    }, [dados, filtro])

    const resumoAssinaturas = useMemo(() => {
        return (dados?.clientes ?? []).reduce(
            (total, cliente) => {
                total.clientes += 1
                if (cliente.statusAssinatura === 'ACTIVE') {
                    total.ativos += 1
                }
                if (cliente.statusAssinatura === 'TRIAL') {
                    total.emTeste += 1
                }
                if (
                    ['OVERDUE', 'SUSPENDED', 'TRIAL_EXPIRED'].includes(
                        cliente.statusAssinatura,
                    )
                ) {
                    total.atencao += 1
                }
                total.receitaMensal += Number(cliente.valor ?? 0)
                return total
            },
            {
                clientes: 0,
                ativos: 0,
                emTeste: 0,
                atencao: 0,
                receitaMensal: 0,
            },
        )
    }, [dados])

    async function carregar() {
        try {
            const resposta = await fetch(
                `${API_URL}/admin/assinaturas`,
                {
                    headers: {
                        Authorization:
                            `${sessao.tipoToken} ${sessao.token}`,
                    },
                },
            )

            if (!resposta.ok) {
                throw new Error(await obterMensagemDeErro(resposta))
            }

            const corpo = await resposta.json()
            setDados(corpo)
            setConfiguracao(corpo.configuracao)
            setMensagem('')
        } catch (erro) {
            setMensagem(
                erro instanceof Error
                    ? erro.message
                    : 'Nao foi possivel carregar assinaturas.',
            )
        }
    }

    async function salvarConfiguracao(evento) {
        evento.preventDefault()
        await enviar(
            `${API_URL}/admin/assinaturas/configuracao`,
            'PUT',
            configuracao,
            'Configuracao salva.',
        )
    }

    async function acaoCliente(
            empresaId,
            caminho,
            corpo,
            sucesso,
            metodo = 'PATCH') {
        await enviar(
            `${API_URL}/admin/assinaturas/empresas/${empresaId}/${caminho}`,
            metodo,
            corpo,
            sucesso,
        )
    }

    async function enviar(url, metodo, corpo, sucesso) {
        try {
            setSalvando(true)
            const resposta = await fetch(url, {
                method: metodo,
                headers: {
                    Authorization:
                        `${sessao.tipoToken} ${sessao.token}`,
                    'Content-Type': 'application/json; charset=utf-8',
                },
                body: corpo ? JSON.stringify(corpo) : undefined,
            })

            if (!resposta.ok) {
                throw new Error(await obterMensagemDeErro(resposta))
            }

            setMensagem(sucesso)
            await carregar()
        } catch (erro) {
            setMensagem(
                erro instanceof Error
                    ? erro.message
                    : 'Nao foi possivel concluir a acao.',
            )
        } finally {
            setSalvando(false)
        }
    }

    return (
        <main className="admin-assinaturas">
            <button
                className="admin-assinaturas-voltar"
                onClick={() =>
                    voltarPaginaAnterior(
                        navigate,
                        '/admin',
                    )
                }
                type="button"
            >
                Voltar ao admin
            </button>

            <header className="admin-assinaturas-topo">
                <span>Administracao</span>
                <h1>Clientes e assinaturas</h1>
                <p>
                    Controle teste gratuito, status de assinatura,
                    preco e regras gerais de pagamento.
                </p>
            </header>

            <section className="admin-assinaturas-resumo">
                <article>
                    <span>Clientes</span>
                    <strong>{resumoAssinaturas.clientes}</strong>
                </article>
                <article>
                    <span>Ativos</span>
                    <strong>{resumoAssinaturas.ativos}</strong>
                </article>
                <article>
                    <span>Em teste</span>
                    <strong>{resumoAssinaturas.emTeste}</strong>
                </article>
                <article>
                    <span>Precisam de atenção</span>
                    <strong>{resumoAssinaturas.atencao}</strong>
                </article>
                <article>
                    <span>Receita prevista</span>
                    <strong>
                        {formatarDinheiro(resumoAssinaturas.receitaMensal)}
                    </strong>
                </article>
            </section>

            {mensagem && (
                <div className="admin-assinaturas-aviso" role="status">
                    {mensagem}
                </div>
            )}

            {configuracao && (
                <form
                    className="admin-assinaturas-config"
                    onSubmit={salvarConfiguracao}
                >
                    <div className="admin-assinaturas-config-topo">
                        <small>Configuração geral</small>
                        <h2>Plano padrão</h2>
                        <p>
                            Defina preço, teste gratuito e regras de aviso sem
                            alterar código.
                        </p>
                    </div>

                    <label>
                        Preco mensal *
                        <input
                            min="0.01"
                            onChange={(evento) =>
                                setConfiguracao({
                                    ...configuracao,
                                    precoMensal: Number(evento.target.value),
                                })
                            }
                            required
                            step="0.01"
                            type="number"
                            value={configuracao.precoMensal}
                        />
                    </label>

                    <label>
                        Dias de teste *
                        <input
                            min="0"
                            onChange={(evento) =>
                                setConfiguracao({
                                    ...configuracao,
                                    diasTrialPadrao: Number(evento.target.value),
                                })
                            }
                            required
                            type="number"
                            value={configuracao.diasTrialPadrao}
                        />
                    </label>

                    <label>
                        Avisar antes *
                        <input
                            min="0"
                            onChange={(evento) =>
                                setConfiguracao({
                                    ...configuracao,
                                    diasAvisoTrial: Number(evento.target.value),
                                })
                            }
                            required
                            type="number"
                            value={configuracao.diasAvisoTrial}
                        />
                    </label>

                    <label>
                        Carencia *
                        <input
                            min="0"
                            onChange={(evento) =>
                                setConfiguracao({
                                    ...configuracao,
                                    diasCarencia: Number(evento.target.value),
                                })
                            }
                            required
                            type="number"
                            value={configuracao.diasCarencia}
                        />
                    </label>

                    <label className="admin-assinaturas-check">
                        <input
                            checked={configuracao.trialHabilitado}
                            onChange={(evento) =>
                                setConfiguracao({
                                    ...configuracao,
                                    trialHabilitado: evento.target.checked,
                                })
                            }
                            type="checkbox"
                        />
                        Teste gratuito ativo
                    </label>

                    <button disabled={salvando} type="submit">
                        Salvar configuracao
                    </button>

                    <small>* Campo obrigatorio</small>
                </form>
            )}

            <section className="admin-assinaturas-filtros">
                <strong>Filtrar clientes</strong>
                {FILTROS.map((item) => (
                    <button
                        className={filtro === item.valor ? 'ativo' : ''}
                        key={item.valor}
                        onClick={() => setFiltro(item.valor)}
                        type="button"
                    >
                        {item.rotulo}
                    </button>
                ))}
            </section>

            <section className="admin-assinaturas-lista">
                {clientesFiltrados.map((cliente) => (
                    <article key={cliente.empresaId}>
                        <div className="admin-assinaturas-cliente">
                            <div>
                                <strong>{cliente.empresa}</strong>
                                <span>{cliente.email ?? cliente.cliente}</span>
                            </div>
                            <b
                                className={`admin-assinaturas-status status-${cliente.statusAssinatura?.toLowerCase()}`}
                            >
                                {cliente.statusAssinatura}
                            </b>
                        </div>

                        <div className="admin-assinaturas-dados">
                            <span><small>Plano</small>{cliente.plano}</span>
                            <span><small>Valor</small>{formatarDinheiro(cliente.valor)}</span>
                            <span><small>Teste</small>{formatarData(cliente.trialInicio)} ate {formatarData(cliente.trialFim)}</span>
                            <span><small>Dias restantes</small>{cliente.diasRestantesTrial}</span>
                            <span><small>Próximo vencimento</small>{formatarData(cliente.proximoVencimento)}</span>
                            <span><small>Último pagamento</small>{formatarData(cliente.ultimoPagamento)}</span>
                            <span><small>Forma</small>{cliente.formaUltimoPagamento ?? '-'}</span>
                        </div>

                        <div className="admin-assinaturas-acoes">
                            <input
                                min="1"
                                onChange={(evento) =>
                                    setDiasPorEmpresa({
                                        ...diasPorEmpresa,
                                        [cliente.empresaId]: evento.target.value,
                                    })
                                }
                                placeholder="+ dias"
                                type="number"
                                value={diasPorEmpresa[cliente.empresaId] ?? ''}
                            />

                            <button
                                disabled={salvando}
                                onClick={() =>
                                    acaoCliente(
                                        cliente.empresaId,
                                        'trial/adicionar-dias',
                                        {
                                            dias: Number(
                                                diasPorEmpresa[cliente.empresaId] || 1,
                                            ),
                                        },
                                        'Dias adicionados ao teste.',
                                    )
                                }
                                type="button"
                            >
                                Adicionar dias
                            </button>

                            <input
                                onChange={(evento) =>
                                    setDataPorEmpresa({
                                        ...dataPorEmpresa,
                                        [cliente.empresaId]: evento.target.value,
                                    })
                                }
                                type="date"
                                value={dataPorEmpresa[cliente.empresaId] ?? ''}
                            />

                            <button
                                disabled={salvando}
                                onClick={() =>
                                    acaoCliente(
                                        cliente.empresaId,
                                        'trial/definir-fim',
                                        {
                                            trialFim: dataPorEmpresa[cliente.empresaId],
                                        },
                                        'Fim do teste atualizado.',
                                    )
                                }
                                type="button"
                            >
                                Definir fim
                            </button>

                            <button
                                disabled={salvando}
                                onClick={() => {
                                    if (window.confirm('Encerrar teste agora?')) {
                                        acaoCliente(
                                            cliente.empresaId,
                                            'trial/encerrar',
                                            null,
                                            'Teste encerrado.',
                                        )
                                    }
                                }}
                                type="button"
                            >
                                Encerrar teste
                            </button>

                            <button
                                disabled={salvando}
                                onClick={() =>
                                    acaoCliente(
                                        cliente.empresaId,
                                        'status',
                                        { status: 'ACTIVE' },
                                        'Assinatura ativada.',
                                    )
                                }
                                type="button"
                            >
                                Ativar
                            </button>

                            <button
                                disabled={salvando}
                                onClick={() => {
                                    if (window.confirm('Suspender acesso deste cliente?')) {
                                        acaoCliente(
                                            cliente.empresaId,
                                            'status',
                                            { status: 'SUSPENDED' },
                                            'Assinatura suspensa.',
                                        )
                                    }
                                }}
                                type="button"
                            >
                                Suspender
                            </button>
                        </div>
                    </article>
                ))}
            </section>
        </main>
    )
}

export default AdminAssinaturas
