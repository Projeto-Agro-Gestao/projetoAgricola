import {
    useEffect,
    useMemo,
    useState,
} from 'react'
import { useNavigate } from 'react-router'
import { API_BASE_URL as API_URL } from '../config.js'
import './AdminPainel.css'
import { apiFetch } from '../servicos/api.js'
import { obterSessao } from '../servicos/sessao.js'
import CarregamentoTela from '../componentes/CarregamentoTela.jsx'
import ShellDashboard from '../componentes/ShellDashboard.jsx'

const STATUS_PAGAMENTO = [
    'EM_DIA',
    'ATRASADO',
    'ISENTO',
    'TESTE',
]

const TIPOS_ACESSO = {
    NORMAL: 'Normal',
    VITALICIO: 'Vitalício',
    PRAZO: 'Por prazo',
}

const FILTROS_USUARIOS = [
    { valor: 'TODOS', rotulo: 'Todos' },
    { valor: 'PENDENTES', rotulo: 'Pendentes' },
    { valor: 'LIBERADOS', rotulo: 'Liberados' },
    { valor: 'BLOQUEADOS', rotulo: 'Bloqueados' },
    { valor: 'ATRASADOS', rotulo: 'Atrasados' },
    { valor: 'SEM_PAGAR', rotulo: 'Sem pagar' },
    { valor: 'SEM_USO', rotulo: 'Sem uso' },
    { valor: 'ADMINISTRADORES', rotulo: 'Administradores' },
    { valor: 'CLIENTES', rotulo: 'Clientes' },
    { valor: 'PRODUTORES', rotulo: 'Produtores' },
    { valor: 'CONTADORES', rotulo: 'Contadores' },
]
const USUARIOS_POR_PAGINA = 5

async function obterMensagemDeErro(resposta) {
    const dados = await resposta.json().catch(() => null)
    return dados?.mensagem ?? 'Não foi possível concluir a ação'
}

async function obterMensagemDeErroAdmin(
    resposta,
    contexto = '',
) {
    const mensagem = await obterMensagemDeErro(resposta)

    if (
        contexto === 'papel' &&
        resposta.status === 404
    ) {
        return 'O backend publicado ainda nao reconheceu a rota de alterar perfil. Atualize a pagina apos o deploy do Render e tente novamente.'
    }

    return mensagem
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
        PENDENTE_APROVACAO: 'Pendente de aprovacao',
        BLOQUEADO: 'Bloqueado',
        ATRASADO: 'Atrasado',
        USANDO_SEM_PAGAR: 'Usando sem pagar',
        SEM_USO: 'Sem uso recente',
        ACESSO_EXPIRADO: 'Acesso expirado',
    }[valor] ?? valor
}

function formatarData(data) {
    if (!data) {
        return '-'
    }

    const [ano, mes, dia] = data.split('-')
    return `${dia}/${mes}/${ano}`
}

function formatarTipoAcesso(valor) {
    return TIPOS_ACESSO[valor] ?? 'Normal'
}

function isAdministradorUsuario(usuario) {
    return usuario?.papel === 'ADMINISTRADOR' ||
        usuario?.papel === 'SUPER_ADMIN'
}

function formatarPerfilUsuario(usuario) {
    if (usuario?.papel === 'SUPER_ADMIN') {
        return 'Super admin'
    }

    if (usuario?.papel === 'ADMINISTRADOR') {
        return 'Administrador'
    }

    if (usuario?.papel === 'CONTADOR') {
        return 'Cliente contador'
    }

    return 'Cliente'
}

function formatarDataHora(dataHora) {
    if (!dataHora) {
        return '-'
    }

    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'America/Sao_Paulo',
    }).format(new Date(dataHora))
}

function formatarMediaUso(valor) {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
    }).format(Number(valor ?? 0))
}

