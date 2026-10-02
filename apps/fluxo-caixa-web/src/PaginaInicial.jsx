import { Link } from 'react-router'
import {
    motion,
    useReducedMotion,
} from 'motion/react'
import {
    IconeAlerta,
    IconeCalendario,
    IconeCamadas,
    IconeCategoria,
    IconeChat,
    IconeCheck,
    IconeDocumento,
    IconeEmail,
    IconeEngrenagem,
    IconeFolha,
    IconeLista,
    IconePlanilha,
    IconeSetaDireita,
} from './componentes/Icones.jsx'
import CabecalhoPublico from './componentes/CabecalhoPublico.jsx'
import RodapePublico from './componentes/RodapePublico.jsx'
import Revelar from './componentes/Revelar.jsx'
import InstalarApp from './componentes/InstalarApp.jsx'
import './App.css'

const itensOrbita = [
    { icone: <IconeChat />, rotulo: 'WhatsApp', cor: '#22c55e' },
    { icone: <IconePlanilha />, rotulo: 'Planilhas', cor: '#16a34a' },
    { icone: <IconeEmail />, rotulo: 'E-mails', cor: '#3b82f6' },
    {
        icone: <IconeEngrenagem className="publica-orbita-girar" />,
        rotulo: (
                            <>
                                Organização
                                <br />
                                manual
                            </>
                        ),
        cor: '#4b5563',
    },
    {
        icone: <IconeDocumento />,
        rotulo: (
                            <>
                                Notas &
                                <br />
                                Recibos
                            </>
                        ),
        cor: '#f59e0b',
    },
]

const LinkAnimado = motion.create(Link)

const heroiContainer = {
    oculto: {},
    visivel: {
        transition: { staggerChildren: 0.12, delayChildren: 0.15 },
    },
}

const heroiItem = {
    oculto: { opacity: 0, y: 28 },
    visivel: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
}

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
    const reduzirMovimento = useReducedMotion()

    return (
        <div className="publica">
            <CabecalhoPublico />

            <main>
                <section className="publica-hero">
                    <motion.div
                        animate="visivel"
                        className="publica-hero-texto"
                        initial={reduzirMovimento ? 'visivel' : 'oculto'}
                        variants={heroiContainer}
                    >
                        <motion.span
                            className="publica-etiqueta"
                            variants={heroiItem}
                        >
                            Gestao financeira rural para produtores e contadores
                        </motion.span>

                        <motion.h1 variants={heroiItem}>
                            Produtor organizado.
                            <br />
                            {' '}
                            Contador com tudo na mão.
                        </motion.h1>

                        <motion.p variants={heroiItem}>
                            Conecte produtor rural e escritorio contabil durante
                            todo o ano. Movimentacoes, documentos, pendencias e
                            informacoes da propriedade em uma unica plataforma.
                        </motion.p>

                        <motion.div
                            className="publica-hero-acoes"
                            variants={heroiItem}
                        >
                            <LinkAnimado
                                className="publica-botao publica-botao-grande"
                                to="/cadastro"
                                whileHover={reduzirMovimento ? undefined : { y: -2 }}
                                whileTap={reduzirMovimento ? undefined : { scale: 0.98 }}
                            >
                                Quero conhecer a plataforma
                                <span>
                                    <IconeSetaDireita />
                                </span>
                            </LinkAnimado>

                            <a className="publica-botao-secundario" href="#produtores">
                                Sou produtor rural
                            </a>
                        </motion.div>
                    </motion.div>

                    <div className="publica-hero-visual" aria-label="Previa ilustrativa da plataforma">
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

                <section className="publica-problema">
                    <Revelar className="publica-secao-editorial">
                        <h2>Hoje, produtor e contador ainda trabalham separados.</h2>
                        <p>
                            O produtor registra informações de um lado, guarda
                            documentos em outro e muitas vezes precisa enviar
                            tudo ao contador de forma manual. O contador recebe
                            dados espalhados, cobra documentos e organiza tudo
                            antes de conseguir analisar.
                        </p>
                    </Revelar>

                    <Revelar className="publica-orbita" aria-label="Canais espalhados entre produtor e contador">
                        <div className="publica-orbita-cenario">
                            <div className="publica-orbita-figura publica-orbita-flutuar-a">
                                <img
                                    alt="Produtor rural"
                                    className="publica-avatar publica-avatar-foto"
                                    src="/produtor.jpg"
                                />
                                <b>Produtor</b>
                                <small>No campo</small>
                            </div>

                            <div className="publica-orbita-meio">
                                <div className="publica-orbita-anel" aria-hidden="true" />
                                <div className="publica-orbita-linha-conexao" aria-hidden="true" />

                                {itensOrbita.map((item, indice) => (
                                    <div
                                        aria-hidden="true"
                                        className={`publica-orbita-ponto publica-orbita-atraso-${indice + 1}`}
                                        key={indice}
                                    >
                                        <div
                                            className="publica-orbita-item"
                                            style={{ color: item.cor }}
                                        >
                                            {item.icone}
                                            <small style={{ color: item.cor }}>{item.rotulo}</small>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="publica-orbita-figura publica-orbita-flutuar-b">
                                <img
                                    alt="Contador"
                                    className="publica-avatar publica-avatar-foto"
                                    src="/contador.jpg"
                                />
                                <b>Contador</b>
                                <small>No escritório</small>
                            </div>
                        </div>
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
                        ].map(([titulo, texto], indice) => (
                            <Revelar as="article" atraso={indice * 80} key={titulo}>
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
                        {recursos.map((recurso, indice) => (
                            <Revelar as="article" atraso={(indice % 2) * 80} key={recurso.titulo}>
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

            <RodapePublico />

            <InstalarApp />
        </div>
    )
}

export default PaginaInicial
