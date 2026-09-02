import { useState } from 'react'
import { Link } from 'react-router'
import './Autenticacao.css'

import { API_ESQUECI_SENHA_URL } from '../config.js'

const API_ESQUECI_SENHA = API_ESQUECI_SENHA_URL

function EsqueciSenha() {
    const [email, setEmail] = useState('')
    const [mensagem, setMensagem] = useState('')
    const [carregando, setCarregando] = useState(false)

    async function solicitar(evento) {
        evento.preventDefault()

        setMensagem('')
        setCarregando(true)

        try {
            const resposta = await fetch(API_ESQUECI_SENHA, {
                method: 'POST',
                headers: {
                    'Content-Type':
                        'application/json; charset=utf-8',
                },
                body: JSON.stringify({
                    email: email.trim(),
                }),
            })

            if (!resposta.ok) {
                const dados = await resposta
                    .json()
                    .catch(() => null)

                throw new Error(
                    dados?.mensagem ??
                        'Não foi possível solicitar a recuperação de senha',
                )
            }

            setMensagem(
                'Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha.',
            )
            setEmail('')
        } catch (erro) {
            setMensagem(
                erro instanceof Error
                    ? erro.message
                    : 'Não foi possível solicitar a recuperação de senha',
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
                        Recupere o acesso à sua propriedade.
                    </h1>

                    <p>
                        Informe o e-mail cadastrado e enviaremos um
                        link seguro para você redefinir a senha.
                    </p>

                    <ul className="autenticacao-beneficios">
                        <li>
                            Link com validade e uso único
                        </li>

                        <li>
                            Protegemos seu e-mail
                        </li>

                        <li>
                            Redefinição rápida e segura
                        </li>
                    </ul>
                </div>

                <p className="autenticacao-direitos">
                    © 2026 AgroGestão. Todos os direitos reservados.
                </p>
            </section>

            <section className="autenticacao-area-formulario">
                <div className="autenticacao-formulario-container">
                    <h2>Esqueci minha senha</h2>

                    <p className="autenticacao-subtitulo">
                        Digite o e-mail da sua conta para receber o
                        link de redefinição.
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
                        onSubmit={solicitar}
                    >
                        <div className="autenticacao-campo">
                            <label htmlFor="emailEsqueciSenha">
                                E-mail
                            </label>

                            <input
                                autoComplete="email"
                                disabled={carregando}
                                id="emailEsqueciSenha"
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

                        <button
                            className="autenticacao-botao"
                            disabled={carregando}
                            type="submit"
                        >
                            <span>→</span>

                            {carregando
                                ? 'Enviando...'
                                : 'Enviar link'}
                        </button>
                    </form>

                    <p className="autenticacao-alternativa">
                        <Link to="/login">
                            ← Voltar para o login
                        </Link>
                    </p>
                </div>
            </section>
        </main>
    )
}

export default EsqueciSenha
