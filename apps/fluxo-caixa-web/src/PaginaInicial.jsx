import { Link } from 'react-router'
import './App.css'

function PaginaInicial() {
    return (
        <div className="publica">
            <header className="publica-cabecalho">
                <Link className="publica-marca" to="/">
                    <span className="publica-marca-icone">♧</span>
                    <span>AgroGestão</span>
                </Link>

                <nav className="publica-menu">
                    <a href="#atividades">Atividades</a>
                    <a href="#recursos">Recursos</a>
                    <a href="#financeiro">Como funciona</a>
                    <a href="#sobre">Sobre</a>
                </nav>

                <div className="publica-acoes">
                    <Link
                        className="publica-entrar"
                        to="/login"
                    >
                        Entrar
                    </Link>

                    <Link
                        className="publica-botao publica-botao-pequeno"
                        to="/cadastro"
                    >
                        Criar conta
                    </Link>
                </div>
            </header>

            <main>
                <section className="publica-inicio">
                    <div className="publica-inicio-conteudo">
              <span className="publica-etiqueta">
                Gestão financeira para o produtor rural
              </span>

                        <h1>
                            Mais clareza para cuidar das
                            {' '}
                            <strong>finanças da propriedade</strong>
                        </h1>

                        <p>
                            Registre receitas e despesas, organize suas
                            categorias e acompanhe quanto entrou, quanto
                            saiu e quanto sobrou em sua propriedade rural.
                        </p>

                        <div className="publica-inicio-botoes">
                            <Link
                                className="publica-botao"
                                to="/cadastro"
                            >
                                Criar sua conta <span>→</span>
                            </Link>

                            <a
                                className="publica-botao-secundario"
                                href="#recursos"
                            >
                                Conheça os recursos
                            </a>
                        </div>
                    </div>

                    <div className="publica-previa">
                        <div className="publica-barra-janela">
                            <span className="publica-circulo publica-vermelho" />
                            <span className="publica-circulo publica-amarelo" />
                            <span className="publica-circulo publica-verde" />
                        </div>

                        <div className="publica-painel">
                            <div className="publica-painel-topo">
                                <div>
                    <span className="publica-painel-legenda">
                      Demonstração do sistema
                    </span>

                                    <h2>Resumo financeiro</h2>
                                </div>

                                <span className="publica-periodo">
                    Dados ilustrativos
                  </span>
                            </div>

                            <div className="publica-resumo">
                                <article className="publica-cartao publica-receita">
                                    <span>Total que entrou</span>
                                    <strong>R$ 15.700,00</strong>
                                    <small>Exemplo de receitas</small>
                                </article>

                                <article className="publica-cartao publica-despesa">
                                    <span>Total que saiu</span>
                                    <strong>R$ 850,00</strong>
                                    <small>Exemplo de despesas</small>
                                </article>

                                <article className="publica-cartao publica-saldo">
                                    <span>Quanto sobrou</span>
                                    <strong>R$ 14.850,00</strong>
                                    <small>Exemplo de saldo</small>
                                </article>
                            </div>

                            <div className="publica-painel-inferior">
                                <article className="publica-grafico">
                                    <div className="publica-bloco-titulo">
                                        <div>
                                            <h3>Fluxo de caixa</h3>

                                            <p>
                                                Exemplo visual de receitas e despesas
                                            </p>
                                        </div>

                                        <span>Demonstração</span>
                                    </div>

                                    <div className="publica-grafico-area">
                                        <div className="publica-linha publica-linha-1" />
                                        <div className="publica-linha publica-linha-2" />
                                        <div className="publica-linha publica-linha-3" />

                                        <svg
                                            aria-label="Gráfico demonstrativo de receitas e despesas"
                                            preserveAspectRatio="none"
                                            role="img"
                                            viewBox="0 0 600 180"
                                        >
                                            <path
                                                className="publica-area-receita"
                                                d="M0,145 C80,130 120,155 190,110 C270,55 320,70 390,90 C470,115 520,70 600,25 L600,180 L0,180 Z"
                                            />

                                            <path
                                                className="publica-linha-receita"
                                                d="M0,145 C80,130 120,155 190,110 C270,55 320,70 390,90 C470,115 520,70 600,25"
                                            />

                                            <path
                                                className="publica-linha-despesa"
                                                d="M0,165 C90,135 150,150 230,155 C320,165 355,110 430,120 C500,130 535,150 600,158"
                                            />
                                        </svg>
                                    </div>
                                </article>

                                <article className="publica-movimentacoes">
                                    <div className="publica-bloco-titulo">
                                        <div>
                                            <h3>Movimentações recentes</h3>
                                            <p>Exemplos de lançamentos rurais</p>
                                        </div>
                                    </div>

                                    <div className="publica-movimentacao">
                      <span className="publica-movimentacao-icone publica-entrada">
                        ↓
                      </span>

                                        <div>
                                            <strong>Venda da produção</strong>
                                            <small>Categoria de receita</small>
                                        </div>

                                        <b className="publica-valor-entrada">
                                            + R$ 3.200,00
                                        </b>
                                    </div>

                                    <div className="publica-movimentacao">
                      <span className="publica-movimentacao-icone publica-saida">
                        ↑
                      </span>

                                        <div>
                                            <strong>Abastecimento do trator</strong>
                                            <small>Categoria: Combustível</small>
                                        </div>

                                        <b className="publica-valor-saida">
                                            − R$ 850,00
                                        </b>
                                    </div>
                                </article>
                            </div>
                        </div>
                    </div>
                </section>

                <section
                    className="publica-segmentos"
                    id="atividades"
                >
                    <p>
                        O sistema adapta as categorias à atividade escolhida
                    </p>

                    <div className="publica-segmentos-lista">
                        <article>
                            <span>♧</span>
                            <strong>Agricultura</strong>
                        </article>

                        <article>
                            <span>◉</span>
                            <strong>Pecuária</strong>
                        </article>

                        <article>
                            <span>R$</span>
                            <strong>Receitas</strong>
                        </article>

                        <article>
                            <span>−</span>
                            <strong>Despesas</strong>
                        </article>

                        <article>
                            <span>✓</span>
                            <strong>Categorias próprias</strong>
                        </article>
                    </div>
                </section>

                <section
                    className="publica-recursos"
                    id="recursos"
                >
                    <div className="publica-secao-titulo">
              <span className="publica-etiqueta">
                Recursos existentes no sistema
              </span>

                        <h2>
                            Recursos reais para organizar sua propriedade
                        </h2>

                        <p>
                            A plataforma foi construída para apresentar as
                            informações financeiras de forma simples, organizada
                            e separada para cada propriedade cadastrada.
                        </p>
                    </div>

                    <div className="publica-grade-recursos">
                        <article>
                <span className="publica-recurso-icone">
                  R$
                </span>

                            <h3>Receitas e despesas</h3>

                            <p>
                                Cadastre o dinheiro que entrou e os gastos da
                                propriedade, com valor, data e observações.
                            </p>
                        </article>

                        <article>
                <span className="publica-recurso-icone">
                  ▤
                </span>

                            <h3>Movimentações financeiras</h3>

                            <p>
                                Consulte e organize os lançamentos financeiros
                                registrados na sua propriedade.
                            </p>
                        </article>

                        <article>
                <span className="publica-recurso-icone">
                  ✓
                </span>

                            <h3>Categorias personalizadas</h3>

                            <p>
                                Utilize categorias iniciais ou crie novas categorias
                                de receita e despesa sem sair do lançamento.
                            </p>
                        </article>

                        <article>
                <span className="publica-recurso-icone">
                  ↗
                </span>

                            <h3>Resumo financeiro</h3>

                            <p>
                                Acompanhe quanto entrou, quanto saiu, o saldo e
                                indicadores calculados com seus próprios registros.
                            </p>
                        </article>

                        <article>
                <span className="publica-recurso-icone">
                  ◫
                </span>

                            <h3>Dados separados por empresa</h3>

                            <p>
                                Cada usuário acessa somente as informações
                                pertencentes à sua própria empresa.
                            </p>
                        </article>

                        <article className="publica-recurso-destaque">
                            <h3>Contas a pagar e receber</h3>

                            <p>
                                Módulo em desenvolvimento para previsões,
                                vencimentos e lembretes financeiros.
                            </p>

                            <span>
                  Em desenvolvimento
                </span>
                        </article>
                    </div>
                </section>

                <section
                    className="publica-financeiro"
                    id="financeiro"
                >
                    <div className="publica-financeiro-texto">
              <span className="publica-etiqueta">
                Funcionamento simples
              </span>

                        <h2>
                            As informações pertencem à sua propriedade
                        </h2>

                        <p>
                            Depois de entrar, o painel utiliza os registros
                            financeiros cadastrados na sua própria conta.
                            Os exemplos desta página são apenas demonstrações
                            visuais e estão identificados dessa forma.
                        </p>

                        <ul>
                            <li>
                                Cadastro para Agricultura, Pecuária ou ambas
                            </li>

                            <li>
                                Categorias iniciais conforme a atividade
                            </li>

                            <li>
                                Receitas e despesas separadas por categoria
                            </li>

                            <li>
                                Histórico financeiro preservado
                            </li>

                            <li>
                                Dados separados entre as empresas
                            </li>
                        </ul>
                    </div>

                    <div className="publica-passos">
                        <article>
                            <span>1</span>

                            <div>
                                <strong>Crie sua conta</strong>

                                <p>
                                    Informe os dados da propriedade e escolha
                                    Agricultura, Pecuária ou as duas atividades.
                                </p>
                            </div>
                        </article>

                        <article>
                            <span>2</span>

                            <div>
                                <strong>Receba categorias iniciais</strong>

                                <p>
                                    O sistema prepara categorias compatíveis com
                                    as atividades escolhidas.
                                </p>
                            </div>
                        </article>

                        <article>
                            <span>3</span>

                            <div>
                                <strong>Registre as movimentações</strong>

                                <p>
                                    Cadastre receitas e despesas com informações
                                    organizadas.
                                </p>
                            </div>
                        </article>

                        <article className="publica-passo-ativo">
                            <span>4</span>

                            <div>
                                <strong>Acompanhe o resultado</strong>

                                <p>
                                    Visualize o resumo calculado com os dados reais
                                    da sua propriedade.
                                </p>
                            </div>
                        </article>
                    </div>
                </section>

                <section className="publica-chamada">
                    <h2>
                        Comece a organizar as finanças da propriedade
                    </h2>

                    <p>
                        Cadastre seus próprios dados e acompanhe resultados
                        calculados a partir das movimentações registradas.
                    </p>

                    <Link to="/cadastro">
                        Criar sua conta
                    </Link>
                </section>
            </main>

            <footer
                className="publica-rodape"
                id="sobre"
            >
                <Link className="publica-marca" to="/">
                    <span className="publica-marca-icone">♧</span>
                    <span>AgroGestão</span>
                </Link>

                <p>
                    © 2026 AgroGestão. Todos os direitos reservados.
                </p>

                <div>
                    <span>Termos de uso em preparação</span>
                    <span>Política de privacidade em preparação</span>
                </div>
            </footer>
        </div>
    )
}

export default PaginaInicial