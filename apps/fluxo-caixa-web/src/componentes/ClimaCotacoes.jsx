import { useState } from 'react'

export default function ClimaCotacoes({ propriedades, requisitar, empresa, podeEscrever, podeEditar = () => podeEscrever }) {
    const [propriedade, setPropriedade] = useState('')
    const [clima, setClima] = useState(null)
    const [cotacoes, setCotacoes] = useState([])
    const [mensagem, setMensagem] = useState('')
    const [ocupado, setOcupado] = useState(false)
    const [serieSelecionada, setSerieSelecionada] = useState('')
    async function executar(acao) {
        if (ocupado) return
        setOcupado(true); setMensagem('')
        try { await acao() } catch (e) { setMensagem(e.message) } finally { setOcupado(false) }
    }
    async function localizar(e) {
        e.preventDefault()
        const r = Object.fromEntries(new FormData(e.currentTarget))
        await executar(async () => {
            await requisitar(`empresas/${empresa}/agricola/propriedades/${propriedade}/localizacao`, { method: 'PUT', body: JSON.stringify({ latitude: Number(r.latitude), longitude: Number(r.longitude) }) })
            setMensagem('Localização salva.'); setClima(null)
        })
    }
    async function carregarCotacoes() { setCotacoes(await requisitar(`empresas/${empresa}/agricola/cotacoes`)) }
    async function salvarCotacao(e) {
        e.preventDefault()
        const form = e.currentTarget
        const r = Object.fromEntries(new FormData(form))
        await executar(async () => {
            await requisitar(`empresas/${empresa}/agricola/cotacoes`, { method: 'POST', body: JSON.stringify({ ...r, valor: Number(r.valor) }) })
            setMensagem('Cotação registrada.'); form.reset(); await carregarCotacoes()
        })
    }
    const serie = cotacoes.filter(c => `${c.cultura} | ${c.praca} | ${c.unidade}` === serieSelecionada).slice().reverse()
    const min = Math.min(...serie.map(c => Number(c.valor)))
    const max = Math.max(...serie.map(c => Number(c.valor)))
    return <section><h2>Clima e cotações</h2>{mensagem && <p role="status">{mensagem}</p>}
        <div className="agri-formularios"><div><h3>Previsão por propriedade</h3>
            <label>Propriedade<select value={propriedade} onChange={e => { setPropriedade(e.target.value); setClima(null) }}><option value="">Selecione</option>{propriedades.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
            <button type="button" disabled={!propriedade || ocupado} onClick={() => executar(async () => { setClima(null); setClima(await requisitar(`empresas/${empresa}/agricola/propriedades/${propriedade}/clima`)) })}>Consultar previsão</button>
            {propriedade && podeEditar('CLIMA') && <details><summary>Configurar localização</summary><form onSubmit={localizar}><fieldset disabled={ocupado}><label>Latitude<input name="latitude" type="number" min="-90" max="90" step="0.0001" required /></label><label>Longitude<input name="longitude" type="number" min="-180" max="180" step="0.0001" required /></label><p>A consulta enviará estas coordenadas ao MET Norway para obter a previsão.</p><button>Salvar coordenadas</button></fieldset></form></details>}
            {clima && !clima.disponivel && <p role="status">{clima.mensagem}</p>}
            {clima?.disponivel && <><p>Fonte: <a href="https://www.met.no/">MET Norway</a> · <a href={clima.licenca}>CC BY 4.0</a>. Consulta: {new Date(clima.consultadoEm).toLocaleString('pt-BR')}. Resumo e avisos calculados pelo AgroGestão.</p><div className="agri-tabela"><table><thead><tr><th>Horário</th><th>°C</th><th>Umidade %</th><th>Chuva mm/h</th><th>Avisos</th></tr></thead><tbody>{clima.horas.map(h => <tr key={h.data}><td>{new Date(h.data).toLocaleString('pt-BR')}</td><td>{h.temperatura ?? '—'}</td><td>{h.umidade ?? '—'}</td><td>{h.chuvaMm ?? '—'}</td><td>{h.avisos.join('; ') || '—'}</td></tr>)}</tbody></table></div></>}
        </div><div><h3>Histórico de preços</h3><p>Preços em reais, com praça, unidade e fonte conferidas. Sincronização e atualização automática disponíveis quando houver um provedor autorizado configurado.</p><button type="button" disabled={ocupado} onClick={() => executar(carregarCotacoes)}>Carregar histórico</button>{podeEditar('COTACOES') && <button type="button" disabled={ocupado} onClick={() => executar(async () => { const resultado = await requisitar(`empresas/${empresa}/agricola/cotacoes/sincronizar`, { method: 'POST' }); await carregarCotacoes(); setMensagem(`${resultado.importadas} cotações importadas.`) })}>Sincronizar com provedor</button>}
            <label>Série<select value={serieSelecionada} onChange={e => setSerieSelecionada(e.target.value)}><option value="">Selecione</option>{[...new Set(cotacoes.map(c => `${c.cultura} | ${c.praca} | ${c.unidade}`))].map(c => <option key={c}>{c}</option>)}</select></label>
            {serie.length > 1 && <svg viewBox="0 0 500 160" role="img" aria-label={`Histórico ${serieSelecionada}, entre ${min} e ${max} reais`}><polyline fill="none" stroke="#24633c" strokeWidth="3" points={serie.map((c, i) => `${10 + i * 480 / (serie.length - 1)},${140 - (Number(c.valor) - min) * 120 / (max - min || 1)}`).join(' ')} /></svg>}
            <div className="agri-tabela"><table><thead><tr><th>Data</th><th>Cultura / praça</th><th>R$</th><th>Unidade</th><th>Fonte</th></tr></thead><tbody>{cotacoes.map(c => <tr key={c.id}><td>{c.data_cotacao}</td><td>{c.cultura} / {c.praca}</td><td>{c.valor}</td><td>{c.unidade}</td><td>{c.fonte}</td></tr>)}</tbody></table></div>
            {podeEditar('COTACOES') && <details><summary>Registrar cotação</summary><form onSubmit={salvarCotacao}><fieldset disabled={ocupado}><label>Cultura<input name="cultura" list="culturas-agro" maxLength={80} required /><datalist id="culturas-agro"><option>Soja</option><option>Milho</option><option>Trigo</option></datalist></label><label>Praça<input name="praca" maxLength={100} required /></label><label>Unidade<input name="unidade" maxLength={30} placeholder="saca 60 kg" required /></label><label>Preço em reais<input name="valor" type="number" step="0.0001" min="0.0001" required /></label><label>Data<input name="data" type="date" required /></label><label>Fonte<input name="fonte" maxLength={300} required /></label><button>Salvar cotação</button></fieldset></form></details>}
        </div></div>
    </section>
}
