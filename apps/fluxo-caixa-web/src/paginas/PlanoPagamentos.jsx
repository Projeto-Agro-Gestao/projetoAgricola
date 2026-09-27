import {
    useEffect,
    useState,
} from 'react'
import { useNavigate } from 'react-router'
import { API_BASE_URL as API_URL } from '../config.js'
import { voltarPaginaAnterior } from '../navegacao.js'
import './PlanoPagamentos.css'

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
            localStorage.getItem('agrogestao_tipo_token') ?? 'Bearer'
        const usuarioSalvo =
            localStorage.getItem('agrogestao_usuario')

        if (!token || !usuarioSalvo) {
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

function formatarDinheiro(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(valor ?? 0)
}

function formatarData(data) {
    if (!data) {
        return '-'
    }

    const [ano, mes, dia] = data.split('-')
    return `${dia}/${mes}/${ano}`
}

function statusLegivel(status) {
    return {
        TRIAL: 'Teste gratuito',
        TRIAL_EXPIRING: 'Teste terminando',
        TRIAL_EXPIRED: 'Teste encerrado',
        PENDING: 'Pagamento pendente',
        ACTIVE: 'Assinatura ativa',
        OVERDUE: 'Pagamento vencido',
        GRACE_PERIOD: 'Pagamento em atraso',
        BLOCKED: 'Acesso bloqueado',
        SUSPENDED: 'Assinatura suspensa',
        CANCELLED: 'Assinatura cancelada',
    }[status] ?? status
}

async function obterMensagemDeErro(resposta, padrao) {
    const dados = await resposta.json().catch(() => null)
    return dados?.mensagem ?? padrao
}

function PlanoPagamentos() {
    const navigate = useNavigate()
    const [sessao] = useState(obterSessao)
    const [dados, setDados] = useState(null)
    const [pagamentoAtual, setPagamentoAtual] = useState(null)
    const [mensagem, setMensagem] = useState('')
    const [avisoCopia, setAvisoCopia] = useState('')
    const [formaSelecionada, setFormaSelecionada] = useState('')
    const [carregando, setCarregando] = useState(true)
    const [gerando, setGerando] = useState('')
    const [salvandoDocumento, setSalvandoDocumento] = useState(false)
    const [dadosCobranca, setDadosCobranca] =
        useState({
            tipoDocumento: 'CPF',
            documento: '',
            cep: '',
            rua: '',
            numero: '',
            bairro: '',
            cidade: '',
            estado: '',
            telefone: '',
            email: '',
        })

    const empresaId = sessao?.usuario?.empresaId

    useEffect(() => {
        if (!sessao) {
            navigate('/login', { replace: true })
            return
        }

        carregar()
    }, [])

    async function carregar() {
        try {
            setCarregando(true)

            const resposta = await fetch(
                `${API_URL}/empresas/${empresaId}/assinatura`,
                {
                    headers: {
                        Authorization:
                            `${sessao.tipoToken} ${sessao.token}`,
                    },
                },
            )

            if (resposta.status === 401) {
                limparSessao()
                navigate('/login', { replace: true })
                return
            }

            if (!resposta.ok) {
                throw new Error(
                    await obterMensagemDeErro(
                        resposta,
                        'Nao foi possivel carregar o plano.',
                    ),
                )
            }

            const novosDados = await resposta.json()
            setDados(novosDados)
            setDadosCobranca({
                tipoDocumento:
                    novosDados.resumo?.tipoDocumentoPagamento ?? 'CPF',
                documento:
                    novosDados.resumo?.documentoPagamento ?? '',
                cep: novosDados.resumo?.cepCobranca ?? '',
                rua: novosDados.resumo?.ruaCobranca ?? '',
                numero: novosDados.resumo?.numeroCobranca ?? '',
                bairro: novosDados.resumo?.bairroCobranca ?? '',
                cidade: novosDados.resumo?.cidadeCobranca ?? '',
                estado: novosDados.resumo?.estadoCobranca ?? '',
                telefone: novosDados.resumo?.telefoneCobranca ?? '',
                email: novosDados.resumo?.emailCobranca ?? '',
            })
            setMensagem('')
        } catch (erro) {
            setMensagem(
                erro instanceof Error
                    ? erro.message
                    : 'Nao foi possivel carregar o plano.',
            )
        } finally {
            setCarregando(false)
        }
    }

    async function gerarPagamento(tipo) {
        try {
            setFormaSelecionada(tipo)
            setAvisoCopia('')

            if (Number(dados?.resumo?.valorMensal ?? 0) === 0) {
                setMensagem(
                    'Seu plano atual esta gratuito. Nenhuma cobranca precisa ser gerada.',
                )
                return
            }

            if (!dadosCobrancaCompletos()) {
                setMensagem(
                    'Preencha os dados exigidos pelo orgao cobrador antes de gerar Pix ou boleto.',
                )
                return
            }

            setGerando(tipo)
            setMensagem('')

            const caminho =
                tipo === 'pix' ? 'pix' : 'boleto'

            const resposta = await fetch(
                `${API_URL}/empresas/${empresaId}/assinatura/pagamentos/${caminho}`,
                {
                    method: 'POST',
                    headers: {
                        Authorization:
                            `${sessao.tipoToken} ${sessao.token}`,
                    },
                },
            )

            if (!resposta.ok) {
                throw new Error(
                    await obterMensagemDeErro(
                        resposta,
                        'Nao foi possivel gerar a cobranca.',
                    ),
                )
            }

            const pagamento = await resposta.json()
            setPagamentoAtual(pagamento)
            setFormaSelecionada(
                pagamento.formaPagamento === 'BOLETO'
                    ? 'boleto'
                    : 'pix',
            )
            await carregar()
        } catch (erro) {
            setMensagem(
                erro instanceof Error
                    ? erro.message
                    : 'Nao foi possivel gerar a cobranca.',
            )
        } finally {
            setGerando('')
        }
    }

    function documentoValido() {
        const digitos = dadosCobranca.documento
            .replace(/\D/g, '')

        return dadosCobranca.tipoDocumento === 'CPF'
            ? digitos.length === 11
            : digitos.length === 14
    }

    function dadosCobrancaCompletos() {
        return documentoValido()
            && dadosCobranca.cep.replace(/\D/g, '').length >= 8
            && dadosCobranca.rua.trim()
            && dadosCobranca.numero.trim()
            && dadosCobranca.bairro.trim()
            && dadosCobranca.cidade.trim()
            && dadosCobranca.estado.trim().length === 2
    }

    async function salvarDocumentoPagamento(evento) {
        evento.preventDefault()

        try {
            setSalvandoDocumento(true)
            setMensagem('')

            if (!documentoValido()) {
                throw new Error(
                    dadosCobranca.tipoDocumento === 'CPF'
                        ? 'CPF deve possuir 11 digitos.'
                        : 'CNPJ deve possuir 14 digitos.',
                )
            }

            if (!dadosCobrancaCompletos()) {
                throw new Error(
                    'Preencha CPF ou CNPJ, CEP, rua, numero, bairro, cidade e estado. Esses dados sao exigidos pelo orgao cobrador.',
                )
            }

            const resposta = await fetch(
                `${API_URL}/empresas/${empresaId}/assinatura/documento-pagamento`,
                {
                    method: 'PUT',
                    headers: {
                        Authorization:
                            `${sessao.tipoToken} ${sessao.token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        tipoDocumento:
                            dadosCobranca.tipoDocumento,
                        documento:
                            dadosCobranca.documento,
                        cep: dadosCobranca.cep,
                        rua: dadosCobranca.rua,
                        numero: dadosCobranca.numero,
                        bairro: dadosCobranca.bairro,
                        cidade: dadosCobranca.cidade,
                        estado: dadosCobranca.estado,
                        telefone: dadosCobranca.telefone,
                        email: dadosCobranca.email,
                    }),
                },
            )

            if (!resposta.ok) {
                throw new Error(
                    await obterMensagemDeErro(
                        resposta,
                        'Nao foi possivel salvar o documento.',
                    ),
                )
            }

            const novosDados = await resposta.json()
            setDados(novosDados)
            setMensagem('Dados para pagamento salvos.')
        } catch (erro) {
            setMensagem(
                erro instanceof Error
                    ? erro.message
                    : 'Nao foi possivel salvar o documento.',
            )
        } finally {
            setSalvandoDocumento(false)
        }
    }

    async function copiar(texto, aviso) {
        if (!texto) {
            return
        }

        await navigator.clipboard.writeText(texto)
        setAvisoCopia(aviso)
        setMensagem('')
    }

    if (carregando) {
        return (
            <main className="plano-pagina">
                <p>Carregando plano...</p>
            </main>
        )
    }

    const resumo = dados?.resumo
    const pagamentos = dados?.pagamentos ?? []
    const planoGratuito = Number(resumo?.valorMensal ?? 0) === 0

    return (
        <main className="plano-pagina">
            <button
                className="plano-voltar"
                onClick={() =>
                    voltarPaginaAnterior(
                        navigate,
                        '/dashboard',
                    )
                }
                type="button"
            >
                Voltar ao painel
            </button>

            <header className="plano-cabecalho">
                <span>AgroGestao</span>
                <h1>Plano e pagamentos</h1>
                <p>
                    Acompanhe seu teste gratuito, assinatura e
                    cobrancas do Gestao Agricola.
                </p>
            </header>

            {mensagem && (
                <div className="plano-aviso" role="status">
                    {mensagem}
                </div>
            )}

            {resumo && (
                <section className="plano-grade">
                    <article>
                        <span>Plano atual</span>
                        <strong>Gestao Agricola</strong>
                        <p>{formatarDinheiro(resumo.valorMensal)}/mes</p>
                    </article>

                    <article>
                        <span>Status</span>
                        <strong>{statusLegivel(resumo.status)}</strong>
                        <p>
                            {resumo.acessoLiberado
                                ? 'Acesso liberado'
                                : 'Acesso aguardando pagamento'}
                        </p>
                    </article>

                    <article>
                        <span>Periodo gratuito</span>
                        <strong>{formatarData(resumo.trialFim)}</strong>
                        <p>
                            {resumo.diasRestantesTrial} dias restantes
                        </p>
                    </article>

                    <article>
                        <span>Proximo vencimento</span>
                        <strong>
                            {formatarData(resumo.proximoVencimento)}
                        </strong>
                        <p>Dia fixo: {resumo.diaVencimento ?? '-'}</p>
                    </article>

                    <article>
                        <span>Carencia</span>
                        <strong>{formatarData(resumo.fimCarencia)}</strong>
                        <p>Bloqueio: {formatarData(resumo.dataBloqueio)}</p>
                    </article>

                    <article>
                        <span>Ultimo pagamento</span>
                        <strong>{formatarData(resumo.ultimoPagamentoEm)}</strong>
                        <p>{resumo.diasRestantesCarencia} dias de carencia</p>
                    </article>
                </section>
            )}

            {resumo
                && ['TRIAL_EXPIRING', 'TRIAL_EXPIRED', 'PENDING', 'OVERDUE', 'GRACE_PERIOD', 'BLOCKED', 'SUSPENDED'].includes(resumo.status) && (
                <section
                    className={`plano-banner ${
                        resumo.status === 'GRACE_PERIOD'
                            ? 'plano-banner-pulsando'
                            : ''
                    }`}
                >
                    <strong>
                        {resumo.status === 'GRACE_PERIOD'
                            ? 'Pagamento em atraso'
                            : resumo.status === 'BLOCKED'
                              ? 'Acesso bloqueado por falta de pagamento.'
                              : resumo.status === 'TRIAL_EXPIRED'
                            ? 'Seu periodo gratuito terminou.'
                            : `Seu periodo gratuito termina em ${resumo.diasRestantesTrial} dias.`}
                    </strong>
                    <span>
                        {resumo.status === 'GRACE_PERIOD'
                            ? `Voce pode usar o AgroGestao ate ${formatarData(resumo.fimCarencia)}. O bloqueio ocorre em ${formatarData(resumo.dataBloqueio)}.`
                            : 'Gere uma cobranca por Pix ou boleto para liberar automaticamente o acesso apos a confirmacao.'}
                    </span>
                </section>
            )}

            {planoGratuito && (
                <section className="plano-banner plano-banner-gratis">
                    <strong>Plano promocional gratuito ativo.</strong>
                    <span>
                        O valor mensal esta configurado como R$ 0,00 pelo
                        administrador. Pix e boleto ficam disponiveis quando
                        houver valor maior que zero.
                    </span>
                </section>
            )}

            <section className="plano-card">
                <div className="plano-card-topo">
                    <div>
                        <span>Dados para pagamento</span>
                        <h2>Dados exigidos pelo orgao cobrador</h2>
                    </div>
                </div>

                <form
                    className="plano-documento"
                    onSubmit={salvarDocumentoPagamento}
                >
                    <div className="plano-documento-opcoes">
                        <label>
                            <input
                                checked={
                                    dadosCobranca.tipoDocumento
                                    === 'CPF'
                                }
                                name="tipoDocumentoPagamento"
                                onChange={() =>
                                    setDadosCobranca({
                                        ...dadosCobranca,
                                        tipoDocumento: 'CPF',
                                    })
                                }
                                type="radio"
                            />
                            CPF
                        </label>

                        <label>
                            <input
                                checked={
                                    dadosCobranca.tipoDocumento
                                    === 'CNPJ'
                                }
                                name="tipoDocumentoPagamento"
                                onChange={() =>
                                    setDadosCobranca({
                                        ...dadosCobranca,
                                        tipoDocumento: 'CNPJ',
                                    })
                                }
                                type="radio"
                            />
                            CNPJ
                        </label>
                    </div>

                    <label className="plano-documento-campo">
                        Numero do {dadosCobranca.tipoDocumento}
                        <input
                            inputMode="numeric"
                            maxLength={
                                dadosCobranca.tipoDocumento === 'CPF'
                                    ? 14
                                    : 18
                            }
                            onChange={(evento) =>
                                setDadosCobranca({
                                    ...dadosCobranca,
                                    documento: evento.target.value,
                                })
                            }
                            placeholder={
                                dadosCobranca.tipoDocumento === 'CPF'
                                    ? 'Digite 11 digitos'
                                    : 'Digite 14 digitos'
                            }
                            value={dadosCobranca.documento}
                        />
                    </label>

                    <div className="plano-documento-grade">
                        <label className="plano-documento-campo">
                            CEP
                            <input
                                inputMode="numeric"
                                maxLength={12}
                                onChange={(evento) =>
                                    setDadosCobranca({
                                        ...dadosCobranca,
                                        cep: evento.target.value,
                                    })
                                }
                                placeholder="Ex.: 88000000"
                                value={dadosCobranca.cep}
                            />
                        </label>

                        <label className="plano-documento-campo">
                            Estado
                            <input
                                maxLength={2}
                                onChange={(evento) =>
                                    setDadosCobranca({
                                        ...dadosCobranca,
                                        estado: evento.target.value
                                            .toUpperCase(),
                                    })
                                }
                                placeholder="SC"
                                value={dadosCobranca.estado}
                            />
                        </label>
                    </div>

                    <label className="plano-documento-campo">
                        Rua
                        <input
                            maxLength={150}
                            onChange={(evento) =>
                                setDadosCobranca({
                                    ...dadosCobranca,
                                    rua: evento.target.value,
                                })
                            }
                            value={dadosCobranca.rua}
                        />
                    </label>

                    <div className="plano-documento-grade">
                        <label className="plano-documento-campo">
                            Numero
                            <input
                                maxLength={20}
                                onChange={(evento) =>
                                    setDadosCobranca({
                                        ...dadosCobranca,
                                        numero: evento.target.value,
                                    })
                                }
                                value={dadosCobranca.numero}
                            />
                        </label>

                        <label className="plano-documento-campo">
                            Bairro
                            <input
                                maxLength={100}
                                onChange={(evento) =>
                                    setDadosCobranca({
                                        ...dadosCobranca,
                                        bairro: evento.target.value,
                                    })
                                }
                                value={dadosCobranca.bairro}
                            />
                        </label>
                    </div>

                    <label className="plano-documento-campo">
                        Cidade
                        <input
                            maxLength={100}
                            onChange={(evento) =>
                                setDadosCobranca({
                                    ...dadosCobranca,
                                    cidade: evento.target.value,
                                })
                            }
                            value={dadosCobranca.cidade}
                        />
                    </label>

                    <button
                        disabled={salvandoDocumento}
                        type="submit"
                    >
                        {salvandoDocumento
                            ? 'Salvando...'
                            : 'Salvar dados para pagamento'}
                    </button>
                </form>

                <p className="plano-documento-ajuda">
                    CPF ou CNPJ, CEP, rua, numero, bairro, cidade e
                    estado sao exigencias do orgao cobrador para gerar
                    Pix ou boleto. Telefone e e-mail sao usados quando
                    estiverem disponiveis no cadastro.
                </p>
            </section>

            <section className="plano-card">
                <div className="plano-card-topo">
                    <div>
                        <span>Gerar Nota Fiscal</span>
                        <h2>PDF da nota fiscal</h2>
                    </div>
                </div>
                <p className="plano-vazio">
                    A nota fiscal usara os mesmos dados de cobranca
                    salvos acima quando a emissao estiver disponivel.
                </p>
            </section>

            <section className="plano-card">
                <div className="plano-card-topo">
                    <div>
                        <span>Formas de pagamento</span>
                        <h2>Pagar assinatura</h2>
                    </div>
                </div>

                <div className="plano-acoes">
                    <button
                        className={
                            formaSelecionada === 'pix'
                                ? 'plano-forma-selecionada'
                                : ''
                        }
                        disabled={
                            planoGratuito
                            || !resumo?.pixHabilitado
                            || Boolean(gerando)
                            || !dadosCobrancaCompletos()
                        }
                        onClick={() => gerarPagamento('pix')}
                        type="button"
                    >
                        {gerando === 'pix'
                            ? 'Gerando Pix...'
                            : 'Pagar com Pix'}
                    </button>

                    <button
                        className={
                            formaSelecionada === 'boleto'
                                ? 'plano-forma-selecionada'
                                : ''
                        }
                        disabled={
                            planoGratuito
                            || !resumo?.boletoHabilitado
                            || Boolean(gerando)
                            || !dadosCobrancaCompletos()
                        }
                        onClick={() => gerarPagamento('boleto')}
                        type="button"
                    >
                        {gerando === 'boleto'
                            ? 'Gerando boleto...'
                            : 'Pagar com boleto'}
                    </button>
                </div>

                {pagamentoAtual && (
                    <div className="plano-cobranca">
                        <h3>Cobranca gerada</h3>
                        <p>
                            Valor: {formatarDinheiro(pagamentoAtual.valor)}
                        </p>
                        <p>
                            Vencimento: {formatarData(pagamentoAtual.vencimento)}
                        </p>
                        <p>
                            Status: {pagamentoAtual.status}
                        </p>

                        {pagamentoAtual.pixQrCodeBase64 && (
                            <>
                                <img
                                    alt="QR Code Pix"
                                    src={`data:image/png;base64,${pagamentoAtual.pixQrCodeBase64}`}
                                />
                                {pagamentoAtual.pixCopiaCola && (
                                    <code>{pagamentoAtual.pixCopiaCola}</code>
                                )}
                                <button
                                    onClick={() =>
                                        copiar(
                                            pagamentoAtual.pixCopiaCola,
                                            'Item copiado.',
                                        )
                                    }
                                    type="button"
                                >
                                    Copiar codigo Pix
                                </button>
                            </>
                        )}

                        {pagamentoAtual.linhaDigitavel && (
                            <>
                                <code>{pagamentoAtual.linhaDigitavel}</code>
                                <button
                                    onClick={() =>
                                        copiar(
                                            pagamentoAtual.linhaDigitavel,
                                            'Item copiado.',
                                        )
                                    }
                                    type="button"
                                >
                                    Copiar codigo do boleto
                                </button>
                            </>
                        )}

                        {avisoCopia && (
                            <p className="plano-copia-feedback">
                                {avisoCopia}
                            </p>
                        )}

                        {pagamentoAtual.boletoUrl && (
                            <a
                                href={pagamentoAtual.boletoUrl}
                                rel="noreferrer"
                                target="_blank"
                            >
                                Visualizar boleto
                            </a>
                        )}
                    </div>
                )}
            </section>

            <section className="plano-card">
                <div className="plano-card-topo">
                    <div>
                        <span>Historico</span>
                        <h2>Pagamentos</h2>
                    </div>
                </div>

                {pagamentos.length === 0 ? (
                    <p className="plano-vazio">
                        Nenhum pagamento gerado ainda.
                    </p>
                ) : (
                    <div className="plano-tabela-area">
                        <table className="plano-tabela">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Descricao</th>
                                    <th>Valor</th>
                                    <th>Forma</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagamentos.map((pagamento) => (
                                    <tr key={pagamento.id}>
                                        <td>{formatarData(pagamento.vencimento)}</td>
                                        <td>{pagamento.descricao}</td>
                                        <td>{formatarDinheiro(pagamento.valor)}</td>
                                        <td>{pagamento.formaPagamento}</td>
                                        <td>{pagamento.status}</td>
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

export default PlanoPagamentos
