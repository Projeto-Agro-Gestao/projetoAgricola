function Base({ size = 18, children, ...props }) {
    return (
        <svg
            aria-hidden="true"
            fill="none"
            height={size}
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width={size}
            {...props}
        >
            {children}
        </svg>
    )
}

export function IconeSetaEsquerda(props) {
    return (
        <Base {...props}>
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
        </Base>
    )
}

export function IconeSetaDireita(props) {
    return (
        <Base {...props}>
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </Base>
    )
}

export function IconeSetaBaixo(props) {
    return (
        <Base {...props}>
            <path d="M12 5v14" />
            <path d="m19 12-7 7-7-7" />
        </Base>
    )
}

export function IconeSetaCima(props) {
    return (
        <Base {...props}>
            <path d="M12 19V5" />
            <path d="m5 12 7-7 7 7" />
        </Base>
    )
}

export function IconeSetaDiagonal(props) {
    return (
        <Base {...props}>
            <path d="M7 17 17 7" />
            <path d="M7 7h10v10" />
        </Base>
    )
}

export function IconeMais(props) {
    return (
        <Base {...props}>
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </Base>
    )
}

export function IconeMenos(props) {
    return (
        <Base {...props}>
            <path d="M5 12h14" />
        </Base>
    )
}

export function IconeLixeira(props) {
    return (
        <Base {...props}>
            <path d="M3 6h18" />
            <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
        </Base>
    )
}

export function IconePlanilha(props) {
    return (
        <Base {...props}>
            <rect height="18" rx="2" width="18" x="3" y="3" />
            <path d="M3 9h18" />
            <path d="M3 15h18" />
            <path d="M9 3v18" />
            <path d="M15 3v18" />
        </Base>
    )
}

export function IconeDocumento(props) {
    return (
        <Base {...props}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M9 13h6" />
            <path d="M9 17h6" />
        </Base>
    )
}

export function IconeFechar(props) {
    return (
        <Base {...props}>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </Base>
    )
}

export function IconeCheck(props) {
    return (
        <Base {...props}>
            <path d="M20 6 9 17l-5-5" />
        </Base>
    )
}

export function IconeAlerta(props) {
    return (
        <Base {...props}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5" />
            <path d="M12 16h.01" />
        </Base>
    )
}

export function IconeInfo(props) {
    return (
        <Base {...props}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5" />
            <path d="M12 8h.01" />
        </Base>
    )
}

export function IconeMenu(props) {
    return (
        <Base {...props}>
            <path d="M4 6h16" />
            <path d="M4 12h16" />
            <path d="M4 18h16" />
        </Base>
    )
}

export function IconeLista(props) {
    return (
        <Base {...props}>
            <path d="M8 6h13" />
            <path d="M8 12h13" />
            <path d="M8 18h13" />
            <path d="M3 6h.01" />
            <path d="M3 12h.01" />
            <path d="M3 18h.01" />
        </Base>
    )
}

export function IconeCategoria(props) {
    return (
        <Base {...props}>
            <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
            <circle cx="7.5" cy="7.5" r=".5" />
        </Base>
    )
}

export function IconeFolha(props) {
    return (
        <Base {...props}>
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6" />
        </Base>
    )
}

export function IconeOlho(props) {
    return (
        <Base {...props}>
            <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
            <circle cx="12" cy="12" r="3" />
        </Base>
    )
}

export function IconeOlhoFechado(props) {
    return (
        <Base {...props}>
            <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
            <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
            <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
            <path d="m2 2 20 20" />
        </Base>
    )
}

export function IconeAlvo(props) {
    return (
        <Base {...props}>
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="3" />
        </Base>
    )
}

export function IconeRelogio(props) {
    return (
        <Base {...props}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
        </Base>
    )
}

export function IconeCalendario(props) {
    return (
        <Base {...props}>
            <rect height="18" rx="2" width="18" x="3" y="4" />
            <path d="M3 10h18" />
            <path d="M8 2v4" />
            <path d="M16 2v4" />
        </Base>
    )
}

export function IconeExpandir(props) {
    return (
        <Base {...props}>
            <path d="M8 3H5a2 2 0 0 0-2 2v3" />
            <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
            <path d="M3 16v3a2 2 0 0 0 2 2h3" />
            <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
        </Base>
    )
}

export function IconeTransferir(props) {
    return (
        <Base {...props}>
            <path d="M7 4v13" />
            <path d="m3 8 4-4 4 4" />
            <path d="M17 20V7" />
            <path d="m13 16 4 4 4-4" />
        </Base>
    )
}

export function IconePata(props) {
    return (
        <Base {...props}>
            <circle cx="11" cy="4" r="2" />
            <circle cx="18" cy="8" r="2" />
            <circle cx="20" cy="16" r="2" />
            <circle cx="4" cy="16" r="2" />
            <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" />
        </Base>
    )
}

export function IconeCamadas(props) {
    return (
        <Base {...props}>
            <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
            <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
            <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
        </Base>
    )
}

export function IconeChat(props) {
    return (
        <Base {...props}>
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </Base>
    )
}

export function IconeEmail(props) {
    return (
        <Base {...props}>
            <rect height="16" rx="2" width="20" x="2" y="4" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </Base>
    )
}

export function IconeFoto(props) {
    return (
        <Base {...props}>
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
        </Base>
    )
}

export function IconeEngrenagem(props) {
    return (
        <Base {...props}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </Base>
    )
}
