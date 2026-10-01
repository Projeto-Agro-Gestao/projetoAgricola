import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { API_BASE_URL as API_URL } from '../config.js'
import { limparSessao } from '../servicos/sessao.js'
import './AdminPainel.css'

function obterSessao() {
    try {
        const token = localStorage.getItem('agrogestao_token')
        const tipoToken =
            localStorage.getItem('agrogestao_tipo_token') ?? 'Bearer'

        if (!token) {
            return null
        }

        return {
            token,
            tipoToken,
        }
    } catch {
        limparSessao()
        return null
    }
}

function headers(sessao) {
    return {
        Authorization: `${sessao.tipoToken} ${sessao.token}`,
    }
}

async function mensagemErro(resposta) {
    const dados = await resposta.json().catch(() => null)
    return dados?.mensagem ?? 'Nao foi possivel concluir a acao.'
}

function AdminIntegracoes() {
    const navigate = useNavigate()
    const [sessao] = useState(obterSessao)
    const [status, setStatus] = useState(null)
    const [mensagem, setMensagem] = useState('')
    const [carregando, setCarregando] = useState(false)

    async function carregarStatus() {
        if (!sessao) {
            navigate('/login', { replace: true })
            return
        }

        setCarregando(true)
        setMensagem('')

        try {
            const resposta = await fetch(
                `${API_URL}/admin/integracoes/oficiais/status`,
                {
                    headers: headers(sessao),
                },
            )

            if (!resposta.ok) {
                throw new Error(await mensagemErro(resposta))
            }

            setStatus(await resposta.json())
        } catch (erro) {
            setMensagem(
                erro instanceof Error
                    ? erro.message
                    : 'Nao foi possivel carregar integracoes.',
            )
        } finally {
            setCarregando(false)
        }
    }

    async function testarConexao() {
        if (!sessao) {
            return
        }

        setCarregando(true)
        setMensagem('')

        try {
            const resposta = await fetch(
                `${API_URL}/admin/integracoes/oficiais/cnpj/testar`,
                {
                    method: 'POST',
                    headers: headers(sessao),
                },
            )

            if (!resposta.ok) {
                throw new Error(await mensagemErro(resposta))
            }

            const dados = await resposta.json()
            setStatus(dados)
            setMensagem(dados.mensagem)
        } catch (erro) {
            setMensagem(
                erro instanceof Error
                    ? erro.message
                    : 'Nao foi possivel testar a conexao.',
            )
        } finally {
            setCarregando(false)
        }
    }

    useEffect(() => {
        carregarStatus()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <main className="admin-painel">
            <header className="admin-topo">
                <div>
                    <span className="admin-marca">AgroGestao</span>
                    <p className="admin-etiqueta">Integracoes oficiais</p>
                    <h1>Servicos oficiais</h1>
                    <p>
                        Configure e monitore a consulta oficial de CNPJ e as
                        fontes tributarias versionadas sem expor credenciais no
                        frontend.
                    </p>
                </div>

                <div className="admin-topo-acoes">
                    <button
                        className="admin-botao-secundario"
                        onClick={() => navigate('/admin')}
                        type="button"
                    >
                        Voltar ao painel
                    </button>
                </div>
            </header>

            {mensagem && (
                <div className="admin-aviso" role="status">
                    {mensagem}
                </div>
            )}

            <section className="admin-tabela-bloco">
                <div className="admin-tabela-cabecalho">
                    <div>
                        <span className="admin-secao-etiqueta">
                            Consulta CNPJ
                        </span>
                        <h2>Provider oficial</h2>
                        <p>
                            O AgroGestao API chama o provider configurado no
                            backend. O navegador nunca recebe credenciais.
                        </p>
                    </div>
                    <button
                        className="admin-botao-primario"
                        disabled={carregando}
                        onClick={testarConexao}
                        type="button"
                    >
                        {carregando ? 'Testando...' : 'Testar conexao'}
                    </button>
                </div>

                <section className="admin-resumo">
                    <article>
                        <span>Provider</span>
                        <strong>{status?.provider ?? '-'}</strong>
                    </article>
                    <article>
                        <span>Status</span>
                        <strong>{status?.status ?? '-'}</strong>
                    </article>
                    <article>
                        <span>Credencial</span>
                        <strong>
                            {status?.credencialConfigurada ? 'Sim' : 'Nao'}
                        </strong>
                    </article>
                    <article>
                        <span>Ultimo teste</span>
                        <strong>
                            {status?.ultimoTeste
                                ? new Date(status.ultimoTeste).toLocaleString(
                                      'pt-BR',
                                  )
                                : '-'}
                        </strong>
                    </article>
                </section>

                <p className="admin-vazio">
                    {status?.mensagem ??
                        'Consulta oficial de CNPJ ainda nao configurada.'}
                </p>
            </section>
        </main>
    )
}

export default AdminIntegracoes
