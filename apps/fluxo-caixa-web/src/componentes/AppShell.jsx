import { useLocation, useNavigate } from 'react-router'
import { limparSessao, obterSessao } from '../servicos/sessao.js'
import './AppShell.css'

const ROTAS_PUBLICAS = [
    '/',
    '/login',
    '/cadastro',
    '/esqueci-senha',
    '/redefinir-senha',
]

function rotaPublica(pathname) {
    return ROTAS_PUBLICAS.some(
        (rota) => pathname === rota || pathname.startsWith(`${rota}/`),
    )
}

function AppShell() {
    const location = useLocation()
    const navigate = useNavigate()

    if (rotaPublica(location.pathname) || !obterSessao()) {
        return null
    }

    function sair() {
        limparSessao()
        navigate('/login', { replace: true })
    }

    return (
        <nav
            className="app-shell"
            aria-label="Navegacao da conta"
        >
            <button
                type="button"
                onClick={() => navigate('/dashboard')}
            >
                Tela principal
            </button>
            <button
                type="button"
                className="app-shell-sair"
                onClick={sair}
            >
                Sair da conta
            </button>
        </nav>
    )
}

export default AppShell
