import {
    useEffect,
    useState,
} from 'react'
import {
    useNavigate,
} from 'react-router'
import './EscolhaModulo.css'
import '../App.css'
import { obterSessao } from '../servicos/sessao.js'
import ShellDashboard from '../componentes/ShellDashboard.jsx'

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

    return (
        <ShellDashboard sessao={sessao} ativo="visao-geral">
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
        </ShellDashboard>
    )
}

export default EscolhaModulo
