import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { API_BASE_URL as API_URL } from '../config.js'
import { apiFetch } from '../servicos/api.js'
import './CentralNotificacoes.css'

const CHAVE_LIDAS = 'agrogestao_notificacoes_lidas'

async function buscarLista(url) {
    try {
        const resposta = await apiFetch(url)
        if (!resposta.ok) return []
        const dados = await resposta.json()
        return Array.isArray(dados) ? dados : []
    } catch {
        return []
    }
}

function lerLidas(chave) {
    try {
        return new Set(JSON.parse(localStorage.getItem(chave) ?? '[]'))
    } catch {
        return new Set()
    }
}

function salvarLidas(chave, lidas) {
    try {
        localStorage.setItem(chave, JSON.stringify([...lidas]))
    } catch {
        // A central continua utilizável mesmo sem armazenamento local.
    }
}

function formatarDinheiro(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(Number(valor ?? 0))
}

function formatarData(data) {
    if (!data) return ''
    const valor = /^\d{4}-\d{2}-\d{2}$/.test(data)
        ? new Date(`${data}T00:00:00`)
        : new Date(data)
    if (Number.isNaN(valor.getTime())) return ''
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(valor)
}

function notificacoesDeContas(contas) {
    return contas.map((conta) => ({
        id: `conta:${conta.id}:${conta.dataVencimento}:${conta.valorPendente}`,
        titulo: conta.vencida ? 'Conta vencida' : 'Conta próxima do vencimento',
        descricao: `${conta.descricao || conta.favorecido || 'Conta financeira'} · ${formatarDinheiro(conta.valorPendente ?? conta.valorTotal)}`,
        detalhe: conta.vencida
            ? `Venceu em ${formatarData(conta.dataVencimento)}`
            : `Vence em ${formatarData(conta.dataVencimento)}`,
        tipo: conta.vencida ? 'urgente' : 'conta',
        data: conta.dataVencimento,
        rota: '/dashboard/contas',
    }))
}

function notificacoesDePendencias(pendencias) {
    return pendencias
        .filter((item) => !['RESOLVIDA', 'CANCELADA'].includes(item.status))
        .map((item) => ({
            id: `pendencia:${item.id}:${item.status}`,
            titulo: item.titulo || 'Pendência do contador',
            descricao: item.descricao || 'Há uma pendência aguardando sua atenção.',
            detalhe: item.vencimento
                ? `Prazo: ${formatarData(item.vencimento)}`
                : 'Aguardando sua ação',
            tipo: ['URGENTE', 'ALTA'].includes(item.prioridade) ? 'urgente' : 'pendencia',
            data: item.criadoEm || item.vencimento,
            rota: '/dashboard/produtor',
        }))
}

function notificacoesDaCarteira(clientes) {
    const itens = []
    clientes.forEach((cliente) => {
        const nome = cliente.empresaNome || 'Cliente'
        const alertas = [
            ['pendenciasAbertas', 'Pendências aguardando o produtor', 'pendencias'],
            ['documentosNovos', 'Documentos novos para revisar', 'documentos'],
            ['despesasSemDocumento', 'Despesas sem documento', 'documentos-ausentes'],
            ['movimentacoesSemClassificacao', 'Lançamentos sem classificação', 'classificacao'],
        ]
        alertas.forEach(([campo, titulo, tipo]) => {
            const quantidade = Number(cliente[campo] ?? 0)
            if (!quantidade) return
            itens.push({
                id: `cliente:${cliente.empresaId}:${tipo}:${quantidade}`,
                titulo: `${nome}: ${titulo.toLowerCase()}`,
                descricao: `${quantidade} ${quantidade === 1 ? 'item requer' : 'itens requerem'} sua atenção.`,
                detalhe: 'Abrir carteira contábil',
                tipo: tipo === 'pendencias' ? 'urgente' : 'pendencia',
                data: cliente.ultimaAtividade,
                rota: '/contador',
            })
        })
    })
    return itens
}

