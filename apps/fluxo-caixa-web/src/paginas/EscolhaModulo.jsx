import {
    useEffect,
    useState,
} from 'react'
import {
    useNavigate,
} from 'react-router'
import './EscolhaModulo.css'
import '../App.css'
import { limparSessao, obterSessao } from '../servicos/sessao.js'

function Icone({ nome, tamanho }) {
    return (
        <span
            aria-hidden="true"
            className="material-symbols-outlined"
            style={tamanho ? { fontSize: `${tamanho}px` } : undefined}
        >
            {nome}
        </span>
    )
}

function EscolhaModulo() {
    const navigate = useNavigate()
    const [sessao] = useState(obterSessao)

    useEffect(() => {
        if (!sessao) {
            navigate('/login', { replace: true })
        }
    }, [navigate, sessao])

    if (!sessao) {
        return null
    }

    const papel = sessao.usuario.papel
    const podeAdministrar =
        papel === 'ADMINISTRADOR' || papel === 'SUPER_ADMIN'

    function sair() {
        limparSessao()
        navigate('/login', { replace: true })
    }

    // Módulos reais do sistema (rotas existentes no roteador).
    const modulos = [
        {
            icone: 'finance_mode',
            categoria: 'Financeiro',
            titulo: 'Controle interno financeiro',
            descricao: 'Acompanhe receitas, despesas, saldo e resultado do período registrado.',
            nota: 'Receitas, despesas e gráficos',
            rota: '/dashboard/financeiro',
            cor: 'verde',
        },
        {
            icone: 'account_balance_wallet',
            categoria: 'Planejamento',
            titulo: 'Contas a pagar e receber',
            descricao: 'Veja valores que ainda vão entrar ou sair e acompanhe vencimentos futuros.',
            nota: 'Previsão e vencimentos',
            rota: '/dashboard/contas',
            cor: 'verde',
        },
        {
            icone: 'local_shipping',
            categoria: 'Compras',
            titulo: 'Controle de fornecedores',
            descricao: 'Cadastre onde comprou, compare preços e organize produtos por categoria.',
            nota: 'Fornecedores e produtos',
            rota: '/dashboard/fornecedores',
            cor: 'ambar',
        },
        {
            icone: 'potted_plant',
            categoria: 'Produtor',
            titulo: 'Painel do produtor',
            descricao: 'Envie documentos, veja pendências do contador e a visão rápida do mês.',
            nota: 'Documentos e pendências',
            rota: '/dashboard/produtor',
            cor: 'verde',
        },
        {
            icone: 'calculate',
            categoria: 'Contábil',
            titulo: 'Área do contador',
            descricao: 'Carteira de clientes, documentos, pendências, classificações e visão tributária.',
            nota: 'Carteira e análise',
            rota: '/contador',
            cor: 'ambar',
        },
    ]

    const navItens = [
        { icone: 'grid_view', rotulo: 'Visão Geral', rota: '/dashboard', ativo: true },
        { icone: 'receipt_long', rotulo: 'Lançamentos', rota: '/dashboard/movimentacoes' },
        { icone: 'account_balance_wallet', rotulo: 'Contas', rota: '/dashboard/contas' },
        { icone: 'account_balance', rotulo: 'LCDPR & Fiscal', rota: '/contador' },
        { icone: 'tune', rotulo: 'Configurações', rota: '/dashboard/perfil' },
    ]

    return (
        <div className="ag-dash publica">
            <aside className="ag-dash-sidebar">
                <div className="ag-dash-sidebar-topo">
                    <div className="ag-dash-marca">
                        <span className="ag-dash-marca-icone">
                            <Icone nome="eco" tamanho={22} />
                        </span>
                        <div>
                            <strong>Agro Gestão</strong>
                            <small>Gestão rural</small>
                        </div>
                    </div>

                    <div className="ag-dash-propriedade">
                        <span className="ag-dash-prop-icone">
                            <Icone nome="agriculture" tamanho={20} />
                        </span>
                        <div className="ag-dash-prop-texto">
                            <small>Propriedade ativa</small>
                            <strong>{sessao.usuario.nomeEmpresa}</strong>
                        </div>
                    </div>

                    <nav className="ag-dash-nav" aria-label="Navegação principal">
                        <span className="ag-dash-nav-titulo">Navegação</span>
                        {navItens.map((item) => (
                            <button
                                className={`ag-dash-nav-item ${item.ativo ? 'ag-ativo' : ''}`}
                                key={item.rotulo}
                                onClick={() => navigate(item.rota)}
                                type="button"
                            >
                                <Icone nome={item.icone} tamanho={20} />
                                {item.rotulo}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="ag-dash-sidebar-base">
                    {podeAdministrar && (
                        <button
                            className="ag-dash-nav-item"
                            onClick={() => navigate('/admin')}
                            type="button"
                        >
                            <Icone nome="shield_person" tamanho={20} />
                            Área administrativa
                        </button>
                    )}
                    <button className="ag-dash-nav-item" onClick={() => navigate('/dashboard/plano')} type="button">
                        <Icone nome="credit_card" tamanho={20} />
                        Plano e pagamentos
                    </button>
                    <button className="ag-dash-nav-item ag-dash-sair" onClick={sair} type="button">
                        <Icone nome="logout" tamanho={20} />
                        Sair
                    </button>
                </div>
            </aside>

            <div className="ag-dash-conteudo">
                <header className="ag-dash-header">
                    <div className="ag-dash-busca">
                        <Icone nome="search" tamanho={18} />
                        <span>Buscar operações, documentos, movimentações...</span>
                    </div>

                    <div className="ag-dash-header-acoes">
                        <button className="ag-dash-icone-botao" onClick={() => navigate('/app')} type="button" title="App simples">
                            <Icone nome="smartphone" tamanho={20} />
                        </button>
                        <button
                            className="ag-dash-icone-botao"
                            type="button"
                            title="Notificações (em breve)"
                        >
                            <Icone nome="notifications" tamanho={20} />
                        </button>
                        <div className="ag-dash-divisor" />
                        <button className="ag-dash-usuario" onClick={() => navigate('/dashboard/perfil')} type="button">
                            <div className="ag-dash-usuario-texto">
                                <strong>{sessao.usuario.nome}</strong>
                                <small>{papel === 'CONTADOR' ? 'Contador' : 'Produtor rural'}</small>
                            </div>
                            <span className="ag-dash-avatar">
                                <Icone nome="person" tamanho={18} />
                            </span>
                        </button>
                    </div>
                </header>

                <main className="ag-dash-main">
                    <section className="ag-dash-modulos">
                        <div className="ag-dash-modulos-topo">
                            <div>
                                <span className="ag-dash-eyebrow">
                                    <Icone nome="hub" tamanho={18} />
                                    Gestão integrada
                                </span>
                                <h2>Módulos do sistema</h2>
                            </div>
                            <div className="ag-dash-modulos-info">
                                <span className="ag-dash-ponto-ok" />
                                {modulos.length} módulos disponíveis
                            </div>
                        </div>

                        <div className="ag-dash-grid">
                            {modulos.map((m) => (
                                <article className="ag-dash-card" key={m.titulo}>
                                    <div className="ag-dash-card-corpo">
                                        <div className="ag-dash-card-topo">
                                            <span className={`ag-dash-card-icone ag-icone-${m.cor}`}>
                                                <Icone nome={m.icone} tamanho={28} />
                                            </span>
                                            <div className="ag-dash-card-tags">
                                                <span className="ag-dash-tag-cat">{m.categoria}</span>
                                                <span className="ag-dash-tag-ativo">
                                                    <span className="ag-dash-ponto-ok" />
                                                    Ativo
                                                </span>
                                            </div>
                                        </div>
                                        <h3>{m.titulo}</h3>
                                        <p>{m.descricao}</p>
                                    </div>
                                    <button
                                        className="ag-dash-card-rodape"
                                        onClick={() => navigate(m.rota)}
                                        type="button"
                                    >
                                        <span>{m.nota}</span>
                                        <span className="ag-dash-card-acessar">
                                            Acessar
                                            <Icone nome="arrow_forward" tamanho={18} />
                                        </span>
                                    </button>
                                </article>
                            ))}
                        </div>
                    </section>
                </main>
            </div>
        </div>
    )
}

export default EscolhaModulo
