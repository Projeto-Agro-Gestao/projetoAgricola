import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { API_BASE_URL as API_URL } from '../config.js'
import { apiFetch } from '../servicos/api.js'
import { obterSessao } from '../servicos/sessao.js'
import './AdminPainel.css'

async function mensagemErro(resposta) {
    const dados = await resposta.json().catch(() => null)
    return dados?.mensagem ?? 'Nao foi possivel concluir a acao.'
}

function AdminIntegracoes() {
    const navigate = useNavigate()
    const [sessao] = useState(obterSessao)
    const [status, setStatus] = useState(null)
    const [setup, setSetup] = useState(null)
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
            const [statusResposta, setupResposta] = await Promise.all([
                apiFetch(`${API_URL}/admin/integracoes/oficiais/status`),
                apiFetch(`${API_URL}/admin/integracoes/oficiais/setup`),
            ])

            if (!statusResposta.ok) {
                throw new Error(await mensagemErro(statusResposta))
            }

            if (!setupResposta.ok) {
                throw new Error(await mensagemErro(setupResposta))
            }

            setStatus(await statusResposta.json())
            setSetup(await setupResposta.json())
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

    async function atualizarSetupSilencioso() {
        if (!sessao) {
            return
        }

        const resposta = await apiFetch(
            `${API_URL}/admin/integracoes/oficiais/setup`,
        )

        if (resposta.ok) {
            setSetup(await resposta.json())
        }
    }

    async function testarConexao() {
        if (!sessao) {
            return
        }

        setCarregando(true)
        setMensagem('')

        try {
            const resposta = await apiFetch(
                `${API_URL}/admin/integracoes/oficiais/cnpj/testar`,
                {
                    method: 'POST',
                },
            )

            if (!resposta.ok) {
                throw new Error(await mensagemErro(resposta))
            }

            const dados = await resposta.json()
            setStatus(dados)
            setMensagem(dados.mensagem)
            atualizarSetupSilencioso()
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

            <section className="admin-integracoes-grade">
                <article className="admin-tabela-bloco">
                    <div className="admin-tabela-cabecalho">
                        <div>
                            <span className="admin-secao-etiqueta">
                                Assistente SERPRO
                            </span>
                            <h2>Configuracao automatizada</h2>
                            <p>
                                O painel verifica as variaveis do backend e
                                mostra exatamente o que falta para ativar a
                                consulta oficial.
                            </p>
                        </div>
                    </div>

                    <div className="admin-checklist">
                        {(setup?.passos ?? []).map((passo) => (
                            <div
                                className="admin-checklist-item"
                                key={passo.titulo}
                            >
                                <span
                                    className={
                                        passo.concluido
                                            ? 'admin-check admin-check-ok'
                                            : 'admin-check'
                                    }
                                >
                                    {passo.concluido ? 'OK' : 'Pendente'}
                                </span>
                                <div>
                                    <strong>{passo.titulo}</strong>
                                    <p>{passo.descricao}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <p className="admin-vazio">
                        {setup?.mensagem ??
                            'Carregando assistente de configuracao.'}
                    </p>
                </article>

                <article className="admin-tabela-bloco">
                    <div className="admin-tabela-cabecalho">
                        <div>
                            <span className="admin-secao-etiqueta">
                                Render
                            </span>
                            <h2>Variaveis do backend</h2>
                            <p>
                                O AgroGestao confere apenas se existem valores.
                                Os segredos nunca sao retornados para a tela.
                            </p>
                        </div>
                    </div>

                    <div className="admin-requisitos">
                        {(setup?.requisitos ?? []).map((item) => (
                            <div
                                className="admin-requisito"
                                key={item.chave}
                            >
                                <div>
                                    <strong>{item.chave}</strong>
                                    <p>{item.descricao}</p>
                                </div>
                                <span
                                    className={
                                        item.configurado
                                            ? 'admin-perfil admin-perfil-admin'
                                            : 'admin-perfil'
                                    }
                                >
                                    {item.configurado
                                        ? 'Configurado'
                                        : item.obrigatorio
                                          ? 'Obrigatorio'
                                          : 'Opcional'}
                                </span>
                                {item.segredo && (
                                    <small>Valor protegido no backend</small>
                                )}
                            </div>
                        ))}
                    </div>
                </article>
            </section>

            <section className="admin-tabela-bloco">
                <div className="admin-tabela-cabecalho">
                    <div>
                        <span className="admin-secao-etiqueta">
                            Fontes oficiais
                        </span>
                        <h2>Links para habilitar e conferir</h2>
                        <p>
                            Use estes enderecos para contratar/habilitar o
                            servico, conferir a documentacao e acompanhar as
                            fontes tributarias oficiais.
                        </p>
                    </div>
                </div>

                <div className="admin-links-oficiais">
                    {(setup?.links ?? []).map((link) => (
                        <a
                            href={link.url}
                            key={link.url}
                            rel="noreferrer"
                            target="_blank"
                        >
                            {link.titulo}
                        </a>
                    ))}
                </div>
            </section>
        </main>
    )
}

export default AdminIntegracoes
