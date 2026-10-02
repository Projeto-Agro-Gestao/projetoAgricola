import {
    useEffect,
    useState,
} from 'react'
import {
    useNavigate,
} from 'react-router'
import './EscolhaModulo.css'
import { limparSessao } from '../servicos/sessao.js'

function obterSessao() {
    try {
        const token = localStorage.getItem('agrogestao_token')
        const tipoToken =
            localStorage.getItem('agrogestao_tipo_token') ?? 'Bearer'
        const usuarioSalvo = localStorage.getItem('agrogestao_usuario')
        const expiraEm = Number(
            localStorage.getItem('agrogestao_token_expira_em'),
        )

        if (!token || !usuarioSalvo) {
            return null
        }

        if (expiraEm && Date.now() >= expiraEm) {
            limparSessao()
            return null
        }

        const usuario = JSON.parse(usuarioSalvo)


        return {
            token,
            tipoToken,
            usuario,
        }
    } catch {
        limparSessao()
        return null
    }
}

function EscolhaModulo() {
    const navigate = useNavigate()
    const [sessao] = useState(obterSessao)

    useEffect(() => {
        if (!sessao) {
            navigate('/login', {
                replace: true,
            })
        }
    }, [
        navigate,
        sessao,
    ])

    function abrirControleInterno() {
        navigate('/dashboard/financeiro')
    }

    function abrirContasFinanceiras() {
        navigate('/dashboard/contas')
    }

    function abrirFornecedores() {
        navigate('/dashboard/fornecedores')
    }

    function abrirPainelProdutor() {
        navigate('/dashboard/produtor')
    }

    function abrirAreaContador() {
        navigate('/contador')
    }

    function abrirAreaAdministrativa() {
        navigate('/admin')
    }

    function abrirPerfil() {
        navigate('/dashboard/perfil')
    }

    function abrirPlano() {
        navigate('/dashboard/plano')
    }

    function abrirAppSimples() {
        navigate('/app')
    }

    if (!sessao) {
        return null
    }

    const papel = sessao.usuario.papel
    const podeAdministrar =
        papel === 'ADMINISTRADOR' ||
        papel === 'SUPER_ADMIN'

    return (
        <div className="escolha-modulo-pagina">
            <div className="escolha-modulo-conteudo">
                <header className="escolha-modulo-cabecalho">
                    <div className="escolha-modulo-marca">
                        <span aria-hidden="true">
                            AG
                        </span>

                        <div>
                            <strong>
                                Agro Gestão
                            </strong>

                            <small>
                                {sessao.usuario.nomeEmpresa}
                            </small>
                        </div>
                    </div>

                    <div className="escolha-modulo-acoes-topo">
                        {podeAdministrar && (
                            <button
                                className="escolha-modulo-admin"
                                onClick={abrirAreaAdministrativa}
                                type="button"
                            >
                                Área administrativa
                            </button>
                        )}

                        <button
                            className="escolha-modulo-perfil"
                            onClick={abrirPerfil}
                            type="button"
                        >
                            Meus dados
                        </button>

                        <button
                            className="escolha-modulo-perfil"
                            onClick={abrirPlano}
                            type="button"
                        >
                            Plano e pagamentos
                        </button>

                        <button
                            className="escolha-modulo-perfil"
                            onClick={abrirAppSimples}
                            type="button"
                        >
                            App simples
                        </button>

                    </div>
                </header>

                <main>
                    <div className="escolha-modulo-apresentacao">
                        <p>
                            Olá, {sessao.usuario.nome}
                        </p>

                        <h1>
                            O que você deseja controlar agora?
                        </h1>

                        <span>
                            Escolha uma área de trabalho. O produtor fica com
                            telas simples; o contador tem uma visão mais
                            organizada para acompanhar clientes e pendências.
                        </span>
                    </div>


                    <section className="escolha-modulo-opcoes">
                        <button
                            className="escolha-modulo-card escolha-modulo-interno"
                            onClick={abrirControleInterno}
                            type="button"
                        >
                            <span className="escolha-modulo-icone">
                                R$
                            </span>

                            <div className="escolha-modulo-card-texto">
                                <small>
                                    Dinheiro movimentado
                                </small>

                                <h2>
                                    Controle interno financeiro
                                </h2>

                                <p>
                                    Acompanhe receitas, despesas, saldo e
                                    resultado do período registrado.
                                </p>

                                <ul>
                                    <li>Receita — dinheiro entrando</li>
                                    <li>Despesa — dinheiro saindo</li>
                                    <li>Gráficos e relatórios</li>
                                </ul>
                            </div>

                            <strong className="escolha-modulo-acao">
                                Abrir controle interno
                                <span aria-hidden="true">
                                    -&gt;
                                </span>
                            </strong>
                        </button>

                        <button
                            className="escolha-modulo-card escolha-modulo-contas"
                            onClick={abrirContasFinanceiras}
                            type="button"
                        >
                            <span className="escolha-modulo-icone">
                                $
                            </span>

                            <div className="escolha-modulo-card-texto">
                                <small>
                                    Planejamento futuro
                                </small>

                                <h2>
                                    Contas a pagar e receber
                                </h2>

                                <p>
                                    Veja valores que ainda vão entrar ou sair e
                                    acompanhe vencimentos futuros.
                                </p>

                                <ul>
                                    <li>Contas a receber</li>
                                    <li>Contas a pagar</li>
                                    <li>Previsão futura</li>
                                </ul>
                            </div>

                            <strong className="escolha-modulo-acao">
                                Abrir contas
                                <span aria-hidden="true">
                                    -&gt;
                                </span>
                            </strong>
                        </button>

                        <button
                            className="escolha-modulo-card escolha-modulo-fornecedores"
                            onClick={abrirFornecedores}
                            type="button"
                        >
                            <span className="escolha-modulo-icone">
                                F
                            </span>

                            <div className="escolha-modulo-card-texto">
                                <small>
                                    Compras e fornecedores
                                </small>

                                <h2>
                                    Controle de fornecedores
                                </h2>

                                <p>
                                    Cadastre onde comprou, compare preços e
                                    organize produtos por categoria.
                                </p>

                                <ul>
                                    <li>Fornecedor e produto</li>
                                    <li>Comparação de preços</li>
                                    <li>Relatórios de compra</li>
                                </ul>
                            </div>

                            <strong className="escolha-modulo-acao">
                                Abrir fornecedores
                                <span aria-hidden="true">
                                    -&gt;
                                </span>
                            </strong>
                        </button>

                        <button
                            className="escolha-modulo-card escolha-modulo-produtor"
                            onClick={abrirPainelProdutor}
                            type="button"
                        >
                            <span className="escolha-modulo-icone">
                                P
                            </span>

                            <div className="escolha-modulo-card-texto">
                                <small>
                                    Produtor e contador
                                </small>

                                <h2>
                                    Painel simples do produtor
                                </h2>

                                <p>
                                    Envie documentos, veja pendências do
                                    contador e acompanhe a visão rápida do mês.
                                </p>

                                <ul>
                                    <li>Inbox de documentos</li>
                                    <li>Pendências solicitadas</li>
                                    <li>Propriedades e atividades</li>
                                </ul>
                            </div>

                            <strong className="escolha-modulo-acao">
                                Abrir painel do produtor
                                <span aria-hidden="true">
                                    -&gt;
                                </span>
                            </strong>
                        </button>

                        <button
                            className="escolha-modulo-card escolha-modulo-contador"
                            onClick={abrirAreaContador}
                            type="button"
                        >
                            <span className="escolha-modulo-icone">
                                C
                            </span>

                            <div className="escolha-modulo-card-texto">
                                <small>
                                    Carteira e análise
                                </small>

                                <h2>
                                    Área do contador
                                </h2>

                                <p>
                                    Acompanhe clientes, documentos,
                                    pendências, classificações e visão
                                    tributária resumida.
                                </p>

                                <ul>
                                    <li>Carteira de clientes</li>
                                    <li>Documentos em análise</li>
                                    <li>Indicadores tributários</li>
                                </ul>
                            </div>

                            <strong className="escolha-modulo-acao">
                                Abrir área do contador
                                <span aria-hidden="true">
                                    -&gt;
                                </span>
                            </strong>
                        </button>
                    </section>

                    <p className="escolha-modulo-ajuda">
                        Você poderá voltar para esta tela e trocar de área
                        quando quiser.
                    </p>
                </main>
            </div>
        </div>
    )
}

export default EscolhaModulo
