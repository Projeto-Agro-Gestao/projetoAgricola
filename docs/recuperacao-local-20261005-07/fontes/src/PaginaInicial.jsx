import { useState } from 'react'
import { Link } from 'react-router'
import MarcaAgro, { IconeAgro } from './componentes/MarcaAgro.jsx'
import ImagemCampo from './componentes/ImagemCampo.jsx'
import './App.css'

const recursos = [
    ['payments', 'Receitas e despesas', 'Registre valores, datas e observações para acompanhar as finanças do campo.'],
    ['receipt_long', 'Movimentações organizadas', 'Consulte o histórico de lançamentos da sua propriedade.'],
    ['category', 'Categorias da sua atividade', 'Organize agricultura e pecuária com categorias personalizadas.'],
    ['stacked_line_chart', 'Resumo financeiro', 'Acompanhe receitas, despesas e saldo calculados com seus registros.'],
    ['account_balance_wallet', 'Contas a pagar e receber', 'Organize compromissos e recebimentos nos módulos da plataforma.'],
    ['local_shipping', 'Fornecedores', 'Mantenha os cadastros utilizados na rotina financeira em um só lugar.'],
]

export default function PaginaInicial() {
    const [secaoAtiva, setSecaoAtiva] = useState('inicio')
    return <div className="publica ag-landing">
        <header className="publica-cabecalho">
            <MarcaAgro />
            <nav className="publica-menu" aria-label="Navegação do site">
                {[['inicio', 'Início'], ['produtores', 'Para produtores'], ['contadores', 'Para contadores'], ['recursos', 'Recursos'], ['faq', 'FAQ']].map(([secao, texto]) => <a key={secao} href={`#${secao}`} aria-current={secaoAtiva === secao ? 'location' : undefined} onClick={() => setSecaoAtiva(secao)}>{texto}</a>)}
            </nav>
            <div className="publica-acoes"><Link className="publica-botao" to="/cadastro">Quero conhecer</Link><Link className="publica-entrar" to="/login">Entrar</Link></div>
        </header>
        <main>
            <section className="publica-inicio" id="inicio">
                <div className="publica-inicio-conteudo">
                    <span className="publica-etiqueta"><IconeAgro nome="sensors" /> Gestão rural conectada</span>
                    <h1><strong>Mais controle</strong> no campo.<br />{' '}Menos papelada no escritório.</h1>
                    <p>Organize receitas, despesas e informações em um só lugar. Você acompanha sua fazenda e seu contador trabalha com informações mais organizadas.</p>
                    <div className="publica-inicio-botoes"><Link className="publica-botao" to="/cadastro">Quero conhecer a Agro Gestão <IconeAgro nome="arrow_forward" /></Link><a className="publica-botao-secundario" href="#financeiro"><IconeAgro nome="play_circle" /> Como funciona</a></div>
                </div>
                <div className="ag-previa" aria-label="Apresentação dos recursos da plataforma">
                    <div className="ag-previa-topo"><IconeAgro nome="eco" /><span>Agro Gestão | Sua propriedade</span></div>
                    <div className="ag-previa-resumo">{[['Receitas', 'payments', 'Organize suas entradas'], ['Despesas', 'receipt_long', 'Acompanhe seus gastos'], ['Resultado', 'stacked_line_chart', 'Entenda seu saldo']].map(([titulo, icone, descricao]) => <article key={titulo}><IconeAgro nome={icone} /><h3>{titulo}</h3><p>{descricao}</p></article>)}</div>
                    <ImagemCampo className="ag-landing-foto" prioritaria /><div className="ag-previa-vazio"><IconeAgro nome="monitoring" /><h3>Seu fluxo de caixa, mais claro</h3><p>Registre receitas e despesas para acompanhar a evolução das finanças da propriedade.</p></div>
                    <div className="ag-previa-aviso"><IconeAgro nome="folder_open" /><div><strong>Informações em um só lugar</strong><p>Consulte seus lançamentos e cadastros.</p></div></div>
                    <span className="ag-previa-flutuante"><IconeAgro nome="agriculture" /><span>Do campo à gestão<br /><small>Uma rotina mais organizada</small></span></span>
                </div>
            </section>
            <section className="ag-publica-secao ag-publica-alternada" id="produtores">
                <div className="publica-secao-titulo"><span className="ag-eyebrow">A rotina do campo e do escritório</span><h2>Chega de perder tempo procurando informações.</h2><p>Uma visão organizada para cuidar das finanças da sua propriedade.</p></div>
                <div className="ag-publica-dupla"><article className="ag-publica-card"><IconeAgro nome="agriculture" /><h3>Para o Produtor</h3><p>Lançamentos financeiros, categorias por atividade e acompanhamento dos resultados com seus próprios dados.</p><Link to="/cadastro">Organizar minha propriedade <IconeAgro nome="arrow_forward" /></Link></article><article className="ag-publica-card" id="contadores"><IconeAgro nome="calculate" /><h3>Para o Contador</h3><p>Acompanhe os produtores na área do contador, respeitando os acessos e permissões da plataforma.</p><Link to="/login">Acessar a plataforma <IconeAgro nome="arrow_forward" /></Link></article></div>
            </section>
            <section className="ag-publica-secao" id="recursos"><div className="publica-secao-titulo"><span className="ag-eyebrow">Recursos</span><h2>Mais organização para cada etapa da gestão</h2></div><div className="publica-grade-recursos">{recursos.map(([icone, titulo, texto]) => <article key={titulo}><span className="publica-recurso-icone"><IconeAgro nome={icone} /></span><h3>{titulo}</h3><p>{texto}</p></article>)}</div></section>
            <section className="ag-publica-secao ag-publica-alternada" id="financeiro"><div className="publica-secao-titulo"><span className="ag-eyebrow">Como funciona</span><h2>Do registro à visão dos resultados</h2></div><div className="ag-publica-passos">{[['Crie sua conta', 'Informe os dados da propriedade e suas atividades.'], ['Organize a rotina', 'Cadastre categorias, fornecedores e movimentações.'], ['Acompanhe os resultados', 'Consulte os indicadores calculados com seus registros.']].map(([titulo, texto], i) => <article className="ag-publica-card" key={titulo}><span className="ag-passo-numero">{i + 1}</span><h3>{titulo}</h3><p>{texto}</p></article>)}</div></section>
            <section className="ag-publica-secao" id="faq"><div className="publica-secao-titulo"><span className="ag-eyebrow">Dúvidas frequentes</span><h2>Conheça a plataforma</h2></div><div className="ag-faq"><details><summary>Posso usar para agricultura e pecuária?</summary><p>Sim. O cadastro permite definir as atividades da propriedade e organizar as categorias correspondentes.</p></details><details><summary>De onde vêm os indicadores financeiros?</summary><p>Os indicadores são calculados a partir dos registros da sua conta. Nenhum resultado financeiro é inventado.</p></details><details><summary>Como acesso pelo celular?</summary><p>A plataforma se adapta ao celular. Você também pode acessar a <Link to="/app">versão app</Link>.</p></details></div></section>
            <section className="publica-chamada"><h2>Comece a organizar as finanças da propriedade</h2><p>Tenha suas informações à mão para acompanhar a rotina do campo.</p><Link className="publica-botao" to="/cadastro">Criar minha conta <IconeAgro nome="arrow_forward" /></Link></section>
        </main>
        <footer className="publica-rodape"><MarcaAgro /><span>© {new Date().getFullYear()} Agro Gestão</span><div><Link to="/login">Entrar</Link><Link to="/app">Versão app</Link></div></footer>
    </div>
}
