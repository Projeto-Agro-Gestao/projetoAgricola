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
    const [carregando, setCarregando] = useState(true)
    const [gerando, setGerando] = useState('')
    const [salvandoDocumento, setSalvandoDocumento] = useState(false)
    const [documentoPagamento, setDocumentoPagamento] =
        useState({
            tipoDocumento: 'CPF',
            documento: '',
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
            setDocumentoPagamento({
                tipoDocumento:
                    novosDados.resumo?.tipoDocumentoPagamento ?? 'CPF',
                documento:
                    novosDados.resumo?.documentoPagamento ?? '',
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
            if (!documentoValido()) {
                setMensagem(
                    'Informe CPF ou CNPJ nos dados para pagamento antes de gerar a cobranca.',
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
        const digitos = documentoPagamento.documento
            .replace(/\D/g, '')

        return documentoPagamento.tipoDocumento === 'CPF'
            ? digitos.length === 11
            : digitos.length === 14
    }

    async function salvarDocumentoPagamento(evento) {
        evento.preventDefault()

        try {
            setSalvandoDocumento(true)
            setMensagem('')

            if (!documentoValido()) {
                throw new Error(
                    documentoPagamento.tipoDocumento === 'CPF'
                        ? 'CPF deve possuir 11 digitos.'
                        : 'CNPJ deve possuir 14 digitos.',
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
                            documentoPagamento.tipoDocumento,
                        documento:
                            documentoPagamento.documento,
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
        setMensagem(aviso)
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
                        <p>Ultimo pagamento: {formatarData(resumo.ultimoPagamentoEm)}</p>
                    </article>
                </section>
            )}

            {resumo
                && ['TRIAL_EXPIRING', 'TRIAL_EXPIRED', 'PENDING', 'OVERDUE', 'SUSPENDED'].includes(resumo.status) && (
                <section className="plano-banner">
                    <strong>
                        {resumo.status === 'TRIAL_EXPIRED'
                            ? 'Seu periodo gratuito terminou.'
                            : `Seu periodo gratuito termina em ${resumo.diasRestantesTrial} dias.`}
                    </strong>
                    <span>
                        Gere uma cobranca por Pix ou boleto para liberar
                        automaticamente o acesso apos a confirmacao.
                    </span>
                </section>
            )}

            <section className="plano-card">
                <div className="plano-card-topo">
                    <div>
                        <span>Dados para pagamento</span>
                        <h2>CPF ou CNPJ</h2>
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
                                    documentoPagamento.tipoDocumento
                                    === 'CPF'
                                }
                                name="tipoDocumentoPagamento"
                                onChange={() =>
                                    setDocumentoPagamento({
                                        ...documentoPagamento,
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
                                    documentoPagamento.tipoDocumento
                                    === 'CNPJ'
                                }
                                name="tipoDocumentoPagamento"
                                onChange={() =>
                                    setDocumentoPagamento({
                                        ...documentoPagamento,
                                        tipoDocumento: 'CNPJ',
                                    })
                                }
                                type="radio"
                            />
                            CNPJ
                        </label>
                    </div>

                    <label className="plano-documento-campo">
                        Numero do {documentoPagamento.tipoDocumento}
                        <input
                            inputMode="numeric"
                            maxLength={
                                documentoPagamento.tipoDocumento === 'CPF'
                                    ? 14
                                    : 18
                            }
                            onChange={(evento) =>
                                setDocumentoPagamento({
                                    ...documentoPagamento,
                                    documento: evento.target.value,
                                })
                            }
                            placeholder={
                                documentoPagamento.tipoDocumento === 'CPF'
                                    ? 'Digite 11 digitos'
                                    : 'Digite 14 digitos'
                            }
                            value={documentoPagamento.documento}
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
                    Este CPF ou CNPJ sera usado apenas para gerar Pix
                    ou boleto no Asaas.
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
                        disabled={Boolean(gerando) || !documentoValido()}
                        onClick={() => gerarPagamento('pix')}
                        type="button"
                    >
                        {gerando === 'pix'
                            ? 'Gerando Pix...'
                            : 'Pagar com Pix'}
                    </button>

                    <button
                        disabled={Boolean(gerando) || !documentoValido()}
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

                        {pagamentoAtual.pixQrCodeBase64 && (
                            <>
                                <img
                                    alt="QR Code Pix"
                                    src={`data:image/png;base64,${pagamentoAtual.pixQrCodeBase64}`}
                                />
                                <button
                                    onClick={() =>
                                        copiar(
                                            pagamentoAtual.pixCopiaCola,
                                            'Pix copia e cola copiado.',
                                        )
                                    }
                                    type="button"
                                >
                                    Copiar Pix
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
                                            'Linha digitavel copiada.',
                                        )
                                    }
                                    type="button"
                                >
                                    Copiar linha digitavel
                                </button>
                            </>
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
