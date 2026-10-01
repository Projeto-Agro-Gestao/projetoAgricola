import { useLocation, useNavigate } from 'react-router'
import { useEffect, useState } from 'react'
import { API_BASE_URL as API_URL } from '../config.js'
import {
    atualizarUsuarioSessao,
    limparSessao,
    obterSessao,
} from '../servicos/sessao.js'
import './AppShell.css'

const ROTAS_PUBLICAS = [
    '/',
    '/login',
    '/cadastro',
    '/esqueci-senha',
    '/redefinir-senha',
    '/termos-de-uso',
    '/politica-de-privacidade',
]

function rotaPublica(pathname) {
    return ROTAS_PUBLICAS.some(
        (rota) => pathname === rota || pathname.startsWith(`${rota}/`),
    )
}

function AppShell() {
    const location = useLocation()
    const navigate = useNavigate()
    const [confirmandoSaida, setConfirmandoSaida] = useState(false)
    const sessao = obterSessao()

    useEffect(() => {
        if (rotaPublica(location.pathname) || !sessao) {
            return
        }

        fetch(`${API_URL}/auth/me`, {
            headers: {
                Authorization: `${sessao.tipoToken} ${sessao.token}`,
            },
        })
            .then(async (resposta) => {
                if (resposta.status === 401) {
                    limparSessao()
                    navigate('/login', { replace: true })
                    return
                }

                if (resposta.ok) {
                    atualizarUsuarioSessao(await resposta.json())
                }
            })
            .catch(() => {})
    }, [location.pathname, navigate, sessao])

    if (rotaPublica(location.pathname) || !sessao) {
        return null
    }

    function sair() {
        limparSessao()
        navigate('/login', { replace: true })
    }

    return (
        <>
            <nav
                className="app-shell"
                aria-label="Navegação da conta"
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
                    onClick={() => setConfirmandoSaida(true)}
                >
                    Sair da conta
                </button>
            </nav>

            {confirmandoSaida && (
                <div
                    className="app-shell-modal-fundo"
                    role="presentation"
                >
                    <section
                        aria-modal="true"
                        className="app-shell-modal"
                        role="dialog"
                    >
                        <h2>Tem certeza que deseja sair da sua conta?</h2>
                        <p>
                            Sua sessão será encerrada e será necessário fazer
                            login novamente para acessar o AgroGestão.
                        </p>
                        <div>
                            <button
                                type="button"
                                onClick={() => setConfirmandoSaida(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="app-shell-sair"
                                onClick={sair}
                            >
                                Sair da conta
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </>
    )
}

export default AppShell
