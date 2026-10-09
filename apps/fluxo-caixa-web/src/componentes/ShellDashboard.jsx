import {
    useState,
} from 'react'
import {
    useLocation,
    useNavigate,
} from 'react-router'
import './ShellDashboard.css'
import { limparSessao } from '../servicos/sessao.js'
import ModalAnimado from './ModalAnimado.jsx'

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

function ShellDashboard({ sessao, ativo, children }) {
    const navigate = useNavigate()
    const location = useLocation()
    const [confirmandoSaida, setConfirmandoSaida] = useState(false)

    const papel = sessao.usuario.papel
    const hoje = new Date()
    const anoSafra = hoje.getMonth() >= 6 ? hoje.getFullYear() : hoje.getFullYear() - 1
    const safraAtual = `${anoSafra}/${anoSafra + 1}`
    const podeAdministrar =
        papel === 'ADMINISTRADOR' || papel === 'SUPER_ADMIN'
    const rotuloPapel = papel === 'CONTADOR'
        ? 'Contador'
        : podeAdministrar
            ? 'Administrador'
            : 'Produtor rural'

    function sair() {
        limparSessao()
        navigate('/login', { replace: true })
    }

    const navItens = [
        { chave: 'visao-geral', icone: 'grid_view', rotulo: 'Visão Geral', rota: '/dashboard', exata: true },
        { chave: 'financeiro', icone: 'monitoring', rotulo: 'Financeiro', rota: '/dashboard/financeiro' },
        { chave: 'lancamentos', icone: 'receipt_long', rotulo: 'Lançamentos', rota: '/dashboard/movimentacoes' },
        { chave: 'contas', icone: 'account_balance_wallet', rotulo: 'Contas', rota: '/dashboard/contas' },
        { chave: 'fornecedores', icone: 'local_shipping', rotulo: 'Fornecedores', rota: '/dashboard/fornecedores' },
        { chave: 'fiscal', icone: 'account_balance', rotulo: 'LCDPR & Fiscal', rota: '/contador' },
        { chave: 'config', icone: 'tune', rotulo: 'Configurações', rota: '/dashboard/perfil' },
    ]

    // Item ativo pela rota atual; o prop `ativo` ainda funciona como override.
    const estaAtivo = (item) => {
        if (ativo) {
            return ativo === item.chave
        }
        return item.exata
            ? location.pathname === item.rota
            : location.pathname.startsWith(item.rota)
    }

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
                                aria-current={estaAtivo(item) ? 'page' : undefined}
                                className={`ag-dash-nav-item ${estaAtivo(item) ? 'ag-ativo' : ''}`}
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
                            aria-current={location.pathname.startsWith('/admin') ? 'page' : undefined}
                            className={`ag-dash-nav-item${location.pathname.startsWith('/admin') ? ' ag-ativo' : ''}`}
                            onClick={() => navigate('/admin')}
                            type="button"
                        >
                            <Icone nome="shield_person" tamanho={20} />
                            Área administrativa
                        </button>
                    )}
                    <button
                        aria-current={location.pathname === '/dashboard/plano' ? 'page' : undefined}
                        className={`ag-dash-nav-item${location.pathname === '/dashboard/plano' ? ' ag-ativo' : ''}`}
                        onClick={() => navigate('/dashboard/plano')}
                        type="button"
                    >
                        <Icone nome="credit_card" tamanho={20} />
                        Plano e pagamentos
                    </button>
                    <button className="ag-dash-nav-item ag-dash-sair" onClick={() => setConfirmandoSaida(true)} type="button">
                        <Icone nome="logout" tamanho={20} />
                        Sair
                    </button>
                </div>
            </aside>

            <div className="ag-dash-conteudo">
                <header className="ag-dash-header">
                    <div className="ag-dash-safra">
                        <span className="ag-dash-ponto-ok" />
                        Safra: <strong>{safraAtual} Ativa</strong>
                    </div>

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
                                <small>{rotuloPapel}</small>
                            </div>
                            <span className="ag-dash-avatar">
                                <Icone nome="person" tamanho={18} />
                            </span>
                        </button>
                    </div>
                </header>

                <main className="ag-dash-main">
                    {children}
                </main>
            </div>

            <ModalAnimado
                aberto={confirmandoSaida}
                aoFechar={() => setConfirmandoSaida(false)}
                classeFundo="ag-dash-modal-fundo"
            >
                <section
                    aria-modal="true"
                    className="ag-dash-modal"
                    role="dialog"
                >
                    <span className="ag-dash-modal-icone">
                        <Icone nome="logout" tamanho={26} />
                    </span>
                    <h2>Sair da conta?</h2>
                    <p>
                        Sua sessão será encerrada e será necessário fazer login
                        novamente para acessar o Agro Gestão.
                    </p>
                    <div className="ag-dash-modal-acoes">
                        <button
                            className="ag-dash-modal-cancelar"
                            onClick={() => setConfirmandoSaida(false)}
                            type="button"
                        >
                            Cancelar
                        </button>
                        <button
                            className="ag-dash-modal-confirmar"
                            onClick={sair}
                            type="button"
                        >
                            Sair da conta
                        </button>
                    </div>
                </section>
            </ModalAnimado>
        </div>
    )
}

export default ShellDashboard
