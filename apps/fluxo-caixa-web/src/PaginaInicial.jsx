import { useState } from 'react'
import { Link } from 'react-router'
import {
    IconeCalendario,
    IconeCamadas,
    IconeCheck,
    IconeFechar,
    IconeFolha,
    IconeLista,
    IconeMenu,
    IconeMenos,
    IconePata,
    IconeSetaBaixo,
    IconeSetaCima,
    IconeSetaDiagonal,
    IconeSetaDireita,
} from './componentes/Icones.jsx'
import Revelar from './componentes/Revelar.jsx'
import ValorAnimado from './componentes/ValorAnimado.jsx'
import './App.css'

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(valor)
}

function PaginaInicial() {
    const [menuAberto, setMenuAberto] = useState(false)

    function fecharMenu() {
        setMenuAberto(false)
    }

    return (
        <div className="publica">
            <header className="publica-cabecalho">
                <Link className="publica-marca" to="/">
                    <span className="publica-marca-icone"><IconeFolha /></span>
                    <span>AgroGestão</span>
                </Link>

                <nav className="publica-menu">
                    <a href="#atividades">Atividades</a>
                    <a href="#recursos">Recursos</a>
                    <a href="#financeiro">Como funciona</a>
                </nav>

                <div className="publica-acoes">
                    <Link
                        className="publica-entrar"
                        to="/login"
                    >
                        Entrar
                    </Link>

                    <Link
                        className="publica-botao-app publica-botao-pequeno"
                        to="/app"
                    >
                        Versão app
                    </Link>

                    <Link
                        className="publica-botao publica-botao-pequeno"
                        to="/cadastro"
                    >
                        Criar conta
                    </Link>

                    <button
                        aria-expanded={menuAberto}
                        aria-label={
                            menuAberto
                                ? 'Fechar menu'
                                : 'Abrir menu'
                        }
                        className="publica-menu-mobile-botao"
                        onClick={() =>
                            setMenuAberto(
                                (valorAtual) => !valorAtual,
                            )
                        }
                        type="button"
                    >
                        {menuAberto ? (
                            <IconeFechar />
                        ) : (
                            <IconeMenu />
                        )}
                    </button>
                </div>

                {menuAberto && (
                    <nav className="publica-menu-mobile">
                        <a
                            href="#atividades"
                            onClick={fecharMenu}
                        >
                            Atividades
                        </a>

                        <a
                            href="#recursos"
                            onClick={fecharMenu}
                        >
                            Recursos
                        </a>

                        <a
                            href="#financeiro"
                            onClick={fecharMenu}
                        >
                            Como funciona
                        </a>

                        <Link
                            onClick={fecharMenu}
                            to="/app"
                        >
                            Versão app
                        </Link>
                    </nav>
                )}
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
                                Criar conta grátis <span><IconeSetaDireita /></span>
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
                                    <strong>
                                        <ValorAnimado
                                            formatar={formatarMoeda}
                                            valor={15700}
                                        />
                                    </strong>
                                    <small>Exemplo de receitas</small>
                                </article>

                                <article className="publica-cartao publica-despesa">
                                    <span>Total que saiu</span>
                                    <strong>
                                        <ValorAnimado
                                            formatar={formatarMoeda}
                                            valor={850}
                                        />
                                    </strong>
                                    <small>Exemplo de despesas</small>
                                </article>

                                <article className="publica-cartao publica-saldo">
                                    <span>Quanto sobrou</span>
                                    <strong>
                                        <ValorAnimado
                                            formatar={formatarMoeda}
                                            valor={14850}
                                        />
                                    </strong>
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
                                                pathLength="1"
                                            />

                                            <path
                                                className="publica-linha-despesa"
                                                d="M0,165 C90,135 150,150 230,155 C320,165 355,110 430,120 C500,130 535,150 600,158"
                                                pathLength="1"
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
                        <IconeSetaBaixo />
                      </span>

                                        <div>
                                            <strong>Venda da produção</strong>
                                            <small>Categoria de receita</small>
                                        </div>

                                        <b className="publica-valor-entrada">
                                            +{' '}
                                            <ValorAnimado
                                                formatar={formatarMoeda}
                                                valor={3200}
                                            />
                                        </b>
                                    </div>

                                    <div className="publica-movimentacao">
                      <span className="publica-movimentacao-icone publica-saida">
                        <IconeSetaCima />
                      </span>

                                        <div>
                                            <strong>Abastecimento do trator</strong>
                                            <small>Categoria: Combustível</small>
                                        </div>

                                        <b className="publica-valor-saida">
                                            −{' '}
                                            <ValorAnimado
                                                formatar={formatarMoeda}
                                                valor={850}
                                            />
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
                    <Revelar as="p">
                        Feito para a rotina do produtor rural — adapta as
                        categorias à atividade escolhida.
                    </Revelar>

                    <Revelar className="publica-segmentos-lista">
                        <article>
                            <span><IconeFolha /></span>
                            <strong>Agricultura</strong>
                        </article>

                        <article>
                            <span><IconePata /></span>
                            <strong>Pecuária</strong>
                        </article>

                        <article>
                            <span>R$</span>
                            <strong>Receitas</strong>
                        </article>

                        <article>
                            <span><IconeMenos /></span>
                            <strong>Despesas</strong>
                        </article>

                        <article>
                            <span><IconeCheck /></span>
                            <strong>Categorias próprias</strong>
                        </article>
                    </Revelar>
                </section>

                <section
                    className="publica-recursos"
                    id="recursos"
                >
                    <Revelar className="publica-secao-titulo">
                        <span className="publica-etiqueta">
                            Recursos
                        </span>

                        <h2>
                            O que você resolve com o AgroGestão
                        </h2>

                        <p>
                            Registre receitas e despesas, organize
                            categorias e acompanhe o resultado da
                            sua propriedade em um só lugar.
                        </p>
                    </Revelar>

                    <div className="publica-grade-recursos">
                        <Revelar as="article" atraso={0}>
                            <span className="publica-recurso-icone">
                                R$
                            </span>

                            <h3>Receitas e despesas</h3>

                            <p>
                                Cadastre entradas e gastos com
                                valor, data e observações.
                            </p>
                        </Revelar>

                        <Revelar as="article" atraso={60}>
                            <span className="publica-recurso-icone">
                                <IconeLista />
                            </span>

                            <h3>Movimentações organizadas</h3>

                            <p>
                                Consulte e filtre os lançamentos
                                registrados na propriedade.
                            </p>
                        </Revelar>

                        <Revelar as="article" atraso={120}>
                            <span className="publica-recurso-icone">
                                <IconeCheck />
                            </span>

                            <h3>Categorias do seu jeito</h3>

                            <p>
                                Use categorias iniciais ou crie
                                novas sem sair do lançamento.
                            </p>
                        </Revelar>

                        <Revelar as="article" atraso={180}>
                            <span className="publica-recurso-icone">
                                <IconeSetaDiagonal />
                            </span>

                            <h3>Resumo financeiro</h3>

                            <p>
                                Veja quanto entrou, quanto saiu,
                                o saldo e os indicadores.
                            </p>
                        </Revelar>

                        <Revelar as="article" atraso={240}>
                            <span className="publica-recurso-icone">
                                <IconeCamadas />
                            </span>

                            <h3>Dados por propriedade</h3>

                            <p>
                                Cada conta acessa apenas as
                                informações da sua empresa.
                            </p>
                        </Revelar>

                        <Revelar
                            as="article"
                            atraso={300}
                            className="publica-recurso-proximo"
                        >
                            <span className="publica-recurso-icone">
                                <IconeCalendario />
                            </span>

                            <h3>Contas a pagar e receber</h3>

                            <p>
                                Previsões, vencimentos e
                                lembretes para os próximos
                                pagamentos.
                            </p>

                            <span className="publica-badge">
                                Em breve
                            </span>
                        </Revelar>
                    </div>
                </section>

                <section
                    className="publica-financeiro"
                    id="financeiro"
                >
                    <Revelar className="publica-financeiro-texto">
                        <span className="publica-etiqueta">
                            Como funciona
                        </span>

                        <h2>
                            Do cadastro ao resultado, em poucos passos
                        </h2>

                        <p>
                            O painel usa os registros da sua própria conta.
                            Os exemplos desta página são demonstrações
                            visuais e estão identificados como tal.
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
                    </Revelar>

                    <Revelar className="publica-passos">
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
                            <span>
                                <IconeCheck />
                            </span>

                            <div>
                                <strong>Acompanhe o resultado</strong>

                                <p>
                                    Visualize o resumo calculado com os dados reais
                                    da sua propriedade.
                                </p>
                            </div>
                        </article>
                    </Revelar>
                </section>

                <section className="publica-chamada">
                    <h2>
                        Comece a organizar as finanças da sua propriedade
                    </h2>

                    <p>
                        Crie sua conta gratuitamente e acompanhe resultados
                        calculados a partir das suas movimentações.
                    </p>

                    <Link to="/cadastro">
                        Criar conta grátis
                    </Link>
                </section>
            </main>

            <footer
                className="publica-rodape"
                id="sobre"
            >
                <Link className="publica-marca" to="/">
                    <span className="publica-marca-icone"><IconeFolha /></span>
                    <span>AgroGestão</span>
                </Link>

                <p>
                    © 2026 AgroGestão. Todos os direitos reservados.
                </p>

                <div>
                    <span>Termos de uso</span>
                    <span>Política de privacidade</span>
                </div>
            </footer>
        </div>
    )
}

export default PaginaInicial
