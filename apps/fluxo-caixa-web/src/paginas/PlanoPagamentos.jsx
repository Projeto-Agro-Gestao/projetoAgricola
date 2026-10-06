import {
    useEffect,
    useState,
} from 'react'
import { useNavigate } from 'react-router'
import { API_BASE_URL as API_URL } from '../config.js'
import { voltarPaginaAnterior } from '../navegacao.js'
import './PlanoPagamentos.css'
import { apiFetch } from '../servicos/api.js'
import { obterSessao } from '../servicos/sessao.js'
import { gerarCobrancaComDados, salvarDadosPagamento } from '../servicos/pagamentos.js'
import CarregamentoTela from '../componentes/CarregamentoTela.jsx'

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

function statusNotaLegivel(status) {
    return {
        NOT_REQUESTED: 'Nao solicitada',
        SCHEDULED: 'Agendada',
        PROCESSING: 'Em processamento',
        AUTHORIZED: 'Emitida',
        ERROR: 'Erro',
        CANCELLED: 'Cancelada',
        CANCELLATION_PENDING: 'Cancelamento em andamento',
        CANCELLATION_DENIED: 'Cancelamento negado',
    }[status] ?? status
}

async function obterMensagemDeErro(resposta, padrao) {
    const dados = await resposta.json().catch(() => null)
    return dados?.mensagem ?? padrao
}

function somenteDigitos(valor) {
    return String(valor ?? '').replace(/\D/g, '')
}

function formatarCep(valor) {
    const digitos = somenteDigitos(valor).slice(0, 8)
    return digitos.length > 5
        ? `${digitos.slice(0, 5)}-${digitos.slice(5)}`
        : digitos
}

function formatarDocumento(valor, tipoDocumento) {
    const digitos = somenteDigitos(valor)

    if (tipoDocumento === 'CPF') {
        const cpf = digitos.slice(0, 11)
        return cpf
            .replace(/^(\d{3})(\d)/, '$1.$2')
            .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1-$2')
    }

    const cnpj = digitos.slice(0, 14)
    return cnpj
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
}

function digitosRepetidos(digitos) {
    return /^(\d)\1+$/.test(digitos)
}

function cpfValido(valor) {
    const digitos = somenteDigitos(valor)

    if (digitos.length !== 11 || digitosRepetidos(digitos)) {
        return false
    }

    let soma = 0
    for (let indice = 0; indice < 9; indice += 1) {
        soma += Number(digitos[indice]) * (10 - indice)
    }

    let verificador = 11 - (soma % 11)
    if (verificador >= 10) {
        verificador = 0
    }

    if (verificador !== Number(digitos[9])) {
        return false
    }

    soma = 0
    for (let indice = 0; indice < 10; indice += 1) {
        soma += Number(digitos[indice]) * (11 - indice)
    }

    verificador = 11 - (soma % 11)
    if (verificador >= 10) {
        verificador = 0
    }

    return verificador === Number(digitos[10])
}

