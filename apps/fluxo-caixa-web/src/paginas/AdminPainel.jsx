import {
    useEffect,
    useMemo,
    useState,
} from 'react'
import { useNavigate } from 'react-router'
import { API_BASE_URL as API_URL } from '../config.js'
import './AdminPainel.css'

const STATUS_PAGAMENTO = [
    'EM_DIA',
    'ATRASADO',
    'ISENTO',
    'TESTE',
]

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
    return dados?.mensagem ?? 'Não foi possível concluir a ação'
}

function formatarStatus(valor) {
    return {
        EM_DIA: 'Em dia',
        ATRASADO: 'Atrasado',
        ISENTO: 'Isento',
        TESTE: 'Teste / sem pagar',
    }[valor] ?? valor
}

function formatarSituacao(valor) {
    return {
        EM_DIA: 'Em dia',
        BLOQUEADO: 'Bloqueado',
        ATRASADO: 'Atrasado',
        USANDO_SEM_PAGAR: 'Usando sem pagar',
        SEM_USO: 'Sem uso recente',
    }[valor] ?? valor
}

function formatarData(data) {
    if (!data) {
        return '-'
    }

    const [ano, mes, dia] = data.split('-')
    return `${dia}/${mes}/${ano}`
}

function formatarDataHora(dataHora) {
    if (!dataHora) {
        return '-'
    }

    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(dataHora))
}

