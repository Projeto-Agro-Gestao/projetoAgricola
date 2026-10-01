import assert from 'node:assert/strict'

function criarStorage({ clearPermitido = true } = {}) {
    const dados = new Map()

    return {
        getItem(chave) {
            return dados.has(chave) ? dados.get(chave) : null
        },
        setItem(chave, valor) {
            dados.set(chave, String(valor))
        },
        removeItem(chave) {
            dados.delete(chave)
        },
        clear() {
            if (!clearPermitido) {
                throw new Error('localStorage.clear nao deve ser usado')
            }

            dados.clear()
        },
        key(indice) {
            return Array.from(dados.keys())[indice] ?? null
        },
        get length() {
            return dados.size
        },
        valores() {
            return Array.from(dados.values())
        },
    }
}

globalThis.localStorage = criarStorage({
    clearPermitido: false,
})
globalThis.sessionStorage = criarStorage()

const sessao = await import('../src/servicos/sessao.js')

sessao.salvarPreferenciaLembrarAcesso(' USER@Example.COM ')
assert.deepEqual(sessao.obterPreferenciaLembrarAcesso(), {
    lembrar: true,
    email: 'user@example.com',
})

sessao.salvarSessao({
    token: 'jwt-de-teste',
    tipoToken: 'Bearer',
    usuario: {
        id: 1,
        email: 'user@example.com',
    },
    expiraEmSegundos: 60,
})
sessao.limparSessao()
assert.deepEqual(sessao.obterPreferenciaLembrarAcesso(), {
    lembrar: true,
    email: 'user@example.com',
})

sessao.salvarSessao({
    token: 'jwt-expirado',
    usuario: {
        id: 1,
        email: 'user@example.com',
    },
    expiraEmSegundos: -1,
})
assert.equal(sessao.obterSessao(), null)
assert.deepEqual(sessao.obterPreferenciaLembrarAcesso(), {
    lembrar: true,
    email: 'user@example.com',
})

sessao.salvarPreferenciaLembrarAcesso('outro@example.com')
assert.deepEqual(sessao.obterPreferenciaLembrarAcesso(), {
    lembrar: true,
    email: 'outro@example.com',
})

sessao.limparPreferenciaLembrarAcesso()
assert.deepEqual(sessao.obterPreferenciaLembrarAcesso(), {
    lembrar: false,
    email: '',
})

sessao.salvarPreferenciaLembrarAcesso('seguro@example.com')
sessao.salvarSessao({
    token: 'jwt-seguro',
    usuario: {
        id: 2,
        email: 'seguro@example.com',
    },
    expiraEmSegundos: 60,
})

assert.equal(
    localStorage.valores().some((valor) => valor.includes('senha-secreta')),
    false,
)

console.log('test:remember ok')
