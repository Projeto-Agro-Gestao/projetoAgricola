import {
    useState,
} from 'react'
import {
    Link,
} from 'react-router'
import { API_ESQUECI_SENHA_URL } from '../config.js'
import './Autenticacao.css'

async function obterMensagemDeErro(
    resposta,
    mensagemPadrao,
) {
    const dadosErro = await resposta
        .json()
        .catch(() => null)

    if (dadosErro?.campos) {
        const mensagensDosCampos =
            Object.values(dadosErro.campos)

        if (mensagensDosCampos.length > 0) {
            return mensagensDosCampos.join(' ')
        }
    }

    return dadosErro?.mensagem ?? mensagemPadrao
}

function EsqueciSenha() {
    const [email, setEmail] = useState('')
    const [erro, setErro] = useState('')
    const [mensagem, setMensagem] =
        useState('')
    const [
        carregando,
        setCarregando,
    ] = useState(false)

    async function solicitarRecuperacao(evento) {
        evento.preventDefault()

        setErro('')
        setMensagem('')
        setCarregando(true)

        try {
            const resposta = await fetch(
                API_ESQUECI_SENHA_URL,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                            'application/json; charset=utf-8',
                    },
                    body: JSON.stringify({
                        email: email.trim(),
                    }),
                },
            )

            if (!resposta.ok) {
                const mensagemErro =
                    await obterMensagemDeErro(
                        resposta,
                        'Nao foi possivel enviar o link de redefinicao.',
                    )

                throw new Error(mensagemErro)
            }

            setMensagem(
                'Se este e-mail estiver cadastrado, voce recebera um link para redefinir sua senha.',
            )
        } catch (erroDaRequisicao) {
            setErro(
                erroDaRequisicao instanceof Error
                    ? erroDaRequisicao.message
                    : 'Nao foi possivel enviar o link de redefinicao.',
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

                    <span>AgroGestao</span>
                </Link>

                <div className="autenticacao-mensagem">
                    <h1>
                        Recupere o acesso a sua propriedade.
                    </h1>

                    <p>
                        Informe o e-mail cadastrado e
                        enviaremos um link seguro para voce
                        redefinir a senha.
                    </p>

                    <ul className="autenticacao-beneficios">
                        <li>Link com validade e uso unico</li>
                        <li>Protegemos seu e-mail</li>
                        <li>Redefinicao rapida e segura</li>
                    </ul>
                </div>

                <p className="autenticacao-direitos">
                    © 2026 AgroGestao. Todos os direitos reservados.
                </p>
            </section>

            <section className="autenticacao-area-formulario">
                <div className="autenticacao-formulario-container">
                    <h2>Esqueci minha senha</h2>

                    <p className="autenticacao-subtitulo">
                        Digite o e-mail da sua conta para
                        receber o link de redefinicao.
                    </p>

                    {erro && (
                        <div
                            className="autenticacao-alerta"
                            role="alert"
                        >
                            {erro}
                        </div>
                    )}

                    {mensagem && (
                        <div
                            className="autenticacao-sucesso"
                            role="status"
                        >
                            {mensagem}
                        </div>
                    )}

                    <form
                        className="autenticacao-formulario"
                        onSubmit={solicitarRecuperacao}
                    >
                        <div className="autenticacao-campo">
                            <label htmlFor="emailRecuperacao">
                                E-mail
                            </label>

                            <input
                                autoComplete="email"
                                disabled={carregando}
                                id="emailRecuperacao"
                                maxLength="150"
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
