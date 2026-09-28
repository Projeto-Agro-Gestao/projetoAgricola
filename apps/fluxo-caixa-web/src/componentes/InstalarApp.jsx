import {
    useEffect,
    useRef,
    useState,
} from 'react'
import './InstalarApp.css'

const CHAVE_DISPENSA = 'agrogestao_instalacao_dispensada_em'
const DIAS_PARA_REEXIBIR = 7

function estaEmModoApp() {
    if (typeof window === 'undefined') {
        return false
    }

    return (
        window.matchMedia?.(
            '(display-mode: standalone)',
        ).matches === true
        || window.navigator.standalone === true
    )
}

function ehIos() {
    if (typeof navigator === 'undefined') {
        return false
    }

    const agente = navigator.userAgent

    const ipadComTouch =
        /Macintosh/.test(agente)
        && navigator.maxTouchPoints > 1

    return (
        /iPad|iPhone|iPod/.test(agente)
        || ipadComTouch
    )
}

function dispensadoRecentemente() {
    try {
        const instante = Number(
            localStorage.getItem(CHAVE_DISPENSA),
        )

        if (!instante) {
            return false
        }

        const diasDecorridos =
            (Date.now() - instante)
            / (1000 * 60 * 60 * 24)

        return diasDecorridos < DIAS_PARA_REEXIBIR
    } catch {
        return false
    }
}

function InstalarApp() {
    const [eventoInstalacao, setEventoInstalacao] =
        useState(null)

    const [visivel, setVisivel] =
        useState(false)

    const [modoIos, setModoIos] =
        useState(false)

    const botaoRef =
        useRef(null)

    useEffect(() => {
        if (
            estaEmModoApp()
            || dispensadoRecentemente()
        ) {
            return undefined
        }

        function aoPoderInstalar(evento) {
            evento.preventDefault()
            setEventoInstalacao(evento)
            setModoIos(false)
            setVisivel(true)
        }

        function aoInstalar() {
            setEventoInstalacao(null)
            setVisivel(false)
        }

        window.addEventListener(
            'beforeinstallprompt',
            aoPoderInstalar,
        )

        window.addEventListener(
            'appinstalled',
            aoInstalar,
        )

        let temporizador

        if (ehIos()) {
            temporizador = window.setTimeout(() => {
                setModoIos(true)
                setVisivel(true)
            }, 3500)
        }

        return () => {
            window.removeEventListener(
                'beforeinstallprompt',
                aoPoderInstalar,
            )

            window.removeEventListener(
                'appinstalled',
                aoInstalar,
            )

            if (temporizador) {
                window.clearTimeout(temporizador)
            }
        }
    }, [])

    useEffect(() => {
        if (!visivel) {
            return undefined
        }

        function aoTeclar(evento) {
            if (evento.key === 'Escape') {
                dispensar()
            }
        }

        document.addEventListener('keydown', aoTeclar)

        botaoRef.current?.focus()

        return () =>
            document.removeEventListener(
                'keydown',
                aoTeclar,
            )
    }, [visivel])

    function dispensar() {
        setVisivel(false)

        try {
            localStorage.setItem(
                CHAVE_DISPENSA,
                String(Date.now()),
            )
        } catch {
            // Armazenamento indisponível: apenas fecha.
        }
    }

    async function instalar() {
        if (!eventoInstalacao) {
            return
        }

        eventoInstalacao.prompt()

        const escolha =
            await eventoInstalacao.userChoice

        setEventoInstalacao(null)

        if (escolha?.outcome === 'accepted') {
            setVisivel(false)
            return
        }

        dispensar()
    }

    if (!visivel) {
        return null
    }

    return (
        <div
            className="instalar-app-fundo"
            onClick={dispensar}
        >
            <div
                aria-describedby="instalar-app-texto"
                aria-labelledby="instalar-app-titulo"
                aria-modal="true"
                className="instalar-app"
                onClick={(evento) =>
                    evento.stopPropagation()
                }
                role="dialog"
            >
                <button
                    aria-label="Fechar"
                    className="instalar-app-fechar"
                    onClick={dispensar}
                    type="button"
                >
                    ×
                </button>

                <img
                    alt=""
                    aria-hidden="true"
                    className="instalar-app-icone"
                    height="56"
                    src="/pwa-icon.svg"
                    width="56"
                />

                <h2 id="instalar-app-titulo">
                    Instale o AgroGestão
                </h2>

                <p id="instalar-app-texto">
                    {modoIos
                        ? 'Toque em Compartilhar e escolha "Adicionar à Tela de Início" para usar como app.'
                        : 'Acesse mais rápido pela tela inicial e use como um aplicativo.'}
                </p>

                {modoIos ? (
                    <button
                        className="instalar-app-botao"
                        onClick={dispensar}
                        ref={botaoRef}
                        type="button"
                    >
                        Entendi
                    </button>
                ) : (
                    <button
                        className="instalar-app-botao"
                        onClick={instalar}
                        ref={botaoRef}
                        type="button"
                    >
                        Instalar agora
                    </button>
                )}

                <button
                    className="instalar-app-depois"
                    onClick={dispensar}
                    type="button"
                >
                    Agora não
                </button>
            </div>
        </div>
    )
}

export default InstalarApp
