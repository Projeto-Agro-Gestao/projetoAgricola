import { CONFIG } from '../config.js'

export async function obterSessaoDemo() {
    if (!CONFIG.email || !CONFIG.senha) {
        throw new Error(
            'Defina VIDEO_EMAIL e VIDEO_SENHA em videos/.env.',
        )
    }

    const resposta = await fetch(`${CONFIG.apiURL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: CONFIG.email,
            senha: CONFIG.senha,
        }),
    })

    if (!resposta.ok) {
        throw new Error(
            `Login da conta demo falhou (HTTP ${resposta.status}).`,
        )
    }

    return resposta.json()
}

export async function injetarSessao(contexto) {
    const dados = await obterSessaoDemo()

    const expiraEm =
        Date.now() +
        Number(dados.expiraEmSegundos ?? 3600) * 1000

    await contexto.addInitScript(
        (sessao) => {
            localStorage.setItem(
                'agrogestao_token',
                sessao.token,
            )
            localStorage.setItem(
                'agrogestao_tipo_token',
                sessao.tipo ?? 'Bearer',
            )
            localStorage.setItem(
                'agrogestao_usuario',
                JSON.stringify(sessao.usuario),
            )
            localStorage.setItem(
                'agrogestao_token_expira_em',
                String(sessao.expiraEm),
            )
        },
        {
            token: dados.token,
            tipo: dados.tipo,
            usuario: dados.usuario,
            expiraEm,
        },
    )

    return dados
}
