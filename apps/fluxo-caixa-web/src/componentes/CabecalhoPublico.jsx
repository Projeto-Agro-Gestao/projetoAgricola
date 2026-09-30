import { useEffect, useState } from 'react'
import {
    Link,
    useLocation,
} from 'react-router'
import {
    IconeFechar,
    IconeFolha,
    IconeMenu,
} from './Icones.jsx'
import '../App.css'

const MENU = [
    ['Para produtores', 'produtores'],
    ['Para contadores', 'contadores'],
    ['Como funciona', 'como-funciona'],
    ['Recursos', 'recursos'],
]

function LinkMenu({ ancora, caminho, aoClicar, children }) {
    if (caminho === '/') {
        return (
            <a href={`#${ancora}`} onClick={aoClicar}>
                {children}
            </a>
        )
    }

    return (
        <Link onClick={aoClicar} to={`/#${ancora}`}>
            {children}
        </Link>
    )
}

function CabecalhoPublico() {
    const [menuAberto, setMenuAberto] = useState(false)
    const { pathname, hash } = useLocation()

    useEffect(() => {
        if (!hash) {
            return
        }

        const id = decodeURIComponent(hash.slice(1))
        const alvo = document.getElementById(id)

        if (alvo) {
            requestAnimationFrame(() => alvo.scrollIntoView({ block: 'start' }))
        }
    }, [pathname, hash])

    function fecharMenu() {
        setMenuAberto(false)
    }

    return (
        <header className="publica-cabecalho">
            <Link className="publica-marca" to="/">
                <span className="publica-marca-icone">
                    <IconeFolha />
                </span>
                <span>AgroGestao</span>
            </Link>

            <nav className="publica-menu" aria-label="Principal">
                {MENU.map(([rotulo, ancora]) => (
                    <LinkMenu
                        aoClicar={fecharMenu}
                        ancora={ancora}
                        caminho={pathname}
                        key={ancora}
                    >
                        {rotulo}
                    </LinkMenu>
                ))}
            </nav>

            <div className="publica-acoes">
                <Link className="publica-entrar" to="/login">
                    Entrar
                </Link>

                <Link
                    className="publica-botao publica-botao-pequeno"
                    to="/cadastro"
                >
                    Quero conhecer
                </Link>

                <button
                    aria-expanded={menuAberto}
                    aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
                    className="publica-menu-mobile-botao"
                    onClick={() => setMenuAberto((valorAtual) => !valorAtual)}
                    type="button"
                >
                    {menuAberto ? <IconeFechar /> : <IconeMenu />}
                </button>
            </div>

            {menuAberto && (
                <nav className="publica-menu-mobile" aria-label="Menu mobile">
                    {MENU.map(([rotulo, ancora]) => (
                        <LinkMenu
                            aoClicar={fecharMenu}
                            ancora={ancora}
                            caminho={pathname}
                            key={ancora}
                        >
                            {rotulo}
                        </LinkMenu>
                    ))}
                </nav>
            )}
        </header>
    )
}

export default CabecalhoPublico