function cnpjValido(valor) {
    const digitos = somenteDigitos(valor)

    if (digitos.length !== 14 || digitosRepetidos(digitos)) {
        return false
    }

    const calcularDigito = (tamanho) => {
        const pesos = tamanho === 12
            ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
            : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        const soma = pesos.reduce(
            (total, peso, indice) =>
                total + Number(digitos[indice]) * peso,
            0,
        )
        const resto = soma % 11
        return resto < 2 ? 0 : 11 - resto
    }

    return calcularDigito(12) === Number(digitos[12])
        && calcularDigito(13) === Number(digitos[13])
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
    const [emitindoNota, setEmitindoNota] = useState(false)
    const [consultandoCep, setConsultandoCep] = useState(false)
    const [dadosCobranca, setDadosCobranca] =
        useState({
            tipoDocumento: 'CPF',
            documento: '',
            cep: '',
            rua: '',
            numero: '',
            semNumero: false,
            complemento: '',
            bairro: '',
            cidade: '',
            estado: '',
            telefone: '',
            email: '',
            observacoesEndereco: '',
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

            const resposta = await apiFetch(
                `${API_URL}/empresas/${empresaId}/assinatura`,
            )

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
                semNumero:
                    novosDados.resumo?.semNumeroCobranca ?? false,
                complemento:
                    novosDados.resumo?.complementoCobranca ?? '',
                bairro: novosDados.resumo?.bairroCobranca ?? '',
                cidade: novosDados.resumo?.cidadeCobranca ?? '',
                estado: novosDados.resumo?.estadoCobranca ?? '',
                telefone: novosDados.resumo?.telefoneCobranca ?? '',
                email: novosDados.resumo?.emailCobranca ?? '',
                observacoesEndereco:
                    novosDados.resumo?.observacoesEnderecoCobranca
                    ?? '',
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

            const resposta = await gerarCobrancaComDados(
                { apiUrl: API_URL, empresaId, dados: dadosCobranca },
                tipo,
                obterMensagemDeErro,
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
        return dadosCobranca.tipoDocumento === 'CPF'
            ? cpfValido(dadosCobranca.documento)
            : cnpjValido(dadosCobranca.documento)
    }

    function dadosCobrancaCompletos() {
        return documentoValido()
            && somenteDigitos(dadosCobranca.cep).length === 8
            && dadosCobranca.rua.trim()
            && (
                dadosCobranca.semNumero
                || dadosCobranca.numero.trim()
            )
            && dadosCobranca.bairro.trim()
            && dadosCobranca.cidade.trim()
            && dadosCobranca.estado.trim().length === 2
    }

    async function consultarCep() {
        const cep = somenteDigitos(dadosCobranca.cep)

        if (!cep) {
            return
        }

        if (cep.length !== 8) {
            setMensagem('CEP deve possuir 8 digitos.')
            return
        }

        try {
            setConsultandoCep(true)
            setMensagem('Buscando endereco...')

            const resposta = await apiFetch(
                `${API_URL}/empresas/${empresaId}/assinatura/cep/${cep}`,
            )

            if (!resposta.ok) {
                throw new Error(
                    await obterMensagemDeErro(
                        resposta,
                        'Nao foi possivel consultar o CEP automaticamente. Preencha o endereco manualmente.',
                    ),
                )
            }

            const endereco = await resposta.json()

            if (!endereco?.logradouro
                && !endereco?.bairro
                && !endereco?.cidade
                && !endereco?.uf) {
                setMensagem(
                    endereco?.mensagem
                    ?? 'CEP nao encontrado. Preencha o endereco manualmente.',
                )
                return
            }

            setDadosCobranca((estadoAtual) => ({
                ...estadoAtual,
                cep: formatarCep(endereco.cep ?? cep),
                rua: endereco.logradouro ?? estadoAtual.rua,
                bairro: endereco.bairro ?? estadoAtual.bairro,
                cidade: endereco.cidade ?? estadoAtual.cidade,
                estado: (endereco.uf ?? estadoAtual.estado)
                    .toUpperCase(),
            }))
            setMensagem('Endereco localizado. Confira os dados antes de salvar.')
        } catch (erro) {
            setMensagem(
                erro instanceof Error
                    ? erro.message
                    : 'Nao foi possivel consultar o CEP automaticamente. Preencha o endereco manualmente.',
            )
        } finally {
            setConsultandoCep(false)
        }
    }

    async function salvarDocumentoPagamento(evento) {
        evento.preventDefault()

        try {
            setSalvandoDocumento(true)
            setMensagem('')

            if (!documentoValido()) {
                throw new Error(
                    dadosCobranca.tipoDocumento === 'CPF'
                        ? 'CPF invalido.'
                        : 'CNPJ invalido.',
                )
            }

            if (somenteDigitos(dadosCobranca.cep).length !== 8) {
                throw new Error('CEP deve possuir 8 digitos.')
            }

            if (
                dadosCobranca.complemento.trim().length > 50
            ) {
                throw new Error(
                    'Complemento deve ter no maximo 50 caracteres.',
                )
            }

            if (
                !dadosCobranca.semNumero
                && !dadosCobranca.numero.trim()
            ) {
                throw new Error(
                    'Informe o numero ou marque Sem numero.',
                )
            }

            if (!dadosCobrancaCompletos()) {
                throw new Error(
                    'Preencha CPF ou CNPJ, CEP, rua, bairro, cidade, estado e numero ou marque Sem numero.',
                )
            }

            const resposta = await salvarDadosPagamento({
                apiUrl: API_URL, empresaId, dados: dadosCobranca,
            })

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

    async function emitirNotaFiscal(pagamentoId) {
        try {
            setEmitindoNota(true)
            setMensagem('')

            const resposta = await apiFetch(
                `${API_URL}/empresas/${empresaId}/assinatura/pagamentos/${pagamentoId}/nota-fiscal`,
                {
                    method: 'POST',
                },
            )

            if (!resposta.ok) {
                throw new Error(
                    await obterMensagemDeErro(
                        resposta,
                        'Nao foi possivel emitir a nota fiscal.',
                    ),
                )
            }

            const nota = await resposta.json()
            setDados((estado) => ({
                ...estado,
                notasFiscais: [
                    nota,
                    ...(estado?.notasFiscais ?? [])
                        .filter((item) => item.id !== nota.id),
                ],
            }))
            setMensagem('Nota fiscal solicitada.')
        } catch (erro) {
            setMensagem(
                erro instanceof Error
                    ? erro.message
                    : 'Nao foi possivel emitir a nota fiscal.',
            )
        } finally {
            setEmitindoNota(false)
        }
    }

    if (carregando) {
        return (
            <main className="plano-pagina">
                <CarregamentoTela texto="Carregando plano" />
            </main>
        )
    }

    const resumo = dados?.resumo
    const pagamentos = dados?.pagamentos ?? []
    const notasFiscais = dados?.notasFiscais ?? []
    const notaPorPagamento = new Map(
        notasFiscais.map((nota) => [nota.pagamentoId, nota]),
    )
    const pagamentosConfirmados = pagamentos.filter((pagamento) =>
        ['CONFIRMED', 'RECEIVED'].includes(pagamento.status),
    )
    const pagamentoElegivelNota = pagamentosConfirmados[0] ?? null
    const notaAtual = pagamentoElegivelNota
        ? notaPorPagamento.get(pagamentoElegivelNota.id)
        : null
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
                                        documento: '',
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
                                        documento: '',
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
                                    documento: formatarDocumento(
                                        evento.target.value,
                                        dadosCobranca.tipoDocumento,
                                    ),
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
                                maxLength={9}
                                onBlur={consultarCep}
                                onChange={(evento) =>
                                    setDadosCobranca({
                                        ...dadosCobranca,
                                        cep: formatarCep(
                                            evento.target.value,
                                        ),
                                    })
                                }
                                placeholder="Ex.: 88813-600"
                                value={dadosCobranca.cep}
                            />
                            {consultandoCep && (
                                <small>Buscando endereco...</small>
                            )}
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
                                disabled={dadosCobranca.semNumero}
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

                        <label className="plano-documento-campo plano-checkbox">
                            <input
                                checked={dadosCobranca.semNumero}
                                onChange={(evento) =>
                                    setDadosCobranca({
                                        ...dadosCobranca,
                                        semNumero:
                                            evento.target.checked,
                                        numero: evento.target.checked
                                            ? ''
                                            : dadosCobranca.numero,
                                    })
                                }
                                type="checkbox"
                            />
                            Sem numero
                        </label>
                    </div>

                    <div className="plano-documento-grade">
                        <label className="plano-documento-campo">
                            Complemento
                            <input
                                maxLength={50}
                                onChange={(evento) =>
                                    setDadosCobranca({
                                        ...dadosCobranca,
                                        complemento: evento.target.value,
                                    })
                                }
                                placeholder="Apartamento, bloco, sala..."
                                value={dadosCobranca.complemento}
                            />
                            <small>
                                {dadosCobranca.complemento.length}/50
                            </small>
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

                    <label className="plano-documento-campo plano-documento-largo">
                        Observacoes do endereco
                        <textarea
                            maxLength={500}
                            onChange={(evento) =>
                                setDadosCobranca({
                                    ...dadosCobranca,
                                    observacoesEndereco:
                                        evento.target.value,
                                })
                            }
                            placeholder="Entrada, referencia rural ou orientacao de entrega."
                            value={dadosCobranca.observacoesEndereco}
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
                    CPF ou CNPJ, CEP, rua, bairro, cidade, estado e
                    numero ou Sem numero sao exigencias para gerar Pix
                    ou boleto. A busca por CEP apenas ajuda no
                    preenchimento; voce pode corrigir o endereco antes
                    de salvar.
                </p>
            </section>

            <section className="plano-card">
                <div className="plano-card-topo">
                    <div>
                        <span>Gerar Nota Fiscal</span>
                        <h2>PDF da nota fiscal</h2>
                    </div>
                </div>

                {!pagamentoElegivelNota && (
                    <p className="plano-vazio">
                        Nota fiscal disponivel apos a confirmacao do
                        pagamento.
                    </p>
                )}

                {pagamentoElegivelNota && !notaAtual && (
                    <div className="plano-nota">
                        <p>
                            Pagamento confirmado em{' '}
                            {formatarData(pagamentoElegivelNota.pagoEm)}.
                            A NFS-e sera emitida com os dados de cobranca
                            salvos nesta pagina.
                        </p>
                        <button
                            disabled={emitindoNota}
                            onClick={() =>
                                emitirNotaFiscal(
                                    pagamentoElegivelNota.id,
                                )
                            }
                            type="button"
                        >
                            {emitindoNota
                                ? 'Emitindo...'
                                : 'Emitir nota fiscal'}
                        </button>
                    </div>
                )}

                {notaAtual && (
                    <div className="plano-nota">
                        <p>
                            Status:{' '}
                            <strong>
                                {statusNotaLegivel(notaAtual.status)}
                            </strong>
                        </p>

                        {['SCHEDULED', 'PROCESSING'].includes(
                            notaAtual.status,
                        ) && (
                            <p className="plano-vazio">
                                Nota fiscal em processamento. Assim que o
                                Asaas autorizar, o PDF aparecera aqui.
                            </p>
                        )}

                        {notaAtual.status === 'ERROR' && (
                            <p className="plano-vazio">
                                Nao foi possivel emitir sua nota fiscal.
                                Nossa equipe foi notificada.
                            </p>
                        )}

                        {notaAtual.status === 'AUTHORIZED' && (
                            <>
                                <p>
                                    Numero: {notaAtual.numeroNota ?? '-'}
                                </p>
                                <p>
                                    Data:{' '}
                                    {formatarData(
                                        notaAtual.dataAutorizacao,
                                    )}
                                </p>
                                <div className="plano-nota-acoes">
                                    {notaAtual.pdfUrl && (
                                        <a
                                            href={notaAtual.pdfUrl}
                                            rel="noreferrer"
                                            target="_blank"
                                        >
                                            Visualizar nota fiscal
                                        </a>
                                    )}
                                    {notaAtual.pdfUrl && (
                                        <a
                                            href={notaAtual.pdfUrl}
                                            rel="noreferrer"
                                            target="_blank"
                                        >
                                            Baixar PDF
                                        </a>
                                    )}
                                    {notaAtual.xmlUrl && (
                                        <a
                                            href={notaAtual.xmlUrl}
                                            rel="noreferrer"
                                            target="_blank"
                                        >
                                            Baixar XML
                                        </a>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
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
                                    <th>Nota fiscal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagamentos.map((pagamento) => {
                                    const nota =
                                        notaPorPagamento.get(
                                            pagamento.id,
                                        )

                                    return (
                                        <tr key={pagamento.id}>
                                            <td>{formatarData(pagamento.vencimento)}</td>
                                            <td>{pagamento.descricao}</td>
                                            <td>{formatarDinheiro(pagamento.valor)}</td>
                                            <td>{pagamento.formaPagamento}</td>
                                            <td>{pagamento.status}</td>
                                            <td>
                                                {nota ? (
                                                    <>
                                                        {statusNotaLegivel(
                                                            nota.status,
                                                        )}
                                                        {nota.pdfUrl && (
                                                            <>
                                                                {' '}
                                                                <a
                                                                    href={nota.pdfUrl}
                                                                    rel="noreferrer"
                                                                    target="_blank"
                                                                >
                                                                    PDF
                                                                </a>
                                                            </>
                                                        )}
                                                    </>
                                                ) : (
                                                    'Disponivel apos pagamento'
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    )
}

export default PlanoPagamentos
