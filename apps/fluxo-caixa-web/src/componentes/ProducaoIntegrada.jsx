import { useState } from 'react'

export default function ProducaoIntegrada({ requisitar, empresa, propriedades, safras, operacoes, categorias, podeEscrever, podeEditar = () => podeEscrever, atualizarIndicadores }) {
    const [dados, setDados] = useState({ armazens: [], graos: [], entregas: [], contratos: [], maquinas: [], 'usos-maquinas': [], insumos: [] })
    const [mensagem, setMensagem] = useState('')
    const [erro, setErro] = useState('')
    const [ocupado, setOcupado] = useState(false)
    const [chaves, setChaves] = useState(() => Object.fromEntries(['depositos', 'entregas', 'usos-maquinas'].map(r => [r, crypto.randomUUID()])))
    const [entrega, setEntrega] = useState('')
    const [incluirCusto, setIncluirCusto] = useState(false)
    const base = `empresas/${empresa}/agricola`
    const moeda = n => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    async function carregar() {
        const recursos = ['armazens', 'graos', 'entregas', 'contratos', 'maquinas', 'usos-maquinas', 'insumos']
        const respostas = await Promise.allSettled(recursos.map(r => requisitar(`${base}/${r}`)))
        setDados(Object.fromEntries(recursos.map((r, i) => [r, respostas[i].status === 'fulfilled' ? respostas[i].value : []])))
        if (respostas.some(r => r.status === 'rejected')) setErro('Alguns módulos estão indisponíveis ou não foram autorizados para seu perfil. Confira as permissões antes de registrar operações.')
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
            for (const campo of ['propriedadeId', 'capacidadeKg', 'armazemId', 'operacaoId', 'quantidadeKg', 'contratoId', 'horimetro', 'proximaManutencao', 'maquinaId', 'horas', 'combustivelLitros', 'categoriaReceitaId', 'categoriaComissaoId', 'insumoCombustivelId']) {
                if (campo in r) r[campo] = r[campo] === '' ? null : Number(r[campo])
            }
            if (chaves[recurso]) r.chave = chaves[recurso]
            if (recurso === 'usos-maquinas') {
                if (incluirCusto) {
                    const op = operacoes.find(o => Number(o.id) === r.operacaoId)
                    r.financeiro = { descricao: `Máquina: ${r.observacao}`.slice(0, 150), valor: Number(r.valor), tipo: 'DESPESA', categoriaId: Number(r.categoriaId), dataMovimentacao: op?.data_operacao, observacao: r.observacao }
                }
                delete r.valor; delete r.categoriaId
            }
            const rota = recurso === 'liquidar' ? `entregas/${entrega}/liquidar` : recurso
            await requisitar(`${base}/${rota}`, { method: 'POST', body: JSON.stringify(r) })
            form.reset()
            if (chaves[recurso]) setChaves(atual => ({ ...atual, [recurso]: crypto.randomUUID() }))
            if (recurso === 'usos-maquinas') setIncluirCusto(false)
            setMensagem('Registro integrado salvo. Estoque e indicadores atualizados.')
            await carregar(); await atualizarIndicadores()
        })
    }
    const selecionar = (nome, opcoes, rotulo, opcional = false) => <label>{rotulo}<select name={nome} required={!opcional}><option value="">{opcional ? 'Não confirmar este movimento' : 'Selecione'}</option>{opcoes.map(o => <option key={o.id} value={o.id}>{o.rotulo}</option>)}</select></label>
    const campo = (nome, rotulo, tipo = 'number', step = '0.001', valor) => <label>{rotulo}<input name={nome} type={tipo} min={tipo === 'number' ? '0' : undefined} step={tipo === 'number' ? step : undefined} defaultValue={valor} required maxLength={tipo === 'text' ? 120 : undefined} /></label>
    const opcoesPropriedades = propriedades.map(p => ({ id: p.id, rotulo: p.nome }))
    const opcoesSilos = dados.armazens.map(a => ({ id: a.id, rotulo: `${a.nome} · saldo ${a.saldo_kg} / ${a.capacidade_kg} kg` }))
    return <section><h2>Produção integrada: silos, entregas e máquinas</h2><button type="button" disabled={ocupado} onClick={() => executar(carregar)}>Carregar produção integrada</button>
        {erro && <p role="alert" className="agri-erro">{erro}</p>}{mensagem && <p role="status" className="agri-sucesso">{mensagem}</p>}
        <div className="agri-formularios"><div><h3>Armazenagem física</h3><ul>{dados.armazens.map(a => <li key={a.id}>{a.nome} · {a.propriedade} · {a.saldo_kg} / {a.capacidade_kg} kg</li>)}</ul>
            {podeEditar('PRODUCAO') && <><details><summary>Cadastrar silo ou armazém</summary><form onSubmit={e => salvar(e, 'armazens')}><fieldset disabled={ocupado}>{selecionar('propriedadeId', opcoesPropriedades, 'Propriedade')}{campo('nome', 'Nome', 'text')}{campo('capacidadeKg', 'Capacidade (kg)')}<button>Salvar armazém</button></fieldset></form></details>
            <details><summary>Armazenar uma colheita</summary><form onSubmit={e => salvar(e, 'depositos')}><fieldset disabled={ocupado}>{selecionar('armazemId', opcoesSilos, 'Armazém')}{selecionar('operacaoId', operacoes.filter(o => o.tipo === 'COLHEITA').map(o => ({ id: o.id, rotulo: `#${o.id} ${o.safra}: ${o.peso_liquido_kg} kg líquidos` })), 'Colheita conferida')}{campo('quantidadeKg', 'Quantidade a armazenar (kg)')}{campo('data', 'Data do depósito', 'date')}<button>Confirmar depósito</button></fieldset></form></details></>}
            <details><summary>Histórico de grãos</summary><ul>{dados.graos.map(g => <li key={g.id}>{g.data_registro} · {g.armazem} · {g.safra} · {g.cultura} · {g.quantidade_kg} kg · {g.operacao_id ? `colheita #${g.operacao_id}` : `entrega #${g.entrega_id}`}</li>)}</ul></details>
        </div><div><h3>Entregas de contratos</h3><p>A entrega baixa o estoque. Recebimento e comissão são confirmados separadamente para refletir o caixa real.</p>
            {podeEditar('CONTRATOS') && <><form onSubmit={e => salvar(e, 'entregas')}><fieldset disabled={ocupado}>{selecionar('contratoId', dados.contratos.map(c => ({ id: c.id, rotulo: `${c.numero} · ${c.contraparte} · ${safras.find(s => Number(s.id) === Number(c.safra_id))?.nome || c.safra} · contratado ${c.quantidade_kg} kg` })), 'Contrato')}{selecionar('armazemId', opcoesSilos, 'Armazém de saída')}{campo('quantidadeKg', 'Quantidade entregue (kg)')}{campo('data', 'Data da entrega', 'date')}<label className="agri-confirmacao"><input type="checkbox" required /> Conferi a saída física e os dados do contrato.</label><button>Registrar entrega</button></fieldset></form>
            <details><summary>Confirmar recebimento / comissão paga</summary><label>Entrega<select value={entrega} onChange={e => setEntrega(e.target.value)}><option value="">Selecione</option>{dados.entregas.map(e => <option key={e.id} value={e.id}>#{e.id} {e.contrato} · {moeda(e.valor)} · comissão {moeda(e.comissao)}</option>)}</select></label>{entrega && <form onSubmit={e => salvar(e, 'liquidar')}><fieldset disabled={ocupado}>{campo('data', 'Data efetiva do recebimento / pagamento', 'date')}{selecionar('categoriaReceitaId', categorias.filter(c => c.tipo === 'RECEITA').map(c => ({ id: c.id, rotulo: c.nome })), 'Categoria — receita efetivamente recebida', true)}{selecionar('categoriaComissaoId', categorias.filter(c => c.tipo === 'DESPESA').map(c => ({ id: c.id, rotulo: c.nome })), 'Categoria — comissão efetivamente paga', true)}<label className="agri-confirmacao"><input type="checkbox" required /> Confirmo que os valores selecionados foram recebidos ou pagos.</label><button>Integrar ao financeiro</button></fieldset></form>}</details></>}
            <ul>{dados.entregas.map(e => <li key={e.id}>#{e.id} · {e.contrato} · {e.quantidade_kg} kg · {moeda(e.valor)} · {e.receita_id ? `recebimento #${e.receita_id}` : 'Recebimento pendente'} · {e.comissao_id ? `comissão paga #${e.comissao_id}` : `comissão prevista ${moeda(e.comissao)}`}</li>)}</ul>
        </div><div><h3>Máquinas, combustível e manutenção</h3><ul>{dados.maquinas.map(m => <li key={m.id}>{m.nome} · {m.identificacao} · {m.horimetro} h · {m.manutencao_pendente ? 'Manutenção pendente' : m.proxima_manutencao ? `próxima manutenção: ${m.proxima_manutencao} h` : 'Próxima manutenção não definida'}</li>)}</ul>
            {podeEditar('FROTA') && <><details><summary>Cadastrar máquina</summary><form onSubmit={e => salvar(e, 'maquinas')}><fieldset disabled={ocupado}>{selecionar('propriedadeId', opcoesPropriedades, 'Propriedade')}{campo('nome', 'Nome', 'text')}{campo('identificacao', 'Identificação', 'text')}{campo('horimetro', 'Horímetro inicial (h)', 'number', '0.01', '0')}<label>Próxima manutenção (h, opcional)<input name="proximaManutencao" type="number" min="0" step="0.01" /></label><button>Salvar máquina</button></fieldset></form></details>
            <details><summary>Registrar uso ou manutenção</summary><form onSubmit={e => salvar(e, 'usos-maquinas')}><fieldset disabled={ocupado}>{selecionar('maquinaId', dados.maquinas.map(m => ({ id: m.id, rotulo: m.nome })), 'Máquina')}{selecionar('operacaoId', operacoes.map(o => ({ id: o.id, rotulo: `#${o.id} ${o.descricao} · ${o.data_operacao}` })), 'Operação que receberá o custo')}<label>Tipo<select name="tipo"><option>USO</option><option>MANUTENCAO</option></select></label>{campo('horas', 'Horas adicionais', 'number', '0.01', '0')}{campo('combustivelLitros', 'Combustível consumido (L)', 'number', '0.001', '0')}{selecionar('insumoCombustivelId', dados.insumos.filter(i => i.tipo === 'COMBUSTIVEL').map(i => ({ id: i.id, rotulo: `${i.nome}: ${i.saldo} ${i.unidade}` })), 'Combustível do estoque (obrigatório se houver consumo)', true)}<label>Próxima manutenção (h, opcional)<input name="proximaManutencao" type="number" min="0" step="0.01" /></label>{campo('observacao', 'Descrição do serviço / uso', 'text')}<label className="agri-confirmacao"><input type="checkbox" checked={incluirCusto} onChange={e => setIncluirCusto(e.target.checked)} /> Registrar também um custo pago</label>{incluirCusto && <>{campo('valor', 'Valor pago (R$)', 'number', '0.01')}{selecionar('categoriaId', categorias.filter(c => c.tipo === 'DESPESA').map(c => ({ id: c.id, rotulo: c.nome })), 'Categoria da despesa')}</>}<p>O consumo será descontado do estoque em litros. Não registre o mesmo custo novamente na operação.</p><button>Salvar uso e integrar custos</button></fieldset></form></details></>}
            <details><summary>Histórico das máquinas</summary><ul>{dados['usos-maquinas'].map(u => <li key={u.id}>{u.data_operacao} · {u.maquina} · {u.tipo} · {u.horas} h · {u.combustivel_litros} L · {u.movimentacao_id ? `despesa #${u.movimentacao_id}` : 'Sem custo financeiro adicional'}</li>)}</ul></details>
        </div></div>
    </section>
}
