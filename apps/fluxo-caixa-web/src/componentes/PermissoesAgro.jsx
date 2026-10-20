import { useState } from 'react'

const funcoes = ['PRODUCAO', 'ESTOQUE', 'CONTRATOS', 'FROTA', 'FINANCEIRO', 'DOCUMENTOS', 'CLIMA', 'COTACOES']
export default function PermissoesAgro({ requisitar, empresa, propriedades }) {
    const [usuarios, setUsuarios] = useState([])
    const [usuario, setUsuario] = useState('')
    const [restrito, setRestrito] = useState(false)
    const [selecionadas, setSelecionadas] = useState([])
    const [regras, setRegras] = useState([])
    const [erro, setErro] = useState('')
    const [mensagem, setMensagem] = useState('')
    const [ocupado, setOcupado] = useState(false)
    const base = `empresas/${empresa}/agricola/acessos`
    async function executar(acao) {
        if (ocupado) return
        setOcupado(true); setErro(''); setMensagem('')
        try { await acao() } catch (e) { setErro(e.message) } finally { setOcupado(false) }
    }
    async function selecionar(id) {
        setUsuario(''); setRegras([])
        if (!id) return
        await executar(async () => {
            const config = await requisitar(`${base}/usuarios/${id}`)
            const alvo = usuarios.find(u => String(u.id) === id)
            setRestrito(config.restringirPropriedades); setSelecionadas(config.propriedades.map(Number))
            setRegras(funcoes.map(funcionalidade => {
                const salva = config.regras.find(r => r.funcionalidade === funcionalidade)
                return { funcionalidade, podeLer: salva ? salva.pode_ler : true, podeEscrever: salva ? salva.pode_escrever : alvo?.papel === 'PRODUTOR' }
            })); setUsuario(id)
        })
    }
    function alterar(index, campo, valor) {
        setRegras(atual => atual.map((r, i) => i === index ? { ...r, [campo]: valor, ...(campo === 'podeLer' && !valor ? { podeEscrever: false } : campo === 'podeEscrever' && valor ? { podeLer: true } : {}) } : r))
    }
    async function salvar(e) {
        e.preventDefault()
        await executar(async () => {
            await requisitar(`${base}/usuarios/${usuario}`, { method: 'PUT', body: JSON.stringify({ restringirPropriedades: restrito, propriedades: selecionadas, regras }) })
            setMensagem('Permissões salvas e auditadas. As novas regras já valem para as próximas solicitações do usuário.')
        })
    }
    return <section><h2>Permissões por função e propriedade</h2><p>Proprietários e administradores mantêm o acesso administrativo. Estoque de insumos e cotações são compartilhados pela empresa conforme a permissão da função. Usuários restritos não acessam relatórios financeiros gerais.</p>
        <button type="button" disabled={ocupado} onClick={() => executar(async () => setUsuarios(await requisitar(`${base}/usuarios`)))}>Carregar usuários da empresa</button>
        {erro && <p role="alert" className="agri-erro">{erro}</p>}{mensagem && <p role="status" className="agri-sucesso">{mensagem}</p>}
        <label>Usuário<select disabled={ocupado} value={usuario} onChange={e => selecionar(e.target.value)}><option value="">Selecione</option>{usuarios.filter(u => !['PROPRIETARIO', 'ADMINISTRADOR', 'SUPER_ADMIN'].includes(u.papel)).map(u => <option key={u.id} value={u.id}>{u.nome} · {u.papel}</option>)}</select></label>
        {usuario && <form onSubmit={salvar}><fieldset disabled={ocupado}><div className="agri-tabela"><table><thead><tr><th>Funcionalidade</th><th>Ler</th><th>Registrar / alterar</th></tr></thead><tbody>{regras.map((r, i) => <tr key={r.funcionalidade}><td>{r.funcionalidade}</td><td><input type="checkbox" aria-label={`Ler ${r.funcionalidade}`} checked={r.podeLer} onChange={e => alterar(i, 'podeLer', e.target.checked)} /></td><td><input type="checkbox" aria-label={`Alterar ${r.funcionalidade}`} checked={r.podeEscrever} onChange={e => alterar(i, 'podeEscrever', e.target.checked)} /></td></tr>)}</tbody></table></div>
            <label className="agri-confirmacao"><input type="checkbox" checked={restrito} onChange={e => setRestrito(e.target.checked)} /> Restringir os registros agrícolas a propriedades selecionadas</label>
            {restrito && <><p>Sem propriedades selecionadas, nenhum registro vinculado a propriedade será liberado.</p>{propriedades.map(p => <label className="agri-confirmacao" key={p.id}><input type="checkbox" checked={selecionadas.includes(Number(p.id))} onChange={e => setSelecionadas(atual => e.target.checked ? [...atual, Number(p.id)] : atual.filter(id => id !== Number(p.id)))} />{p.nome}</label>)}</>}
            <button>Salvar permissões</button>
        </fieldset></form>}
    </section>
}
