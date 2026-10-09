import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { API_BASE_URL } from '../config.js'
import { apiFetch } from '../servicos/api.js'
import './BuscaGlobal.css'

const icones = {
    MODULO: 'apps',
    MOVIMENTACAO: 'payments',
    CONTA: 'event_note',
    FORNECEDOR: 'local_shipping',
    DOCUMENTO: 'description',
    PROPRIEDADE: 'agriculture',
}

const modulosBase = [
    { id: 'visao-geral', titulo: 'Visão geral', descricao: 'Resumo da sua operação', rota: '/dashboard', termos: 'início painel resumo' },
    { id: 'financeiro', titulo: 'Financeiro', descricao: 'Fluxo de caixa e indicadores', rota: '/dashboard/financeiro', termos: 'caixa receitas despesas' },
    { id: 'lancamentos', titulo: 'Lançamentos', descricao: 'Receitas e despesas', rota: '/dashboard/movimentacoes', termos: 'movimentações operações transações' },
    { id: 'contas', titulo: 'Contas', descricao: 'Contas a pagar e a receber', rota: '/dashboard/contas', termos: 'pagamentos recebimentos vencimentos' },
    { id: 'fornecedores', titulo: 'Fornecedores', descricao: 'Cadastro e compras', rota: '/dashboard/fornecedores', termos: 'compras parceiros' },
    { id: 'produtor', titulo: 'Produtor rural', descricao: 'Documentos, propriedades e atividades', rota: '/dashboard/produtor', termos: 'propriedades documentos atividades produtor' },
    { id: 'fiscal', titulo: 'Fiscal', descricao: 'Carteira contábil e informações fiscais', rota: '/contador', termos: 'lcdpr contador fiscal tributário' },
    { id: 'categorias', titulo: 'Categorias', descricao: 'Organização financeira', rota: '/dashboard/categorias', termos: 'categorias classificação' },
    { id: 'plano', titulo: 'Plano e pagamentos', descricao: 'Assinatura e cobrança', rota: '/dashboard/plano', termos: 'plano assinatura cobrança pagamento' },
    { id: 'configuracoes', titulo: 'Configurações', descricao: 'Perfil e preferências da conta', rota: '/dashboard/perfil', termos: 'configurações perfil conta' },
]

function normalizarBusca(valor) {
    return valor
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('pt-BR')
}

