import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import './Autenticacao.css'

import { API_REDEFINIR_SENHA_URL } from '../config.js'

const API_REDEFINIR_SENHA = API_REDEFINIR_SENHA_URL

function RedefinirSenha() {
    const [parametros] = useSearchParams()
    const token = parametros.get('token') ?? ''

    const [mostrarSenha, setMostrarSenha] = useState(false)
    const [senha, setSenha] = useState('')
    const [confirmacao, setConfirmacao] = useState('')
    const [mensagem, setMensagem] = useState('')
    const [sucesso, setSucesso] = useState(false)
    const [carregando, setCarregando] = useState(false)

    async function redefinir(evento) {
        evento.preventDefault()

        setMensagem('')
        setSucesso(false)

        if (!token) {
            setMensagem(
                'O link é inválido. Solicite uma nova recuperação de senha.',
            )
            return
        }

        if (senha.length < 8 || senha.length > 72) {
            setMensagem(
                'A nova senha deve ter entre 8 e 72 caracteres.',
            )
            return
        }

        if (senha !== confirmacao) {
            setMensagem(
                'A confirmação não coincide com a nova senha.',
            )
            return
        }

        setCarregando(true)

        try {
            const resposta = await fetch(API_REDEFINIR_SENHA, {
                method: 'POST',
                headers: {
                    'Content-Type':
                        'application/json; charset=utf-8',
                },
                body: JSON.stringify({
                    token,
                    novaSenha: senha,
                }),
            })

            if (!resposta.ok) {
                const dados = await resposta
                    .json()
                    .catch(() => null)

                throw new Error(
                    dados?.mensagem ??
                        'Não foi possível redefinir a senha',
                )
            }

            setSucesso(true)
            setSenha('')
            setConfirmacao('')
        } catch (erro) {
            setMensagem(
                erro instanceof Error
                    ? erro.message
                    : 'Não foi possível redefinir a senha',
            )
        } finally {
            setCarregando(false)
        }
    }

    if (sucesso) {
        return (
            <main className="autenticacao">
                <section className="autenticacao-area-formulario">
                    <div className="autenticacao-formulario-container">
                        <h2>Senha redefinida</h2>

                        <p className="autenticacao-subtitulo">
                            Sua senha foi alterada com sucesso.
                            Agora você já pode entrar na conta.
                        </p>

                        <div
                            className="autenticacao-sucesso"
                            role="alert"
                        >
                            Tudo certo! Use sua nova senha para acessar.
                        </div>

                        <Link
                            className="autenticacao-botao"
                            to="/login"
                        >
                            <span>→</span>
                            Ir para o login
                        </Link>
                    </div>
                </section>
            </main>
        )
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
                        Crie uma nova senha de acesso.
                    </h1>

                    <p>
                        Escolha uma senha forte e diferente das
                        anteriores para proteger os dados da sua
                        propriedade.
                    </p>

                    <ul className="autenticacao-beneficios">
                        <li>
                            Entre 8 e 72 caracteres
                        </li>

                        <li>
                            Seu acesso volta ao normal em instantes
                        </li>

                        <li>
                            Link válido apenas uma vez
                        </li>
                    </ul>
                </div>

                <p className="autenticacao-direitos">
                    © 2026 AgroGestão. Todos os direitos reservados.
                </p>
            </section>

            <section className="autenticacao-area-formulario">
                <div className="autenticacao-formulario-container">
                    <h2>Redefinir senha</h2>

                    <p className="autenticacao-subtitulo">
                        Informe a nova senha e confirme para concluir.
                    </p>

                    {mensagem && (
                        <div
                            className="autenticacao-alerta"
                            role="alert"
                        >
                            {mensagem}
                        </div>
                    )}

                    <form
                        className="autenticacao-formulario"
                        onSubmit={redefinir}
                    >
                        <div className="autenticacao-campo">
                            <label htmlFor="novaSenha">
                                Nova senha
                            </label>

                            <div className="autenticacao-senha">
                                <input
                                    autoComplete="new-password"
                                    disabled={carregando}
                                    id="novaSenha"
                                    maxLength="72"
                                    minLength="8"
                                    name="novaSenha"
                                    onChange={(evento) =>
                                        setSenha(evento.target.value)
                                    }
                                    placeholder="Digite a nova senha"
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

                        <div className="autenticacao-campo">
                            <label htmlFor="confirmarSenha">
                                Confirmar nova senha
                            </label>

                            <input
                                autoComplete="new-password"
                                disabled={carregando}
                                id="confirmarSenha"
                                maxLength="72"
                                minLength="8"
                                name="confirmarSenha"
                                onChange={(evento) =>
                                    setConfirmacao(evento.target.value)
                                }
                                placeholder="Repita a nova senha"
                                required
                                type={
                                    mostrarSenha
                                        ? 'text'
                                        : 'password'
                                }
                                value={confirmacao}
                            />
                        </div>

                        <button
                            className="autenticacao-botao"
                            disabled={carregando}
                            type="submit"
                        >
                            <span>→</span>

                            {carregando
                                ? 'Redefinindo...'
                                : 'Redefinir senha'}
                        </button>
                    </form>

                    <p className="autenticacao-alternativa">
                        <Link to="/esqueci-senha">
                            Solicitar um novo link
                        </Link>
                    </p>

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

export default RedefinirSenha
