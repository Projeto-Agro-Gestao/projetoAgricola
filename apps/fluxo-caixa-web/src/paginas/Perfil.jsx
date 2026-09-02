import {
    useEffect,
    useState,
} from 'react'
import { useNavigate } from 'react-router'
import { API_BASE_URL as API_URL } from '../config.js'
import './Perfil.css'

function limparSessao() {
    localStorage.removeItem('agrogestao_token')
    localStorage.removeItem('agrogestao_tipo_token')
    localStorage.removeItem('agrogestao_usuario')
    localStorage.removeItem('agrogestao_token_expira_em')
}

function obterSessao() {
    try {
        const token = localStorage.getItem('agrogestao_token')
        const tipoToken =
            localStorage.getItem('agrogestao_tipo_token') ??
            'Bearer'
        const usuarioSalvo =
            localStorage.getItem('agrogestao_usuario')
        const expiraEm = Number(
            localStorage.getItem('agrogestao_token_expira_em'),
        )

        if (!token || !usuarioSalvo) {
            return null
        }

        if (expiraEm && Date.now() >= expiraEm) {
            limparSessao()
            return null
        }

        return {
            token,
            tipoToken,
            usuario: JSON.parse(usuarioSalvo),
        }
    } catch {
        limparSessao()
        return null
    }
}

async function obterMensagemDeErro(resposta) {
    const dados = await resposta.json().catch(() => null)
    return dados?.mensagem ?? 'Nao foi possivel salvar os dados'
}

