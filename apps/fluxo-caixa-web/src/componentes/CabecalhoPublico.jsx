import { useEffect, useState } from 'react'
import {
    Link,
    useLocation,
} from 'react-router'
import '../App.css'

const MENU = [
    ['Início', 'inicio'],
    ['Para produtores', 'produtores'],
    ['Para contadores', 'contadores'],
    ['Recursos', 'recursos'],
    ['FAQ', 'faq'],
]

function Simbolo({ nome, tamanho }) {
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

function LinkMenu({ ancora, caminho, aoClicar, children }) {
    const destino = ancora === 'inicio' ? '' : `#${ancora}`

    if (caminho === '/') {
        return (
            <a href={ancora === 'inicio' ? '#' : destino} onClick={aoClicar}>
                {children}
            </a>
        )
    }

    return (
        <Link onClick={aoClicar} to={`/${destino}`}>
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
        <header className="ag-cabecalho">
            <div className="ag-cabecalho-interno">
                <Link className="ag-marca" to="/">
                    <span className="ag-marca-icone">
                        <Simbolo nome="eco" tamanho={22} />
                    </span>
                    <span className="ag-marca-nome">Agro Gestão</span>
                </Link>

                <nav className="ag-nav" aria-label="Principal">
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

                <div className="ag-cabecalho-acoes">
                    <Link className="ag-entrar" to="/login">
                        Entrar
                    </Link>
                    <Link className="ag-botao ag-botao-primario ag-botao-pequeno" to="/cadastro">
                        Quero conhecer
                    </Link>

                    <button
                        aria-expanded={menuAberto}
                        aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
                        className="ag-menu-mobile-botao"
                        onClick={() => setMenuAberto((valor) => !valor)}
                        type="button"
                    >
                        <Simbolo nome={menuAberto ? 'close' : 'menu'} tamanho={24} />
                    </button>
                </div>
            </div>

            {menuAberto && (
                <nav className="ag-menu-mobile" aria-label="Menu mobile">
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
                    <Link className="ag-botao ag-botao-primario" onClick={fecharMenu} to="/cadastro">
                        Quero conhecer
                    </Link>
                </nav>
            )}
        </header>
    )
}

export default CabecalhoPublico
