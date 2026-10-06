import { useLocation, useNavigate } from 'react-router'
import { useEffect } from 'react'
import { API_BASE_URL as API_URL } from '../config.js'
import { apiFetch } from '../servicos/api.js'
import {
    atualizarUsuarioSessao,
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
    const sessao = obterSessao()

    useEffect(() => {
        if (rotaPublica(location.pathname) || !sessao) {
            return
        }

        apiFetch(`${API_URL}/auth/me`)
            .then(async (resposta) => {
                if (resposta.ok) {
                    atualizarUsuarioSessao(await resposta.json())
                }
            })
            .catch(() => {})
    }, [location.pathname, navigate, sessao])

    // Componente sem UI: apenas valida a sessão (useEffect acima) e
    // desloga em caso de token expirado. Os antigos botões flutuantes
    // "Tela principal" / "Sair da conta" foram removidos.
    return null
}

export default AppShell
