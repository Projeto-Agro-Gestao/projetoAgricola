import { useState } from 'react'
import { Link } from 'react-router'
import {
    IconeAlerta,
    IconeCalendario,
    IconeCamadas,
    IconeCategoria,
    IconeCheck,
    IconeDocumento,
    IconeFechar,
    IconeFolha,
    IconeLista,
    IconeMenu,
    IconeSetaDireita,
} from './componentes/Icones.jsx'
import Revelar from './componentes/Revelar.jsx'
import InstalarApp from './componentes/InstalarApp.jsx'
import './App.css'

const recursos = [
    {
        icone: <IconeLista />,
        titulo: 'Movimentacoes financeiras',
        texto: 'Receitas e despesas da propriedade ficam organizadas em uma base unica para produtor e contador.',
    },
    {
        icone: <IconeDocumento />,
        titulo: 'Documentos vinculados',
        texto: 'Notas, recibos e comprovantes podem acompanhar a movimentacao correspondente.',
    },
    {
        icone: <IconeAlerta />,
        titulo: 'Pendencias visiveis',
        texto: 'O contador acompanha o que falta e solicita informacoes ao produtor dentro do contexto correto.',
    },
    {
        icone: <IconeCategoria />,
        titulo: 'Classificacao contabil',
        texto: 'Categorias financeiras e tratamentos fiscais ficam separados para evitar conclusoes automaticas.',
    },
    {
        icone: <IconeCamadas />,
        titulo: 'Propriedades e atividades',
        texto: 'A leitura pode considerar propriedade, atividade rural, fornecedor, categoria e periodo.',
    },
    {
        icone: <IconeCalendario />,
        titulo: 'Rotina durante o ano',
        texto: 'As informacoes chegam ao contador aos poucos, antes de virar uma correria no fechamento.',
    },
]

