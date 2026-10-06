import assert from 'node:assert/strict'

// Shims minimos de browser para rodar api.js/sessao.js sob node (sem framework).
function criarLocalStorage() {
    const mapa = new Map()
    return {
        getItem: (k) => (mapa.has(k) ? mapa.get(k) : null),
        setItem: (k, v) => mapa.set(k, String(v)),
        removeItem: (k) => mapa.delete(k),
        clear: () => mapa.clear(),
        _mapa: mapa,
    }
}

let redirecionadoPara = null
globalThis.localStorage = criarLocalStorage()
globalThis.sessionStorage = criarLocalStorage()
globalThis.window = {
    location: { assign: (destino) => { redirecionadoPara = destino } },
}

const { apiFetch } = await import('../src/servicos/api.js')
const { salvarSessao, obterSessao } = await import('../src/servicos/sessao.js')
const { API_REFRESH_URL } = await import('../src/config.js')

function resposta(status, corpo) {
    return new Response(corpo == null ? null : JSON.stringify(corpo), { status })
}

function semSessao() {
    globalThis.localStorage.clear()
    redirecionadoPara = null
}

// --- CA-14: salvarSessao sem expiracao nao aplica o antigo fallback de 3600s ---
{
    semSessao()
    salvarSessao({ token: 't', tipoToken: 'Bearer', usuario: { id: 1 } })
    assert.equal(
        globalThis.localStorage.getItem('agrogestao_token_expira_em'),
        null,
        'CA-14: sem expiraEmSegundos nao deve gravar expiracao',
    )
    // E uma expiracao anterior nao pode persistir mentindo.
    salvarSessao({ token: 't', usuario: { id: 1 }, expiraEmSegundos: 900 })
    assert.ok(globalThis.localStorage.getItem('agrogestao_token_expira_em'))
    salvarSessao({ token: 't', usuario: { id: 1 }, expiraEmSegundos: undefined })
    assert.equal(
        globalThis.localStorage.getItem('agrogestao_token_expira_em'),
        null,
        'CA-14: expiracao obsoleta deve ser removida',
    )
    assert.ok(obterSessao(), 'sessao sem expiracao continua valida (confia no 401 do backend)')
}

// --- CA-11: 401 -> UM refresh -> retry; sucesso refaz e passa ---
{
    semSessao()
    salvarSessao({ token: 'velho', usuario: { id: 1 }, expiraEmSegundos: 900 })
    let refreshes = 0
    const chamadas = []
    const fetchMock = async (url, req) => {
        chamadas.push({ url, req })
        if (url === API_REFRESH_URL) {
            refreshes++
            return resposta(200, {
                token: 'novo', tipo: 'Bearer', usuario: { id: 1 }, expiraEmSegundos: 900,
            })
        }
        // Primeira chamada ao recurso: 401; apos refresh (Authorization novo): 200.
        const auth = req.headers.Authorization
        return resposta(auth === 'Bearer novo' ? 200 : 401, { ok: true })
    }
    const r = await apiFetch('/recurso', {}, fetchMock)
    assert.equal(r.status, 200, 'CA-11: retry apos refresh deve passar')
    assert.equal(refreshes, 1, 'CA-11: exatamente um refresh')
    assert.equal(chamadas.length, 3, 'CA-11: recurso(401) + refresh + recurso(retry)')
    assert.equal(obterSessao().token, 'novo', 'CA-11: sessao salva com o token novo')
}

// --- CA-11: refresh falha -> limparSessao + redirect /login ---
{
    semSessao()
    salvarSessao({ token: 'velho', usuario: { id: 1 }, expiraEmSegundos: 900 })
    const fetchMock = async (url) => {
        if (url === API_REFRESH_URL) return resposta(401)
        return resposta(401, { ok: false })
    }
    const r = await apiFetch('/recurso', {}, fetchMock)
    assert.equal(r.status, 401, 'CA-11: 401 propagado quando refresh falha')
    assert.equal(obterSessao(), null, 'CA-11: limparSessao() apagou a sessao')
    assert.equal(redirecionadoPara, '/login', 'CA-11: redirect para /login')
}

// --- CA-12: N 401 concorrentes -> um unico POST /refresh (coalescencia) ---
{
    semSessao()
    salvarSessao({ token: 'velho', usuario: { id: 1 }, expiraEmSegundos: 900 })
    let refreshes = 0
    let resolverRefresh
    const refreshPendente = new Promise((res) => { resolverRefresh = res })
    const fetchMock = async (url, req) => {
        if (url === API_REFRESH_URL) {
            refreshes++
            await refreshPendente // segura a janela para forcar concorrencia
            return resposta(200, {
                token: 'novo', tipo: 'Bearer', usuario: { id: 1 }, expiraEmSegundos: 900,
            })
        }
        return resposta(req.headers.Authorization === 'Bearer novo' ? 200 : 401, {})
    }
    const n = 5
    const lote = Array.from({ length: n }, () => apiFetch('/recurso', {}, fetchMock))
    await new Promise((r) => setTimeout(r, 10)) // deixa os 5 chegarem no 401/refresh
    resolverRefresh()
    const resultados = await Promise.all(lote)
    assert.ok(resultados.every((r) => r.status === 200), 'CA-12: todas passam no retry')
    assert.equal(refreshes, 1, 'CA-12: um unico /refresh para N 401 concorrentes')
}

console.log('test:api ok: CA-11 (refresh+retry e falha->logout), CA-12 (coalescencia), CA-14 (sem fallback 3600)')
