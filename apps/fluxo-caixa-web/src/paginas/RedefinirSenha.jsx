import {
    useMemo,
    useState,
} from 'react'
import {
    Link,
    useNavigate,
    useSearchParams,
} from 'react-router'
import { API_REDEFINIR_SENHA_URL } from '../config.js'
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

function RedefinirSenha() {
    const navigate = useNavigate()
    const [parametros] = useSearchParams()

    const token = useMemo(
        () => parametros.get('token') ?? '',
        [parametros],
    )

    const [
        mostrarSenha,
        setMostrarSenha,
    ] = useState(false)

    const [
        mostrarConfirmacao,
        setMostrarConfirmacao,
    ] = useState(false)

    const [novaSenha, setNovaSenha] =
        useState('')

    const [
        confirmacaoSenha,
        setConfirmacaoSenha,
    ] = useState('')

    const [erro, setErro] = useState('')
    const [mensagem, setMensagem] =
        useState('')
    const [
        carregando,
        setCarregando,
    ] = useState(false)

    async function redefinirSenha(evento) {
        evento.preventDefault()

        setErro('')
        setMensagem('')

        if (!token) {
            setErro(
                'O link de redefinicao esta incompleto. Solicite um novo link.',
            )

            return
        }

        if (novaSenha !== confirmacaoSenha) {
            setErro(
                'A confirmacao da senha deve ser igual a nova senha informada.',
            )

            return
        }

        if (novaSenha.length < 8) {
            setErro(
                'A nova senha deve possuir pelo menos 8 caracteres.',
            )

            return
        }

        setCarregando(true)

        try {
            const resposta = await fetch(
                API_REDEFINIR_SENHA_URL,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                            'application/json; charset=utf-8',
                    },
                    body: JSON.stringify({
                        token,
                        novaSenha,
                    }),
                },
            )

            if (!resposta.ok) {
                const mensagemErro =
                    await obterMensagemDeErro(
                        resposta,
                        'Nao foi possivel redefinir a senha.',
                    )

                throw new Error(mensagemErro)
            }

            setMensagem(
                'Senha redefinida com sucesso. Voce ja pode entrar com a nova senha.',
            )

            setNovaSenha('')
            setConfirmacaoSenha('')

            setTimeout(() => {
                navigate('/login', {
                    replace: true,
                })
            }, 1200)
        } catch (erroDaRequisicao) {
            setErro(
                erroDaRequisicao instanceof Error
                    ? erroDaRequisicao.message
                    : 'Nao foi possivel redefinir a senha.',
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
                        Crie uma nova senha para sua conta.
                    </h1>

                    <p>
                        Use uma senha segura para continuar
                        acessando a gestao da sua propriedade.
                    </p>

                    <ul className="autenticacao-beneficios">
                        <li>Link com validade e uso unico</li>
                        <li>Protegemos seu acesso</li>
                        <li>Redefinicao rapida e segura</li>
                    </ul>
                </div>

                <p className="autenticacao-direitos">
                    © 2026 AgroGestao. Todos os direitos reservados.
                </p>
            </section>

            <section className="autenticacao-area-formulario">
                <div className="autenticacao-formulario-container">
                    <h2>Redefinir senha</h2>

                    <p className="autenticacao-subtitulo">
                        Informe a nova senha da sua conta.
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
                        onSubmit={redefinirSenha}
                    >
                        <div className="autenticacao-campo">
                            <label htmlFor="novaSenha">
                                Nova senha
                            </label>

                            <div className="autenticacao-senha">
                                <input
                                    autoComplete="new-password"
                                    disabled={carregando || !token}
                                    id="novaSenha"
                                    minLength="8"
                                    onChange={(evento) =>
                                        setNovaSenha(
                                            evento.target.value,
                                        )
                                    }
                                    placeholder="Minimo de 8 caracteres"
                                    required
                                    type={
                                        mostrarSenha
                                            ? 'text'
                                            : 'password'
                                    }
                                    value={novaSenha}
                                />

                                <button
                                    aria-label={
                                        mostrarSenha
                                            ? 'Ocultar senha'
                                            : 'Mostrar senha'
                                    }
                                    className="autenticacao-mostrar-senha"
                                    disabled={carregando || !token}
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
                            <label htmlFor="confirmacaoSenha">
                                Confirmar nova senha
                            </label>

                            <div className="autenticacao-senha">
                                <input
                                    autoComplete="new-password"
                                    disabled={carregando || !token}
                                    id="confirmacaoSenha"
                                    minLength="8"
                                    onChange={(evento) =>
                                        setConfirmacaoSenha(
                                            evento.target.value,
                                        )
                                    }
                                    placeholder="Digite a senha novamente"
                                    required
                                    type={
                                        mostrarConfirmacao
                                            ? 'text'
                                            : 'password'
                                    }
                                    value={confirmacaoSenha}
                                />

                                <button
                                    aria-label={
                                        mostrarConfirmacao
                                            ? 'Ocultar confirmacao'
                                            : 'Mostrar confirmacao'
                                    }
                                    className="autenticacao-mostrar-senha"
                                    disabled={carregando || !token}
                                    onClick={() =>
                                        setMostrarConfirmacao(
                                            (valorAtual) =>
                                                !valorAtual,
                                        )
                                    }
                                    type="button"
                                >
                                    {mostrarConfirmacao ? '●' : '○'}
                                </button>
                            </div>
                        </div>

                        <button
                            className="autenticacao-botao"
                            disabled={carregando || !token}
                            type="submit"
                        >
                            <span>→</span>

                            {carregando
                                ? 'Redefinindo...'
                                : 'Redefinir senha'}
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

export default RedefinirSenha