function Perfil() {
    const navigate = useNavigate()
    const [sessao] = useState(() => obterSessao())
    const [formulario, setFormulario] = useState({
        nomeEmpresa: '',
        nome: '',
        email: '',
        telefone: '',
        agriculturaAtiva: true,
        pecuariaAtiva: false,
    })
    const [mensagem, setMensagem] = useState('')
    const [carregando, setCarregando] = useState(true)
    const [salvando, setSalvando] = useState(false)

    useEffect(() => {
        if (!sessao) {
            navigate('/login', { replace: true })
        }
    }, [navigate, sessao])

    useEffect(() => {
        if (!sessao) {
            return
        }

        async function carregarPerfil() {
            setCarregando(true)
            setMensagem('')

            try {
                const resposta = await fetch(
                    `${API_URL}/usuarios/meu-perfil`,
                    {
                        headers: {
                            Authorization:
                                `${sessao.tipoToken} ${sessao.token}`,
                        },
                    },
                )

                if (!resposta.ok) {
                    throw new Error(
                        await obterMensagemDeErro(resposta),
                    )
                }

                const usuario = await resposta.json()
                preencherFormulario(usuario)
                localStorage.setItem(
                    'agrogestao_usuario',
                    JSON.stringify(usuario),
                )
            } catch (erro) {
                setMensagem(
                    erro instanceof Error
                        ? erro.message
                        : 'Nao foi possivel carregar os dados',
                )
            } finally {
                setCarregando(false)
            }
        }

        void carregarPerfil()
    }, [sessao])

    function preencherFormulario(usuario) {
        setFormulario({
            nomeEmpresa: usuario.nomeEmpresa ?? '',
            nome: usuario.nome ?? '',
            email: usuario.email ?? '',
            telefone: usuario.telefone ?? '',
            agriculturaAtiva:
                usuario.agriculturaAtiva ?? true,
            pecuariaAtiva:
                usuario.pecuariaAtiva ?? false,
        })
    }

    function atualizarCampo(campo, valor) {
        setFormulario((atual) => ({
            ...atual,
            [campo]: valor,
        }))
    }

    async function salvar(evento) {
        evento.preventDefault()

        if (
            !formulario.agriculturaAtiva
            && !formulario.pecuariaAtiva
        ) {
            setMensagem(
                'Escolha Agricultura, Pecuaria ou as duas atividades.',
            )
            return
        }

        setSalvando(true)
        setMensagem('')

        try {
            const resposta = await fetch(
                `${API_URL}/usuarios/meu-perfil`,
                {
                    method: 'PATCH',
                    headers: {
                        Authorization:
                            `${sessao.tipoToken} ${sessao.token}`,
                        'Content-Type':
                            'application/json; charset=utf-8',
                    },
                    body: JSON.stringify({
                        nomeEmpresa: formulario.nomeEmpresa,
                        nome: formulario.nome,
                        telefone: formulario.telefone,
                        agriculturaAtiva:
                            formulario.agriculturaAtiva,
                        pecuariaAtiva:
                            formulario.pecuariaAtiva,
                    }),
                },
            )

            if (!resposta.ok) {
                throw new Error(
                    await obterMensagemDeErro(resposta),
                )
            }

            const usuarioAtualizado = await resposta.json()
            preencherFormulario(usuarioAtualizado)
            localStorage.setItem(
                'agrogestao_usuario',
                JSON.stringify(usuarioAtualizado),
            )
            setMensagem('Dados atualizados com sucesso.')
        } catch (erro) {
            setMensagem(
                erro instanceof Error
                    ? erro.message
                    : 'Nao foi possivel salvar os dados',
            )
        } finally {
            setSalvando(false)
        }
    }

    if (!sessao) {
        return null
    }

    return (
        <main className="perfil-pagina">
            <section className="perfil-conteudo">
                <header className="perfil-topo">
                    <div>
                        <span>Minha conta</span>
                        <h1>Meus dados</h1>
                        <p>
                            Atualize seus dados cadastrais e
                            as atividades da propriedade.
                        </p>
                    </div>

                    <button
                        className="perfil-botao-secundario"
                        onClick={() => navigate('/dashboard')}
                        type="button"
                    >
                        Voltar
                    </button>
                </header>

                {mensagem && (
                    <div className="perfil-aviso" role="status">
                        {mensagem}
                    </div>
                )}

                {carregando ? (
                    <p className="perfil-carregando">
                        Carregando dados...
                    </p>
                ) : (
                    <form
                        className="perfil-formulario"
                        onSubmit={salvar}
                    >
                        <label>
                            Nome da propriedade
                            <input
                                maxLength={150}
                                onChange={(evento) =>
                                    atualizarCampo(
                                        'nomeEmpresa',
                                        evento.target.value,
                                    )
                                }
                                required
                                value={formulario.nomeEmpresa}
                            />
                        </label>

                        <label>
                            Nome do responsavel
                            <input
                                maxLength={120}
                                onChange={(evento) =>
                                    atualizarCampo(
                                        'nome',
                                        evento.target.value,
                                    )
                                }
                                required
                                value={formulario.nome}
                            />
                        </label>

                        <label>
                            E-mail
                            <input
                                disabled
                                value={formulario.email}
                            />
                            <small>
                                Somente o administrador pode
                                alterar o e-mail.
                            </small>
                        </label>

                        <label>
                            Telefone
                            <input
                                maxLength={20}
                                onChange={(evento) =>
                                    atualizarCampo(
                                        'telefone',
                                        evento.target.value,
                                    )
                                }
                                value={formulario.telefone}
                            />
                        </label>

                        <fieldset>
                            <legend>Atividades</legend>

                            <label>
                                <input
                                    checked={
                                        formulario.agriculturaAtiva
                                    }
                                    onChange={(evento) =>
                                        atualizarCampo(
                                            'agriculturaAtiva',
                                            evento.target.checked,
                                        )
                                    }
                                    type="checkbox"
                                />
                                Agricultura
                            </label>

                            <label>
                                <input
                                    checked={
                                        formulario.pecuariaAtiva
                                    }
                                    onChange={(evento) =>
                                        atualizarCampo(
                                            'pecuariaAtiva',
                                            evento.target.checked,
                                        )
                                    }
                                    type="checkbox"
                                />
                                Pecuaria
                            </label>
                        </fieldset>

                        <div className="perfil-acoes">
                            <button
                                className="perfil-botao-primario"
                                disabled={salvando}
                                type="submit"
                            >
                                {salvando
                                    ? 'Salvando...'
                                    : 'Salvar dados'}
                            </button>
                        </div>
                    </form>
                )}
            </section>
        </main>
    )
}

export default Perfil
