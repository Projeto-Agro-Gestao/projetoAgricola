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
            icone: 'Inicio',
            rota: '/dashboard',
            texto: 'Tela principal',
        },
        {
            ativo: location.pathname.startsWith('/dashboard/financeiro'),
            icone: 'R$',
            rota: '/dashboard/financeiro',
            texto: 'Controle financeiro',
        },
        {
            ativo: location.pathname.startsWith('/dashboard/contas'),
            icone: 'Contas',
            rota: '/dashboard/contas',
            texto: 'Contas a pagar e receber',
        },
        {
            ativo: location.pathname.startsWith('/dashboard/fornecedores'),
            icone: 'F',
            rota: '/dashboard/fornecedores',
            texto: 'Fornecedores',
        },
        {
            ativo: location.pathname.startsWith('/dashboard/produtor'),
            icone: 'Produtor',
            rota: '/dashboard/produtor',
            texto: 'Inicio do produtor',
        },
        {
            ativo: location.pathname.startsWith('/contador'),
            icone: 'Contador',
            rota: '/contador',
            texto: 'Area do contador',
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
