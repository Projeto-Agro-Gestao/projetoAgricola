import {
    useEffect,
    useState,
} from 'react'
import {
    useNavigate,
} from 'react-router'
import './EscolhaModulo.css'

function limparSessao() {
    localStorage.removeItem(
        'agrogestao_token',
    )

    localStorage.removeItem(
        'agrogestao_tipo_token',
    )

    localStorage.removeItem(
        'agrogestao_usuario',
    )

    localStorage.removeItem(
        'agrogestao_token_expira_em',
    )
}

function obterSessao() {
    try {
        const token =
            localStorage.getItem(
                'agrogestao_token',
            )

        const tipoToken =
            localStorage.getItem(
                'agrogestao_tipo_token',
            ) ?? 'Bearer'

        const usuarioSalvo =
            localStorage.getItem(
                'agrogestao_usuario',
            )

        const expiraEm =
            Number(
                localStorage.getItem(
                    'agrogestao_token_expira_em',
                ),
            )

        if (!token || !usuarioSalvo) {
            return null
        }

        if (
            expiraEm
            && Date.now() >= expiraEm
        ) {
            limparSessao()
            return null
        }

        const usuario =
            JSON.parse(usuarioSalvo)

        if (!usuario?.empresaId) {
            limparSessao()
            return null
        }

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

    const [sessao] =
        useState(obterSessao)

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
        navigate(
            '/dashboard/financeiro',
        )
    }

    function abrirContasFinanceiras() {
        navigate(
            '/dashboard/contas',
        )
    }

    function abrirFornecedores() {
        navigate(
            '/dashboard/fornecedores',
        )
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

    function sair() {
        limparSessao()

        navigate('/login', {
            replace: true,
        })
    }

    if (!sessao) {
        return null
    }

    return (
        <div className="escolha-modulo-pagina">
            <div className="escolha-modulo-conteudo">
                <header className="escolha-modulo-cabecalho">
                    <div className="escolha-modulo-marca">
                        <span aria-hidden="true">
                            ♧
                        </span>

                        <div>
                            <strong>
                                AgroGestão
                            </strong>

                            <small>
                                {
                                    sessao.usuario
                                        .nomeEmpresa
                                }
                            </small>
                        </div>
                    </div>

                    <div className="escolha-modulo-acoes-topo">
                        {sessao.usuario.papel ===
                            'ADMINISTRADOR' && (
                            <button
                                className="escolha-modulo-admin"
                                onClick={abrirAreaAdministrativa}
                                type="button"
                            >
                                Area administrativa
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

                        <button
                            className="escolha-modulo-sair"
                            onClick={sair}
                            type="button"
                        >
                            Sair da conta
                        </button>
                    </div>
                </header>

                <main>
                    <div className="escolha-modulo-apresentacao">
                        <p>
                            Olá, {
                            sessao.usuario.nome
                        }
                        </p>

                        <h1>
                            O que você deseja
                            controlar agora?
                        </h1>

                        <span>
                            Escolha uma das áreas.
                            Cada uma possui informações
                            e gráficos próprios.
                        </span>
                    </div>

                    <section className="escolha-modulo-opcoes">
                        <button
                            className="escolha-modulo-card escolha-modulo-interno"
                            onClick={
                                abrirControleInterno
                            }
                            type="button"
                        >
                            <span className="escolha-modulo-icone">
                                ↕
                            </span>

                            <div className="escolha-modulo-card-texto">
                                <small>
                                    Dinheiro movimentado
                                </small>

                                <h2>
                                    Controle interno
                                    financeiro
                                </h2>

                                <p>
                                    Acompanhe receitas —
                                    dinheiro entrando — e
                                    despesas — dinheiro
                                    saindo — que já foram
                                    registradas.
                                </p>

                                <ul>
                                    <li>
                                        Receita — dinheiro
                                        entrando
                                    </li>

                                    <li>
                                        Despesa — dinheiro
                                        saindo
                                    </li>

                                    <li>
                                        Saldo, porcentagens
                                        e gráfico realizado
                                    </li>
                                </ul>
                            </div>

                            <strong className="escolha-modulo-acao">
                                Abrir controle interno
                                <span aria-hidden="true">
                                    →
                                </span>
                            </strong>
                        </button>

                        <button
                            className="escolha-modulo-card escolha-modulo-contas"
                            onClick={
                                abrirContasFinanceiras
                            }
                            type="button"
                        >
                            <span className="escolha-modulo-icone">
                                ◷
                            </span>

                            <div className="escolha-modulo-card-texto">
                                <small>
                                    Planejamento futuro
                                </small>

                                <h2>
                                    Contas a pagar
                                    e receber
                                </h2>

                                <p>
                                    Acompanhe o dinheiro que
                                    deverá entrar e o dinheiro
                                    que deverá sair nos próximos
                                    vencimentos.
                                </p>

                                <ul>
                                    <li>
                                        Conta a receber —
                                        dinheiro que deverá
                                        entrar
                                    </li>

                                    <li>
                                        Conta a pagar —
                                        dinheiro que deverá
                                        sair
                                    </li>

                                    <li>
                                        Previsão, lembretes
                                        e gráfico futuro
                                    </li>
                                </ul>
                            </div>

                            <strong className="escolha-modulo-acao">
                                Abrir contas
                                <span aria-hidden="true">
                                    →
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
                                    Cadastre onde comprou,
                                    acompanhe valores e veja
                                    quem registrou cada compra.
                                </p>

                                <ul>
                                    <li>
                                        Nome do fornecedor obrigatorio
                                    </li>

                                    <li>
                                        Compras ligadas as despesas
                                    </li>

                                    <li>
                                        Lixeira com restauracao
                                    </li>
                                </ul>
                            </div>

                            <strong className="escolha-modulo-acao">
                                Abrir fornecedores
                                <span aria-hidden="true">
                                    -&gt;
                                </span>
                            </strong>
                        </button>
                    </section>

                    <p className="escolha-modulo-ajuda">
                        Você poderá voltar para esta
                        tela e trocar de área quando
                        quiser.
                    </p>
                </main>
            </div>
        </div>
    )
}

export default EscolhaModulo
