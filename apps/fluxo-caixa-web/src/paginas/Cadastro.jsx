import {
    useState,
} from 'react'
import {
    Link,
    useNavigate,
} from 'react-router'
import {
    API_CADASTRO_URL,
    API_LOGIN_URL,
} from '../config.js'
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

function armazenarSessao(dados) {
    const expiraEm =
        Date.now() +
        Number(
            dados.expiraEmSegundos ?? 3600,
        ) * 1000

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
}

function Cadastro() {
    const navigate = useNavigate()

    const [
        mostrarSenha,
        setMostrarSenha,
    ] = useState(false)

    const [
        mostrarConfirmacao,
        setMostrarConfirmacao,
    ] = useState(false)

    const [
        agriculturaAtiva,
        setAgriculturaAtiva,
    ] = useState(true)

    const [
        pecuariaAtiva,
        setPecuariaAtiva,
    ] = useState(false)

    const [erro, setErro] = useState('')
    const [mensagem, setMensagem] = useState('')

    const [
        carregando,
        setCarregando,
    ] = useState(false)

    async function criarConta(evento) {
        evento.preventDefault()

        setErro('')
        setMensagem('')

        const formulario =
            new FormData(evento.currentTarget)

        const nome = String(
            formulario.get('nome') ?? '',
        ).trim()

        const nomeEmpresa = String(
            formulario.get('propriedade') ?? '',
        ).trim()

        const email = String(
            formulario.get('email') ?? '',
        )
            .trim()
            .toLowerCase()

        const telefone = String(
            formulario.get('telefone') ?? '',
        ).trim()

        const senha = String(
            formulario.get('senha') ?? '',
        )

        const confirmacao = String(
            formulario.get('confirmacaoSenha') ?? '',
        )

        if (!agriculturaAtiva && !pecuariaAtiva) {
            setErro(
                'Escolha Agricultura (plantação), Pecuária (animais) ou as duas atividades.',
            )

            return
        }

        if (senha !== confirmacao) {
            setErro(
                'A confirmação da senha deve ser igual à senha informada.',
            )

            return
        }

        if (senha.length < 8) {
            setErro(
                'A senha deve possuir pelo menos 8 caracteres.',
            )

            return
        }

        setCarregando(true)

        try {
            const respostaCadastro = await fetch(
                API_CADASTRO_URL,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                            'application/json; charset=utf-8',
                    },
                    body: JSON.stringify({
                        nomeEmpresa,
                        nome,
                        email,
                        telefone:
                            telefone || null,
                        senha,
                        agriculturaAtiva,
                        pecuariaAtiva,
                    }),
                },
            )

            if (!respostaCadastro.ok) {
                const mensagemErro =
                    await obterMensagemDeErro(
                        respostaCadastro,
                        'Não foi possível criar a conta.',
                    )

                throw new Error(mensagemErro)
            }

            setMensagem(
                'Conta criada. Estamos entrando no sistema...',
            )

            const respostaLogin = await fetch(
                API_LOGIN_URL,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                            'application/json; charset=utf-8',
                    },
                    body: JSON.stringify({
                        email,
                        senha,
                    }),
                },
            )

            if (!respostaLogin.ok) {
                const mensagemErro =
                    await obterMensagemDeErro(
                        respostaLogin,
                        'A conta foi criada, mas não foi possível entrar automaticamente.',
                    )

                throw new Error(mensagemErro)
            }

            const dadosLogin =
                await respostaLogin.json()

            if (
                !dadosLogin?.token ||
                !dadosLogin?.usuario?.empresaId
            ) {
                throw new Error(
                    'A conta foi criada, mas o servidor retornou um login inválido.',
                )
            }

            armazenarSessao(dadosLogin)

            navigate('/dashboard', {
                replace: true,
            })
        } catch (erroDaRequisicao) {
            setMensagem('')

            setErro(
                erroDaRequisicao instanceof Error
                    ? erroDaRequisicao.message
                    : 'Não foi possível criar a conta.',
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
                        A gestão da sua propriedade,
                        do campo ao caixa.
                    </h1>

                    <p>
                        Crie sua conta e comece a
                        organizar as informações da
                        sua propriedade rural.
                    </p>

                    <ul className="autenticacao-beneficios">
                        <li>
                            Controle de receitas e despesas
                        </li>

                        <li>
                            Agricultura e pecuária no mesmo sistema
                        </li>

                        <li>
                            Resumo financeiro simples e automático
                        </li>
                    </ul>
                </div>

                <p className="autenticacao-direitos">
                    © 2026 AgroGestão. Todos os direitos reservados.
                </p>
            </section>

            <section className="autenticacao-area-formulario">
                <div className="autenticacao-formulario-container">
                    <h2>Criar conta</h2>

                    <p className="autenticacao-subtitulo">
                        Comece a organizar sua propriedade
                        em poucos minutos.
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
                        onSubmit={criarConta}
                    >
                        <div className="autenticacao-campo">
                            <label htmlFor="nomeProdutor">
                                Nome do produtor
                            </label>

                            <input
                                autoComplete="name"
                                disabled={carregando}
                                id="nomeProdutor"
                                maxLength="120"
                                name="nome"
                                placeholder="João da Silva"
                                required
                                type="text"
                            />
                        </div>

                        <div className="autenticacao-campo">
                            <label htmlFor="nomePropriedade">
                                Nome da propriedade
                            </label>

                            <input
                                disabled={carregando}
                                id="nomePropriedade"
                                maxLength="150"
                                name="propriedade"
                                placeholder="Fazenda Boa Vista"
                                required
                                type="text"
                            />
                        </div>

                        <fieldset
                            className="autenticacao-atividades"
                            disabled={carregando}
                        >
                            <legend>
                                O que existe na sua propriedade?
                            </legend>

                            <p>
                                Você poderá mudar essa escolha
                                posteriormente nas configurações.
                            </p>

                            <label className="autenticacao-atividade">
                                <input
                                    checked={agriculturaAtiva}
                                    onChange={(evento) =>
                                        setAgriculturaAtiva(
                                            evento.target.checked,
                                        )
                                    }
                                    type="checkbox"
                                />

                                <span>
                                    <strong>
                                        Agricultura (plantação)
                                    </strong>

                                    <small>
                                        Plantações, safras,
                                        colheitas e insumos.
                                    </small>
                                </span>
                            </label>

                            <label className="autenticacao-atividade">
                                <input
                                    checked={pecuariaAtiva}
                                    onChange={(evento) =>
                                        setPecuariaAtiva(
                                            evento.target.checked,
                                        )
                                    }
                                    type="checkbox"
                                />

                                <span>
                                    <strong>
                                        Pecuária (animais)
                                    </strong>

                                    <small>
                                        Rebanhos, lotes, alimentação
                                        e manejo.
                                    </small>
                                </span>
                            </label>
                        </fieldset>

                        <div className="autenticacao-campo">
                            <label htmlFor="emailCadastro">
                                E-mail
                            </label>

                            <input
                                autoComplete="email"
                                disabled={carregando}
                                id="emailCadastro"
                                maxLength="150"
                                name="email"
                                placeholder="produtor@fazenda.com.br"
                                required
                                type="email"
                            />
                        </div>

                        <div className="autenticacao-campo">
                            <label htmlFor="telefoneCadastro">
                                Telefone (opcional)
                            </label>

                            <input
                                autoComplete="tel"
                                disabled={carregando}
                                id="telefoneCadastro"
                                maxLength="20"
                                name="telefone"
                                placeholder="(00) 00000-0000"
                                type="tel"
                            />
                        </div>

                        <div className="autenticacao-campo">
                            <label htmlFor="senhaCadastro">
                                Senha
                            </label>

                            <div className="autenticacao-senha">
                                <input
                                    autoComplete="new-password"
                                    disabled={carregando}
                                    id="senhaCadastro"
                                    minLength="8"
                                    name="senha"
                                    placeholder="Mínimo de 8 caracteres"
                                    required
                                    type={
                                        mostrarSenha
                                            ? 'text'
                                            : 'password'
                                    }
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
                            <label htmlFor="confirmacaoSenha">
                                Confirmar senha
                            </label>

                            <div className="autenticacao-senha">
                                <input
                                    autoComplete="new-password"
                                    disabled={carregando}
                                    id="confirmacaoSenha"
                                    minLength="8"
                                    name="confirmacaoSenha"
                                    placeholder="Digite a senha novamente"
                                    required
                                    type={
                                        mostrarConfirmacao
                                            ? 'text'
                                            : 'password'
                                    }
                                />

                                <button
                                    aria-label={
                                        mostrarConfirmacao
                                            ? 'Ocultar confirmação'
                                            : 'Mostrar confirmação'
                                    }
                                    className="autenticacao-mostrar-senha"
                                    disabled={carregando}
                                    onClick={() =>
                                        setMostrarConfirmacao(
                                            (valorAtual) =>
                                                !valorAtual,
                                        )
                                    }
                                    type="button"
                                >
                                    {mostrarConfirmacao
                                        ? '●'
                                        : '○'}
                                </button>
                            </div>
                        </div>

                        <button
                            className="autenticacao-botao"
                            disabled={carregando}
                            type="submit"
                        >
                            <span>→</span>

                            {carregando
                                ? 'Criando conta...'
                                : 'Criar conta'}
                        </button>
                    </form>

                    <p className="autenticacao-alternativa">
                        Já possui conta?{' '}
                        <Link to="/login">
                            Entrar
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

export default Cadastro
