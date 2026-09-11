import {
    useEffect,
    useState,
} from 'react'
import { Link, useNavigate } from 'react-router'
import { API_LOGIN_URL } from '../config.js'
import './Autenticacao.css'

function Login() {
    const navigate = useNavigate()

    const [mostrarSenha, setMostrarSenha] = useState(false)
    const [email, setEmail] = useState('')
    const [senha, setSenha] = useState('')
    const [lembrarAcesso, setLembrarAcesso] = useState(false)
    const [mensagem, setMensagem] = useState('')
    const [carregando, setCarregando] = useState(false)

    useEffect(() => {
        const emailLembrado = localStorage.getItem(
            'agrogestao_email_lembrado',
        )

        if (emailLembrado) {
            setEmail(emailLembrado)
            setLembrarAcesso(true)
        }
    }, [])

    async function entrar(evento) {
        evento.preventDefault()

        setMensagem('')
        setCarregando(true)

        try {
            const resposta = await fetch(API_LOGIN_URL, {
                method: 'POST',
                headers: {
                    'Content-Type':
                        'application/json; charset=utf-8',
                },
                body: JSON.stringify({
                    email: email.trim(),
                    senha,
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

            const expiraEm =
                Date.now() +
                Number(dados.expiraEmSegundos ?? 3600) * 1000

            localStorage.setItem(
                'agrogestao_token',
                dados.token,
            )

            localStorage.setItem(
                'agrogestao_tipo_token',
                dados.tipo ?? 'Bearer',
            )

            localStorage.setItem(
                'agrogestao_usuario',
                JSON.stringify(dados.usuario),
            )

            localStorage.setItem(
                'agrogestao_token_expira_em',
                String(expiraEm),
            )

            if (lembrarAcesso) {
                localStorage.setItem(
                    'agrogestao_email_lembrado',
                    email.trim(),
                )
            } else {
                localStorage.removeItem(
                    'agrogestao_email_lembrado',
                )
            }

            navigate(
                dados.usuario.papel === 'ADMINISTRADOR'
                    ? '/admin'
                    : '/dashboard',
                {
                replace: true,
                },
            )
        } catch (erro) {
            setMensagem(
                erro instanceof Error
                    ? erro.message
                    : 'Não foi possível entrar na conta',
            )
        } finally {
            setCarregando(false)
        }
    }

    return (
        <main className="autenticacao">
            <section className="autenticacao-apresentacao">
                <Link
                    className="autenticacao-marca"
                    to="/"
                >
                    <span className="autenticacao-marca-icone">
                        ♧
                    </span>

                    <span>AgroGestão</span>
                </Link>

                <div className="autenticacao-mensagem">
                    <h1>
                        A gestão da sua propriedade, do campo ao caixa.
                    </h1>

                    <p>
                        Organize as informações financeiras da sua
                        propriedade em uma plataforma simples e
                        inteligente.
                    </p>

                    <ul className="autenticacao-beneficios">
                        <li>
                            Receitas e despesas sempre organizadas
                        </li>

                        <li>
                            Categorias personalizadas para sua atividade
                        </li>

                        <li>
                            Resumo financeiro para decisões melhores
                        </li>
                    </ul>
                </div>

                <p className="autenticacao-direitos">
                    © 2026 AgroGestão. Todos os direitos reservados.
                </p>
            </section>

            <section className="autenticacao-area-formulario">
                <div className="autenticacao-formulario-container">
                    <h2>Entrar na conta</h2>

                    <p className="autenticacao-subtitulo">
                        Acesse o painel de gestão da sua propriedade.
                    </p>

                    {mensagem && (
                        <div
                            className="autenticacao-sucesso"
                            role="alert"
                        >
                            {mensagem}
                        </div>
                    )}

                    <form
                        className="autenticacao-formulario"
                        onSubmit={entrar}
                    >
                        <div className="autenticacao-campo">
                            <label htmlFor="emailLogin">
                                E-mail
                            </label>

                            <input
                                autoComplete="email"
                                disabled={carregando}
                                id="emailLogin"
                                name="email"
                                onChange={(evento) =>
                                    setEmail(evento.target.value)
                                }
                                placeholder="produtor@fazenda.com.br"
                                required
                                type="email"
                                value={email}
                            />
                        </div>

                        <div className="autenticacao-campo">
                            <label htmlFor="senhaLogin">
                                Senha
                            </label>

                            <div className="autenticacao-senha">
                                <input
                                    autoComplete="current-password"
                                    disabled={carregando}
                                    id="senhaLogin"
                                    minLength="6"
                                    name="senha"
                                    onChange={(evento) =>
                                        setSenha(evento.target.value)
                                    }
                                    placeholder="Digite sua senha"
                                    required
                                    type={
                                        mostrarSenha
                                            ? 'text'
                                            : 'password'
                                    }
                                    value={senha}
                                />

                                <button
                                    aria-label={
                                        mostrarSenha
                                            ? 'Ocultar senha'
                                            : 'Mostrar senha'
                                    }
                                    className="autenticacao-mostrar-senha"
                                    disabled={carregando}
                                    onClick={() =>
                                        setMostrarSenha(
                                            (valorAtual) =>
                                                !valorAtual,
                                        )
                                    }
                                    type="button"
                                >
                                    {mostrarSenha ? '●' : '○'}
                                </button>
                            </div>
                        </div>

                        <label className="autenticacao-lembrar">
                            <input
                                checked={lembrarAcesso}
                                disabled={carregando}
                                onChange={(evento) =>
                                    setLembrarAcesso(
                                        evento.target.checked,
                                    )
                                }
                                type="checkbox"
                            />

                            <span>Lembrar meu acesso</span>
                        </label>

                        <button
                            className="autenticacao-botao"
                            disabled={carregando}
                            type="submit"
                        >
                            <span>→</span>

                            {carregando
                                ? 'Entrando...'
                                : 'Entrar'}
                        </button>
                    </form>

                    <p className="autenticacao-alternativa">
                        <Link to="/esqueci-senha">
                            Esqueci minha senha
                        </Link>
                    </p>

                    <p className="autenticacao-alternativa">
                        Ainda não tem conta?{' '}
                        <Link to="/cadastro">
                            Cadastre-se
                        </Link>
                    </p>

                    <p className="autenticacao-alternativa">
                        <Link to="/">
                            ← Voltar para a página inicial
                        </Link>
                    </p>
                </div>
            </section>
        </main>
    )
}

export default Login