function CentralNotificacoes({ sessao }) {
    const navigate = useNavigate()
    const location = useLocation()
    const raizRef = useRef(null)
    const papel = sessao.usuario?.papel
    const empresaId = sessao.usuario?.empresaId
    const usuarioId = sessao.usuario?.id ?? sessao.usuario?.email ?? empresaId ?? 'usuario'
    const chaveLidas = `${CHAVE_LIDAS}:${usuarioId}`
    const [aberta, setAberta] = useState(false)
    const [carregando, setCarregando] = useState(true)
    const [notificacoes, setNotificacoes] = useState([])
    const [lidas, setLidas] = useState(() => lerLidas(chaveLidas))
    const [atualizar, setAtualizar] = useState(0)
    const naoLidas = useMemo(
        () => notificacoes.filter((item) => !lidas.has(item.id)),
        [lidas, notificacoes],
    )

    const carregarNotificacoes = useCallback(async () => {
        const contasUrl = empresaId
            ? `${API_URL}/empresas/${empresaId}/contas-financeiras/lembretes`
            : null
        const pendenciasUrl = papel === 'PRODUTOR' && empresaId
            ? `${API_URL}/colaboracao/empresas/${empresaId}/pendencias`
            : null

        const [contas, pendencias, clientes] = await Promise.all([
            contasUrl ? buscarLista(contasUrl) : Promise.resolve([]),
            pendenciasUrl ? buscarLista(pendenciasUrl) : Promise.resolve([]),
            papel === 'CONTADOR'
                ? buscarLista(`${API_URL}/contador/clientes`)
                : Promise.resolve([]),
        ])

        return [
            ...notificacoesDeContas(contas),
            ...notificacoesDePendencias(pendencias),
            ...notificacoesDaCarteira(clientes),
        ].sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0))
    }, [empresaId, papel])

    useEffect(() => {
        let ativa = true
        const carregar = async () => {
            try {
                const itens = await carregarNotificacoes()
                if (ativa) setNotificacoes(itens)
            } finally {
                if (ativa) setCarregando(false)
            }
        }

        carregar()
        const intervalo = window.setInterval(carregar, 60_000)
        return () => {
            ativa = false
            window.clearInterval(intervalo)
        }
    }, [carregarNotificacoes, location.pathname, atualizar])

    useEffect(() => {
        if (!aberta) return undefined
        const fecharFora = (evento) => {
            if (!raizRef.current?.contains(evento.target)) setAberta(false)
        }
        const fecharEscape = (evento) => {
            if (evento.key === 'Escape') setAberta(false)
        }
        document.addEventListener('pointerdown', fecharFora)
        document.addEventListener('keydown', fecharEscape)
        return () => {
            document.removeEventListener('pointerdown', fecharFora)
            document.removeEventListener('keydown', fecharEscape)
        }
    }, [aberta])

    function marcarLida(id) {
        const novasLidas = new Set(lidas)
        novasLidas.add(id)
        setLidas(novasLidas)
        salvarLidas(chaveLidas, novasLidas)
    }

    function marcarTodasLidas() {
        const novasLidas = new Set(lidas)
        notificacoes.forEach((item) => novasLidas.add(item.id))
        setLidas(novasLidas)
        salvarLidas(chaveLidas, novasLidas)
    }

    function abrirNotificacao(item) {
        marcarLida(item.id)
        setAberta(false)
        navigate(item.rota)
    }

    return (
        <div className="ag-notificacoes" ref={raizRef}>
            <button
                aria-expanded={aberta}
                aria-label={naoLidas.length
                    ? `Notificações, ${naoLidas.length} não lidas`
                    : 'Notificações, nenhuma não lida'}
                className="ag-dash-icone-botao ag-notificacoes-botao"
                onClick={() => setAberta((valor) => !valor)}
                type="button"
                title="Notificações"
            >
                <span aria-hidden="true" className="material-symbols-outlined">notifications</span>
                {naoLidas.length > 0 && (
                    <span className="ag-notificacoes-contador">
                        {naoLidas.length > 9 ? '9+' : naoLidas.length}
                    </span>
                )}
            </button>

            {aberta && (
                <section aria-label="Central de notificações" className="ag-notificacoes-painel">
                    <header className="ag-notificacoes-topo">
                        <div>
                            <h2>Notificações</h2>
                            <p>{naoLidas.length ? `${naoLidas.length} não lidas` : 'Tudo em dia'}</p>
                        </div>
                        <div className="ag-notificacoes-acoes">
                            <button
                                aria-label="Atualizar notificações"
                                disabled={carregando}
                                onClick={() => {
                                    setCarregando(true)
                                    setAtualizar((valor) => valor + 1)
                                }}
                                type="button"
                            >
                                <span aria-hidden="true" className="material-symbols-outlined">refresh</span>
                            </button>
                            <button
                                disabled={naoLidas.length === 0}
                                onClick={marcarTodasLidas}
                                type="button"
                            >
                                Marcar todas como lidas
                            </button>
                        </div>
                    </header>

                    <div className="ag-notificacoes-lista" aria-live="polite">
                        {carregando && notificacoes.length === 0 ? (
                            <p className="ag-notificacoes-vazio">Buscando notificações...</p>
                        ) : notificacoes.length === 0 ? (
                            <p className="ag-notificacoes-vazio">Nenhuma notificação por enquanto.</p>
                        ) : notificacoes.slice(0, 30).map((item) => (
                            <button
                                className={`ag-notificacoes-item ag-notificacoes-${item.tipo}${lidas.has(item.id) ? ' ag-notificacao-lida' : ''}`}
                                key={item.id}
                                onClick={() => abrirNotificacao(item)}
                                type="button"
                            >
                                <span aria-hidden="true" className="material-symbols-outlined ag-notificacoes-icone">
                                    {item.tipo === 'urgente' ? 'priority_high' : item.tipo === 'conta' ? 'event' : 'info'}
                                </span>
                                <span className="ag-notificacoes-texto">
                                    <strong>{item.titulo}</strong>
                                    <span>{item.descricao}</span>
                                    <small>{item.detalhe}</small>
                                </span>
                                {!lidas.has(item.id) && <span aria-label="Não lida" className="ag-notificacoes-ponto" />}
                            </button>
                        ))}
                    </div>
                    <footer className="ag-notificacoes-rodape">
                        Atualizadas automaticamente a cada minuto
                    </footer>
                </section>
            )}
        </div>
    )
}

export default CentralNotificacoes