function BuscaGlobal({ sessao }) {
    const navigate = useNavigate()
    const raizRef = useRef(null)
    const inputRef = useRef(null)
    const empresaId = sessao.usuario.empresaId
    const administrador = ['ADMINISTRADOR', 'SUPER_ADMIN'].includes(sessao.usuario.papel)
    const [aberta, setAberta] = useState(false)
    const [termo, setTermo] = useState('')
    const [resultados, setResultados] = useState([])
    const [carregando, setCarregando] = useState(false)
    const [erro, setErro] = useState('')
    const modulosDisponiveis = administrador
        ? [
            { id: 'admin', titulo: 'Painel administrativo', descricao: 'Usuários e acessos', rota: '/admin', termos: 'admin usuários acessos' },
            { id: 'assinaturas', titulo: 'Assinaturas', descricao: 'Planos e pagamentos de clientes', rota: '/admin/assinaturas', termos: 'admin planos pagamentos' },
            { id: 'integracoes', titulo: 'Integrações oficiais', descricao: 'Configuração de integrações', rota: '/admin/integracoes', termos: 'admin integrações oficiais' },
            ...modulosBase,
        ]
        : modulosBase
    const consultaNormalizada = normalizarBusca(termo.trim())
    const atalhos = consultaNormalizada.length >= 2
        ? modulosDisponiveis
            .filter((modulo) => normalizarBusca(`${modulo.titulo} ${modulo.termos}`).includes(consultaNormalizada))
            .map((modulo) => ({ ...modulo, tipo: 'MODULO' }))
        : []

    useEffect(() => {
        const atalho = (evento) => {
            if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'k') {
                evento.preventDefault()
                setAberta(true)
            }
            if (evento.key === 'Escape') setAberta(false)
        }
        window.addEventListener('keydown', atalho)
        return () => window.removeEventListener('keydown', atalho)
    }, [])

    useEffect(() => {
        if (!aberta) return undefined
        inputRef.current?.focus()
        const fecharFora = (evento) => {
            if (!raizRef.current?.contains(evento.target)) setAberta(false)
        }
        document.addEventListener('pointerdown', fecharFora)
        return () => document.removeEventListener('pointerdown', fecharFora)
    }, [aberta])

    useEffect(() => {
        const consulta = termo.trim()
        if (!aberta || consulta.length < 2 || !empresaId) return undefined

        let ativa = true
        const atraso = window.setTimeout(async () => {
            setCarregando(true)
            setErro('')
            try {
                const query = new URLSearchParams({ q: consulta })
                const resposta = await apiFetch(
                    `${API_BASE_URL}/empresas/${empresaId}/busca-global?${query}`,
                )
                if (!resposta.ok) throw new Error('Não foi possível realizar a busca.')
                const dados = await resposta.json()
                if (ativa) setResultados(Array.isArray(dados) ? dados : dados.resultados ?? [])
            } catch (falha) {
                if (ativa) setErro(falha.message || 'Erro ao buscar.')
            } finally {
                if (ativa) setCarregando(false)
            }
        }, 250)

        return () => {
            ativa = false
            window.clearTimeout(atraso)
        }
    }, [aberta, empresaId, termo])

    function abrirResultado(resultado) {
        setAberta(false)
        setTermo('')
        navigate(resultado.rota)
    }

    return (
        <div className="ag-busca-global" ref={raizRef}>
            <button
                aria-expanded={aberta}
                aria-haspopup="dialog"
                className="ag-dash-busca"
                onClick={() => setAberta(true)}
                type="button"
            >
                <span aria-hidden="true" className="material-symbols-outlined">search</span>
                <span>Buscar operações, documentos, movimentações...</span>
                <kbd>Ctrl K</kbd>
            </button>

            {aberta && (
                <section aria-label="Busca global" className="ag-busca-global-painel" role="dialog">
                    <label className="ag-busca-global-campo">
                        <span aria-hidden="true" className="material-symbols-outlined">search</span>
                        <input
                            autoComplete="off"
                            onChange={(evento) => {
                                const novoTermo = evento.target.value
                                setTermo(novoTermo)
                                setResultados([])
                                setCarregando(novoTermo.trim().length >= 2 && Boolean(empresaId))
                                setErro('')
                            }}
                            placeholder="Busque operações, documentos, movimentações..."
                            ref={inputRef}
                            type="search"
                            value={termo}
                        />
                        <kbd>ESC</kbd>
                    </label>
                    <div aria-live="polite" className="ag-busca-global-resultados">
                        {!termo.trim() ? (
                            <p>Digite ao menos 2 caracteres para buscar.</p>
                        ) : (
                            <>
                                {atalhos.map((resultado) => (
                                    <button
                                        className="ag-busca-global-resultado ag-busca-global-modulo"
                                        key={`MODULO:${resultado.id}`}
                                        onClick={() => abrirResultado(resultado)}
                                        type="button"
                                    >
                                        <span aria-hidden="true" className="material-symbols-outlined">
                                            {icones.MODULO}
                                        </span>
                                        <span className="ag-busca-global-resultado-texto">
                                            <strong>{resultado.titulo}</strong>
                                            <small>{resultado.descricao}</small>
                                        </span>
                                        <span className="ag-busca-global-tipo">MÓDULO</span>
                                    </button>
                                ))}
                                {carregando && <p>Buscando registros...</p>}
                                {!carregando && erro && <p role="alert">{erro}</p>}
                                {!carregando && !erro && resultados.length === 0 && atalhos.length === 0 && (
                                    <p>Nenhum módulo ou registro encontrado.</p>
                                )}
                                {!erro && resultados.map((resultado) => (
                            <button
                                className="ag-busca-global-resultado"
                                key={`${resultado.tipo}:${resultado.id}`}
                                onClick={() => abrirResultado(resultado)}
                                type="button"
                            >
                                <span aria-hidden="true" className="material-symbols-outlined">
                                    {icones[resultado.tipo] || 'search'}
                                </span>
                                <span className="ag-busca-global-resultado-texto">
                                    <strong>{resultado.titulo}</strong>
                                    <small>{resultado.descricao}</small>
                                </span>
                                <span className="ag-busca-global-tipo">{resultado.tipo}</span>
                            </button>
                                ))}
                            </>
                        )}
                    </div>
                    <footer>Resultados limitados aos dados da sua empresa</footer>
                </section>
            )}
        </div>
    )
}

export default BuscaGlobal
