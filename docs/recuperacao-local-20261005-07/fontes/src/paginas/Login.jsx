import {
    useState,
} from 'react'
import { Link, useNavigate } from 'react-router'
import { API_LOGIN_URL } from '../config.js'
import './Autenticacao.css'
import MarcaAgro, { IconeAgro } from '../componentes/MarcaAgro.jsx'
import imagemCampo from '../assets/campo-agro-gestao.png'
import FundoAutenticacao from '../componentes/FundoAutenticacao.jsx'

function Login() {
    const navigate = useNavigate()

    const [mostrarSenha, setMostrarSenha] = useState(false)
    const [email, setEmail] = useState(() => localStorage.getItem('agrogestao_email_lembrado') || '')
    const [senha, setSenha] = useState('')
    const [lembrarAcesso, setLembrarAcesso] = useState(() => Boolean(localStorage.getItem('agrogestao_email_lembrado')))
    const [mensagem, setMensagem] = useState('')
    const [carregando, setCarregando] = useState(false)


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
                ['ADMINISTRADOR', 'SUPER_ADMIN'].includes(dados.usuario.papel)
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
        <main className="autenticacao ag-login ag-auth-premium">
            <FundoAutenticacao />
            <header className="ag-login-header"><MarcaAgro /><Link className="publica-botao-secundario" to="/">← Voltar para o site</Link></header>
            <section className="autenticacao-apresentacao">
                <div className="autenticacao-mensagem">
                    <h1>Acesse sua conta e mantenha a gestão da fazenda em dia</h1>
                    <p>Organize as informações do campo e acompanhe as finanças da sua propriedade em um só lugar.</p>
                    <article className="ag-login-beneficio"><IconeAgro nome="agriculture" /><h3>Para o Produtor</h3><p>Registre receitas e despesas, organize categorias e acompanhe os resultados da propriedade.</p><small>Foco na gestão do campo</small></article>
                    <article className="ag-login-beneficio ag-login-contador"><IconeAgro nome="calculate" /><h3>Para o Contador</h3><p>Acesse a área do contador e organize o acompanhamento dos produtores conforme as permissões da sua conta.</p><small>Informações organizadas para sua rotina</small></article>
                    <img className="ag-login-imagem" src={imagemCampo} alt="Produtora inspecionando uma lavoura de soja com um tablet" loading="lazy" decoding="async" />
                </div>
            </section>

            <section className="autenticacao-area-formulario">
                <div className="autenticacao-formulario-container">
                    <h2>Entrar na plataforma</h2>

                    <p className="autenticacao-subtitulo">
                        Ainda não tem acesso? <Link to="/cadastro">Criar conta agora</Link>
                    </p>

                    {mensagem && (
                        <div
                            className="autenticacao-erro"
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

                            <div className="ag-login-campo-icone"><IconeAgro nome="mail" />
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
                        </div>

                        <div className="autenticacao-campo">
                            <div className="ag-login-rotulo"><label htmlFor="senhaLogin">Senha de acesso</label><Link to="/esqueci-senha">Esqueceu a senha?</Link></div>

                            <div className="autenticacao-senha ag-login-campo-icone">
                                <IconeAgro nome="key" />
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
                                    <IconeAgro nome={mostrarSenha ? 'visibility' : 'visibility_off'} />
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
                            <IconeAgro nome="arrow_forward" />

                            {carregando
                                ? 'Entrando...'
                                : 'Entrar no Agro Gestão'}
                        </button>
                    </form>

                    <div className="ag-login-divisor">Ou acesse com</div>
                    <button className="publica-botao-secundario ag-login-google" type="button" disabled aria-describedby="ag-google-ajuda">Entrar com Google indisponível</button>
                    <p id="ag-google-ajuda" className="ag-login-ajuda">Use seu e-mail e senha para entrar.</p>
                </div>
            </section>
        </main>
    )
}

export default Login

