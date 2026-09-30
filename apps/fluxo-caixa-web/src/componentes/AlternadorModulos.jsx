import {
    useLocation,
    useNavigate,
} from 'react-router'
import './AlternadorModulos.css'

function AlternadorModulos() {
    const navigate = useNavigate()
    const location = useLocation()

    const itens = [
        {
            ativo: location.pathname === '/dashboard',
            icone: 'In',
            rota: '/dashboard',
            texto: 'Inicio',
        },
        {
            ativo: location.pathname.startsWith('/dashboard/financeiro'),
            icone: 'R$',
            rota: '/dashboard/financeiro',
            texto: 'Financeiro',
        },
        {
            ativo: location.pathname.startsWith('/dashboard/contas'),
            icone: 'Ct',
            rota: '/dashboard/contas',
            texto: 'Contas',
        },
        {
            ativo: location.pathname.startsWith('/dashboard/fornecedores'),
            icone: 'F',
            rota: '/dashboard/fornecedores',
            texto: 'Fornecedores',
        },
        {
            ativo: location.pathname.startsWith('/dashboard/produtor'),
            icone: 'Pr',
            rota: '/dashboard/produtor',
            texto: 'Produtor',
        },
        {
            ativo: location.pathname.startsWith('/contador'),
            icone: 'Co',
            rota: '/contador',
            texto: 'Contador',
        },
    ]

    return (
        <nav
            aria-label="Alternar entre as areas do AgroGestao"
            className="alternador-modulos"
        >
            {itens.map((item) => (
                <button
                    key={item.rota}
                    aria-current={item.ativo ? 'page' : undefined}
                    className={
                        item.ativo
                            ? 'alternador-modulos-botao ativo'
                            : 'alternador-modulos-botao'
                    }
                    onClick={() => navigate(item.rota)}
                    type="button"
                >
                    <span aria-hidden="true">
                        {item.icone}
                    </span>

                    {item.texto}
                </button>
            ))}
        </nav>
    )
}

export default AlternadorModulos
