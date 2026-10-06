import { API_LOGOUT_URL, API_REFRESH_URL } from '../config.js'
import {
    limparSessao,
    montarCabecalhos,
    obterSessao,
    salvarSessao,
} from './sessao.js'

// Coalescencia intra-aba (variavel de modulo): N chamadas que tomam 401 ao
// mesmo tempo compartilham a MESMA promise -> um unico POST /refresh.
let refreshEmAndamento = null

function garantirRefresh(fetchImpl) {
    if (!refreshEmAndamento) {
        refreshEmAndamento = fetchImpl(API_REFRESH_URL, {
            method: 'POST',
            credentials: 'include',
        })
            .then((r) => (r.ok ? r.json() : Promise.reject(r)))
            .finally(() => {
                refreshEmAndamento = null
            })
    }

    return refreshEmAndamento
}

function montarHeaders(auth, sessao, corpoJson) {
    if (auth && sessao) {
        return montarCabecalhos(sessao, corpoJson)
    }

    return corpoJson
        ? { 'Content-Type': 'application/json; charset=utf-8' }
        : {}
}

export async function apiFetch(
    url,
    { method = 'GET', body, auth = true } = {},
    fetchImpl = globalThis.fetch,
) {
    // FormData segue cru (o navegador define o multipart boundary); objeto -> JSON;
    // string -> repassada; sem corpo -> sem Content-Type.
    const ehFormData =
        typeof FormData !== 'undefined' && body instanceof FormData
    const corpo =
        body == null
            ? undefined
            : ehFormData || typeof body === 'string'
                ? body
                : JSON.stringify(body)
    const corpoJson = corpo != null && !ehFormData

    const sessao = obterSessao()

    const resposta = await fetchImpl(url, {
        method,
        headers: montarHeaders(auth, sessao, corpoJson),
        body: corpo,
        credentials: 'include',
    })

    if (resposta.status !== 401) {
        return resposta
    }

    try {
        const dados = await garantirRefresh(fetchImpl)
        // /refresh devolve EntrarResponse: o tipo do token vem no campo `tipo`
        // (nao `tipoToken`), igual ao mapeamento de Login/Cadastro.
        salvarSessao({
            token: dados.token,
            tipoToken: dados.tipo ?? 'Bearer',
            usuario: dados.usuario,
            expiraEmSegundos: dados.expiraEmSegundos,
        })
    } catch {
        limparSessao()
        window.location.assign('/login')
        return resposta
    }

    const sessaoNova = obterSessao()

    return fetchImpl(url, {
        method,
        headers: montarHeaders(auth, sessaoNova, corpoJson),
        body: corpo,
        credentials: 'include',
    })
}

export async function logout(fetchImpl = globalThis.fetch) {
    try {
        await fetchImpl(API_LOGOUT_URL, {
            method: 'POST',
            credentials: 'include',
        })
    } finally {
        limparSessao()
    }
}
