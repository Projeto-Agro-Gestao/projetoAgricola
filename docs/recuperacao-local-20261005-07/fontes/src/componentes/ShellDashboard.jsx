import { useState } from 'react'
import { NavLink } from 'react-router'
import ImagemCampo from './ImagemCampo.jsx'
import MarcaAgro, { IconeAgro } from './MarcaAgro.jsx'

const itens = [
    ['/dashboard', 'apps', 'Início'],
    ['/dashboard/financeiro', 'stacked_line_chart', 'Resumo financeiro'],
    ['/dashboard/movimentacoes', 'payments', 'Movimentações'],
    ['/dashboard/contas', 'account_balance_wallet', 'Contas a pagar e receber'],
    ['/dashboard/categorias', 'category', 'Categorias'],
    ['/dashboard/fornecedores', 'local_shipping', 'Fornecedores'],
    ['/dashboard/produtor', 'agriculture', 'Área do produtor'],
    ['/dashboard/agricola', 'eco', 'Safras e operações'],
    ['/contador', 'calculate', 'Área do contador'],
    ['/dashboard/perfil', 'person', 'Meu perfil'],
    ['/dashboard/plano', 'receipt_long', 'Meu plano'],
]

export default function ShellDashboard({ sessao, ativo, children }) {
    const [aberto, setAberto] = useState(false)
    const [busca, setBusca] = useState('')
    // The current application has one company per session; do not invent a property selector.
    const usuario = sessao?.usuario
    const administrador = ['ADMINISTRADOR', 'SUPER_ADMIN'].includes(usuario?.papel)
    const permitidos = itens.filter(([rota]) => rota !== '/contador' || administrador || usuario?.papel === 'CONTADOR')
    if (administrador) permitidos.push(['/admin', 'admin_panel_settings', 'Administração'], ['/admin/assinaturas', 'receipt_long', 'Assinaturas'])
    const normalizar = texto => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    const visiveis = permitidos.filter(([, , texto]) => normalizar(texto).includes(normalizar(busca)))
    return <div className="ag-shell" data-ativo={ativo}>
        <aside className="ag-sidebar">
            <MarcaAgro />
            <div className="ag-propriedade"><IconeAgro nome="agriculture" /><div><small>Propriedade atual</small><strong>{usuario?.nomeEmpresa || 'Sua propriedade'}</strong></div></div>
            <button type="button" className="ag-menu-mobile" aria-expanded={aberto} aria-controls="ag-navegacao" onClick={() => setAberto(!aberto)}><IconeAgro nome={aberto ? 'close' : 'menu'} /> Menu</button>
            <nav id="ag-navegacao" aria-label="Navegação da plataforma" className={aberto ? 'ag-nav aberta' : 'ag-nav'}>
                {visiveis.map(([rota, icone, texto]) => <NavLink key={rota} to={rota} end={rota === '/dashboard' || rota === '/admin'} onClick={() => setAberto(false)}><IconeAgro nome={icone} />{texto}</NavLink>)}
                {!visiveis.length && <p className="ag-nav-vazia">Nenhuma página encontrada.</p>}
            </nav>
            <figure className="ag-sidebar-campo">
                <ImagemCampo />
                <figcaption><IconeAgro nome="eco" /> Campo e gestão, lado a lado.</figcaption>
            </figure>
        </aside>
        <div className="ag-shell-area">
            <header className="ag-shell-header"><label className="ag-shell-busca"><IconeAgro nome="search" /><input aria-label="Buscar página no menu" type="search" placeholder="Buscar página no menu" value={busca} onChange={evento => { setBusca(evento.target.value); setAberto(true) }} /></label><div className="ag-shell-usuario"><IconeAgro nome="account_circle" /><span>{usuario?.nome || 'Minha conta'}</span></div></header>
            <div className="ag-shell-conteudo">{children}</div>
        </div>
    </div>
}