function AdminPainel() {
    const navigate = useNavigate()
    const [sessao] = useState(() => obterSessao())
    const [usuarios, setUsuarios] = useState([])
    const [mensagem, setMensagem] = useState('')
    const [carregando, setCarregando] = useState(true)
    const [salvandoId, setSalvandoId] = useState(null)
    const [diasAcesso, setDiasAcesso] = useState({})
    const [buscaUsuarios, setBuscaUsuarios] = useState('')
    const [filtroUsuarios, setFiltroUsuarios] = useState('TODOS')
    const [paginaUsuarios, setPaginaUsuarios] = useState(1)
    const [usuarioEmEdicao, setUsuarioEmEdicao] =
        useState(null)
    const [confirmacaoPapel, setConfirmacaoPapel] =
        useState(null)
    const [vinculosContador, setVinculosContador] =
        useState(null)
    const [empresaParaVincular, setEmpresaParaVincular] =
        useState('')
    const [formularioEdicao, setFormularioEdicao] =
        useState({
            nomeEmpresa: '',
            nome: '',
            email: '',
            telefone: '',
            agriculturaAtiva: true,
            pecuariaAtiva: false,
        })

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

    const usuariosFiltrados = useMemo(() => {
        const termo = buscaUsuarios.trim().toLowerCase()

        const filtrados = usuarios.filter((usuario) => {
            const atendeBusca = !termo || [
                usuario.nome,
                usuario.email,
                usuario.telefone,
                usuario.nomeEmpresa,
            ].some((valor) =>
                String(valor ?? '').toLowerCase().includes(termo),
            )

            const atendeFiltro =
                filtroUsuarios === 'TODOS' ||
                (filtroUsuarios === 'LIBERADOS' &&
                    usuario.acessoLiberado) ||
                (filtroUsuarios === 'PENDENTES' &&
                    usuario.situacao === 'PENDENTE_APROVACAO') ||
                (filtroUsuarios === 'BLOQUEADOS' &&
                    !usuario.acessoLiberado) ||
                (filtroUsuarios === 'ATRASADOS' &&
                    usuario.statusPagamento === 'ATRASADO') ||
                (filtroUsuarios === 'SEM_PAGAR' &&
                    usuario.statusPagamento === 'TESTE') ||
                (filtroUsuarios === 'SEM_USO' &&
                    usuario.situacao === 'SEM_USO') ||
                (filtroUsuarios === 'ADMINISTRADORES' &&
                    isAdministradorUsuario(usuario)) ||
                (filtroUsuarios === 'CLIENTES' &&
                    !isAdministradorUsuario(usuario)) ||
                (filtroUsuarios === 'PRODUTORES' &&
                    usuario.papel === 'PRODUTOR') ||
                (filtroUsuarios === 'CONTADORES' &&
                    usuario.papel === 'CONTADOR')

            return atendeBusca && atendeFiltro
        })

        return filtrados
    }, [buscaUsuarios, filtroUsuarios, usuarios])

    const totalPaginasUsuarios = Math.ceil(
        usuariosFiltrados.length / USUARIOS_POR_PAGINA,
    )
    const paginaAtualUsuarios = Math.min(
        paginaUsuarios,
        Math.max(totalPaginasUsuarios, 1),
    )
    const usuariosPaginados = useMemo(() => {
        const inicio = (paginaAtualUsuarios - 1) * USUARIOS_POR_PAGINA
        return usuariosFiltrados.slice(inicio, inicio + USUARIOS_POR_PAGINA)
    }, [paginaAtualUsuarios, usuariosFiltrados])

    useEffect(() => {
        if (paginaUsuarios > Math.max(totalPaginasUsuarios, 1)) {
            setPaginaUsuarios(Math.max(totalPaginasUsuarios, 1))
        }
    }, [paginaUsuarios, totalPaginasUsuarios])

    const empresasClienteDisponiveis = useMemo(() => {
        const empresas = new Map()
        usuarios
            .filter((usuario) =>
                usuario.empresaId &&
                usuario.empresaId !== vinculosContador?.contador?.empresaId &&
                !isAdministradorUsuario(usuario) &&
                usuario.papel !== 'CONTADOR')
            .forEach((usuario) => {
                if (!empresas.has(usuario.empresaId)) {
                    empresas.set(usuario.empresaId, {
                        empresaId: usuario.empresaId,
                        nomeEmpresa: usuario.nomeEmpresa,
                        produtorNome: usuario.nome,
                    })
                }
            })

        return Array.from(empresas.values())
            .sort((a, b) =>
                String(a.nomeEmpresa ?? '').localeCompare(
                    String(b.nomeEmpresa ?? ''),
                    'pt-BR',
                ))
    }, [usuarios, vinculosContador])

    useEffect(() => {
        if (!sessao) {
            navigate('/login', { replace: true })
            return
        }

        if (
            sessao.usuario?.papel !== 'ADMINISTRADOR' &&
            sessao.usuario?.papel !== 'SUPER_ADMIN'
        ) {
            navigate('/dashboard', { replace: true })
        }
    }, [navigate, sessao])

    async function carregarUsuarios() {
        setCarregando(true)
        setMensagem('')

        try {
            const resposta = await apiFetch(
                `${API_URL}/admin/usuarios`,
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
        if (
            sessao?.usuario?.papel === 'ADMINISTRADOR' ||
            sessao?.usuario?.papel === 'SUPER_ADMIN'
        ) {
            void Promise.resolve().then(() =>
                carregarUsuarios(),
            )
        }
    }, [sessao])

    async function alternarAcesso(usuario) {
        await salvarAlteracao(
            usuario.id,
            `${API_URL}/admin/usuarios/${usuario.id}/acesso`,
            {
                acessoLiberado: !usuario.acessoLiberado,
                tipoAcesso: usuario.tipoAcesso ?? 'NORMAL',
                acessoExpiraEm: usuario.acessoExpiraEm ?? null,
            },
        )
    }

    async function darAcessoVitalicio(usuario) {
        await salvarAlteracao(
            usuario.id,
            `${API_URL}/admin/usuarios/${usuario.id}/acesso`,
            {
                acessoLiberado: true,
                tipoAcesso: 'VITALICIO',
                acessoExpiraEm: null,
                diasAcesso: null,
            },
        )
    }

    async function liberarPorPrazo(usuario) {
        const dias = Number(diasAcesso[usuario.id] ?? 30)

        await salvarAlteracao(
            usuario.id,
            `${API_URL}/admin/usuarios/${usuario.id}/acesso`,
            {
                acessoLiberado: true,
                tipoAcesso: 'PRAZO',
                diasAcesso: dias,
            },
        )
    }

    async function voltarAcessoNormal(usuario) {
        await salvarAlteracao(
            usuario.id,
            `${API_URL}/admin/usuarios/${usuario.id}/acesso`,
            {
                acessoLiberado: true,
                tipoAcesso: 'NORMAL',
                acessoExpiraEm: null,
                diasAcesso: null,
            },
        )
    }

    function atualizarDiasAcesso(usuarioId, valor) {
        setDiasAcesso((atual) => ({
            ...atual,
            [usuarioId]: valor,
        }))
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

    async function aprovarUsuario(usuario, papel) {
        await salvarAlteracao(
            usuario.id,
            `${API_URL}/admin/usuarios/${usuario.id}/aprovar`,
            {
                papel,
            },
        )
    }

    function alternarPapelAdministrativo(usuario) {
        const administrador = isAdministradorUsuario(usuario)
        const papel = administrador ? 'PRODUTOR' : 'ADMINISTRADOR'

        setConfirmacaoPapel({
            usuario,
            papel,
            administrador,
        })
    }

    async function confirmarAlteracaoPapel() {
        if (!confirmacaoPapel) {
            return
        }

        const { usuario, papel, administrador } = confirmacaoPapel

        await salvarAlteracao(
            usuario.id,
            `${API_URL}/admin/usuarios/${usuario.id}/papel`,
            {
                papel,
            },
            'papel',
            administrador
                ? 'Acesso de administrador removido com sucesso.'
                : 'Usuario promovido a administrador com sucesso.',
        )
        setConfirmacaoPapel(null)
    }

    async function abrirVinculosContador(usuario) {
        if (!sessao) {
            return
        }

        setSalvandoId(usuario.id)
        setMensagem('')

        try {
            const resposta = await apiFetch(
                `${API_URL}/admin/contadores/${usuario.id}/clientes`,
            )

            if (!resposta.ok) {
                throw new Error(await obterMensagemDeErro(resposta))
            }

            setVinculosContador({
                contador: usuario,
                vinculos: await resposta.json(),
            })
            setEmpresaParaVincular('')
        } catch (erro) {
            setMensagem(
                erro instanceof Error
                    ? erro.message
                    : 'Nao foi possivel carregar os vinculos do contador.',
            )
        } finally {
            setSalvandoId(null)
        }
    }

    async function vincularClienteAoContador(evento) {
        evento.preventDefault()

        if (!sessao || !vinculosContador || !empresaParaVincular) {
            return
        }

        setSalvandoId(vinculosContador.contador.id)
        setMensagem('')

        try {
            const resposta = await apiFetch(
                `${API_URL}/admin/contadores/${vinculosContador.contador.id}/clientes`,
                {
                    method: 'POST',
                    body: {
                        empresaId: Number(empresaParaVincular),
                    },
                },
            )

            if (!resposta.ok) {
                throw new Error(await obterMensagemDeErro(resposta))
            }

            const vinculo = await resposta.json()
            setVinculosContador((atual) => ({
                ...atual,
                vinculos: [
                    ...(atual?.vinculos ?? []).filter((item) =>
                        item.empresaId !== vinculo.empresaId),
                    vinculo,
                ].sort((a, b) =>
                    String(a.empresaNome ?? '').localeCompare(
                        String(b.empresaNome ?? ''),
                        'pt-BR',
                    )),
            }))
            setEmpresaParaVincular('')
            setMensagem('Cliente vinculado ao contador com sucesso.')
        } catch (erro) {
            setMensagem(
                erro instanceof Error
                    ? erro.message
                    : 'Nao foi possivel vincular o cliente.',
            )
        } finally {
            setSalvandoId(null)
        }
    }

    async function removerClienteDoContador(vinculo) {
        if (!sessao || !vinculosContador) {
            return
        }

        setSalvandoId(vinculosContador.contador.id)
        setMensagem('')

        try {
            const resposta = await apiFetch(
                `${API_URL}/admin/contadores/${vinculosContador.contador.id}/clientes/${vinculo.empresaId}`,
                {
                    method: 'DELETE',
                },
            )

            if (!resposta.ok) {
                throw new Error(await obterMensagemDeErro(resposta))
            }

            const atualizado = await resposta.json()
            setVinculosContador((atual) => ({
                ...atual,
                vinculos: (atual?.vinculos ?? []).map((item) =>
                    item.empresaId === atualizado.empresaId
                        ? atualizado
                        : item,
                ),
            }))
            setMensagem('Vinculo removido do contador.')
        } catch (erro) {
            setMensagem(
                erro instanceof Error
                    ? erro.message
                    : 'Nao foi possivel remover o vinculo.',
            )
        } finally {
            setSalvandoId(null)
        }
    }

    async function salvarAlteracao(
        usuarioId,
        url,
        corpo,
        contexto = '',
        mensagemSucesso = 'Alteração salva com sucesso.',
    ) {
        if (!sessao) {
            return
        }

        setSalvandoId(usuarioId)
        setMensagem('')

        try {
            const resposta = await apiFetch(url, {
                method: 'PATCH',
                body: corpo,
            })

            if (!resposta.ok) {
                throw new Error(
                    await obterMensagemDeErroAdmin(
                        resposta,
                        contexto,
                    ),
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

            setMensagem(mensagemSucesso)
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

    function abrirEdicao(usuario) {
        setUsuarioEmEdicao(usuario)
        setFormularioEdicao({
            nomeEmpresa: usuario.nomeEmpresa ?? '',
            nome: usuario.nome ?? '',
            email: usuario.email ?? '',
            telefone: usuario.telefone ?? '',
            agriculturaAtiva:
                usuario.agriculturaAtiva ?? true,
            pecuariaAtiva:
                usuario.pecuariaAtiva ?? false,
        })
        setMensagem('')
    }

    function fecharEdicao() {
        setUsuarioEmEdicao(null)
    }

    function atualizarCampoEdicao(campo, valor) {
        setFormularioEdicao((atual) => ({
            ...atual,
            [campo]: valor,
        }))
    }

    async function salvarDadosUsuario(evento) {
        evento.preventDefault()

        if (!usuarioEmEdicao || !sessao) {
            return
        }

        if (
            !formularioEdicao.agriculturaAtiva
            && !formularioEdicao.pecuariaAtiva
        ) {
            setMensagem(
                'Escolha Agricultura, Pecuaria ou as duas atividades.',
            )
            return
        }

        setSalvandoId(usuarioEmEdicao.id)
        setMensagem('')

        try {
            const resposta = await apiFetch(
                `${API_URL}/admin/usuarios/${usuarioEmEdicao.id}/dados`,
                {
                    method: 'PATCH',
                    body: formularioEdicao,
                },
            )

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
            setUsuarioEmEdicao(null)
            setMensagem('Dados do usuario salvos com sucesso.')
        } catch (erro) {
            setMensagem(
                erro instanceof Error
                    ? erro.message
                    : 'Nao foi possivel salvar os dados',
            )
        } finally {
            setSalvandoId(null)
        }
    }

    function abrirSistema() {
        navigate('/dashboard')
    }

    function abrirAssinaturas() {
        navigate('/admin/assinaturas')
    }

    function abrirIntegracoes() {
        navigate('/admin/integracoes')
    }

    if (!sessao?.usuario) {
        return <CarregamentoTela compacto texto="Validando acesso" />
    }

    return (
        <ShellDashboard sessao={sessao}>
            <main className="admin-painel admin-painel-shell">
            <header className="admin-topo">
                <div>
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
                        <span aria-hidden="true" className="material-symbols-outlined">open_in_new</span>
                        Ir para o sistema
                    </button>

                    <button
                        className="admin-botao-secundario"
                        onClick={abrirAssinaturas}
                        type="button"
                    >
                        <span aria-hidden="true" className="material-symbols-outlined">credit_card</span>
                        Plano e pagamentos
                    </button>

                    <button
                        className="admin-botao-secundario"
                        onClick={abrirIntegracoes}
                        type="button"
                    >
                        <span aria-hidden="true" className="material-symbols-outlined">sync_alt</span>
                        Integrações oficiais
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
                    <small>Cadastrados</small>
                </article>

                <article>
                    <span>Liberados</span>
                    <strong>{resumo.liberados}</strong>
                    <small>Acesso ativo</small>
                </article>

                <article>
                    <span>Bloqueados</span>
                    <strong>{resumo.bloqueados}</strong>
                    <small>Sem pendências</small>
                </article>

                <article>
                    <span>Atrasados</span>
                    <strong>{resumo.atrasados}</strong>
                    <small>Em dia</small>
                </article>

                <article>
                    <span>Sem pagar</span>
                    <strong>{resumo.semPagamento}</strong>
                    <small>Faturamento OK</small>
                </article>

                <article>
                    <span>Sem uso</span>
                    <strong>{resumo.semUso}</strong>
                    <small>Sem atividade</small>
                </article>
            </section>

            <section className="admin-tabela-bloco" id="admin-usuarios">
                <div className="admin-tabela-cabecalho">
                    <div>
                        <h2>Usuários cadastrados</h2>
                        <p>
                            {resumo.usosHoje} usos hoje · {resumo.usosTotais} usos totais
                        </p>
                    </div>

                    <div className="admin-tabela-ferramentas">
                        <input
                            aria-label="Buscar usuário na lista"
                            onChange={(evento) => {
                                setBuscaUsuarios(evento.target.value)
                                setPaginaUsuarios(1)
                            }}
                            placeholder="Buscar nome, e-mail ou propriedade"
                            type="search"
                            value={buscaUsuarios}
                        />
                        <select
                            aria-label="Filtrar usuários"
                            onChange={(evento) => {
                                setFiltroUsuarios(evento.target.value)
                                setPaginaUsuarios(1)
                            }}
                            value={filtroUsuarios}
                        >
                            {FILTROS_USUARIOS.map((item) => (
                                <option key={item.valor} value={item.valor}>
                                    {item.rotulo}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {carregando ? (
                    <CarregamentoTela compacto texto="Carregando usuários" />
                ) : (
                    <>
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
                                {usuariosPaginados.length === 0 ? (
                                    <tr>
                                        <td className="admin-tabela-sem-resultados" colSpan="6">
                                            Nenhum usuário encontrado.
                                        </td>
                                    </tr>
                                ) : usuariosPaginados.map((usuario) => (
                                    <tr key={usuario.id}>
                                        <td>
                                            <div className="admin-usuario-identidade">
                                                <strong>
                                                    {usuario.nome}
                                                </strong>

                                                <span
                                                    className={
                                                        isAdministradorUsuario(
                                                            usuario,
                                                        )
                                                            ? 'admin-perfil admin-perfil-admin'
                                                            : 'admin-perfil'
                                                    }
                                                >
                                                    {formatarPerfilUsuario(
                                                        usuario,
                                                    )}
                                                </span>
                                            </div>

                                            <div className="admin-usuario-contato">
                                                <span>{usuario.email}</span>
                                                {usuario.telefone && (
                                                    <>
                                                        <span aria-hidden="true" className="admin-contato-separador">•</span>
                                                        <span>{usuario.telefone}</span>
                                                    </>
                                                )}
                                            </div>
                                            {usuario.nomeEmpresa && (
                                                <span className="admin-propriedade">
                                                    <span aria-hidden="true" className="material-symbols-outlined">agriculture</span>
                                                    {usuario.nomeEmpresa}
                                                </span>
                                            )}
                                        </td>

                                        <td>
                                            <select
                                                aria-label="Status do pagamento"
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
                                                aria-label="Data de vencimento do pagamento"
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
                                            <div className="admin-uso-painel">
                                                <div className="admin-uso-hoje">
                                                    <strong>{usuario.usosHoje}</strong>
                                                    <span>hoje</span>
                                                    <span className="admin-uso-media">
                                                        {formatarMediaUso(usuario.mediaUsoPorDia)}/dia
                                                    </span>
                                                </div>
                                                <div className="admin-uso-ultimo">
                                                    <span>
                                                        <span aria-hidden="true" className="material-symbols-outlined">history</span>
                                                        Último:
                                                    </span>
                                                    <time>{formatarDataHora(usuario.ultimoUsoEm)}</time>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <div className="admin-acesso-painel">
                                                <div className="admin-acesso-painel-topo">
                                                    <div className="admin-acesso-info">
                                                        <strong>{formatarTipoAcesso(usuario.tipoAcesso)}</strong>
                                                        <span>
                                                            Expira: {usuario.tipoAcesso === 'VITALICIO'
                                                                ? 'Nunca'
                                                                : formatarData(usuario.acessoExpiraEm)}
                                                        </span>
                                                    </div>
                                                    <button
                                                        className={usuario.acessoLiberado ? 'admin-botao-perigo' : 'admin-botao-primario'}
                                                        disabled={salvandoId === usuario.id}
                                                        onClick={() => alternarAcesso(usuario)}
                                                        type="button"
                                                    >
                                                        <span aria-hidden="true" className="material-symbols-outlined">
                                                            {usuario.acessoLiberado ? 'block' : 'lock_open'}
                                                        </span>
                                                        {usuario.acessoLiberado ? 'Bloquear' : 'Liberar'}
                                                    </button>
                                                </div>

                                                {usuario.situacao === 'PENDENTE_APROVACAO' && (
                                                    <div className="admin-acesso-aprovacao">
                                                        <button
                                                            className="admin-botao-primario"
                                                            disabled={salvandoId === usuario.id}
                                                            onClick={() => aprovarUsuario(usuario, 'PRODUTOR')}
                                                            type="button"
                                                        >Aprovar produtor</button>
                                                        <button
                                                            className="admin-botao-secundario"
                                                            disabled={salvandoId === usuario.id}
                                                            onClick={() => aprovarUsuario(usuario, 'CONTADOR')}
                                                            type="button"
                                                        >Aprovar contador</button>
                                                    </div>
                                                )}

                                                <div className="admin-acesso-administracao">
                                                    <button
                                                        className="admin-botao-secundario"
                                                        disabled={salvandoId === usuario.id}
                                                        onClick={() => abrirEdicao(usuario)}
                                                        type="button"
                                                    >
                                                        <span aria-hidden="true" className="material-symbols-outlined">edit</span>
                                                        Editar
                                                    </button>
                                                    {usuario.papel !== 'SUPER_ADMIN' && (
                                                        <button
                                                            className={isAdministradorUsuario(usuario) ? 'admin-botao-secundario' : 'admin-botao-primario'}
                                                            disabled={salvandoId === usuario.id}
                                                            onClick={() => alternarPapelAdministrativo(usuario)}
                                                            type="button"
                                                        >
                                                            <span aria-hidden="true" className="material-symbols-outlined">{isAdministradorUsuario(usuario) ? 'person' : 'shield_person'}</span>
                                                            {salvandoId === usuario.id
                                                                ? 'Atualizando...'
                                                                : isAdministradorUsuario(usuario)
                                                                    ? 'Tornar cliente'
                                                                    : 'Tornar administrador'}
                                                        </button>
                                                    )}
                                                    {usuario.papel === 'CONTADOR' && (
                                                        <button
                                                            className="admin-botao-secundario"
                                                            disabled={salvandoId === usuario.id}
                                                            onClick={() => abrirVinculosContador(usuario)}
                                                            type="button"
                                                        >Clientes</button>
                                                    )}
                                                </div>

                                                <div className="admin-acesso-liberacao">
                                                    <button
                                                        className="admin-botao-vitalicio"
                                                        disabled={salvandoId === usuario.id}
                                                        onClick={() => darAcessoVitalicio(usuario)}
                                                        type="button"
                                                    >Vitalício</button>
                                                    <button
                                                        className="admin-botao-normal"
                                                        disabled={salvandoId === usuario.id}
                                                        onClick={() => voltarAcessoNormal(usuario)}
                                                        type="button"
                                                    >Normal</button>
                                                    <div className="admin-prazo-acesso">
                                                        <input
                                                            aria-label="Dias de acesso"
                                                            disabled={salvandoId === usuario.id}
                                                            min="1"
                                                            onChange={(evento) => atualizarDiasAcesso(usuario.id, evento.target.value)}
                                                            type="number"
                                                            value={diasAcesso[usuario.id] ?? 30}
                                                        />
                                                        <span>dias</span>
                                                        <button
                                                            className="admin-botao-secundario"
                                                            disabled={salvandoId === usuario.id}
                                                            onClick={() => liberarPorPrazo(usuario)}
                                                            type="button"
                                                        >Liberar por prazo</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <footer className="admin-paginacao">
                        <span>
                            Mostrando <strong>{usuariosFiltrados.length === 0 ? 0 : (paginaAtualUsuarios - 1) * USUARIOS_POR_PAGINA + 1}</strong> a <strong>{Math.min(paginaAtualUsuarios * USUARIOS_POR_PAGINA, usuariosFiltrados.length)}</strong> de <strong>{usuariosFiltrados.length}</strong> usuários cadastrados
                        </span>
                        {totalPaginasUsuarios > 1 && (
                            <nav aria-label="Paginação de usuários" className="admin-paginacao-controles">
                                <button
                                    disabled={paginaAtualUsuarios === 1}
                                    onClick={() => setPaginaUsuarios(paginaAtualUsuarios - 1)}
                                    type="button"
                                >Anterior</button>
                                {Array.from({ length: totalPaginasUsuarios }, (_, indice) => indice + 1).map((pagina) => (
                                    <button
                                        aria-current={pagina === paginaAtualUsuarios ? 'page' : undefined}
                                        className={pagina === paginaAtualUsuarios ? 'ativo' : ''}
                                        key={pagina}
                                        onClick={() => setPaginaUsuarios(pagina)}
                                        type="button"
                                    >{pagina}</button>
                                ))}
                                <button
                                    disabled={paginaAtualUsuarios === totalPaginasUsuarios}
                                    onClick={() => setPaginaUsuarios(paginaAtualUsuarios + 1)}
                                    type="button"
                                >Próximo</button>
                            </nav>
                        )}
                    </footer>
                    </>
                )}
            </section>

            {usuarioEmEdicao && (
                <div
                    className="admin-modal-fundo"
                    role="presentation"
                >
                    <form
                        className="admin-modal"
                        onSubmit={salvarDadosUsuario}
                    >
                        <div className="admin-modal-topo">
                            <div>
                                <span>Usuario</span>
                                <h2>Editar dados</h2>
                            </div>

                            <button
                                className="admin-modal-fechar"
                                onClick={fecharEdicao}
                                type="button"
                            >
                                Fechar
                            </button>
                        </div>

                        <label>
                            Nome da propriedade
                            <input
                                maxLength={150}
                                onChange={(evento) =>
                                    atualizarCampoEdicao(
                                        'nomeEmpresa',
                                        evento.target.value,
                                    )
                                }
                                required
                                value={
                                    formularioEdicao.nomeEmpresa
                                }
                            />
                        </label>

                        <label>
                            Nome do responsavel
                            <input
                                maxLength={120}
                                onChange={(evento) =>
                                    atualizarCampoEdicao(
                                        'nome',
                                        evento.target.value,
                                    )
                                }
                                required
                                value={formularioEdicao.nome}
                            />
                        </label>

                        <label>
                            E-mail
                            <input
                                maxLength={150}
                                onChange={(evento) =>
                                    atualizarCampoEdicao(
                                        'email',
                                        evento.target.value,
                                    )
                                }
                                required
                                type="email"
                                value={formularioEdicao.email}
                            />
                        </label>

                        <label>
                            Telefone
                            <input
                                maxLength={20}
                                onChange={(evento) =>
                                    atualizarCampoEdicao(
                                        'telefone',
                                        evento.target.value,
                                    )
                                }
                                value={formularioEdicao.telefone}
                            />
                        </label>

                        <fieldset>
                            <legend>Atividades</legend>

                            <label>
                                <input
                                    checked={
                                        formularioEdicao.agriculturaAtiva
                                    }
                                    onChange={(evento) =>
                                        atualizarCampoEdicao(
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
                                        formularioEdicao.pecuariaAtiva
                                    }
                                    onChange={(evento) =>
                                        atualizarCampoEdicao(
                                            'pecuariaAtiva',
                                            evento.target.checked,
                                        )
                                    }
                                    type="checkbox"
                                />
                                Pecuaria
                            </label>
                        </fieldset>

                        <div className="admin-modal-acoes">
                            <button
                                className="admin-botao-secundario"
                                onClick={fecharEdicao}
                                type="button"
                            >
                                Cancelar
                            </button>

                            <button
                                className="admin-botao-primario"
                                disabled={
                                    salvandoId ===
                                    usuarioEmEdicao.id
                                }
                                type="submit"
                            >
                                Salvar dados
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {vinculosContador && (
                <div
                    className="admin-modal-fundo"
                    role="presentation"
                >
                    <div
                        aria-modal="true"
                        className="admin-modal admin-modal-amplo"
                        role="dialog"
                    >
                        <div className="admin-modal-topo">
                            <div>
                                <span>Carteira do contador</span>
                                <h2>
                                    Clientes de{' '}
                                    {vinculosContador.contador.nome}
                                </h2>
                            </div>

                            <button
                                className="admin-modal-fechar"
                                disabled={
                                    salvandoId ===
                                    vinculosContador.contador.id
                                }
                                onClick={() =>
                                    setVinculosContador(null)
                                }
                                type="button"
                            >
                                Fechar
                            </button>
                        </div>

                        <form
                            className="admin-vinculo-form"
                            onSubmit={vincularClienteAoContador}
                        >
                            <label>
                                Vincular cliente
                                <select
                                    onChange={(evento) =>
                                        setEmpresaParaVincular(
                                            evento.target.value,
                                        )
                                    }
                                    value={empresaParaVincular}
                                >
                                    <option value="">
                                        Selecione uma empresa/produtor
                                    </option>
                                    {empresasClienteDisponiveis.map(
                                        (empresa) => (
                                            <option
                                                key={empresa.empresaId}
                                                value={empresa.empresaId}
                                            >
                                                {empresa.nomeEmpresa} -{' '}
                                                {empresa.produtorNome}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </label>

                            <button
                                className="admin-botao-primario"
                                disabled={
                                    !empresaParaVincular ||
                                    salvandoId ===
                                    vinculosContador.contador.id
                                }
                                type="submit"
                            >
                                + Vincular cliente
                            </button>
                        </form>

                        <div className="admin-vinculos-lista">
                            {vinculosContador.vinculos.length === 0 ? (
                                <p>
                                    Nenhum cliente vinculado a este
                                    contador.
                                </p>
                            ) : (
                                vinculosContador.vinculos.map((vinculo) => (
                                    <article key={vinculo.vinculoId}>
                                        <div>
                                            <strong>
                                                {vinculo.empresaNome}
                                            </strong>
                                            <span>
                                                Status: {vinculo.status}
                                            </span>
                                        </div>

                                        {vinculo.status === 'ATIVO' ? (
                                            <button
                                                className="admin-botao-perigo"
                                                disabled={
                                                    salvandoId ===
                                                    vinculosContador
                                                        .contador.id
                                                }
                                                onClick={() =>
                                                    removerClienteDoContador(
                                                        vinculo,
                                                    )
                                                }
                                                type="button"
                                            >
                                                Remover vinculo
                                            </button>
                                        ) : (
                                            <span>Vinculo encerrado</span>
                                        )}
                                    </article>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {confirmacaoPapel && (
                <div
                    className="admin-modal-fundo"
                    role="presentation"
                >
                    <div
                        aria-modal="true"
                        className="admin-modal"
                        role="dialog"
                    >
                        <div className="admin-modal-topo">
                            <div>
                                <span>Perfil do usuario</span>
                                <h2>
                                    {confirmacaoPapel.administrador
                                        ? 'Remover acesso de administrador?'
                                        : 'Tornar usuario administrador?'}
                                </h2>
                            </div>

                            <button
                                className="admin-modal-fechar"
                                disabled={
                                    salvandoId ===
                                    confirmacaoPapel.usuario.id
                                }
                                onClick={() =>
                                    setConfirmacaoPapel(null)
                                }
                                type="button"
                            >
                                Fechar
                            </button>
                        </div>

                        <p>
                            {confirmacaoPapel.administrador
                                ? 'Tem certeza que deseja remover o acesso de administrador deste usuario?'
                                : 'Tem certeza que deseja tornar este usuario um administrador?'}
                        </p>

                        <p>
                            Administradores possuem acesso ampliado as
                            funcoes de gestao do AgroGestao.
                        </p>

                        <div className="admin-modal-acoes">
                            <button
                                className="admin-botao-secundario"
                                disabled={
                                    salvandoId ===
                                    confirmacaoPapel.usuario.id
                                }
                                onClick={() =>
                                    setConfirmacaoPapel(null)
                                }
                                type="button"
                            >
                                Cancelar
                            </button>

                            <button
                                className={
                                    confirmacaoPapel.administrador
                                        ? 'admin-botao-perigo'
                                        : 'admin-botao-primario'
                                }
                                disabled={
                                    salvandoId ===
                                    confirmacaoPapel.usuario.id
                                }
                                onClick={confirmarAlteracaoPapel}
                                type="button"
                            >
                                {salvandoId ===
                                confirmacaoPapel.usuario.id
                                    ? 'Atualizando...'
                                    : confirmacaoPapel.administrador
                                        ? 'Tornar cliente'
                                        : 'Tornar administrador'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </main>
        </ShellDashboard>
    )
}

export default AdminPainel
