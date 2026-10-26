import { obterSessao } from '../servicos/sessao.js'
import { apiFetch } from '../servicos/api.js'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, Link } from 'react-router'
import { API_BASE_URL } from '../config.js'
import './GestaoAgricola.css'
import ClimaCotacoes from '../componentes/ClimaCotacoes.jsx'
import RecursosAgro from '../componentes/RecursosAgro.jsx'
import ProducaoIntegrada from '../componentes/ProducaoIntegrada.jsx'
import PermissoesAgro from '../componentes/PermissoesAgro.jsx'

const numero = valor => Number(valor || 0).toLocaleString('pt-BR', { maximumFractionDigits: 3 })
const dinheiro = valor => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export default function GestaoAgricola() {
    const [sessao] = useState(obterSessao)
    const [dados, setDados] = useState({ safras: [], operacoes: [], romaneios: [], propriedades: [], categorias: [], acessos: null })
    const [erro, setErro] = useState('')
    const [mensagem, setMensagem] = useState('')
    const [ocupado, setOcupado] = useState(false)
    const [tipoFinanceiro, setTipoFinanceiro] = useState('')
    const [romaneio, setRomaneio] = useState('')
    const [chave, setChave] = useState(() => crypto.randomUUID())
    const formularioOperacao = useRef(null)
    const requisitar = useCallback(async (rota, opcoes = {}) => {
        const resposta = await apiFetch(`${API_BASE_URL}/${rota}`, opcoes)
        const corpo = await resposta.json().catch(() => null)
        if (!resposta.ok) throw new Error(corpo?.mensagem || (resposta.status === 403 ? 'Acesso indisponível. Verifique seu perfil e assinatura.' : 'Não foi possível concluir a operação.'))
        return corpo
    }, [])
    const carregar = useCallback(async () => {
        if (!sessao) return
        const empresa = sessao.usuario.empresaId
        const acessos = await requisitar(`empresas/${empresa}/agricola/acessos/meu`)
        const respostas = await Promise.allSettled([
            ...['safras', 'operacoes', 'romaneios'].map(p => requisitar(`empresas/${empresa}/agricola/${p}`)),
            requisitar(`colaboracao/empresas/${empresa}/propriedades`), requisitar(`empresas/${empresa}/categorias`),
        ])
        const [safras, operacoes, romaneios, propriedades, categorias] = respostas.map(r => r.status === 'fulfilled' ? r.value : [])
        if (respostas.some(r => r.status === 'rejected')) setErro('Alguns módulos estão indisponíveis ou não foram liberados para seu perfil. Os registros autorizados continuam acessíveis.')
        setDados({ safras, operacoes, romaneios, propriedades, categorias, acessos })
    }, [sessao, requisitar])
    useEffect(() => {
        let ativo = true
        Promise.resolve().then(() => { if (ativo) return carregar() }).catch(e => { if (ativo) setErro(e.message) })
        return () => { ativo = false }
    }, [carregar])
    async function baixarOriginal() {
        if (!romaneio) return
        setErro('')
        try {
            const resposta = await fetch(`${API_BASE_URL}/empresas/${sessao.usuario.empresaId}/agricola/romaneios/${romaneio}/arquivo`, { headers: { Authorization: `Bearer ${sessao.token}` } })
            if (!resposta.ok) throw new Error((await resposta.json().catch(() => null))?.mensagem || 'Não foi possível baixar o original.')
            const url = URL.createObjectURL(await resposta.blob())
            const link = document.createElement('a')
            link.href = url; link.download = dados.romaneios.find(r => String(r.id) === romaneio)?.nome_arquivo || 'romaneio'
            document.body.append(link); link.click(); link.remove()
            setTimeout(() => URL.revokeObjectURL(url), 10000)
        } catch (e) { setErro(e.message) }
    }
    async function salvar(evento, recurso) {
        evento.preventDefault()
        if (ocupado) return
        const form = evento.currentTarget
        const campos = new FormData(form)
        const valores = Object.fromEntries(campos)
        setOcupado(true); setErro(''); setMensagem('')
        try {
            let body
            if (recurso === 'romaneios') body = campos
            else if (recurso === 'safras') body = JSON.stringify({ ...valores, propriedadeId: Number(valores.propriedadeId), areaHectares: Number(valores.areaHectares) })
            else body = JSON.stringify({
                safraId: Number(valores.safraId), romaneioId: romaneio ? Number(romaneio) : null, chave,
                tipo: valores.tipo, descricao: valores.descricao, data: valores.data,
                quantidadeKg: Number(valores.quantidadeKg), taraKg: Number(valores.taraKg), umidade: Number(valores.umidade), impurezas: Number(valores.impurezas), descontoKg: Number(valores.descontoKg),
                financeiro: tipoFinanceiro ? { descricao: valores.descricao, valor: Number(valores.valor), tipo: tipoFinanceiro,
                    categoriaId: Number(valores.categoriaId), dataMovimentacao: valores.data, observacao: 'Operação agrícola conferida',
                    produtoNome: dados.safras.find(s => String(s.id) === valores.safraId)?.cultura,
                } : null,
            })
            const resultado = await requisitar(`empresas/${sessao.usuario.empresaId}/agricola/${recurso}`, { method: 'POST', body })
            // Limpa somente após confirmação; a chave permanece igual em caso de falha de rede.
            form.reset()
            if (recurso === 'operacoes') { setChave(crypto.randomUUID()); setRomaneio(''); setTipoFinanceiro('') }
            if (recurso === 'romaneios') setRomaneio(String(resultado.id))
            setMensagem(recurso === 'romaneios' ? 'Documento recebido. Confira o original e os dados antes de registrar a colheita.' : 'Registro salvo com sucesso.')
            await carregar()
        } catch (e) { setErro(e.message) } finally { setOcupado(false) }
    }
    if (!sessao) return <Navigate to="/login" replace />
    const podeEscrever = dados.acessos ? dados.acessos.regras.some(r => r.podeEscrever) : ['PROPRIETARIO', 'PRODUTOR', 'ADMINISTRADOR', 'SUPER_ADMIN'].includes(sessao.usuario.papel)
    const podeEditar = funcao => dados.acessos ? dados.acessos.regras.find(r => r.funcionalidade === funcao)?.podeEscrever === true : podeEscrever
    const doc = dados.romaneios.find(r => String(r.id) === romaneio)
    let sugestoes = {}
    try { sugestoes = JSON.parse(doc?.sugestoes_json || '{}') } catch { /* Documento sem sugestões válidas. */ }
    function aplicarSugestoes() {
        const campos = formularioOperacao.current?.elements
        if (!campos) return
        for (const [destino, origem] of Object.entries({ quantidadeKg: 'pesoBrutoKg', taraKg: 'taraKg', umidade: 'umidadePercentual', impurezas: 'impurezasPercentual', descontoKg: 'descontoKg' })) {
            const valor = sugestoes[origem]
            if (valor !== undefined && valor !== null && valor !== '' && Number.isFinite(Number(valor)) && Number(valor) >= 0) campos[destino].value = valor
        }
        const normalizar = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
        const candidatas = dados.safras.filter(s => normalizar(s.cultura) === normalizar(sugestoes.produto))
        if (candidatas.length === 1) campos.safraId.value = candidatas[0].id
        campos.tipo.value = 'COLHEITA'
        setMensagem('Sugestões aplicadas. Confira produtor, produto, safra e valores com o original antes de salvar.')
    }
    return <main className="gestao-agricola">
        <header><span className="ag-eyebrow">DO CAMPO AO CAIXA</span><h1>Gestão agrícola</h1><p>Safras, colheitas e custos com os registros da sua propriedade.</p><Link to="/dashboard/produtor">Gerenciar propriedades e documentos →</Link></header>
        {erro && <p role="alert" className="agri-erro">{erro}</p>}{mensagem && <p role="status" className="agri-sucesso">{mensagem}</p>}
        <section aria-labelledby="resumo-safras"><h2 id="resumo-safras">Resultados por safra e talhão</h2>
            <p>Receitas e custos incluem apenas movimentações vinculadas a operações, sem registros excluídos. Valores sem lançamentos aparecem como zero.</p>
            <div className="agri-cards">{dados.safras.map(s => <article key={s.id}><small>{s.propriedade} · {s.talhao}</small><h3>{s.nome} · {s.cultura}</h3><p>{numero(s.area_hectares)} ha · {s.inicio} a {s.fim}</p><dl>
                <div><dt>Produção líquida</dt><dd>{numero(s.producao_kg)} kg</dd></div><div><dt>Produtividade</dt><dd>{numero(s.produtividade_kg_ha)} kg/ha</dd></div>
                {'custos' in s ? <><div><dt>Custos / ha</dt><dd>{dinheiro(Number(s.custos) / Number(s.area_hectares))}</dd></div><div><dt>Receitas</dt><dd>{dinheiro(s.receitas)}</dd></div><div><dt>Resultado registrado</dt><dd>{dinheiro(Number(s.receitas) - Number(s.custos))}</dd></div></> : <div><dt>Financeiro</dt><dd>Acesso restrito</dd></div>}
            </dl></article>)}</div>{!dados.safras.length && <p>Nenhuma safra registrada.</p>}
        </section>
        {podeEscrever && <div className="agri-formularios"><section><h2>Planejar safra / talhão</h2><form onSubmit={e => salvar(e, 'safras')}><fieldset disabled={ocupado || !podeEditar('PRODUCAO')}>
            <label>Propriedade<select name="propriedadeId" required><option value="">Selecione</option>{dados.propriedades.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
            <label>Safra<input name="nome" maxLength={120} placeholder="2026/2027" required /></label><label>Cultura<input name="cultura" maxLength={80} required /></label><label>Talhão<input name="talhao" maxLength={120} required /></label>
            <label>Área cultivada (ha)<input name="areaHectares" type="number" min="0.0001" step="0.0001" required /></label><label>Início<input name="inicio" type="date" required /></label><label>Fim<input name="fim" type="date" required /></label><button>Salvar safra</button>
        </fieldset></form></section>
        <section><h2>Importar romaneio</h2><p>PDF, JPEG ou PNG até 10 MB. OCR disponível quando configurado no servidor. Nenhum dado extraído é confirmado automaticamente.</p><form onSubmit={e => salvar(e, 'romaneios')}><fieldset disabled={ocupado || !podeEditar('DOCUMENTOS')}><label>Propriedade do romaneio<select name="propriedadeId" required><option value="">Selecione</option>{dados.propriedades.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label><label>Documento<input name="arquivo" type="file" accept="application/pdf,image/jpeg,image/png" required /></label><button>Importar para conferência</button></fieldset></form>
            <label>Romaneio para conferir<select value={romaneio} onChange={e => setRomaneio(e.target.value)}><option value="">Sem romaneio</option>{dados.romaneios.filter(r => r.status === 'CONFERIR').map(r => <option key={r.id} value={r.id}>#{r.id} · {r.nome_arquivo}</option>)}</select></label>
            {doc && <div><p>Documento #{doc.documento_id}.</p><button type="button" onClick={baixarOriginal}>Baixar original para conferência</button><label>Texto do OCR<textarea readOnly value={doc.texto_extraido || 'OCR indisponível ou sem texto legível. Confira o arquivo original.'} rows={7} /></label>{Object.keys(sugestoes).length > 0 && <><h3>Sugestões de IA — pendentes de conferência</h3><dl>{Object.entries(sugestoes).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{String(v)}</dd></div>)}</dl><button type="button" onClick={aplicarSugestoes}>Aplicar sugestões à operação</button></>}</div>}
        </section>
        <section><h2>Registrar operação</h2><p>Colheita não gera receita automaticamente. Inclua movimento financeiro somente quando houver entrada ou saída efetiva.</p><form ref={formularioOperacao} onSubmit={e => salvar(e, 'operacoes')}><fieldset disabled={ocupado || !podeEditar('PRODUCAO')}>
            <label>Safra<select name="safraId" required><option value="">Selecione</option>{dados.safras.map(s => <option key={s.id} value={s.id}>{s.nome} · {s.talhao} · {s.cultura}</option>)}</select></label>
            <label>Operação<select name="tipo" required>{['COLHEITA', 'PLANTIO', 'INSUMO', 'MAQUINA', 'COMBUSTIVEL', 'ARMAZENAGEM', 'OUTRO'].map(t => <option key={t}>{t}</option>)}</select></label>
            <label>Descrição<input name="descricao" maxLength={150} required /></label><label>Data<input name="data" type="date" required /></label>
            <label>Peso bruto (kg)<input name="quantidadeKg" type="number" min="0" step="0.001" defaultValue="0" required /></label><label>Tara do veículo (kg; zero se o peso já for só do produto)<input name="taraKg" type="number" min="0" step="0.001" defaultValue="0" required /></label><label>Umidade medida (%)<input name="umidade" type="number" min="0" max="100" step="0.0001" defaultValue="0" required /></label>
            <label>Impurezas descontadas (%)<input name="impurezas" type="number" min="0" max="100" step="0.0001" defaultValue="0" required /></label><label>Outros descontos conferidos (kg)<input name="descontoKg" type="number" min="0" step="0.001" defaultValue="0" required /></label>
            <p>O peso líquido subtrai primeiro a tara, depois as impurezas e outros descontos em kg. A umidade não usa uma tabela comercial presumida. {romaneio && `A operação validará o romaneio #${romaneio}.`}</p>
            <label>Movimento financeiro<select disabled={!podeEditar('FINANCEIRO')} value={tipoFinanceiro} onChange={e => setTipoFinanceiro(e.target.value)}><option value="">Sem movimentação financeira</option><option value="DESPESA">Despesa paga</option><option value="RECEITA">Receita recebida</option></select></label>
            {tipoFinanceiro && <><label>Valor (R$)<input name="valor" type="number" min="0.01" step="0.01" required /></label><label>Categoria<select name="categoriaId" required><option value="">Selecione</option>{dados.categorias.filter(c => c.tipo === tipoFinanceiro).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label></>}
            <label className="agri-confirmacao"><input type="checkbox" required /> Conferi os dados e os descontos com o documento original.</label><button>Confirmar e salvar operação</button>
        </fieldset></form></section></div>}
        <section><h2>Histórico de operações</h2><div className="agri-tabela"><table><thead><tr><th>Data</th><th>Safra</th><th>Operação</th><th>Descrição</th><th>Peso líquido</th><th>Financeiro</th></tr></thead><tbody>{dados.operacoes.map(o => <tr key={o.id}><td>{o.data_operacao}</td><td>{o.safra}</td><td>{o.tipo}</td><td>{o.descricao}</td><td>{numero(o.peso_liquido_kg)} kg</td><td>{o.movimentacao_id ? `#${o.movimentacao_id}` : 'Sem lançamento'}</td></tr>)}</tbody></table></div>{!dados.operacoes.length && <p>Nenhuma operação registrada.</p>}</section>
        <section><h2>Histórico de romaneios</h2><ul>{dados.romaneios.map(r => <li key={r.id}>#{r.id} · {r.nome_arquivo} · {r.status}</li>)}</ul>{!dados.romaneios.length && <p>Nenhum romaneio importado.</p>}</section>
        <ClimaCotacoes propriedades={dados.propriedades} requisitar={requisitar} empresa={sessao.usuario.empresaId} podeEscrever={podeEscrever} podeEditar={podeEditar} />
        <RecursosAgro requisitar={requisitar} empresa={sessao.usuario.empresaId} safras={dados.safras} operacoes={dados.operacoes} podeEscrever={podeEscrever} podeEditar={podeEditar} />
        <ProducaoIntegrada requisitar={requisitar} empresa={sessao.usuario.empresaId} propriedades={dados.propriedades} safras={dados.safras} operacoes={dados.operacoes} categorias={dados.categorias} podeEscrever={podeEscrever} podeEditar={podeEditar} atualizarIndicadores={carregar} />
        {dados.acessos?.administrar && <PermissoesAgro requisitar={requisitar} empresa={sessao.usuario.empresaId} propriedades={dados.propriedades} />}
    </main>
}
