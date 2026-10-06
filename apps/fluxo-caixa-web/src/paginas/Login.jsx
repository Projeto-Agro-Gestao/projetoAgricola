import {
    useEffect,
    useState,
} from 'react'
import { Link, useNavigate } from 'react-router'
import {
    API_GOOGLE_AUTH_URL,
    API_LOGIN_URL,
    GOOGLE_CLIENT_ID,
} from '../config.js'
import {
    limparPreferenciaLembrarAcesso,
    normalizarEmailLembrado,
    obterPreferenciaLembrarAcesso,
    salvarPreferenciaLembrarAcesso,
    salvarSessao,
} from '../servicos/sessao.js'
import { renderizarBotaoGoogle } from '../utils/googleIdentity.js'
import MarcaAgro from '../componentes/MarcaAgro.jsx'
import '../App.css'
import './Autenticacao.css'

function Simbolo({ nome, tamanho }) {
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

function mensagemDeFalhaConexao(erro, mensagemPadrao) {
    if (
        erro instanceof TypeError &&
        erro.message === 'Failed to fetch'
    ) {
        return 'Nao foi possivel conectar ao servidor do AgroGestao. Aguarde alguns instantes e tente novamente.'
    }

    return erro instanceof Error
        ? erro.message
        : mensagemPadrao
}

function Login() {
    const navigate = useNavigate()

    const [mostrarSenha, setMostrarSenha] = useState(false)
    const [email, setEmail] = useState('')
    const [senha, setSenha] = useState('')
    const [lembrarAcesso, setLembrarAcesso] = useState(false)
    const [mensagem, setMensagem] = useState('')
    const [carregando, setCarregando] = useState(false)
    const [carregandoGoogle, setCarregandoGoogle] = useState(false)
    const [googleDisponivel, setGoogleDisponivel] =
        useState(Boolean(GOOGLE_CLIENT_ID))

    useEffect(() => {
        const preferencia = obterPreferenciaLembrarAcesso()

        if (preferencia.lembrar) {
            setEmail(preferencia.email)
            setLembrarAcesso(true)
        }
    }, [])

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) {
            setGoogleDisponivel(false)
            return
        }

        let ativo = true

        renderizarBotaoGoogle({
            clientId: GOOGLE_CLIENT_ID,
            elementId: 'google-login-botao',
            onCredential: async (credential) => {
                if (ativo) {
                    await entrarComGoogle(credential)
                }
            },
        }).catch(() => {
            if (ativo) {
                setGoogleDisponivel(false)
            }
        })

        return () => {
            ativo = false
        }
    }, [])

    async function entrar(evento) {
        evento.preventDefault()

        setMensagem('')
        setCarregando(true)

        try {
            const emailNormalizado = normalizarEmailLembrado(email)

            const resposta = await fetch(API_LOGIN_URL, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type':
                        'application/json; charset=utf-8',
                },
                body: JSON.stringify({
                    email: emailNormalizado,
                    senha,
                    lembrar: lembrarAcesso,
                }),
            })

            const dados = await resposta
                .json()
                .catch(() => null)

            if (!resposta.ok) {
                throw new Error(
                    dados?.mensagem ??
                    'Não foi possível entrar na conta',
                )
            }

            if (!dados?.token || !dados?.usuario?.empresaId) {
                throw new Error(
                    'O servidor retornou uma resposta de login inválida',
                )
            }

            salvarSessao({
                token: dados.token,
                tipoToken: dados.tipo ?? 'Bearer',
                usuario: dados.usuario,
                expiraEmSegundos: dados.expiraEmSegundos,
            })

            if (lembrarAcesso) {
                salvarPreferenciaLembrarAcesso(emailNormalizado)
            } else {
                limparPreferenciaLembrarAcesso()
            }

            navigate(
                dados.usuario.papel === 'ADMINISTRADOR' ||
                    dados.usuario.papel === 'SUPER_ADMIN'
                    ? '/admin'
                    : '/dashboard',
                {
                    replace: true,
                },
            )
        } catch (erro) {
            setMensagem(
                mensagemDeFalhaConexao(
                    erro,
                    'Não foi possível entrar na conta',
                ),
            )
        } finally {
            setCarregando(false)
        }
    }

    async function entrarComGoogle(credential) {
        if (carregando || carregandoGoogle) {
            return
        }

        setMensagem('')
        setCarregandoGoogle(true)

        try {
            const resposta = await fetch(API_GOOGLE_AUTH_URL, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type':
                        'application/json; charset=utf-8',
                },
                body: JSON.stringify({
                    credential,
                }),
            })

            const dados = await resposta
                .json()
                .catch(() => null)

            if (!resposta.ok) {
                throw new Error(
                    dados?.mensagem ??
                    'Nao foi possivel entrar com Google. Se ainda nao tiver conta, cadastre-se primeiro.',
                )
            }

            if (!dados?.token || !dados?.usuario?.empresaId) {
                throw new Error(
                    'O servidor retornou uma resposta de login invalida',
                )
            }

            salvarSessao({
                token: dados.token,
                tipoToken: dados.tipo ?? 'Bearer',
                usuario: dados.usuario,
                expiraEmSegundos: dados.expiraEmSegundos,
            })

            if (lembrarAcesso) {
                salvarPreferenciaLembrarAcesso(
                    dados.usuario?.email ?? email,
                )
            } else {
                limparPreferenciaLembrarAcesso()
            }

            navigate(
                dados.usuario.papel === 'ADMINISTRADOR' ||
                    dados.usuario.papel === 'SUPER_ADMIN'
                    ? '/admin'
                    : '/dashboard',
                {
                    replace: true,
                },
            )
        } catch (erro) {
            setMensagem(
                mensagemDeFalhaConexao(
                    erro,
                    'Nao foi possivel entrar com Google',
                ),
            )
        } finally {
            setCarregandoGoogle(false)
        }
    }

    return (
        <div className="ag-login publica">
            <header className="ag-login-cabecalho">
                <div className="ag-login-cabecalho-interno">
                    <MarcaAgro to="/" />
                    <Link className="ag-login-voltar" to="/">
                        <Simbolo nome="arrow_back" tamanho={18} />
                        Voltar para o site
                    </Link>
                </div>
            </header>

            <main className="ag-login-main">
                <div className="ag-login-grid">
                    {/* LADO ESQUERDO — institucional */}
                    <section className="ag-login-institucional">
                        <div className="ag-login-glow ag-login-glow-a" aria-hidden="true" />
                        <div className="ag-login-glow ag-login-glow-b" aria-hidden="true" />

                        <div className="ag-login-institucional-conteudo">
                            <div className="ag-login-institucional-topo">
                                <h1>Acesse sua conta e mantenha a gestão da fazenda em dia</h1>
                                <p>
                                    Conecte o manejo da lavoura e da pecuária
                                    diretamente ao escritório contábil e elimine
                                    o retrabalho no fim do ano fiscal.
                                </p>
                            </div>

                            <div className="ag-login-cards">
                                <div className="ag-login-card">
                                    <span className="ag-login-card-icone ag-login-card-icone-verde">
                                        <Simbolo nome="agriculture" tamanho={24} />
                                    </span>
                                    <h3>Para o Produtor</h3>
                                    <p>
                                        Lançamentos simplificados no pasto ou na
                                        lavoura, captura de notas e documentos em
                                        poucos toques.
                                    </p>
                                    <div className="ag-login-card-selo ag-verde">
                                        <Simbolo nome="verified" tamanho={18} />
                                        Foco na colheita e produtividade
                                    </div>
                                </div>

                                <div className="ag-login-card">
                                    <span className="ag-login-card-icone ag-login-card-icone-ambar">
                                        <Simbolo nome="receipt_long" tamanho={24} />
                                    </span>
                                    <h3>Para o Contador</h3>
                                    <p>
                                        Carteira de clientes centralizada,
                                        documentos sempre anexados e organização
                                        para o Livro Caixa Digital (LCDPR).
                                    </p>
                                    <div className="ag-login-card-selo ag-ambar">
                                        <Simbolo nome="analytics" tamanho={18} />
                                        Pronto para o LCDPR
                                    </div>
                                </div>
                            </div>

                            <div
                                className="ag-login-foto"
                                role="img"
                                aria-label="Produtora rural inspecionando a lavoura ao entardecer"
                            />

                            <div className="ag-login-seguranca">
                                <Simbolo nome="verified_user" tamanho={16} />
                                Ambiente seguro e criptografado
                            </div>
                        </div>
                    </section>

                    {/* LADO DIREITO — formulário */}
                    <section className="ag-login-form-area">
                        <div className="ag-login-card-form">
                            <div className="ag-login-form-cabecalho">
                                <h2>Entrar na plataforma</h2>
                                <p>
                                    Ainda não tem acesso?
                                    <Link to="/cadastro"> Criar conta agora</Link>
                                </p>
                            </div>

                            {mensagem && (
                                <div className="ag-login-alerta" role="alert">
                                    {mensagem}
                                </div>
                            )}

                            <form className="ag-login-form" onSubmit={entrar}>
                                <div className="ag-login-campo">
                                    <label htmlFor="emailLogin">E-mail</label>
                                    <div className="ag-login-input">
                                        <Simbolo nome="badge" tamanho={20} />
                                        <input
                                            autoComplete="email"
                                            disabled={carregando}
                                            id="emailLogin"
                                            name="email"
                                            onChange={(evento) => setEmail(evento.target.value)}
                                            placeholder="seu.email@exemplo.com"
                                            required
                                            type="email"
                                            value={email}
                                        />
                                    </div>
                                </div>

                                <div className="ag-login-campo">
                                    <div className="ag-login-campo-topo">
                                        <label htmlFor="senhaLogin">Senha de acesso</label>
                                        <Link className="ag-login-link" to="/esqueci-senha">
                                            Esqueceu a senha?
                                        </Link>
                                    </div>
                                    <div className="ag-login-input">
                                        <Simbolo nome="key" tamanho={20} />
                                        <input
                                            autoComplete="current-password"
                                            disabled={carregando}
                                            id="senhaLogin"
                                            minLength="6"
                                            name="senha"
                                            onChange={(evento) => setSenha(evento.target.value)}
                                            placeholder="Digite sua senha"
                                            required
                                            type={mostrarSenha ? 'text' : 'password'}
                                            value={senha}
                                        />
                                        <button
                                            aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                                            className="ag-login-olho"
                                            disabled={carregando}
                                            onClick={() => setMostrarSenha((v) => !v)}
                                            type="button"
                                        >
                                            <Simbolo nome={mostrarSenha ? 'visibility' : 'visibility_off'} tamanho={20} />
                                        </button>
                                    </div>
                                </div>

                                <label className="ag-login-lembrar">
                                    <input
                                        checked={lembrarAcesso}
                                        disabled={carregando}
                                        onChange={(evento) => setLembrarAcesso(evento.target.checked)}
                                        type="checkbox"
                                    />
                                    <span>Lembrar este dispositivo</span>
                                </label>

                                <button
                                    className="ag-login-botao"
                                    disabled={carregando || carregandoGoogle}
                                    type="submit"
                                >
                                    {carregando ? 'Entrando...' : 'Entrar no Agro Gestão'}
                                    <Simbolo nome="arrow_forward" tamanho={20} />
                                </button>
                            </form>

                            <div className="ag-login-divisor">
                                <span>ou acesse com</span>
                            </div>

                            <div className="ag-login-google">
                                {googleDisponivel ? (
                                    <div id="google-login-botao" />
                                ) : (
                                    <button className="ag-login-google-indisponivel" disabled type="button">
                                        Entrar com Google indisponível
                                    </button>
                                )}
                                {carregandoGoogle && <p>Validando conta Google...</p>}
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <footer className="ag-login-rodape">
                <div className="ag-login-rodape-interno">
                    <span>© 2026 Agro Gestão. Todos os direitos reservados.</span>
                    <div className="ag-login-rodape-links">
                        <Link to="/termos-de-uso">Termos de Serviço</Link>
                        <Link to="/politica-de-privacidade">Política de Privacidade</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Login
