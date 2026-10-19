import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { API_GOOGLE_AUTH_URL, GOOGLE_CLIENT_ID } from '../config.js'
import {
    limparPreferenciaLembrarAcesso,
    salvarPreferenciaLembrarAcesso,
    salvarSessao,
} from '../servicos/sessao.js'
import { renderizarBotaoGoogle } from '../utils/googleIdentity.js'

function AcessoGoogle({ elementId, lembrarAcesso = false }) {
    const navigate = useNavigate()
    const [disponivel, setDisponivel] = useState(Boolean(GOOGLE_CLIENT_ID))
    const [carregando, setCarregando] = useState(false)
    const [erro, setErro] = useState('')
    const [credentialPendente, setCredentialPendente] = useState('')
    const [cadastroPendente, setCadastroPendente] = useState(false)
    const [nomeEmpresa, setNomeEmpresa] = useState('')
    const [documento, setDocumento] = useState('')
    const [agriculturaAtiva, setAgriculturaAtiva] = useState(true)
    const [pecuariaAtiva, setPecuariaAtiva] = useState(false)
    const autenticarRef = useRef(null)

    const autenticar = useCallback(async (credential, perfil = null) => {
        if (carregando) {
            return
        }

        setErro('')
        setCarregando(true)

        try {
            const resposta = await fetch(API_GOOGLE_AUTH_URL, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                },
                body: JSON.stringify({
                    credential,
                    nomeEmpresa: perfil?.nomeEmpresa ?? null,
                    telefone: null,
                    documento: perfil?.documento ?? null,
                    inscricaoEstadual: null,
                    isentoInscricaoEstadual: false,
                    inscricaoMunicipal: null,
                    isentoInscricaoMunicipal: false,
                    agriculturaAtiva: perfil?.agriculturaAtiva ?? false,
                    pecuariaAtiva: perfil?.pecuariaAtiva ?? false,
                }),
            })

            const dados = await resposta.json().catch(() => null)

            if (
                resposta.status === 409 &&
                dados?.erro === 'Cadastro Google necessário'
            ) {
                setCredentialPendente(credential)
                setCadastroPendente(true)
                return
            }

            if (!resposta.ok) {
                throw new Error(
                    dados?.mensagem ?? 'Não foi possível continuar com Google.',
                )
            }

            if (!dados?.token || !dados?.usuario?.empresaId) {
                throw new Error('O servidor retornou uma sessão inválida.')
            }

            salvarSessao({
                token: dados.token,
                tipoToken: dados.tipo ?? 'Bearer',
                usuario: dados.usuario,
                expiraEmSegundos: dados.expiraEmSegundos,
            })

            if (lembrarAcesso && dados.usuario.email) {
                salvarPreferenciaLembrarAcesso(dados.usuario.email)
            } else if (!lembrarAcesso) {
                limparPreferenciaLembrarAcesso()
            }

            navigate(
                dados.usuario.papel === 'ADMINISTRADOR' ||
                    dados.usuario.papel === 'SUPER_ADMIN'
                    ? '/admin'
                    : '/dashboard',
                { replace: true },
            )
        } catch (erroRequisicao) {
            setErro(
                erroRequisicao instanceof Error
                    ? erroRequisicao.message
                    : 'Não foi possível continuar com Google.',
            )
        } finally {
            setCarregando(false)
        }
    }, [carregando, lembrarAcesso, navigate])

    useEffect(() => {
        autenticarRef.current = autenticar
    }, [autenticar])

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) {
            return
        }

        let ativo = true

        renderizarBotaoGoogle({
            clientId: GOOGLE_CLIENT_ID,
            elementId,
            text: 'continue_with',
            onCredential: async (credential) => {
                if (ativo) {
                    await autenticarRef.current?.(credential)
                }
            },
        }).catch(() => {
            if (ativo) {
                setDisponivel(false)
            }
        })

        return () => {
            ativo = false
        }
    }, [elementId])

    async function concluirCadastro(evento) {
        evento.preventDefault()

        if (!nomeEmpresa.trim()) {
            setErro('Informe o nome da propriedade.')
            return
        }

        const documentoNormalizado = documento.replace(/\D/g, '')

        if (documentoNormalizado.length !== 11 && documentoNormalizado.length !== 14) {
            setErro('Informe um CPF com 11 dígitos ou CNPJ com 14 dígitos.')
            return
        }

        if (!agriculturaAtiva && !pecuariaAtiva) {
            setErro('Selecione Agricultura, Pecuária ou as duas atividades.')
            return
        }

        await autenticar(credentialPendente, {
            nomeEmpresa: nomeEmpresa.trim(),
            documento: documentoNormalizado,
            agriculturaAtiva,
            pecuariaAtiva,
        })
    }

    function cancelarCadastro() {
        setCredentialPendente('')
        setCadastroPendente(false)
        setNomeEmpresa('')
        setDocumento('')
        setAgriculturaAtiva(true)
        setPecuariaAtiva(false)
        setErro('')
    }

    return (
        <div className="ag-login-google">
            {disponivel ? (
                <div id={elementId} />
            ) : (
                <button className="ag-login-google-indisponivel" disabled type="button">
                    Continuar com Google indisponível
                </button>
            )}

            {carregando && <p>Validando conta Google...</p>}
            {erro && <div className="ag-login-alerta" role="alert">{erro}</div>}

            {cadastroPendente && (
                <form
                    className="ag-login-google-onboarding"
                    onSubmit={concluirCadastro}
                >
                    <h3>Complete seu cadastro</h3>
                    <p>Precisamos de alguns dados da propriedade para criar seu acesso.</p>

                    <div className="ag-login-campo">
                        <label htmlFor={`${elementId}-propriedade`}>Nome da propriedade</label>
                        <div className="ag-login-input">
                            <input
                                autoComplete="organization"
                                disabled={carregando}
                                id={`${elementId}-propriedade`}
                                maxLength="150"
                                onChange={(evento) => setNomeEmpresa(evento.target.value)}
                                placeholder="Fazenda Boa Vista"
                                required
                                value={nomeEmpresa}
                            />
                        </div>
                    </div>

                    <div className="ag-login-campo">
                        <label htmlFor={`${elementId}-documento`}>CPF ou CNPJ da propriedade</label>
                        <div className="ag-login-input">
                            <input
                                autoComplete="off"
                                disabled={carregando}
                                id={`${elementId}-documento`}
                                inputMode="numeric"
                                maxLength="18"
                                onChange={(evento) => setDocumento(evento.target.value)}
                                placeholder="CPF ou CNPJ"
                                required
                                value={documento}
                            />
                        </div>
                    </div>

                    <fieldset className="ag-cad-atividades" disabled={carregando}>
                        <span className="ag-cad-atividades-titulo">Atividades da propriedade</span>
                        <label className="ag-cad-atividade">
                            <input
                                checked={agriculturaAtiva}
                                onChange={(evento) => setAgriculturaAtiva(evento.target.checked)}
                                type="checkbox"
                            />
                            <span><strong>Agricultura</strong></span>
                        </label>
                        <label className="ag-cad-atividade">
                            <input
                                checked={pecuariaAtiva}
                                onChange={(evento) => setPecuariaAtiva(evento.target.checked)}
                                type="checkbox"
                            />
                            <span><strong>Pecuária</strong></span>
                        </label>
                    </fieldset>

                    <button className="ag-login-botao" disabled={carregando} type="submit">
                        {carregando ? 'Criando conta...' : 'Criar conta e entrar'}
                    </button>
                    <button
                        className="ag-google-cadastro-cancelar"
                        disabled={carregando}
                        onClick={cancelarCadastro}
                        type="button"
                    >
                        Cancelar
                    </button>
                </form>
            )}
        </div>
    )
}

export default AcessoGoogle
