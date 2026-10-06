import {
    useEffect,
    useRef,
    useState,
} from 'react'
import {
    Link,
    useNavigate,
} from 'react-router'
import {
    API_CADASTRO_URL,
    API_GOOGLE_AUTH_URL,
    API_LOGIN_URL,
    GOOGLE_CLIENT_ID,
} from '../config.js'
import { salvarSessao } from '../servicos/sessao.js'
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

const FEATURES = [
    ['receipt_long', 'Documentos sempre à mão', 'Envie notas, recibos e comprovantes e mantenha tudo ligado às movimentações.'],
    ['balance', 'Organização para o LCDPR', 'Receitas e despesas organizadas para facilitar o Livro Caixa Digital do produtor rural.'],
    ['group', 'Produtor e contador juntos', 'O produtor registra e o contador acompanha a carteira, pendências e classificações.'],
    ['agriculture', 'Agricultura e pecuária', 'Separe propriedades e atividades e tenha uma visão organizada de cada operação.'],
]

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

function aplicarMascaraDocumento(valor) {
    const digitos = valor.replace(/\D/g, '')

    if (digitos.length <= 11) {
        // CPF: 000.000.000-00
        return digitos
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    }

    // CNPJ: 00.000.000/0001-00
    return digitos
        .slice(0, 14)
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

function Cadastro() {
    const navigate = useNavigate()
    const formularioRef = useRef(null)
    const cadastroGoogleRef = useRef({
        agriculturaAtiva: true,
        pecuariaAtiva: false,
        carregando: false,
    })

    const [mostrarSenha, setMostrarSenha] = useState(false)
    const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false)
    const [agriculturaAtiva, setAgriculturaAtiva] = useState(true)
    const [pecuariaAtiva, setPecuariaAtiva] = useState(false)
    const [documento, setDocumento] = useState('')
    const [isentoIE, setIsentoIE] = useState(false)
    const [isentoIM, setIsentoIM] = useState(false)
    const [erro, setErro] = useState('')
    const [mensagem, setMensagem] = useState('')
    const [carregando, setCarregando] = useState(false)
    const [carregandoGoogle, setCarregandoGoogle] = useState(false)
    const [googleDisponivel, setGoogleDisponivel] =
        useState(Boolean(GOOGLE_CLIENT_ID))

    useEffect(() => {
        cadastroGoogleRef.current = {
            agriculturaAtiva,
            pecuariaAtiva,
            isentoIE,
            isentoIM,
            carregando: carregando || carregandoGoogle,
        }
    }, [
        agriculturaAtiva,
        pecuariaAtiva,
        isentoIE,
        isentoIM,
        carregando,
        carregandoGoogle,
    ])

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) {
            setGoogleDisponivel(false)
            return
        }

        let ativo = true

        renderizarBotaoGoogle({
            clientId: GOOGLE_CLIENT_ID,
            elementId: 'google-cadastro-botao',
            onCredential: async (credential) => {
                if (ativo) {
                    await cadastrarComGoogle(credential)
                }
            },
            text: 'signup_with',
        }).catch(() => {
            if (ativo) {
                setGoogleDisponivel(false)
            }
        })

        return () => {
            ativo = false
        }
    }, [])

    async function criarConta(evento) {
        evento.preventDefault()

        setErro('')
        setMensagem('')

        const formulario = new FormData(evento.currentTarget)

        const nome = String(formulario.get('nome') ?? '').trim()
        const nomeEmpresa = String(formulario.get('propriedade') ?? '').trim()
        const email = String(formulario.get('email') ?? '').trim().toLowerCase()
        const telefone = String(formulario.get('telefone') ?? '').trim()
        const senha = String(formulario.get('senha') ?? '')
        const confirmacao = String(formulario.get('confirmacaoSenha') ?? '')

        if (!agriculturaAtiva && !pecuariaAtiva) {
            setErro('Escolha Agricultura (plantação), Pecuária (animais) ou as duas atividades.')
            return
        }

        if (senha !== confirmacao) {
            setErro('A confirmação da senha deve ser igual à senha informada.')
            return
        }

        if (senha.length < 8) {
            setErro('A senha deve possuir pelo menos 8 caracteres.')
            return
        }

        const documentoDigitos = documento.replace(/\D/g, '')

        if (documentoDigitos.length !== 11 && documentoDigitos.length !== 14) {
            setErro('Informe o CPF (11 dígitos) ou CNPJ (14 dígitos) da propriedade.')
            return
        }

        const inscricaoEstadual = String(formulario.get('inscricaoEstadual') ?? '').trim()
        const inscricaoMunicipal = String(formulario.get('inscricaoMunicipal') ?? '').trim()

        setCarregando(true)

        try {
            const respostaCadastro = await fetch(API_CADASTRO_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                },
                body: JSON.stringify({
                    nomeEmpresa,
                    nome,
                    email,
                    telefone: telefone || null,
                    senha,
                    documento: documentoDigitos,
                    inscricaoEstadual: isentoIE ? null : inscricaoEstadual || null,
                    isentoInscricaoEstadual: isentoIE,
                    inscricaoMunicipal: isentoIM ? null : inscricaoMunicipal || null,
                    isentoInscricaoMunicipal: isentoIM,
                    agriculturaAtiva,
                    pecuariaAtiva,
                }),
            })

            if (!respostaCadastro.ok) {
                const mensagemErro = await obterMensagemDeErro(
                    respostaCadastro,
                    'Não foi possível criar a conta.',
                )
                throw new Error(mensagemErro)
            }

            setMensagem('Conta criada. Estamos entrando no sistema...')

            const respostaLogin = await fetch(API_LOGIN_URL, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                },
                body: JSON.stringify({ email, senha }),
            })

            if (!respostaLogin.ok) {
                const mensagemErro = await obterMensagemDeErro(
                    respostaLogin,
                    'A conta foi criada, mas não foi possível entrar automaticamente.',
                )
                throw new Error(mensagemErro)
            }

            const dadosLogin = await respostaLogin.json()

            if (!dadosLogin?.token || !dadosLogin?.usuario?.empresaId) {
                throw new Error('A conta foi criada, mas o servidor retornou um login inválido.')
            }

            salvarSessao({
                token: dadosLogin.token,
                tipoToken: dadosLogin.tipo ?? 'Bearer',
                usuario: dadosLogin.usuario,
                expiraEmSegundos: dadosLogin.expiraEmSegundos,
            })
            navigate('/dashboard', { replace: true })
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

    async function cadastrarComGoogle(credential) {
        const estado = cadastroGoogleRef.current

        if (estado.carregando) {
            return
        }

        setErro('')
        setMensagem('')

        const formulario = formularioRef.current

        if (!formulario) {
            setErro('Nao foi possivel ler os dados do cadastro.')
            return
        }

        const dadosFormulario = new FormData(formulario)
        const nomeEmpresa = String(dadosFormulario.get('propriedade') ?? '').trim()
        const telefone = String(dadosFormulario.get('telefone') ?? '').trim()
        const documentoGoogle = documento.replace(/\D/g, '')
        const inscricaoEstadualGoogle = String(dadosFormulario.get('inscricaoEstadual') ?? '').trim()
        const inscricaoMunicipalGoogle = String(dadosFormulario.get('inscricaoMunicipal') ?? '').trim()

        if (!nomeEmpresa) {
            setErro('Digite o nome da propriedade antes de cadastrar com Google.')
            return
        }

        if (documentoGoogle.length !== 11 && documentoGoogle.length !== 14) {
            setErro('Informe o CPF ou CNPJ da propriedade antes de cadastrar com Google.')
            return
        }

        if (!estado.agriculturaAtiva && !estado.pecuariaAtiva) {
            setErro('Escolha Agricultura (plantacao), Pecuaria (animais) ou as duas atividades.')
            return
        }

        setCarregandoGoogle(true)

        try {
            const resposta = await fetch(API_GOOGLE_AUTH_URL, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                },
                body: JSON.stringify({
                    credential,
                    nomeEmpresa,
                    telefone: telefone || null,
                    documento: documentoGoogle,
                    inscricaoEstadual: estado.isentoIE ? null : inscricaoEstadualGoogle || null,
                    isentoInscricaoEstadual: estado.isentoIE,
                    inscricaoMunicipal: estado.isentoIM ? null : inscricaoMunicipalGoogle || null,
                    isentoInscricaoMunicipal: estado.isentoIM,
                    agriculturaAtiva: estado.agriculturaAtiva,
                    pecuariaAtiva: estado.pecuariaAtiva,
                }),
            })

            if (!resposta.ok) {
                const mensagemErro = await obterMensagemDeErro(
                    resposta,
                    'Nao foi possivel cadastrar com Google.',
                )
                throw new Error(mensagemErro)
            }

            const dadosLogin = await resposta.json()

            if (!dadosLogin?.token || !dadosLogin?.usuario?.empresaId) {
                throw new Error('O servidor retornou um login invalido.')
            }

            salvarSessao({
                token: dadosLogin.token,
                tipoToken: dadosLogin.tipo ?? 'Bearer',
                usuario: dadosLogin.usuario,
                expiraEmSegundos: dadosLogin.expiraEmSegundos,
            })
            navigate('/dashboard', { replace: true })
        } catch (erroDaRequisicao) {
            setErro(
                erroDaRequisicao instanceof Error
                    ? erroDaRequisicao.message
                    : 'Nao foi possivel cadastrar com Google.',
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
                <div className="ag-login-grid ag-cad-grid">
                    {/* LADO ESQUERDO — institucional */}
                    <section className="ag-login-institucional">
                        <div className="ag-login-glow ag-login-glow-a" aria-hidden="true" />
                        <div className="ag-login-glow ag-login-glow-b" aria-hidden="true" />

                        <div className="ag-login-institucional-conteudo">
                            <div className="ag-login-institucional-topo">
                                <h1>Comece a organizar a gestão do seu campo</h1>
                                <p>
                                    Conecte a rotina da propriedade ao escritório
                                    contábil e mantenha receitas, despesas e
                                    documentos organizados durante todo o ano.
                                </p>
                            </div>

                            <div className="ag-cad-features">
                                {FEATURES.map(([icone, titulo, texto]) => (
                                    <div className="ag-cad-feature" key={titulo}>
                                        <span className="ag-cad-feature-icone">
                                            <Simbolo nome={icone} tamanho={22} />
                                        </span>
                                        <div>
                                            <strong>{titulo}</strong>
                                            <small>{texto}</small>
                                        </div>
                                    </div>
                                ))}
                            </div>

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
                                <h2>Criar conta</h2>
                                <p>
                                    Já tem cadastro?
                                    <Link to="/login"> Entrar</Link>
                                </p>
                            </div>

                            {erro && (
                                <div className="ag-login-alerta" role="alert">
                                    {erro}
                                </div>
                            )}
                            {mensagem && (
                                <div className="ag-login-sucesso" role="status">
                                    {mensagem}
                                </div>
                            )}

                            <form
                                className="ag-login-form"
                                onSubmit={criarConta}
                                ref={formularioRef}
                            >
                                <div className="ag-login-campo">
                                    <label htmlFor="nomeProdutor">Nome do produtor</label>
                                    <div className="ag-login-input">
                                        <Simbolo nome="badge" tamanho={20} />
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
                                </div>

                                <div className="ag-login-campo">
                                    <label htmlFor="nomePropriedade">Nome da propriedade</label>
                                    <div className="ag-login-input">
                                        <Simbolo nome="agriculture" tamanho={20} />
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
                                </div>

                                <div className="ag-login-campo">
                                    <label htmlFor="documentoProdutor">CPF ou CNPJ da propriedade</label>
                                    <div className="ag-login-input">
                                        <Simbolo nome="pin" tamanho={20} />
                                        <input
                                            disabled={carregando}
                                            id="documentoProdutor"
                                            inputMode="numeric"
                                            maxLength="18"
                                            name="documento"
                                            onChange={(e) => setDocumento(aplicarMascaraDocumento(e.target.value))}
                                            placeholder="000.000.000-00 ou 00.000.000/0001-00"
                                            required
                                            type="text"
                                            value={documento}
                                        />
                                    </div>
                                </div>

                                <div className="ag-cad-dupla">
                                    <div className="ag-login-campo">
                                        <label htmlFor="emailCadastro">E-mail</label>
                                        <div className="ag-login-input">
                                            <Simbolo nome="mail" tamanho={20} />
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
                                    </div>

                                    <div className="ag-login-campo">
                                        <label htmlFor="telefoneCadastro">Telefone (opcional)</label>
                                        <div className="ag-login-input">
                                            <Simbolo nome="phone_iphone" tamanho={20} />
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
                                    </div>
                                </div>

                                <div className="ag-cad-dupla">
                                    <div className="ag-login-campo">
                                        <label htmlFor="senhaCadastro">Senha</label>
                                        <div className="ag-login-input">
                                            <Simbolo nome="lock" tamanho={20} />
                                            <input
                                                autoComplete="new-password"
                                                disabled={carregando}
                                                id="senhaCadastro"
                                                minLength="8"
                                                name="senha"
                                                placeholder="Mínimo de 8 caracteres"
                                                required
                                                type={mostrarSenha ? 'text' : 'password'}
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

                                    <div className="ag-login-campo">
                                        <label htmlFor="confirmacaoSenha">Confirmar senha</label>
                                        <div className="ag-login-input">
                                            <Simbolo nome="lock_reset" tamanho={20} />
                                            <input
                                                autoComplete="new-password"
                                                disabled={carregando}
                                                id="confirmacaoSenha"
                                                minLength="8"
                                                name="confirmacaoSenha"
                                                placeholder="Digite a senha novamente"
                                                required
                                                type={mostrarConfirmacao ? 'text' : 'password'}
                                            />
                                            <button
                                                aria-label={mostrarConfirmacao ? 'Ocultar confirmação' : 'Mostrar confirmação'}
                                                className="ag-login-olho"
                                                disabled={carregando}
                                                onClick={() => setMostrarConfirmacao((v) => !v)}
                                                type="button"
                                            >
                                                <Simbolo nome={mostrarConfirmacao ? 'visibility' : 'visibility_off'} tamanho={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <fieldset className="ag-cad-atividades" disabled={carregando}>
                                    <span className="ag-cad-atividades-titulo">O que existe na sua propriedade?</span>
                                    <label className="ag-cad-atividade">
                                        <input
                                            checked={agriculturaAtiva}
                                            onChange={(e) => setAgriculturaAtiva(e.target.checked)}
                                            type="checkbox"
                                        />
                                        <span>
                                            <strong>Agricultura (plantação)</strong>
                                            <small>Plantações, safras, colheitas e insumos.</small>
                                        </span>
                                    </label>
                                    <label className="ag-cad-atividade">
                                        <input
                                            checked={pecuariaAtiva}
                                            onChange={(e) => setPecuariaAtiva(e.target.checked)}
                                            type="checkbox"
                                        />
                                        <span>
                                            <strong>Pecuária (animais)</strong>
                                            <small>Rebanhos, lotes, alimentação e manejo.</small>
                                        </span>
                                    </label>
                                </fieldset>

                                <details className="ag-cad-fiscais">
                                    <summary>Adicionar dados fiscais (opcional)</summary>
                                    <p>Preencha se tiver Inscrição Estadual ou Municipal. Você pode completar depois no Perfil.</p>

                                    <div className="ag-login-campo">
                                        <label htmlFor="inscricaoEstadual">Inscrição Estadual (IE)</label>
                                        <div className="ag-login-input">
                                            <Simbolo nome="description" tamanho={20} />
                                            <input
                                                disabled={carregando || isentoIE}
                                                id="inscricaoEstadual"
                                                maxLength="40"
                                                name="inscricaoEstadual"
                                                placeholder="Ex: 123.456.789.012"
                                                type="text"
                                            />
                                        </div>
                                        <label className="ag-cad-isento">
                                            <input
                                                checked={isentoIE}
                                                disabled={carregando}
                                                onChange={(e) => setIsentoIE(e.target.checked)}
                                                type="checkbox"
                                            />
                                            <span>Isento de IE</span>
                                        </label>
                                    </div>

                                    <div className="ag-login-campo">
                                        <label htmlFor="inscricaoMunicipal">Inscrição Municipal (IM)</label>
                                        <div className="ag-login-input">
                                            <Simbolo nome="description" tamanho={20} />
                                            <input
                                                disabled={carregando || isentoIM}
                                                id="inscricaoMunicipal"
                                                maxLength="40"
                                                name="inscricaoMunicipal"
                                                placeholder="Ex: 12.345.678-9"
                                                type="text"
                                            />
                                        </div>
                                        <label className="ag-cad-isento">
                                            <input
                                                checked={isentoIM}
                                                disabled={carregando}
                                                onChange={(e) => setIsentoIM(e.target.checked)}
                                                type="checkbox"
                                            />
                                            <span>Isento de IM</span>
                                        </label>
                                    </div>
                                </details>

                                <button
                                    className="ag-login-botao"
                                    disabled={carregando || carregandoGoogle}
                                    type="submit"
                                >
                                    {carregando ? 'Criando conta...' : 'Criar conta'}
                                    <Simbolo nome="arrow_forward" tamanho={20} />
                                </button>
                            </form>

                            <div className="ag-login-divisor">
                                <span>ou cadastre com</span>
                            </div>

                            <div className="ag-login-google">
                                {googleDisponivel ? (
                                    <div id="google-cadastro-botao" />
                                ) : (
                                    <button className="ag-login-google-indisponivel" disabled type="button">
                                        Cadastrar com Google indisponível
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

export default Cadastro
