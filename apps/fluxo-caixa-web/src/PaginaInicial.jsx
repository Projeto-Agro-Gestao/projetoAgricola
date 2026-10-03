import { Link } from 'react-router'
import CabecalhoPublico from './componentes/CabecalhoPublico.jsx'
import RodapePublico from './componentes/RodapePublico.jsx'
import Revelar from './componentes/Revelar.jsx'
import InstalarApp from './componentes/InstalarApp.jsx'
import './App.css'

// Ícone Material Symbols Outlined (webfont carregada em index.css).
function Icone({ nome, tamanho }) {
    return (
        <span
            aria-hidden="true"
            className="material-symbols-outlined"
            style={tamanho ? { fontSize: `${tamanho}px` } : undefined}
        >
            {nome}
        </span>
    )
}

const WHATSAPP = 'https://wa.me/5584999352001'

const problemaProdutor = [
    'Receitas do campo consolidadas por talhão',
    'Despesas de insumos, sementes e maquinário',
    'Documentos e NF-e por foto ou PDF instantâneo',
    'Múltiplas propriedades separadas ou conjuntas',
    'Resultado financeiro real na palma da mão',
]

const problemaContador = [
    'Carteira de produtores rurais centralizada',
    'Documentos fiscais e recibos sempre anexados',
    'Gestão ágil de pendências do cliente com avisos',
    'Movimentações categorizadas com rapidez',
    'Organização para o Livro Caixa Digital (LCDPR)',
]

const movimentacoes = [
    ['12/Mai', 'Venda Safra Soja Lote 14', 'attach_file', 'Doc Anexado', 'anexo', '+ R$ 38.000,00', 'receita'],
    ['10/Mai', 'Compra Adubo NPK 20-05-20', 'receipt_long', 'NF-e 4432', 'nf', '- R$ 14.300,00', 'despesa'],
    ['08/Mai', 'Manutenção Colheitadeira JD', 'check_circle', 'Recibo OK', 'nf', '- R$ 4.850,00', 'despesa'],
    ['05/Mai', 'Abastecimento Diesel S10', 'receipt_long', 'NF-e 8819', 'nf', '- R$ 6.240,00', 'despesa'],
]

const clientesContador = [
    ['FA', 'Fazenda Alvorada', 'Produtor: Marcos Silva • 14 docs este mês', '0 pendências', 'Em dia', 'ok'],
    ['TM', 'Sítio Três Meninas', 'Produtora: Helena Santos • 8 docs este mês', '2 notas sem classificação', 'Pendente', 'alerta'],
    ['FP', 'Fazenda Progresso', 'Produtor: Carlos Eduardo • 19 docs este mês', '1 comprovante faltante', 'Revisão', 'neutro'],
]

const recursos = [
    ['layers', 'Organize cada propriedade do seu jeito', 'Divida receitas e despesas entre propriedades ou atividades e tenha uma visão mais organizada de cada operação agrícola ou pecuária.', 'Visão segregada e consolidada'],
    ['bar_chart', 'Tenha uma visão do seu resultado', 'Acompanhe receitas, despesas e resultados para entender melhor o cenário financeiro da sua atividade rural mês a mês.', 'Métricas e indicadores reais'],
    ['groups', 'Trabalhe junto com seu contador', 'Compartilhe informações, acompanhe pendências e facilite a comunicação entre a propriedade e o escritório sem atrito.', 'Canal unificado e transparente'],
]

const faq = [
    [
        'A Agro Gestão é feita para produtores ou contadores?',
        'Para os dois. O produtor pode controlar suas finanças e enviar documentos, enquanto o contador acompanha clientes, pendências e movimentações em um ambiente compartilhado.',
    ],
    [
        'Preciso entender de contabilidade para usar a plataforma?',
        'Não. A proposta é facilitar o controle financeiro do dia a dia com recursos simples, como lançamentos, envio de documentos e acompanhamento de resultados. A parte contábil continua contando com o apoio do profissional responsável.',
    ],
    [
        'Como produtor e contador trabalham juntos na plataforma?',
        'O produtor lança receitas, despesas e envia documentos. O contador acompanha a carteira, identifica pendências e classifica as movimentações, tudo no mesmo ambiente e em tempo real.',
    ],
    [
        'A Agro Gestão substitui o contador?',
        'Não. A plataforma foi pensada para aproximar o produtor e o contador, organizando informações e facilitando o acompanhamento. A atuação profissional do contador continua sendo fundamental.',
    ],
    [
        'Consigo separar várias propriedades?',
        'Sim. Você pode registrar e acompanhar receitas, despesas e documentos por propriedade ou atividade, com visões segregadas e consolidadas da sua operação.',
    ],
]

