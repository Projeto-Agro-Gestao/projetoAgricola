import { useEffect, useState } from 'react'
import {
    Link,
    useLocation,
} from 'react-router'
import MarcaAgro from './MarcaAgro.jsx'
import '../App.css'

const MENU = [
    ['Início', 'inicio'],
    ['Para produtores', 'produtores'],
    ['Para contadores', 'contadores'],
    ['Recursos', 'recursos'],
    ['FAQ', 'faq'],
]

// Âncoras que existem como seções na página (inicio = topo).
const SECOES = ['produtores', 'contadores', 'recursos', 'faq']

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

function LinkMenu({ ancora, caminho, ativo, aoClicar, children }) {
    const destino = ancora === 'inicio' ? '' : `#${ancora}`
    const classe = ativo ? 'ag-nav-ativo' : undefined

    if (caminho === '/') {
        return (
            <a
                aria-current={ativo ? 'true' : undefined}
                className={classe}
                href={ancora === 'inicio' ? '#' : destino}
                onClick={aoClicar}
            >
                {children}
            </a>
        )
    }

    return (
        <Link
            aria-current={ativo ? 'true' : undefined}
            className={classe}
            onClick={aoClicar}
            to={`/${destino}`}
        >
            {children}
        </Link>
    )
}

function CabecalhoPublico() {
    const [menuAberto, setMenuAberto] = useState(false)
    const [ativo, setAtivo] = useState('inicio')
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

    // Marca o item da seção visível na tela (scroll spy).
    useEffect(() => {
        if (pathname !== '/') {
            return undefined
        }

        const alvos = SECOES
            .map((id) => document.getElementById(id))
            .filter(Boolean)

        if (alvos.length === 0) {
            return undefined
        }

        const observador = new IntersectionObserver(
            (entradas) => {
                const visivel = entradas
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

                if (visivel) {
                    setAtivo(visivel.target.id)
                } else if (window.scrollY < 200) {
                    setAtivo('inicio')
                }
            },
            { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
        )

        alvos.forEach((alvo) => observador.observe(alvo))

        return () => observador.disconnect()
    }, [pathname])

    function fecharMenu() {
        setMenuAberto(false)
    }

    function aoClicarItem(ancora) {
        setAtivo(ancora)
        fecharMenu()
    }

    return (
        <header className="ag-cabecalho">
            <div className="ag-cabecalho-interno">
                <MarcaAgro to="/" />

                <nav aria-label="Principal" className="ag-nav">
                    {MENU.map(([rotulo, ancora]) => (
                        <LinkMenu
                            ancora={ancora}
                            aoClicar={() => aoClicarItem(ancora)}
                            ativo={ativo === ancora}
                            caminho={pathname}
                            key={ancora}
                        >
                            {rotulo}
                        </LinkMenu>
                    ))}
                </nav>

                <div className="ag-cabecalho-acoes">
                    <Link className="ag-botao ag-botao-primario ag-botao-pequeno" to="/cadastro">
                        Quero conhecer
                    </Link>
                    <Link className="ag-entrar" to="/login">
                        Entrar
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
                            ancora={ancora}
                            aoClicar={() => aoClicarItem(ancora)}
                            ativo={ativo === ancora}
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
