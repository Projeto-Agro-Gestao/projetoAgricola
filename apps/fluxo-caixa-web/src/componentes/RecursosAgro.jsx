import { useState } from 'react'

const moeda = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export default function RecursosAgro({ requisitar, empresa, safras, operacoes, podeEscrever, podeEditar = () => podeEscrever }) {
    const [dados, setDados] = useState({ insumos: [], estoque: [], contratos: [], extrato: [] })
    const [mensagem, setMensagem] = useState('')
    const [erro, setErro] = useState('')
    const [ocupado, setOcupado] = useState(false)
    const [chave, setChave] = useState(() => crypto.randomUUID())
    const [linha, setLinha] = useState('')
    const [sugestoes, setSugestoes] = useState([])
    const base = `empresas/${empresa}/agricola`
    async function carregar() {
        const recursos = ['insumos', 'estoque', 'contratos', 'extrato']
        const respostas = await Promise.allSettled(recursos.map(r => requisitar(`${base}/${r}`)))
        setDados(Object.fromEntries(recursos.map((r, i) => [r, respostas[i].status === 'fulfilled' ? respostas[i].value : []])))
        if (respostas.some(r => r.status === 'rejected')) setErro('Alguns recursos não estão disponíveis para seu perfil. As listas exibem somente os módulos autorizados que puderam ser consultados.')
    }
    async function executar(acao) {
        if (ocupado) return
        setOcupado(true); setErro(''); setMensagem('')
        try { await acao() } catch (e) { setErro(e.message) } finally { setOcupado(false) }
    }
    async function salvar(e, recurso) {
        e.preventDefault()
        const form = e.currentTarget
        const r = Object.fromEntries(new FormData(form))
        await executar(async () => {
            for (const campo of ['insumoId', 'operacaoId', 'quantidade', 'safraId', 'quantidadeKg', 'precoKg', 'comissaoPercentual']) if (campo in r) r[campo] = r[campo] ? Number(r[campo]) : null
            if (recurso === 'estoque') r.chave = chave
            await requisitar(`${base}/${recurso}`, { method: 'POST', body: JSON.stringify(r) })
            form.reset(); setChave(crypto.randomUUID()); setMensagem('Registro salvo.'); await carregar()
        })
    }
    async function importar(e) {
        e.preventDefault()
        const r = Object.fromEntries(new FormData(e.currentTarget))
        await executar(async () => {
            const rows = r.csv.trim().split(/\r?\n/)
            if (rows.shift() !== 'referencia;data;descricao;valor') throw new Error('Use o cabeçalho referencia;data;descricao;valor e valores com ponto decimal.')
            if (!rows.length || rows.length > 500) throw new Error('Importe entre 1 e 500 linhas.')
            const linhas = rows.map((row, i) => {
                const c = row.split(';')
                if (c.length !== 4 || !/^-?\d+(\.\d{1,2})?$/.test(c[3]) || !/^\d{4}-\d{2}-\d{2}$/.test(c[1])) throw new Error(`Linha ${i + 2} inválida. Não use separadores dentro dos campos.`)
                return { referencia: c[0], data: c[1], descricao: c[2], valor: Number(c[3]) }
            })
            const resposta = await requisitar(`${base}/extrato`, { method: 'POST', body: JSON.stringify({ conta: r.conta, linhas }) })
            setMensagem(`${resposta.importadas} linhas importadas. Referências repetidas foram preservadas.`); await carregar()
        })
    }
    async function escolherLinha(id) {
        setLinha(id); setSugestoes([])
        if (id) await executar(async () => setSugestoes(await requisitar(`${base}/extrato/${id}/sugestoes`)))
    }
    async function conciliar(e) {
        e.preventDefault()
        const id = Number(new FormData(e.currentTarget).get('movimentacaoId'))
        await executar(async () => {
            await requisitar(`${base}/extrato/${linha}/conciliar`, { method: 'POST', body: JSON.stringify({ movimentacaoId: id }) })
            setMensagem('Conciliação confirmada.'); setLinha(''); setSugestoes([]); await carregar()
        })
    }
    return <section><h2>Estoque, contratos e conciliação</h2><button type="button" disabled={ocupado} onClick={() => executar(carregar)}>Carregar registros</button>
        {erro && <p role="alert" className="agri-erro">{erro}</p>}{mensagem && <p role="status" className="agri-sucesso">{mensagem}</p>}
        {podeEditar('FINANCEIRO') && <details><summary>Importar arquivo OFX bancário</summary><form onSubmit={e => { e.preventDefault(); const arquivo = new FormData(e.currentTarget); executar(async () => { const resultado = await requisitar(`${base}/extrato/ofx`, { method: 'POST', body: arquivo }); setMensagem(`${resultado.importadas} lançamentos OFX importados.`); await carregar() }) }}><fieldset disabled={ocupado}><label>Extrato OFX (até 2 MB, até 500 lançamentos)<input type="file" name="arquivo" accept=".ofx,application/x-ofx" required /></label><button>Importar OFX</button></fieldset></form></details>}
        <div className="agri-formularios"><div><h3>Insumos e combustível</h3><ul>{dados.insumos.map(i => <li key={i.id}>{i.nome} · {i.tipo} · saldo {i.saldo} {i.unidade}</li>)}</ul>
            {podeEditar('ESTOQUE') && <><details><summary>Cadastrar insumo</summary><form onSubmit={e => salvar(e, 'insumos')}><fieldset disabled={ocupado}><label>Nome<input name="nome" maxLength={120} required /></label><label>Tipo<select name="tipo">{['SEMENTE', 'DEFENSIVO', 'FERTILIZANTE', 'COMBUSTIVEL', 'OUTRO'].map(t => <option key={t}>{t}</option>)}</select></label><label>Unidade<input name="unidade" maxLength={20} placeholder="kg, L ou unidade" required /></label><button>Salvar insumo</button></fieldset></form></details>
            <details><summary>Registrar entrada ou aplicação</summary><form onSubmit={e => salvar(e, 'estoque')}><fieldset disabled={ocupado}><label>Insumo<select name="insumoId" required><option value="">Selecione</option>{dados.insumos.map(i => <option key={i.id} value={i.id}>{i.nome} ({i.unidade})</option>)}</select></label><label>Tipo<select name="tipo"><option>ENTRADA</option><option>SAIDA</option></select></label><label>Operação (obrigatória para saída)<select name="operacaoId"><option value="">Sem operação</option>{operacoes.map(o => <option key={o.id} value={o.id}>#{o.id} {o.descricao} · {o.safra}</option>)}</select></label><label>Quantidade na unidade do insumo<input name="quantidade" type="number" step="0.0001" min="0.0001" required /></label><label>Data<input name="data" type="date" required /></label><label>Observação / lote<input name="observacao" maxLength={300} required /></label><p>Registre os custos na operação agrícola correspondente para alimentar o financeiro.</p><button>Salvar movimentação de estoque</button></fieldset></form></details></>}
            <details><summary>Histórico de estoque</summary><ul>{dados.estoque.map(e => <li key={e.id}>{e.data_registro} · {e.nome} · {e.tipo} {e.quantidade} {e.unidade} · operação {e.operacao_id || '—'}</li>)}</ul></details>
        </div><div><h3>Contratos agrícolas</h3><p>Valores e comissões são previstos. Recebimentos e pagamentos efetivos devem ser registrados no financeiro.</p><ul>{dados.contratos.map(c => <li key={c.id}>#{c.numero} · {c.contraparte} · {c.safra} · {c.quantidade_kg} kg · {moeda(c.valor_previsto)} · comissão prevista {moeda(c.comissao_prevista)} · vencimento {c.vencimento}</li>)}</ul>
            {podeEditar('CONTRATOS') && <details><summary>Registrar contrato</summary><form onSubmit={e => salvar(e, 'contratos')}><fieldset disabled={ocupado}><label>Safra<select name="safraId" required><option value="">Selecione</option>{safras.map(s => <option key={s.id} value={s.id}>{s.nome} · {s.talhao}</option>)}</select></label><label>Número<input name="numero" maxLength={80} required /></label><label>Contraparte<input name="contraparte" maxLength={150} required /></label><label>Quantidade (kg)<input name="quantidadeKg" type="number" min="0.001" step="0.001" required /></label><label>Preço por kg (R$)<input name="precoKg" type="number" min="0.0001" step="0.0001" required /></label><label>Comissão (%)<input name="comissaoPercentual" type="number" min="0" max="100" step="0.0001" defaultValue="0" required /></label><label>Vencimento<input name="vencimento" type="date" required /></label><button>Salvar contrato</button></fieldset></form></details>}
        </div><div><h3>Conciliação bancária</h3><p>Importe o extrato em CSV normalizado. Valores positivos representam entradas; negativos, saídas. A importação não cria novas receitas ou despesas.</p>
            {podeEditar('FINANCEIRO') && <><details><summary>Importar CSV normalizado</summary><form onSubmit={importar}><fieldset disabled={ocupado}><label>Identificação da conta<input name="conta" maxLength={100} required /></label><label>Conteúdo CSV<textarea name="csv" rows={7} placeholder="referencia;data;descricao;valor" required /></label><p>Cabeçalho: referencia;data;descricao;valor. Datas AAAA-MM-DD, ponto decimal, sem aspas ou ponto e vírgula nos campos. Use uma referência bancária única em cada linha.</p><button>Importar extrato</button></fieldset></form></details>
            <label>Lançamento para conciliar<select disabled={ocupado} value={linha} onChange={e => escolherLinha(e.target.value)}><option value="">Selecione</option>{dados.extrato.filter(e => !e.movimentacao_id).map(e => <option key={e.id} value={e.id}>{e.data_registro} {e.descricao} {moeda(e.valor)}</option>)}</select></label>
            {linha && <form onSubmit={conciliar}><fieldset disabled={ocupado}><label>Movimentação compatível<select name="movimentacaoId" required><option value="">Selecione</option>{sugestoes.map(m => <option key={m.id} value={m.id}>#{m.id} {m.descricao} {moeda(m.valor)}</option>)}</select></label>{!sugestoes.length && <p>Nenhuma movimentação disponível com data, valor e tipo coincidentes.</p>}<button disabled={!sugestoes.length}>Confirmar conciliação</button></fieldset></form>}</>}
            <ul>{dados.extrato.map(e => <li key={e.id}>{e.data_registro} · {e.conta} · {e.descricao} · {moeda(e.valor)} · {e.movimentacao_excluida ? 'Revisar: movimentação excluída' : e.movimentacao_id ? `Conciliado #${e.movimentacao_id}` : 'Pendente'}</li>)}</ul>
        </div></div>
    </section>
}
