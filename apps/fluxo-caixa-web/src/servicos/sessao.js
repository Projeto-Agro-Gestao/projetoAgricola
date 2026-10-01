const CHAVE_TOKEN = 'agrogestao_token'
const CHAVE_TIPO_TOKEN = 'agrogestao_tipo_token'
const CHAVE_USUARIO = 'agrogestao_usuario'
const CHAVE_EXPIRA_EM = 'agrogestao_token_expira_em'
const CHAVE_LEMBRAR_ACESSO = 'agrogestao_remember_access'
const CHAVE_EMAIL_LEMBRADO = 'agrogestao_remembered_email'
const CHAVE_EMAIL_LEMBRADO_LEGADO = 'agrogestao_email_lembrado'

const CHAVES_SESSAO = [
    CHAVE_TOKEN,
    CHAVE_TIPO_TOKEN,
    CHAVE_USUARIO,
    CHAVE_EXPIRA_EM,
]

export function limparSessao() {
    CHAVES_SESSAO.forEach((chave) => localStorage.removeItem(chave))
    sessionStorage.clear()
}

export function normalizarEmailLembrado(email) {
    return String(email ?? '').trim().toLowerCase()
}

export function salvarPreferenciaLembrarAcesso(email) {
    const emailNormalizado = normalizarEmailLembrado(email)

    if (!emailNormalizado) {
        limparPreferenciaLembrarAcesso()
        return
    }

    localStorage.setItem(CHAVE_LEMBRAR_ACESSO, 'true')
    localStorage.setItem(CHAVE_EMAIL_LEMBRADO, emailNormalizado)
    localStorage.removeItem(CHAVE_EMAIL_LEMBRADO_LEGADO)
}

export function limparPreferenciaLembrarAcesso() {
    localStorage.removeItem(CHAVE_LEMBRAR_ACESSO)
    localStorage.removeItem(CHAVE_EMAIL_LEMBRADO)
    localStorage.removeItem(CHAVE_EMAIL_LEMBRADO_LEGADO)
}

export function obterPreferenciaLembrarAcesso() {
    const lembrar =
        localStorage.getItem(CHAVE_LEMBRAR_ACESSO) === 'true'
    const emailAtual = localStorage.getItem(CHAVE_EMAIL_LEMBRADO)
    const emailLegado = localStorage.getItem(
        CHAVE_EMAIL_LEMBRADO_LEGADO,
    )
    const email = normalizarEmailLembrado(emailAtual || emailLegado)

    if (!lembrar && !email) {
        return {
            lembrar: false,
            email: '',
        }
    }

    if (email) {
        localStorage.setItem(CHAVE_LEMBRAR_ACESSO, 'true')
        localStorage.setItem(CHAVE_EMAIL_LEMBRADO, email)
        localStorage.removeItem(CHAVE_EMAIL_LEMBRADO_LEGADO)
    }

    return {
        lembrar: Boolean(email) || lembrar,
        email,
    }
}

export function obterSessao() {
    try {
        const token = localStorage.getItem(CHAVE_TOKEN)
        const tipoToken =
            localStorage.getItem(CHAVE_TIPO_TOKEN) ?? 'Bearer'
        const usuarioSalvo =
            localStorage.getItem(CHAVE_USUARIO)
        const expiraEm = Number(
            localStorage.getItem(CHAVE_EXPIRA_EM),
        )

        if (!token || !usuarioSalvo) {
            return null
        }

        if (expiraEm && Date.now() >= expiraEm) {
            limparSessao()
            return null
        }

        const usuario = JSON.parse(usuarioSalvo)

        return {
            token,
            tipoToken,
            usuario,
        }
    } catch {
        limparSessao()
        return null
    }
}

export function salvarSessao({
    token,
    tipoToken = 'Bearer',
    usuario,
    expiraEmSegundos,
}) {
    localStorage.setItem(CHAVE_TOKEN, token)
    localStorage.setItem(CHAVE_TIPO_TOKEN, tipoToken)
    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario))
    localStorage.setItem(
        CHAVE_EXPIRA_EM,
        String(
            Date.now() +
                Number(expiraEmSegundos ?? 3600) * 1000,
        ),
    )
}

export function atualizarUsuarioSessao(usuario) {
    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario))
}

export function montarCabecalhos(sessao, possuiCorpo = false) {
    const cabecalhos = {
        Authorization: `${sessao.tipoToken} ${sessao.token}`,
    }

    if (possuiCorpo) {
        cabecalhos['Content-Type'] =
            'application/json; charset=utf-8'
    }

    return cabecalhos
}
