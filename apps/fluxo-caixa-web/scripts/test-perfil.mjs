import assert from 'node:assert/strict'
import { criarAtualizacaoPerfil } from '../src/servicos/perfil.js'

const original = {
    nomeEmpresa: 'Propriedade', nome: 'Responsavel', email: 'teste@example.test',
    telefone: '', agriculturaAtiva: true, pecuariaAtiva: false,
    documentoPagamento: 'LEGADO-1', cepCobranca: '88813600', ruaCobranca: 'Rua antiga',
    numeroCobranca: '10', bairroCobranca: 'Centro', cidadeCobranca: 'Criciuma', estadoCobranca: 'SC',
}
const telefone = criarAtualizacaoPerfil({ ...original, telefone: '48999999999' }, original)
assert.equal(telefone.telefone, '48999999999')
assert.equal('documentoPagamento' in telefone, false)
assert.equal('ruaCobranca' in telefone, false)
assert.equal('email' in telefone, false)
assert.equal('papel' in telefone, false)
assert.equal(criarAtualizacaoPerfil({ ...original, documentoPagamento: '52998224725' }, original)
    .documentoPagamento, '52998224725')
assert.equal(criarAtualizacaoPerfil({ ...original, ruaCobranca: '' }, original).ruaCobranca, '')
assert.deepEqual(original.documentoPagamento, 'LEGADO-1')
console.log('Perfil: telefone, dados legados, alteracao e limpeza de cobranca verificados.')