function PaginaInicial() {
    return (
        <div className="publica">
            <CabecalhoPublico />

            <main className="ag-main">
                {/* SEÇÃO 1 — HERO */}
                <section className="ag-secao ag-secao-lowest ag-hero">
                    <div className="ag-container ag-hero-grid">
                        <Revelar className="ag-hero-texto">
                            <span className="ag-badge">
                                <Icone nome="sensors" tamanho={16} />
                                Gestão rural conectada
                            </span>

                            <h1 className="ag-hero-titulo">
                                <span className="ag-destaque">Mais controle</span>
                                {' '}
                                no campo. Menos papelada no escritório.
                            </h1>

                            <p className="ag-hero-sub">
                                Organize receitas, despesas e documentos em um só
                                lugar. Você acompanha sua fazenda e seu contador
                                trabalha com informações mais organizadas.
                            </p>

                            <div className="ag-hero-acoes">
                                <Link className="ag-botao ag-botao-primario" to="/cadastro">
                                    Quero conhecer a Agro Gestão
                                    <Icone nome="arrow_forward" tamanho={20} />
                                </Link>
                                <a className="ag-botao ag-botao-claro" href="#como-funciona">
                                    <Icone nome="play_circle" tamanho={20} />
                                    Como funciona
                                </a>
                            </div>
                        </Revelar>

                        <Revelar atraso={120} className="ag-hero-visual">
                            <div className="ag-flutuante ag-flutuante-topo">
                                <span className="ag-flutuante-icone ag-flutuante-icone-verde">
                                    <Icone nome="agriculture" tamanho={18} />
                                </span>
                                <div>
                                    <strong>Conexão Direta</strong>
                                    <small>Campo e Contabilidade</small>
                                </div>
                            </div>

                            <div className="ag-flutuante ag-flutuante-base">
                                <span className="ag-flutuante-icone ag-flutuante-icone-folha">
                                    <Icone nome="description" tamanho={18} />
                                </span>
                                <div>
                                    <strong>XML e Comprovantes</strong>
                                    <small>Sincronizados e auditados</small>
                                </div>
                            </div>

                            <div className="ag-janela">
                                <div className="ag-janela-interna">
                                    <div className="ag-janela-barra">
                                        <div className="ag-janela-pontos">
                                            <span className="ag-ponto ag-ponto-erro" />
                                            <span className="ag-ponto ag-ponto-ambar" />
                                            <span className="ag-ponto ag-ponto-verde" />
                                            <span className="ag-janela-titulo">Agro Gestão | Fazenda Santa Luzia</span>
                                        </div>
                                        <span className="ag-chip ag-chip-suave">
                                            <Icone nome="yard" tamanho={14} />
                                            Soja e Milho
                                        </span>
                                    </div>

                                    <div className="ag-kpi-grid">
                                        <div className="ag-kpi">
                                            <small>Resultado do mês</small>
                                            <strong>R$ 84.320</strong>
                                            <span className="ag-kpi-trend ag-trend-up">
                                                <Icone nome="trending_up" tamanho={14} />
                                                +12.4%
                                            </span>
                                        </div>
                                        <div className="ag-kpi">
                                            <small>Receitas</small>
                                            <strong className="ag-valor-verde">R$ 142.500</strong>
                                            <span className="ag-kpi-nota">Safra 2025/26</span>
                                        </div>
                                        <div className="ag-kpi">
                                            <small>Despesas</small>
                                            <strong className="ag-valor-ambar">R$ 58.180</strong>
                                            <span className="ag-kpi-nota">Insumos e Óleo</span>
                                        </div>
                                    </div>

                                    <div className="ag-mini-grafico">
                                        <div className="ag-mini-grafico-topo">
                                            <strong>Fluxo Mensal (em Milhares R$)</strong>
                                            <span>6 meses</span>
                                        </div>
                                        <div className="ag-barras" aria-hidden="true">
                                            {[52, 68, 44, 72, 60, 84].map((altura, i) => (
                                                <span key={i} style={{ height: `${altura}%` }} />
                                            ))}
                                        </div>
                                        <div className="ag-barras-rotulos">
                                            {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'].map((m) => (
                                                <span key={m}>{m}</span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="ag-pendente">
                                        <div className="ag-pendente-info">
                                            <Icone nome="pending_actions" tamanho={20} />
                                            <div>
                                                <strong>2 Documentos Pendentes</strong>
                                                <small>NF de Diesel S10 pronta para conferência</small>
                                            </div>
                                        </div>
                                        <span className="ag-tag-acao">Ação requerida</span>
                                    </div>
                                </div>
                            </div>
                        </Revelar>
                    </div>
                </section>

                {/* SEÇÃO 2 — PROBLEMA */}
                <section className="ag-secao ag-secao-low">
                    <div className="ag-container">
                        <Revelar className="ag-cabecalho-secao">
                            <span className="ag-eyebrow">A rotina do campo e do escritório</span>
                            <h2>Chega de perder tempo procurando notas e informações.</h2>
                            <p>
                                Você sabe como é: uma nota fiscal que não aparece,
                                um comprovante perdido, uma despesa que ficou sem
                                classificação e aquela mensagem do contador pedindo
                                documentos mais uma vez. No meio de tudo, fica
                                difícil responder: quanto realmente sobrou neste mês?
                            </p>
                        </Revelar>

                        <div className="ag-par-cards">
                            <Revelar as="article" className="ag-card ag-card-publico">
                                <div>
                                    <span className="ag-card-icone">
                                        <Icone nome="agriculture" tamanho={32} />
                                    </span>
                                    <h3>Para quem produz</h3>
                                    <p>
                                        Diga adeus às pastas cheias de papéis
                                        amassados e à incerteza sobre as contas da
                                        fazenda.
                                    </p>
                                    <ul className="ag-lista-check">
                                        {problemaProdutor.map((item) => (
                                            <li key={item}>
                                                <Icone nome="check_circle" tamanho={20} />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="ag-card-rodape">
                                    <span>Foco na colheita e produtividade</span>
                                    <Icone nome="spa" tamanho={20} />
                                </div>
                            </Revelar>

                            <Revelar as="article" atraso={80} className="ag-card ag-card-publico">
                                <div>
                                    <span className="ag-card-icone">
                                        <Icone nome="calculate" tamanho={32} />
                                    </span>
                                    <h3>Para quem cuida da contabilidade</h3>
                                    <p>
                                        Elimine o retrabalho de digitar lançamentos
                                        manuais no fim do ano fiscal.
                                    </p>
                                    <ul className="ag-lista-check">
                                        {problemaContador.map((item) => (
                                            <li key={item}>
                                                <Icone nome="check_circle" tamanho={20} />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="ag-card-rodape">
                                    <span>Conformidade e precisão contábil</span>
                                    <Icone nome="verified" tamanho={20} />
                                </div>
                            </Revelar>
                        </div>
                    </div>
                </section>

                {/* SEÇÃO 3 — COMO FUNCIONA */}
                <section className="ag-secao ag-secao-lowest" id="como-funciona">
                    <div className="ag-container">
                        <Revelar className="ag-cabecalho-secao">
                            <h2>Uma gestão que aproxima o campo do escritório.</h2>
                            <p>
                                A Agro Gestão facilita a rotina de quem produz e de
                                quem cuida da contabilidade rural. O produtor lança
                                receitas e despesas, envia documentos e acompanha
                                suas informações. O contador visualiza a carteira de
                                clientes, acompanha pendências e organiza as
                                movimentações. Tudo conectado em um só ambiente.
                            </p>
                        </Revelar>

                        <div className="ag-diagrama">
                            <Revelar as="article" className="ag-no">
                                <span className="ag-no-icone">
                                    <Icone nome="nature_people" tamanho={36} />
                                </span>
                                <h4>Produtor Rural</h4>
                                <span className="ag-no-rotulo">No Campo e Galpão</span>
                                <div className="ag-no-itens">
                                    <span><Icone nome="attach_money" tamanho={16} />Receitas e Despesas operacionais</span>
                                    <span><Icone nome="photo_camera" tamanho={16} />Fotos de cupons e NF-e</span>
                                    <span><Icone nome="domain" tamanho={16} />Separação por propriedade rural</span>
                                </div>
                            </Revelar>

                            <Revelar as="article" atraso={100} className="ag-no ag-no-hub">
                                <span className="ag-no-hub-icone">
                                    <Icone nome="sync_alt" tamanho={40} />
                                </span>
                                <h4>Agro Gestão</h4>
                                <span className="ag-chip ag-chip-suave">Ambiente Integrado em Nuvem</span>
                                <p>Sincronização em tempo real com validação fiscal e auditoria automática.</p>
                                <div className="ag-no-ativo">
                                    <span className="ag-pulso" />
                                    Fluxo bidirecional ativo
                                </div>
                            </Revelar>

                            <Revelar as="article" atraso={200} className="ag-no">
                                <span className="ag-no-icone">
                                    <Icone nome="account_balance" tamanho={36} />
                                </span>
                                <h4>Escritório Contábil</h4>
                                <span className="ag-no-rotulo">Gestão Fiscal e Tributária</span>
                                <div className="ag-no-itens">
                                    <span><Icone nome="groups" tamanho={16} />Carteira consolidada de produtores</span>
                                    <span><Icone nome="rule" tamanho={16} />Aprovação e conciliação ágil</span>
                                    <span><Icone nome="file_download" tamanho={16} />Preparação para LCDPR sem estresse</span>
                                </div>
                            </Revelar>
                        </div>
                    </div>
                </section>

                {/* SEÇÃO 4 — CONTROLE FINANCEIRO */}
                <section className="ag-secao ag-secao-low">
                    <div className="ag-container">
                        <Revelar className="ag-cabecalho-secao">
                            <span className="ag-eyebrow">Controle financeiro</span>
                            <h2>Mais clareza para cuidar da sua propriedade.</h2>
                            <p>
                                Registre receitas e despesas, acompanhe o resultado
                                do mês e veja o que ainda está pendente. Tenha uma
                                visão financeira mais clara da sua atividade rural.
                            </p>
                        </Revelar>

                        <Revelar className="ag-dashboard">
                            <div className="ag-dashboard-topo">
                                <div className="ag-dashboard-prop">
                                    <span className="ag-dashboard-prop-icone">
                                        <Icone nome="location_on" />
                                    </span>
                                    <div>
                                        <small>Propriedade Selecionada</small>
                                        <strong>Fazenda Bela Vista (Talhão 04 e 07)</strong>
                                    </div>
                                </div>
                                <div className="ag-dashboard-periodo">
                                    <span className="ag-chip-neutro">Período: Maio 2025</span>
                                    <span className="ag-chip-saldo">Saldo Atual: R$ 148.920,00</span>
                                </div>
                            </div>

                            <div className="ag-metricas">
                                <div className="ag-metrica">
                                    <small>Resultado do mês</small>
                                    <strong className="ag-valor-verde">R$ 24.580,00</strong>
                                    <span className="ag-trend-up"><Icone nome="arrow_upward" tamanho={14} />Superávit mensal</span>
                                </div>
                                <div className="ag-metrica">
                                    <small>Receitas acumuladas</small>
                                    <strong>R$ 68.450,00</strong>
                                    <span className="ag-metrica-nota">Venda Grãos Cooperativa</span>
                                </div>
                                <div className="ag-metrica">
                                    <small>Despesas operacionais</small>
                                    <strong className="ag-valor-ambar">R$ 43.870,00</strong>
                                    <span className="ag-metrica-nota">Combustível e Defensivos</span>
                                </div>
                                <div className="ag-metrica">
                                    <small>A vencer (próx. 7 dias)</small>
                                    <strong>R$ 6.200,00</strong>
                                    <span className="ag-trend-ambar"><Icone nome="schedule" tamanho={14} />2 títulos a pagar</span>
                                </div>
                            </div>

                            <div className="ag-dashboard-grid">
                                <div className="ag-grafico-comp">
                                    <div className="ag-grafico-comp-topo">
                                        <h4>Receitas vs Despesas</h4>
                                        <span>Últimos 6 meses</span>
                                    </div>
                                    <p>Comparativo de fluxo de caixa rural</p>
                                    <div className="ag-barras-duplas" aria-hidden="true">
                                        {[[60, 40], [70, 48], [55, 50], [80, 45], [68, 52], [84, 44]].map(([r, d], i) => (
                                            <span className="ag-barra-par" key={i}>
                                                <span className="ag-barra-r" style={{ height: `${r}%` }} />
                                                <span className="ag-barra-d" style={{ height: `${d}%` }} />
                                            </span>
                                        ))}
                                    </div>
                                    <div className="ag-barras-rotulos">
                                        {['Dez', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai'].map((m) => <span key={m}>{m}</span>)}
                                    </div>
                                    <div className="ag-legenda">
                                        <span><span className="ag-leg-cor ag-leg-r" />Receitas</span>
                                        <span><span className="ag-leg-cor ag-leg-d" />Despesas</span>
                                    </div>
                                </div>

                                <div className="ag-tabela-wrap">
                                    <div className="ag-tabela-topo">
                                        <h4>Últimas movimentações</h4>
                                        <span className="ag-tabela-topo-link">Ver extrato completo</span>
                                    </div>
                                    <table className="ag-tabela">
                                        <thead>
                                            <tr>
                                                <th>Data</th>
                                                <th>Descrição</th>
                                                <th>Comprovante</th>
                                                <th className="ag-dir">Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {movimentacoes.map(([data, desc, icone, selo, tipoSelo, valor, tipo]) => (
                                                <tr key={desc}>
                                                    <td className="ag-td-data">{data}</td>
                                                    <td className="ag-td-desc">{desc}</td>
                                                    <td>
                                                        <span className={`ag-selo-doc ag-selo-${tipoSelo}`}>
                                                            <Icone nome={icone} tamanho={13} />
                                                            {selo}
                                                        </span>
                                                    </td>
                                                    <td className={`ag-dir ag-valor-${tipo}`}>{valor}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="ag-tabela-rodape">
                                        <span>Movimentações sincronizadas com o contador</span>
                                        <span className="ag-valor-verde">Atualização contínua</span>
                                    </div>
                                </div>
                            </div>
                        </Revelar>
                    </div>
                </section>

                {/* SEÇÃO 5 — DOCUMENTOS */}
                <section className="ag-secao ag-secao-lowest" id="produtores">
                    <div className="ag-container ag-split">
                        <Revelar className="ag-doc-mockup">
                            <div className="ag-doc-topo">
                                <span className="ag-doc-titulo">
                                    <Icone nome="folder_shared" tamanho={24} />
                                    Repositório de Documentos
                                </span>
                                <span className="ag-tag-contagem">128 Arquivos</span>
                            </div>
                            <div className="ag-doc-lista">
                                <div className="ag-doc-item">
                                    <div className="ag-doc-item-info">
                                        <span className="ag-doc-item-icone"><Icone nome="receipt" /></span>
                                        <div>
                                            <strong>NF-e 000.491.203 - Fertilizantes Sul</strong>
                                            <div className="ag-doc-tags">
                                                <span className="ag-tag-verde">Nota Fiscal</span>
                                                <span className="ag-tag-cinza">XML 3524...</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="ag-doc-status ag-verde"><Icone nome="cloud_done" tamanho={20} /></span>
                                </div>

                                <div className="ag-doc-item">
                                    <div className="ag-doc-item-info">
                                        <span className="ag-doc-item-icone ag-icone-ambar"><Icone nome="history_edu" /></span>
                                        <div>
                                            <strong>Recibo Arrendamento Safra 24/25</strong>
                                            <div className="ag-doc-tags">
                                                <span className="ag-tag-cinza">Recibo assinado</span>
                                                <span className="ag-tag-verde">Comprovante Pix</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="ag-doc-status ag-verde"><Icone nome="cloud_done" tamanho={20} /></span>
                                </div>

                                <div className="ag-doc-item">
                                    <div className="ag-doc-item-info">
                                        <span className="ag-doc-item-icone"><Icone nome="link" /></span>
                                        <div>
                                            <strong>Fatura Defensivos e Inseticidas</strong>
                                            <small className="ag-verde">Vinculado à despesa de defensivos</small>
                                        </div>
                                    </div>
                                    <span className="ag-doc-status-txt ag-verde">Vinculado</span>
                                </div>

                                <div className="ag-doc-item ag-doc-item-pendente">
                                    <div className="ag-doc-item-info">
                                        <span className="ag-doc-item-icone ag-icone-ambar-suave"><Icone nome="schedule" /></span>
                                        <div>
                                            <strong>Foto Comprovante Oficina de Tratores</strong>
                                            <small className="ag-ambar">Documento pendente de aprovação</small>
                                        </div>
                                    </div>
                                    <span className="ag-doc-status ag-ambar"><Icone nome="pending" tamanho={20} /></span>
                                </div>
                            </div>
                        </Revelar>

                        <Revelar atraso={80} className="ag-split-texto">
                            <span className="ag-eyebrow">Documentos organizados</span>
                            <h2>Encontre seus documentos sem complicação.</h2>
                            <p>
                                Envie notas fiscais, arquivos XML, recibos e
                                comprovantes, mantendo tudo associado à empresa e às
                                movimentações quando necessário.
                            </p>
                            <div className="ag-features-linha">
                                <div className="ag-feature">
                                    <span className="ag-feature-icone"><Icone nome="cloud" tamanho={18} /></span>
                                    <div>
                                        <h4>Armazenamento em nuvem</h4>
                                        <p>Seus comprovantes protegidos e acessíveis de qualquer computador, tablet ou celular no campo.</p>
                                    </div>
                                </div>
                                <div className="ag-feature">
                                    <span className="ag-feature-icone"><Icone nome="search" tamanho={18} /></span>
                                    <div>
                                        <h4>Busca rápida por fornecedor ou data</h4>
                                        <p>Filtros instantâneos para localizar qualquer despesa sem precisar revirar caixas de recibos fiscais.</p>
                                    </div>
                                </div>
                                <div className="ag-feature">
                                    <span className="ag-feature-icone"><Icone nome="attach_file" tamanho={18} /></span>
                                    <div>
                                        <h4>Vinculação direta com lançamentos</h4>
                                        <p>Cada centavo lançado possui seu comprovante anexo, gerando total transparência para o contador.</p>
                                    </div>
                                </div>
                            </div>
                            <a className="ag-link-seta" href="#recursos">
                                Conhecer recursos
                                <Icone nome="arrow_forward" tamanho={18} />
                            </a>
                        </Revelar>
                    </div>
                </section>

                {/* SEÇÃO 6 — PARA CONTADORES */}
                <section className="ag-secao ag-secao-low" id="contadores">
                    <div className="ag-container ag-split ag-split-invertido">
                        <Revelar className="ag-split-texto">
                            <span className="ag-eyebrow">Para contadores</span>
                            <h2>Gerencie vários produtores em um só lugar.</h2>
                            <p>
                                Se você é contador, acompanhe sua carteira de
                                clientes, veja documentos recebidos, identifique
                                pendências e encontre movimentações que ainda
                                precisam de classificação.
                            </p>
                            <div className="ag-features-cards">
                                <div className="ag-feature-card">
                                    <Icone nome="hub" tamanho={22} />
                                    <div>
                                        <h4>Visão consolidada da carteira rural</h4>
                                        <p>Acompanhe dezenas de produtores simultaneamente em um painel unificado com status por cor.</p>
                                    </div>
                                </div>
                                <div className="ag-feature-card">
                                    <Icone nome="notifications_active" tamanho={22} />
                                    <div>
                                        <h4>Notificações de pendências por produtor</h4>
                                        <p>Avise diretamente seu cliente sobre notas sem arquivo ou valores sem extrato correspondente.</p>
                                    </div>
                                </div>
                                <div className="ag-feature-card">
                                    <Icone nome="fact_check" tamanho={22} />
                                    <div>
                                        <h4>Exportação e conformidade simplificada</h4>
                                        <p>Reduza o tempo gasto na consolidação dos dados fiscais do produtor rural ao fim de cada ciclo.</p>
                                    </div>
                                </div>
                            </div>
                        </Revelar>

                        <Revelar atraso={80} className="ag-painel-contador">
                            <div className="ag-painel-topo">
                                <div>
                                    <small>Painel Fiscal do Escritório</small>
                                    <strong>Portal do Contador • 18 Produtores Ativos</strong>
                                </div>
                                <span className="ag-chip ag-chip-suave">Safra 2024/2025</span>
                            </div>

                            <div className="ag-clientes">
                                {clientesContador.map(([sigla, nome, info, pend, status, cor]) => (
                                    <div className="ag-cliente" key={nome}>
                                        <div className="ag-cliente-info">
                                            <span className={`ag-avatar ag-avatar-${cor}`}>{sigla}</span>
                                            <div>
                                                <h4>{nome}</h4>
                                                <p>{info}</p>
                                            </div>
                                        </div>
                                        <div className="ag-cliente-status">
                                            <span className={`ag-cliente-pend ag-pend-${cor}`}>{pend}</span>
                                            <span className={`ag-status-chip ag-status-${cor}`}>{status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="ag-painel-metricas">
                                <div className="ag-painel-metrica">
                                    <Icone nome="verified" tamanho={24} />
                                    <div>
                                        <strong>94% no prazo</strong>
                                        <small>Documentos entregues no mês</small>
                                    </div>
                                </div>
                                <div className="ag-painel-metrica">
                                    <Icone nome="timelapse" tamanho={24} />
                                    <div>
                                        <strong>-18 Horas/mês</strong>
                                        <small>Economia em cobranças manuais</small>
                                    </div>
                                </div>
                            </div>
                        </Revelar>
                    </div>
                </section>

                {/* SEÇÃO 7 — RECURSOS */}
                <section className="ag-secao ag-secao-lowest" id="recursos">
                    <div className="ag-container">
                        <Revelar className="ag-cabecalho-secao">
                            <h2>Uma visão mais completa da sua gestão rural.</h2>
                            <p>
                                Além do controle financeiro, a Agro Gestão reúne
                                recursos pensados para as necessidades específicas de
                                quem trabalha com o agro.
                            </p>
                        </Revelar>

                        <div className="ag-recursos-grid">
                            {recursos.map(([icone, titulo, texto, nota], i) => (
                                <Revelar as="article" atraso={i * 80} className="ag-recurso" key={titulo}>
                                    <div>
                                        <span className="ag-recurso-icone">
                                            <Icone nome={icone} tamanho={32} />
                                        </span>
                                        <h3>{titulo}</h3>
                                        <p>{texto}</p>
                                    </div>
                                    <div className="ag-recurso-rodape">{nota}</div>
                                </Revelar>
                            ))}
                        </div>
                    </div>
                </section>

                {/* SEÇÃO 8 — AMBIENTE COLABORATIVO */}
                <section className="ag-secao ag-secao-escura">
                    <div className="ag-container">
                        <Revelar className="ag-cabecalho-secao ag-cabecalho-claro">
                            <span className="ag-eyebrow ag-eyebrow-claro">Por dentro da Agro Gestão</span>
                            <h2>Mais organização para todos os envolvidos.</h2>
                            <p>
                                A Agro Gestão torna a troca de informações entre
                                produtores e contadores mais simples e transparente.
                            </p>
                        </Revelar>

                        <Revelar className="ag-showcase">
                            <div className="ag-showcase-topo">
                                <div className="ag-showcase-abas">
                                    <span className="ag-aba ag-aba-ativa">
                                        <Icone nome="person" tamanho={16} />
                                        Visão Produtor
                                    </span>
                                    <span className="ag-aba">
                                        <Icone nome="domain" tamanho={16} />
                                        Visão Contador
                                    </span>
                                </div>
                                <div className="ag-showcase-colab">
                                    <span className="ag-pulso ag-pulso-claro" />
                                    Ambiente Colaborativo
                                </div>
                            </div>

                            <div className="ag-showcase-grid">
                                <div className="ag-showcase-card">
                                    <div className="ag-showcase-card-topo">
                                        <span className="ag-claro-verde">Lançamento Rápido no Campo</span>
                                        <span className="ag-claro-sutil">Sincronizado</span>
                                    </div>
                                    <div className="ag-showcase-linhas">
                                        <div><span>Diesel p/ Plantio (2.000 L)</span><strong>R$ 11.800,00</strong></div>
                                        <div><span>Manutenção Pulverizador</span><strong>R$ 3.420,00</strong></div>
                                        <div><span>Venda Semente Certificada</span><strong className="ag-claro-verde">+ R$ 42.000,00</strong></div>
                                    </div>
                                    <div className="ag-showcase-nota ag-nota-verde">
                                        <Icone nome="check_circle" tamanho={16} />
                                        Todos os 3 comprovantes foram fotografados e anexados
                                    </div>
                                </div>

                                <div className="ag-showcase-card">
                                    <div className="ag-showcase-card-topo">
                                        <span className="ag-claro-ambar">Conferência e Auditoria</span>
                                        <span className="ag-claro-sutil">Auditoria Contábil</span>
                                    </div>
                                    <div className="ag-showcase-linhas">
                                        <div>
                                            <span><Icone nome="task_alt" tamanho={16} />Diesel p/ Plantio</span>
                                            <strong className="ag-claro-verde">Conciliado</strong>
                                        </div>
                                        <div>
                                            <span><Icone nome="task_alt" tamanho={16} />Manutenção Pulverizador</span>
                                            <strong className="ag-claro-verde">Conciliado</strong>
                                        </div>
                                        <div>
                                            <span><Icone nome="hourglass_top" tamanho={16} />Venda Semente Certificada</span>
                                            <strong className="ag-claro-ambar">Validando XML</strong>
                                        </div>
                                    </div>
                                    <div className="ag-showcase-nota">
                                        <span>Status do Fechamento Rural:</span>
                                        <strong>92% Concluído</strong>
                                    </div>
                                </div>
                            </div>
                        </Revelar>
                    </div>
                </section>

                {/* SEÇÃO 9 — MENSAGEM */}
                <section className="ag-secao ag-secao-lowest ag-secao-centro">
                    <div className="ag-container">
                        <Revelar className="ag-mensagem">
                            <h2>Sua rotina pode ficar mais simples.</h2>
                            <p>
                                Menos tempo procurando informações. Mais clareza para
                                acompanhar sua propriedade e mais organização na
                                relação com seu contador.
                            </p>
                        </Revelar>
                    </div>
                </section>

                {/* SEÇÃO 10 — CTA FINAL */}
                <section className="ag-secao ag-secao-escura ag-secao-centro" id="conhecer">
                    <div className="ag-container">
                        <Revelar className="ag-cta-final">
                            <span className="ag-cta-icone">
                                <Icone nome="energy_savings_leaf" tamanho={36} />
                            </span>
                            <h2>Organize sua gestão rural de uma nova forma.</h2>
                            <p>
                                Conecte produtor e contador em um só ambiente e
                                acompanhe suas informações durante todo o ano.
                            </p>
                            <div className="ag-cta-acoes">
                                <Link className="ag-botao ag-botao-branco" to="/cadastro">
                                    Quero conhecer a Agro Gestão
                                    <Icone nome="arrow_forward" tamanho={20} />
                                </Link>
                                <a
                                    className="ag-botao ag-botao-contorno-claro"
                                    href={WHATSAPP}
                                    rel="noopener noreferrer"
                                    target="_blank"
                                >
                                    <Icone nome="chat" tamanho={20} />
                                    Falar no WhatsApp
                                </a>
                            </div>
                        </Revelar>
                    </div>
                </section>

                {/* SEÇÃO 11 — FAQ */}
                <section className="ag-secao ag-secao-low" id="faq">
                    <div className="ag-container">
                        <Revelar className="ag-cabecalho-secao">
                            <span className="ag-eyebrow">Perguntas frequentes</span>
                            <h2>Ainda ficou alguma dúvida?</h2>
                        </Revelar>

                        <div className="ag-faq">
                            {faq.map(([pergunta, resposta]) => (
                                <details className="ag-faq-item" key={pergunta}>
                                    <summary>
                                        <span>{pergunta}</span>
                                        <Icone nome="expand_more" tamanho={24} />
                                    </summary>
                                    <div className="ag-faq-resposta">{resposta}</div>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <RodapePublico />

            <a
                aria-label="Falar no WhatsApp"
                className="ag-whatsapp-flutuante"
                href="#"
                rel="noopener noreferrer"
                target="_blank"
            >
                <span className="ag-whatsapp-pulso" aria-hidden="true" />
                <svg fill="currentColor" height="30" viewBox="0 0 24 24" width="30">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
            </a>

            <InstalarApp />
        </div>
    )
}

export default PaginaInicial