function AdminPainel() {
    const navigate = useNavigate()
    const [sessao] = useState(() => obterSessao())
    const [usuarios, setUsuarios] = useState([])
    const [mensagem, setMensagem] = useState('')
    const [carregando, setCarregando] = useState(true)
    const [salvandoId, setSalvandoId] = useState(null)

    const resumo = useMemo(() => {
        return usuarios.reduce(
            (total, usuario) => {
                total.usuarios += 1

                if (usuario.acessoLiberado) {
                    total.liberados += 1
                } else {
                    total.bloqueados += 1
                }

                if (usuario.statusPagamento === 'ATRASADO') {
                    total.atrasados += 1
                }

                if (usuario.statusPagamento === 'TESTE') {
                    total.semPagamento += 1
                }

                if (usuario.situacao === 'SEM_USO') {
                    total.semUso += 1
                }

                total.usosHoje += usuario.usosHoje ?? 0
                total.usosTotais += usuario.usosTotais ?? 0
                return total
            },
            {
                usuarios: 0,
                liberados: 0,
                bloqueados: 0,
                atrasados: 0,
                semPagamento: 0,
                semUso: 0,
                usosHoje: 0,
                usosTotais: 0,
            },
        )
    }, [usuarios])

    useEffect(() => {
        if (!sessao) {
            navigate('/login', { replace: true })
            return
        }

        if (sessao.usuario?.papel !== 'ADMINISTRADOR') {
            navigate('/dashboard', { replace: true })
        }
    }, [navigate, sessao])

    async function carregarUsuarios(sessaoAtual) {
        setCarregando(true)
        setMensagem('')

        try {
            const resposta = await fetch(
                `${API_URL}/admin/usuarios`,
                {
                    headers: {
                        Authorization:
                            `${sessaoAtual.tipoToken} ${sessaoAtual.token}`,
                    },
                },
            )

            if (!resposta.ok) {
                throw new Error(
                    await obterMensagemDeErro(resposta),
                )
            }

            setUsuarios(await resposta.json())
        } catch (erro) {
            setMensagem(
                erro instanceof Error
                    ? erro.message
                    : 'Não foi possível carregar os usuários',
            )
        } finally {
            setCarregando(false)
        }
    }

    useEffect(() => {
        if (sessao?.usuario?.papel === 'ADMINISTRADOR') {
            void Promise.resolve().then(() =>
                carregarUsuarios(sessao),
            )
        }
    }, [sessao])

    async function alternarAcesso(usuario) {
        await salvarAlteracao(
            usuario.id,
            `${API_URL}/admin/usuarios/${usuario.id}/acesso`,
            {
                acessoLiberado: !usuario.acessoLiberado,
            },
        )
    }

    async function atualizarPagamento(usuario, campos) {
        await salvarAlteracao(
            usuario.id,
            `${API_URL}/admin/usuarios/${usuario.id}/pagamento`,
            {
                statusPagamento:
                    campos.statusPagamento ??
                    usuario.statusPagamento,
                dataVencimentoPagamento:
                    campos.dataVencimentoPagamento ??
                    usuario.dataVencimentoPagamento,
            },
        )
    }

    async function salvarAlteracao(usuarioId, url, corpo) {
        if (!sessao) {
            return
        }

        setSalvandoId(usuarioId)
        setMensagem('')

        try {
            const resposta = await fetch(url, {
                method: 'PATCH',
                headers: {
                    Authorization:
                        `${sessao.tipoToken} ${sessao.token}`,
                    'Content-Type':
                        'application/json; charset=utf-8',
                },
                body: JSON.stringify(corpo),
            })

            if (!resposta.ok) {
                throw new Error(
                    await obterMensagemDeErro(resposta),
                )
            }

            const usuarioAtualizado = await resposta.json()

            setUsuarios((listaAtual) =>
                listaAtual.map((usuario) =>
                    usuario.id === usuarioAtualizado.id
                        ? usuarioAtualizado
                        : usuario,
                ),
            )

            setMensagem('Alteração salva com sucesso.')
        } catch (erro) {
            setMensagem(
                erro instanceof Error
                    ? erro.message
                    : 'Não foi possível salvar a alteração',
            )
        } finally {
            setSalvandoId(null)
        }
    }

    function sair() {
        limparSessao()
        navigate('/login', { replace: true })
    }

    function abrirSistema() {
        navigate('/dashboard')
    }

    return (
        <main className="admin-painel">
            <header className="admin-topo">
                <div>
                    <span className="admin-marca">AgroGestão</span>
                    <p className="admin-etiqueta">
                        Administração
                    </p>
                    <h1>Painel administrativo</h1>
                    <p>
                        Acompanhe pagamentos, liberação de
                        acesso e uso diário dos usuários.
                    </p>
                </div>

                <div className="admin-topo-acoes">
                    <button
                        className="admin-botao-primario"
                        onClick={abrirSistema}
                        type="button"
                    >
                        Ir para o sistema
                    </button>

                    <button
                        className="admin-botao-secundario"
                        onClick={sair}
                        type="button"
                    >
                        Sair da conta
                    </button>
                </div>
            </header>

            {mensagem && (
                <div className="admin-aviso" role="status">
                    {mensagem}
                </div>
            )}

            <section className="admin-resumo">
                <article>
                    <span>Usuários</span>
                    <strong>{resumo.usuarios}</strong>
                </article>

                <article>
                    <span>Liberados</span>
                    <strong>{resumo.liberados}</strong>
                </article>

                <article>
                    <span>Bloqueados</span>
                    <strong>{resumo.bloqueados}</strong>
                </article>

                <article>
                    <span>Atrasados</span>
                    <strong>{resumo.atrasados}</strong>
                </article>

                <article>
                    <span>Sem pagar</span>
                    <strong>{resumo.semPagamento}</strong>
                </article>

                <article>
                    <span>Sem uso</span>
                    <strong>{resumo.semUso}</strong>
                </article>
            </section>

            <section className="admin-tabela-bloco">
                <div className="admin-tabela-cabecalho">
                    <div>
                        <h2>Usuários cadastrados</h2>
                        <p>
                            {resumo.usosHoje} usos hoje ·{' '}
                            {resumo.usosTotais} usos totais
                        </p>
                    </div>
                </div>

                {carregando ? (
                    <p className="admin-vazio">
                        Carregando usuários...
                    </p>
                ) : (
                    <div className="admin-tabela-area">
                        <table className="admin-tabela">
                            <thead>
                                <tr>
                                    <th>Usuário</th>
                                    <th>Pagamento</th>
                                    <th>Vencimento</th>
                                    <th>Situação</th>
                                    <th>Uso</th>
                                    <th>Acesso</th>
                                </tr>
                            </thead>

                            <tbody>
                                {usuarios.map((usuario) => (
                                    <tr key={usuario.id}>
                                        <td>
                                            <strong>
                                                {usuario.nome}
                                            </strong>
                                            <span>
                                                {usuario.email}
                                            </span>
                                            <span>
                                                {usuario.nomeEmpresa}
                                            </span>
                                        </td>

                                        <td>
                                            <select
                                                disabled={
                                                    salvandoId ===
                                                    usuario.id
                                                }
                                                onChange={(evento) =>
                                                    atualizarPagamento(
                                                        usuario,
                                                        {
                                                            statusPagamento:
                                                                evento
                                                                    .target
                                                                    .value,
                                                        },
                                                    )
                                                }
                                                value={
                                                    usuario.statusPagamento
                                                }
                                            >
                                                {STATUS_PAGAMENTO.map(
                                                    (status) => (
                                                        <option
                                                            key={
                                                                status
                                                            }
                                                            value={
                                                                status
                                                            }
                                                        >
                                                            {formatarStatus(
                                                                status,
                                                            )}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        </td>

                                        <td>
                                            <input
                                                disabled={
                                                    salvandoId ===
                                                    usuario.id
                                                }
                                                onBlur={(evento) =>
                                                    atualizarPagamento(
                                                        usuario,
                                                        {
                                                            dataVencimentoPagamento:
                                                                evento
                                                                    .target
                                                                    .value ||
                                                                null,
                                                        },
                                                    )
                                                }
                                                type="date"
                                                defaultValue={
                                                    usuario.dataVencimentoPagamento ??
                                                    ''
                                                }
                                            />
                                            <span>
                                                {formatarData(
                                                    usuario.dataVencimentoPagamento,
                                                )}
                                            </span>
                                        </td>

                                        <td>
                                            <span
                                                className={
                                                    `admin-status admin-status-${usuario.situacao?.toLowerCase()}`
                                                }
                                            >
                                                {formatarSituacao(
                                                    usuario.situacao,
                                                )}
                                            </span>
                                        </td>

                                        <td>
                                            <strong>
                                                {usuario.usosHoje}
                                            </strong>
                                            <span>
                                                hoje · média{' '}
                                                {
                                                    usuario.mediaUsoPorDia
                                                }
                                                /dia
                                            </span>
                                            <span>
                                                Último uso:{' '}
                                                {formatarDataHora(
                                                    usuario.ultimoUsoEm,
                                                )}
                                            </span>
                                        </td>

                                        <td>
                                            <button
                                                className={
                                                    usuario.acessoLiberado
                                                        ? 'admin-botao-perigo'
                                                        : 'admin-botao-primario'
                                                }
                                                disabled={
                                                    salvandoId ===
                                                    usuario.id
                                                }
                                                onClick={() =>
                                                    alternarAcesso(
                                                        usuario,
                                                    )
                                                }
                                                type="button"
                                            >
                                                {usuario.acessoLiberado
                                                    ? 'Bloquear'
                                                    : 'Liberar'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    )
}

export default AdminPainel