function PaginaInicial() {
    const [menuAberto, setMenuAberto] = useState(false)

    function fecharMenu() {
        setMenuAberto(false)
    }

    return (
        <div className="publica">
            <header className="publica-cabecalho">
                <Link className="publica-marca" to="/">
                    <span className="publica-marca-icone">
                        <IconeFolha />
                    </span>
                    <span>AgroGestao</span>
                </Link>

                <nav className="publica-menu" aria-label="Principal">
                    <a href="#produtores">Para produtores</a>
                    <a href="#contadores">Para contadores</a>
                    <a href="#como-funciona">Como funciona</a>
                    <a href="#recursos">Recursos</a>
                </nav>

                <div className="publica-acoes">
                    <Link className="publica-entrar" to="/login">
                        Entrar
                    </Link>

                    <Link className="publica-botao publica-botao-pequeno" to="/cadastro">
                        Quero conhecer
                    </Link>

                    <button
                        aria-expanded={menuAberto}
                        aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
                        className="publica-menu-mobile-botao"
                        onClick={() => setMenuAberto((valorAtual) => !valorAtual)}
                        type="button"
                    >
                        {menuAberto ? <IconeFechar /> : <IconeMenu />}
                    </button>
                </div>

                {menuAberto && (
                    <nav className="publica-menu-mobile" aria-label="Menu mobile">
                        <a href="#produtores" onClick={fecharMenu}>
                            Para produtores
                        </a>
                        <a href="#contadores" onClick={fecharMenu}>
                            Para contadores
                        </a>
                        <a href="#como-funciona" onClick={fecharMenu}>
                            Como funciona
                        </a>
                        <a href="#recursos" onClick={fecharMenu}>
                            Recursos
                        </a>
                    </nav>
                )}
            </header>

            <main>
                <section className="publica-hero">
                    <div className="publica-hero-texto">
                        <span className="publica-etiqueta">
                            Gestao financeira rural para produtores e contadores
                        </span>

                        <h1>
                            Produtor organizado.
                            <br />
                            {' '}
                            Contador com tudo na mao.
                        </h1>

                        <p>
                            Conecte produtor rural e escritorio contabil durante
                            todo o ano. Movimentacoes, documentos, pendencias e
                            informacoes da propriedade em uma unica plataforma.
                        </p>

                        <div className="publica-hero-acoes">
                            <Link className="publica-botao publica-botao-grande" to="/cadastro">
                                Quero conhecer a plataforma
                                <span>
                                    <IconeSetaDireita />
                                </span>
                            </Link>

                            <a className="publica-botao-secundario" href="#produtores">
                                Sou produtor rural
                            </a>
                        </div>
                    </div>

                    <div className="publica-hero-visual" aria-label="Previa ilustrativa da plataforma">
                        <div className="publica-flutuante publica-flutuante-a">
                            <strong>3 documentos pendentes</strong>
                            <span>visiveis para o contador</span>
                        </div>

                        <div className="publica-flutuante publica-flutuante-b">
                            <strong>Produtor atualizado</strong>
                            <span>movimentacoes enviadas</span>
                        </div>

                        <div className="publica-app-mockup">
                            <div className="publica-app-topo">
                                <span>Carteira rural</span>
                                <strong>Setembro</strong>
                            </div>

                            <div className="publica-app-grid">
                                <article>
                                    <small>Receitas</small>
                                    <strong>R$ 150.000</strong>
                                    <span>vendas registradas</span>
                                </article>
                                <article>
                                    <small>Despesas</small>
                                    <strong>R$ 85.000</strong>
                                    <span>com documentos</span>
                                </article>
                                <article>
                                    <small>Resultado</small>
                                    <strong>R$ 65.000</strong>
                                    <span>financeiro</span>
                                </article>
                            </div>

                            <div className="publica-app-linha">
                                <span className="publica-ponto publica-ponto-verde" />
                                <div>
                                    <strong>Compra de fertilizante</strong>
                                    <small>Documento vinculado · Fazenda Boa Vista</small>
                                </div>
                                <b>R$ 8.500</b>
                            </div>

                            <div className="publica-app-linha">
                                <span className="publica-ponto publica-ponto-lima" />
                                <div>
                                    <strong>Venda da producao</strong>
                                    <small>Receita enviada ao contador</small>
                                </div>
                                <b>R$ 30.000</b>
                            </div>

                            <div className="publica-app-rodape">
                                <span>2 propriedades</span>
                                <span>11 movimentacoes</span>
                                <span>5 documentos</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="publica-faixa-confianca">
                    <span>Feito para a rotina financeira do produtor rural.</span>
                    <div>
                        <b>Agricultura</b>
                        <b>Pecuaria</b>
                        <b>Receitas</b>
                        <b>Despesas</b>
                        <b>Documentos</b>
                        <b>Contadores</b>
                    </div>
                </section>

                <section className="publica-problema">
                    <Revelar className="publica-secao-editorial">
                        <span className="publica-etiqueta">O problema</span>
                        <h2>Hoje, produtor e contador ainda trabalham separados.</h2>
                        <p>
                            O produtor registra informacoes de um lado, guarda
                            documentos em outro e muitas vezes precisa enviar
                            tudo ao contador de forma manual. O contador recebe
                            dados espalhados, cobra documentos e organiza tudo
                            antes de conseguir analisar.
                        </p>
                    </Revelar>

                    <Revelar className="publica-fluxo-antigo">
                        <span>Produtor</span>
                        <i>WhatsApp</i>
                        <i>Planilhas</i>
                        <i>Fotos</i>
                        <i>E-mails</i>
                        <span>Contador</span>
                        <strong>Organizacao manual</strong>
                    </Revelar>
                </section>

                <section className="publica-ponte" id="como-funciona">
                    <Revelar className="publica-ponte-texto">
                        <span className="publica-etiqueta">A nova forma de trabalhar</span>
                        <h2>Uma ponte entre o produtor e o contador.</h2>
                        <p>
                            O produtor registra e envia informacoes durante o
                            ano. A plataforma organiza. O contador acompanha,
                            solicita o que falta, classifica e trabalha com tudo
                            mais claro.
                        </p>
                    </Revelar>

                    <Revelar className="publica-ponte-visual">
                        <article>
                            <small>Produtor</small>
                            <strong>Registra a rotina</strong>
                            <span>Receitas, despesas e documentos</span>
                        </article>

                        <div className="publica-ponte-centro">
                            <strong>AgroGestao</strong>
                            <div>
                                <span>Movimentacoes</span>
                                <span>Documentos</span>
                                <span>Pendencias</span>
                                <span>Propriedades</span>
                                <span>Categorias</span>
                                <span>Financeiro</span>
                            </div>
                        </div>

                        <article>
                            <small>Contador</small>
                            <strong>Analisa e valida</strong>
                            <span>Classificacao, documentos e simulacoes</span>
                        </article>
                    </Revelar>
                </section>

                <section className="publica-contador" id="contadores">
                    <Revelar className="publica-contador-copy">
                        <span className="publica-etiqueta">Para contadores</span>
                        <h2>Seu escritorio acompanha todos os produtores em um so lugar.</h2>
                        <p>
                            Veja quem precisa de atencao, quais documentos
                            chegaram, o que esta sem classificacao e como esta o
                            resultado financeiro dos produtores vinculados.
                        </p>

                        <ul>
                            <li>Acompanhe varios produtores sem planilhas paralelas.</li>
                            <li>Solicite documentos dentro do contexto da movimentacao.</li>
                            <li>Reduza trocas soltas de mensagem ao longo do ano.</li>
                            <li>Trabalhe com dados que ja chegam organizados.</li>
                        </ul>
                    </Revelar>

                    <Revelar className="publica-carteira-mockup">
                        <div className="publica-carteira-topo">
                            <div>
                                <small>Meus produtores</small>
                                <strong>Carteira do escritorio</strong>
                            </div>
                            <span>47 produtores</span>
                        </div>

                        <div className="publica-carteira-metricas">
                            <article>
                                <strong>31</strong>
                                <span>em dia</span>
                            </article>
                            <article>
                                <strong>8</strong>
                                <span>com documentos pendentes</span>
                            </article>
                            <article>
                                <strong>5</strong>
                                <span>aguardando classificacao</span>
                            </article>
                        </div>

                        <div className="publica-tabela">
                            {[
                                ['Fazenda Boa Vista', 'Em dia', '4 docs', 'hoje'],
                                ['Sitio Santa Clara', 'Pendencia', '2 docs', 'ontem'],
                                ['Agro Vale Norte', 'Revisar', '7 docs', '2 dias'],
                            ].map(([nome, status, docs, data]) => (
                                <div key={nome}>
                                    <strong>{nome}</strong>
                                    <span>{status}</span>
                                    <span>{docs}</span>
                                    <small>{data}</small>
                                </div>
                            ))}
                        </div>
                    </Revelar>
                </section>

                <section className="publica-cta-meio">
                    <Revelar>
                        <h2>Seu escritorio ainda precisa correr atras das informacoes?</h2>
                        <p>
                            Centralize seus produtores e acompanhe as informacoes
                            ao longo do ano.
                        </p>
                        <Link to="/cadastro">Quero conhecer para meu escritorio</Link>
                    </Revelar>
                </section>

                <section className="publica-produtor" id="produtores">
                    <Revelar className="publica-mobile-mockup">
                        <div className="publica-celular">
                            <div className="publica-celular-topo" />
                            <strong>Inicio do produtor</strong>
                            <div className="publica-celular-card">
                                <span>Receitas do mes</span>
                                <b>R$ 30.000</b>
                            </div>
                            <div className="publica-celular-card">
                                <span>Despesas</span>
                                <b>R$ 12.000</b>
                            </div>
                            <button type="button">Enviar documento</button>
                            <small>Pendencia do contador: nota de combustivel</small>
                        </div>
                    </Revelar>

                    <Revelar className="publica-produtor-copy">
                        <span className="publica-etiqueta">Para produtores</span>
                        <h2>O produtor registra. O contador acompanha.</h2>
                        <p>
                            Uma experiencia simples para registrar o dia a dia
                            da propriedade, enviar documentos e responder
                            solicitacoes sem precisar entender de contabilidade.
                        </p>
                        <Link className="publica-botao-secundario" to="/cadastro">
                            Quero organizar minha propriedade
                        </Link>
                    </Revelar>
                </section>

                <section className="publica-jornada">
                    <Revelar className="publica-secao-editorial publica-secao-centro">
                        <span className="publica-etiqueta">Como funciona</span>
                        <h2>Uma jornada unica, com visoes diferentes.</h2>
                        <p>
                            O dado nasce no produtor e segue para documentos,
                            classificacao, pendencias e analise do contador.
                        </p>
                    </Revelar>

                    <div className="publica-jornada-grid">
                        {[
                            ['Propriedade', 'Cadastre a empresa rural e suas atividades.'],
                            ['Movimentacoes', 'Registre receitas e despesas uma unica vez.'],
                            ['Documentos', 'Anexe notas, recibos e comprovantes.'],
                            ['Contador', 'Acompanhe pendencias, classificacoes e simulacoes.'],
                        ].map(([titulo, texto]) => (
                            <Revelar as="article" key={titulo}>
                                <span>
                                    <IconeCheck />
                                </span>
                                <h3>{titulo}</h3>
                                <p>{texto}</p>
                            </Revelar>
                        ))}
                    </div>
                </section>

                <section className="publica-recursos" id="recursos">
                    <Revelar className="publica-secao-editorial">
                        <span className="publica-etiqueta">Recursos</span>
                        <h2>Financeiro rural conectado ao processo contabil.</h2>
                        <p>
                            Nao e um fluxo de caixa isolado. E uma base
                            organizada para produtor e contador trabalharem com
                            as mesmas informacoes.
                        </p>
                    </Revelar>

                    <div className="publica-recursos-grid">
                        {recursos.map((recurso) => (
                            <Revelar as="article" key={recurso.titulo}>
                                <span>{recurso.icone}</span>
                                <h3>{recurso.titulo}</h3>
                                <p>{recurso.texto}</p>
                            </Revelar>
                        ))}
                    </div>
                </section>

                <section className="publica-diferencial">
                    <Revelar>
                        <span className="publica-etiqueta">Diferencial</span>
                        <h2>Chega de organizar tudo quando o ano termina.</h2>
                        <p>
                            Quando produtor e contador trabalham conectados
                            durante o ano, as informacoes chegam mais
                            organizadas, as pendencias aparecem antes e o
                            trabalho deixa de ficar concentrado em um unico
                            momento.
                        </p>
                    </Revelar>
                </section>

                <section className="publica-publicos">
                    <Revelar className="publica-publico-produtor">
                        <span>Para produtores</span>
                        <h2>Mais controle sobre o financeiro da propriedade.</h2>
                        <p>
                            Registre movimentacoes, acompanhe resultado e envie
                            documentos ao contador sem retrabalho.
                        </p>
                        <Link to="/cadastro">Conhecer como produtor</Link>
                    </Revelar>

                    <Revelar className="publica-publico-contador">
                        <span>Para contadores</span>
                        <h2>Mais organizacao para acompanhar sua carteira.</h2>
                        <p>
                            Veja produtores, pendencias, documentos e dados
                            financeiros em uma visao preparada para analise.
                        </p>
                        <Link to="/cadastro">Conhecer para meu escritorio</Link>
                    </Revelar>
                </section>

                <section className="publica-cta-final">
                    <Revelar>
                        <h2>
                            Organize a rotina financeira do produtor e simplifique
                            o trabalho do contador.
                        </h2>
                        <p>
                            Uma plataforma para manter produtor e contador
                            conectados durante todo o ano.
                        </p>
                        <div>
                            <Link className="publica-botao publica-botao-claro" to="/cadastro">
                                Quero conhecer a plataforma
                            </Link>
                            <Link className="publica-botao-secundario publica-link-claro" to="/cadastro">
                                Sou produtor rural
                            </Link>
                        </div>
                    </Revelar>
                </section>
            </main>

            <footer className="publica-rodape">
                <Link className="publica-marca" to="/">
                    <span className="publica-marca-icone">
                        <IconeFolha />
                    </span>
                    <span>AgroGestao</span>
                </Link>

                <nav>
                    <a href="#produtores">Para produtores</a>
                    <a href="#contadores">Para contadores</a>
                    <a href="#recursos">Recursos</a>
                    <a href="#como-funciona">Como funciona</a>
                    <Link to="/login">Entrar</Link>
                </nav>

                <p>© 2026 AgroGestao. Todos os direitos reservados.</p>

                <div>
                    <span>Termos de uso</span>
                    <span>Politica de privacidade</span>
                </div>
            </footer>

            <InstalarApp />
        </div>
    )
}

export default PaginaInicial
