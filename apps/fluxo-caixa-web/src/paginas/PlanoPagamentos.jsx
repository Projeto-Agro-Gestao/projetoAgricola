import {
    useEffect,
    useState,
} from 'react'
import { useNavigate } from 'react-router'
import { API_BASE_URL as API_URL } from '../config.js'
import './PlanoPagamentos.css'
import ModalAnimado from '../componentes/ModalAnimado.jsx'
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

function intervaloSafraAtual(data = new Date()) {
    const inicioAno = data.getMonth() >= 6
        ? data.getFullYear()
        : data.getFullYear() - 1

    return {
        inicio: `${inicioAno}-07-01`,
        fim: `${inicioAno + 1}-06-30`,
        rotulo: `${inicioAno}/${inicioAno + 1}`,
    }
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

function statusPagamentoLegivel(status) {
    return {
        PENDING: 'Pendente',
        CONFIRMED: 'Pago',
        RECEIVED: 'Pago',
        OVERDUE: 'Vencido',
        CANCELLED: 'Cancelado',
        FAILED: 'Falhou',
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

function cobrancaCompleta(dados) {
    const documentoOk = dados.tipoDocumento === 'CPF'
        ? cpfValido(dados.documento)
        : cnpjValido(dados.documento)

    return documentoOk
        && somenteDigitos(dados.cep).length === 8
        && dados.rua.trim()
        && (dados.semNumero || dados.numero.trim())
        && dados.bairro.trim()
        && dados.cidade.trim()
        && dados.estado.trim().length === 2
}

function cobrancaPendenteAtiva(pagamento) {
    if (pagamento.status !== 'PENDING') return false

    const partesData = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date())
    const valoresData = Object.fromEntries(
        partesData.map(({ type, value }) => [type, value]),
    )
    const hoje = `${valoresData.year}-${valoresData.month}-${valoresData.day}`

    if (pagamento.vencimento && pagamento.vencimento < hoje) return false

    if (pagamento.formaPagamento === 'PIX' && pagamento.pixExpiraEm) {
        const expiracao = Date.parse(pagamento.pixExpiraEm)
        if (!Number.isNaN(expiracao) && expiracao <= Date.now()) return false
    }

    return true
}

function PlanoPagamentos() {
    const navigate = useNavigate()
    const [sessao] = useState(obterSessao)
    const [safraPadrao] = useState(intervaloSafraAtual)
    const [dados, setDados] = useState(null)
    const [pagamentoAtual, setPagamentoAtual] = useState(null)
    const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false)
    const [checandoPagamento, setChecandoPagamento] = useState(false)
    const [mensagem, setMensagem] = useState('')
    const [alertaDados, setAlertaDados] = useState(null)
    const [avisoCopia, setAvisoCopia] = useState('')
    const [formaSelecionada, setFormaSelecionada] = useState('')
    const [carregando, setCarregando] = useState(true)
    const [atualizandoHistorico, setAtualizandoHistorico] = useState(false)
    const [filtroDatas, setFiltroDatas] = useState(() => ({
        inicio: safraPadrao.inicio,
        fim: safraPadrao.fim,
    }))
    const [rascunhoFiltroDatas, setRascunhoFiltroDatas] = useState(() => ({
        inicio: safraPadrao.inicio,
        fim: safraPadrao.fim,
    }))
    const [filtroDatasAberto, setFiltroDatasAberto] = useState(false)
    const [gerando, setGerando] = useState('')
    const [salvandoDocumento, setSalvandoDocumento] = useState(false)
    const [editandoDocumento, setEditandoDocumento] = useState(true)
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
        if (!alertaDados) return undefined
        const temporizador = window.setTimeout(() => setAlertaDados(null), 5000)
        return () => window.clearTimeout(temporizador)
    }, [alertaDados])

    useEffect(() => {
        if (!sessao) {
            navigate('/login', { replace: true })
            return
        }

        carregar()
    }, [])

    async function carregar(
        mostrarCarregamento = true,
        sincronizarDadosCobranca = true,
    ) {
        try {
            if (mostrarCarregamento) setCarregando(true)

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
            const pagamentoPendente = novosDados.pagamentos?.find(
                cobrancaPendenteAtiva,
            ) ?? null
            setPagamentoAtual(pagamentoPendente)
            setFormaSelecionada(
                pagamentoPendente?.formaPagamento === 'BOLETO'
                    ? 'boleto'
                    : pagamentoPendente
                        ? 'pix'
                        : '',
            )
            setMensagem('')
            if (!sincronizarDadosCobranca) return novosDados

            const dadosPagamento = {
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
            }
            setDadosCobranca(dadosPagamento)
            setEditandoDocumento(!cobrancaCompleta(dadosPagamento))
            return novosDados
        } catch (erro) {
            setMensagem(
                erro instanceof Error
                    ? erro.message
                    : 'Nao foi possivel carregar o plano.',
            )
            return null
        } finally {
            if (mostrarCarregamento) setCarregando(false)
        }
    }

    async function atualizarHistorico() {
        if (atualizandoHistorico) return

        setAtualizandoHistorico(true)
        try {
            await carregar(false, false)
        } finally {
            setAtualizandoHistorico(false)
        }
    }

    function aplicarFiltroDatas() {
        if (rascunhoFiltroDatas.inicio
            && rascunhoFiltroDatas.fim
            && rascunhoFiltroDatas.inicio > rascunhoFiltroDatas.fim) {
            return
        }

        setFiltroDatas(rascunhoFiltroDatas)
        setFiltroDatasAberto(false)
    }

    function limparFiltroDatas() {
        const semFiltro = { inicio: '', fim: '' }
        setFiltroDatas(semFiltro)
        setRascunhoFiltroDatas(semFiltro)
        setFiltroDatasAberto(false)
    }

    function filtrarSafraAtual() {
        const safra = {
            inicio: safraPadrao.inicio,
            fim: safraPadrao.fim,
        }
        setFiltroDatas(safra)
        setRascunhoFiltroDatas(safra)
        setFiltroDatasAberto(false)
    }

    function abrirPagamentoDoHistorico(pagamento) {
        if (cobrancaPendenteAtiva(pagamento)) {
            setPagamentoAtual(pagamento)
            setFormaSelecionada(
                pagamento.formaPagamento === 'BOLETO' ? 'boleto' : 'pix',
            )
            setAvisoCopia('')
            setModalPagamentoAberto(true)
            return
        }

        gerarPagamento(
            pagamento.formaPagamento === 'BOLETO' ? 'boleto' : 'pix',
        )
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
            await carregar(false)
            if (pagamento.formaPagamento === 'BOLETO'
                || pagamento.pixCopiaCola
                || pagamento.pixQrCodeBase64) {
                setModalPagamentoAberto(true)
            }
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

    async function confirmarPagamento() {
        if (!pagamentoAtual?.id) {
            setModalPagamentoAberto(false)
            return
        }

        try {
            setChecandoPagamento(true)
            const dadosAtualizados = await carregar(false)
            const pagamentoAtualizado = dadosAtualizados?.pagamentos?.find(
                (pagamento) => pagamento.id === pagamentoAtual.id,
            )

            if (pagamentoAtualizado) {
                setPagamentoAtual((atual) => ({
                    ...atual,
                    ...pagamentoAtualizado,
                }))
            }

            if (['CONFIRMED', 'RECEIVED'].includes(pagamentoAtualizado?.status)) {
                setModalPagamentoAberto(false)
                setAlertaDados({
                    tipo: 'sucesso',
                    texto: `Pagamento ${pagamentoAtual?.formaPagamento === 'BOLETO' ? 'do boleto' : 'Pix'} confirmado. Seu acesso foi atualizado.`,
                })
            }
        } finally {
            setChecandoPagamento(false)
        }
    }

    function documentoValido() {
        return dadosCobranca.tipoDocumento === 'CPF'
            ? cpfValido(dadosCobranca.documento)
            : cnpjValido(dadosCobranca.documento)
    }

    function dadosCobrancaCompletos() {
        return cobrancaCompleta(dadosCobranca)
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
            setAlertaDados(null)

            if (!documentoValido()) {
                throw new Error(
                    dadosCobranca.tipoDocumento === 'CPF'
                        ? 'CPF inválido.'
                        : 'CNPJ inválido.',
                )
            }

            if (somenteDigitos(dadosCobranca.cep).length !== 8) {
                throw new Error('CEP deve possuir 8 dígitos.')
            }

            if (
                dadosCobranca.complemento.trim().length > 50
            ) {
                throw new Error(
                    'Complemento deve ter no máximo 50 caracteres.',
                )
            }

            if (
                !dadosCobranca.semNumero
                && !dadosCobranca.numero.trim()
            ) {
                throw new Error(
                    'Informe o número ou marque Sem número.',
                )
            }

            if (!dadosCobrancaCompletos()) {
                throw new Error(
                    'Preencha CPF ou CNPJ, CEP, rua, bairro, cidade, estado e número ou marque Sem número.',
                )
            }

            const resposta = await salvarDadosPagamento({
                apiUrl: API_URL, empresaId, dados: dadosCobranca,
            })

            if (!resposta.ok) {
                throw new Error(
                    await obterMensagemDeErro(
                        resposta,
                        'Não foi possível salvar os dados de pagamento.',
                    ),
                )
            }

            const novosDados = await resposta.json()
            setDados(novosDados)
            setEditandoDocumento(false)
            setAlertaDados({
                tipo: 'sucesso',
                texto: 'Dados de pagamento salvos com sucesso.',
            })
        } catch (erro) {
            setAlertaDados({
                tipo: 'erro',
                texto: erro instanceof Error
                    ? erro.message
                    : 'Não foi possível salvar os dados de pagamento.',
            })
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
    const safraAtual = safraPadrao.rotulo
    const pagamentosFiltrados = pagamentos.filter((pagamento) => {
        const dataPagamento = pagamento.pagoEm ?? pagamento.vencimento
        if (!dataPagamento) return false
        if (filtroDatas.inicio && dataPagamento < filtroDatas.inicio) return false
        if (filtroDatas.fim && dataPagamento > filtroDatas.fim) return false
        return true
    })
    const filtroEhSafraAtual = filtroDatas.inicio === safraPadrao.inicio
        && filtroDatas.fim === safraPadrao.fim
    const rotuloFiltroDatas = filtroEhSafraAtual
        ? `Safra ${safraAtual}`
        : filtroDatas.inicio && filtroDatas.fim
            ? `${formatarData(filtroDatas.inicio)} – ${formatarData(filtroDatas.fim)}`
            : filtroDatas.inicio
                ? `A partir de ${formatarData(filtroDatas.inicio)}`
                : filtroDatas.fim
                    ? `Até ${formatarData(filtroDatas.fim)}`
                    : 'Todas as datas'
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
            {alertaDados && (
                <div
                    className={`plano-toast plano-toast-${alertaDados.tipo}`}
                    role={alertaDados.tipo === 'erro' ? 'alert' : 'status'}
                    aria-live={alertaDados.tipo === 'erro' ? 'assertive' : 'polite'}
                >
                    <span className="material-symbols-outlined plano-toast-icone" aria-hidden="true">
                        {alertaDados.tipo === 'erro' ? 'error' : 'check_circle'}
                    </span>
                    <span className="plano-toast-texto">{alertaDados.texto}</span>
                    <button
                        aria-label="Fechar aviso"
                        className="plano-toast-fechar"
                        onClick={() => setAlertaDados(null)}
                        type="button"
                    >
                        <span className="material-symbols-outlined" aria-hidden="true">close</span>
                    </button>
                </div>
            )}
            <div className="plano-conteudo">
                <header className="plano-cabecalho">
                    <h1>Plano e pagamentos</h1>
                    <p>
                        Acompanhe seu teste gratuito, assinatura e cobranças do Gestão Agrícola.
                    </p>
                </header>

                {mensagem && (
                    <div className="plano-aviso" role="status">
                        {mensagem}
                    </div>
                )}

                {resumo && ['TRIAL_EXPIRING', 'TRIAL_EXPIRED', 'PENDING', 'OVERDUE', 'GRACE_PERIOD', 'BLOCKED', 'SUSPENDED'].includes(resumo.status) && (
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
                                    ? 'Seu período gratuito terminou.'
                                    : `Seu período gratuito termina em ${resumo.diasRestantesTrial} dias.`}
                        </strong>
                        <span>
                            {resumo.status === 'GRACE_PERIOD'
                                ? `Você pode usar o AgroGestão até ${formatarData(resumo.fimCarencia)}. O bloqueio ocorre em ${formatarData(resumo.dataBloqueio)}.`
                                : 'Gere uma cobrança por Pix ou boleto para liberar automaticamente o acesso após a confirmação.'}
                        </span>
                    </section>
                )}

                {planoGratuito && (
                    <section className="plano-banner plano-banner-gratis">
                        <strong>Plano promocional gratuito ativo.</strong>
                        <span>
                            O valor mensal está configurado como R$ 0,00 pelo administrador. Pix e boleto ficam disponíveis quando houver valor maior que zero.
                        </span>
                    </section>
                )}

                {resumo && (
                    <section className="plano-grade">
                        <article>
                            <span>Plano atual</span>
                            <strong>Gestão Agrícola</strong>
                            <p>{formatarDinheiro(resumo.valorMensal)}/mês</p>
                        </article>

                        <article>
                            <span>Status</span>
                            <strong className={`plano-status plano-status-${resumo.status?.toLowerCase()}`}>
                                {statusLegivel(resumo.status)}
                            </strong>
                            <p>
                                {resumo.acessoLiberado
                                    ? 'Acesso liberado'
                                    : 'Acesso aguardando pagamento'}
                            </p>
                        </article>

                        <article>
                            <span>Período gratuito</span>
                            <strong>{formatarData(resumo.trialFim)}</strong>
                            <p>{resumo.diasRestantesTrial} dias restantes</p>
                        </article>

                        <article>
                            <span>Próximo vencimento</span>
                            <strong>{formatarData(resumo.proximoVencimento)}</strong>
                            <p>Dia fixo: {resumo.diaVencimento ?? '-'}</p>
                        </article>

                        <article>
                            <span>Carência</span>
                            <strong>{formatarData(resumo.fimCarencia)}</strong>
                            <p>Bloqueio: {formatarData(resumo.dataBloqueio)}</p>
                        </article>

                        <article>
                            <span>Último pagamento</span>
                            <strong>{formatarData(resumo.ultimoPagamentoEm)}</strong>
                            <p>{resumo.diasRestantesCarencia} dias de carência</p>
                        </article>
                    </section>
                )}

            <section className="plano-card">
                <div className="plano-card-topo">
                    <div className="plano-card-identidade">
                        <span className="plano-card-icone" aria-hidden="true">
                            <span className="material-symbols-outlined">badge</span>
                        </span>
                        <div>
                            <div className="plano-card-sobretitulo">
                                <span>Dados para pagamento</span>
                                {dadosCobrancaCompletos() && (
                                    <span className="plano-dados-confirmados">
                                        <span className="material-symbols-outlined" aria-hidden="true">check_circle</span>
                                        Dados confirmados
                                    </span>
                                )}
                            </div>
                            <h2>Dados exigidos pelo órgão cobrador</h2>
                            <p>Informações fiscais necessárias para emissão do documento bancário e liberação da assinatura.</p>
                        </div>
                    </div>
                    <div className="plano-documento-opcoes" role="group" aria-label="Tipo de documento">
                        {['CPF', 'CNPJ'].map((tipo) => (
                            <label className={dadosCobranca.tipoDocumento === tipo ? 'selecionado' : ''} key={tipo}>
                                <input
                                    checked={dadosCobranca.tipoDocumento === tipo}
                                    disabled={!editandoDocumento}
                                    name="tipoDocumentoPagamento"
                                    onChange={() => setDadosCobranca({
                                        ...dadosCobranca,
                                        tipoDocumento: tipo,
                                        documento: '',
                                    })}
                                    type="radio"
                                />
                                {tipo}
                            </label>
                        ))}
                    </div>
                </div>

                <form
                    className="plano-documento"
                    noValidate
                    onSubmit={salvarDocumentoPagamento}
                >
                    <label className="plano-documento-campo plano-campo-documento">
                        <span>Número do {dadosCobranca.tipoDocumento} <b>*</b></span>
                        <input
                            disabled={!editandoDocumento}
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
                            required
                            value={dadosCobranca.documento}
                        />
                    </label>

                    <label className="plano-documento-campo plano-campo-cep">
                        <span>CEP <b>*</b></span>
                        <input
                            disabled={!editandoDocumento}
                            inputMode="numeric"
                            maxLength={9}
                            onBlur={consultarCep}
                            onChange={(evento) => setDadosCobranca({
                                ...dadosCobranca,
                                cep: formatarCep(evento.target.value),
                            })}
                            placeholder="88813-600"
                            required
                            value={dadosCobranca.cep}
                        />
                        {consultandoCep && <small>Buscando endereço...</small>}
                    </label>

                    <label className="plano-documento-campo plano-campo-estado">
                        <span>Estado <b>*</b></span>
                        <input
                            disabled={!editandoDocumento}
                            maxLength={2}
                            onChange={(evento) => setDadosCobranca({
                                ...dadosCobranca,
                                estado: evento.target.value.toUpperCase(),
                            })}
                            placeholder="SC"
                            required
                            value={dadosCobranca.estado}
                        />
                    </label>

                    <label className="plano-documento-campo plano-campo-cidade">
                        <span>Cidade <b>*</b></span>
                        <input
                            disabled={!editandoDocumento}
                            maxLength={100}
                            onChange={(evento) => setDadosCobranca({
                                ...dadosCobranca,
                                cidade: evento.target.value,
                            })}
                            required
                            value={dadosCobranca.cidade}
                        />
                    </label>

                    <label className="plano-documento-campo plano-campo-bairro">
                        <span>Bairro <b>*</b></span>
                        <input
                            disabled={!editandoDocumento}
                            maxLength={100}
                            onChange={(evento) => setDadosCobranca({
                                ...dadosCobranca,
                                bairro: evento.target.value,
                            })}
                            required
                            value={dadosCobranca.bairro}
                        />
                    </label>

                    <label className="plano-documento-campo plano-campo-rua">
                        <span>Rua <b>*</b></span>
                        <input
                            disabled={!editandoDocumento}
                            maxLength={150}
                            onChange={(evento) =>
                                setDadosCobranca({
                                    ...dadosCobranca,
                                    rua: evento.target.value,
                                })
                            }
                            required
                            value={dadosCobranca.rua}
                        />
                    </label>

                    <label className="plano-documento-campo plano-campo-numero">
                        <span>Número <b>*</b></span>
                        <input
                            disabled={!editandoDocumento || dadosCobranca.semNumero}
                            maxLength={20}
                            onChange={(evento) => setDadosCobranca({
                                ...dadosCobranca,
                                numero: evento.target.value,
                            })}
                            required={!dadosCobranca.semNumero}
                            value={dadosCobranca.numero}
                        />
                    </label>

                    <label className="plano-checkbox plano-campo-sem-numero">
                        <input
                            checked={dadosCobranca.semNumero}
                            disabled={!editandoDocumento}
                            onChange={(evento) => setDadosCobranca({
                                ...dadosCobranca,
                                semNumero: evento.target.checked,
                                numero: evento.target.checked ? '' : dadosCobranca.numero,
                            })}
                            type="checkbox"
                        />
                        Sem número
                    </label>

                    <label className="plano-documento-campo plano-campo-complemento">
                        Complemento
                        <input
                            disabled={!editandoDocumento}
                            maxLength={50}
                            onChange={(evento) => setDadosCobranca({
                                ...dadosCobranca,
                                complemento: evento.target.value,
                            })}
                            placeholder="Galpão, bloco, sala..."
                            value={dadosCobranca.complemento}
                        />
                    </label>

                    <label className="plano-documento-campo plano-documento-largo">
                        Observações do endereço
                        <textarea
                            disabled={!editandoDocumento}
                            maxLength={500}
                            onChange={(evento) =>
                                setDadosCobranca({
                                    ...dadosCobranca,
                                    observacoesEndereco:
                                        evento.target.value,
                                })
                            }
                            placeholder="Acesso, referência rural ou orientação de entrega."
                            value={dadosCobranca.observacoesEndereco}
                        />
                    </label>

                    <div className="plano-documento-rodape">
                        <button
                            className="plano-botao-edicao"
                            disabled={salvandoDocumento}
                            onClick={() => {
                                if (!editandoDocumento) setEditandoDocumento(true)
                            }}
                            type={editandoDocumento ? 'submit' : 'button'}
                        >
                            <span className="material-symbols-outlined" aria-hidden="true">
                                {editandoDocumento ? 'save' : 'edit'}
                            </span>
                            {salvandoDocumento
                                ? 'Salvando...'
                                : editandoDocumento
                                    ? 'Salvar dados de pagamento'
                                    : 'Editar dados de pagamento'}
                        </button>
                        {dadosCobrancaCompletos() && !editandoDocumento && (
                            <span className="plano-cadastro-completo">
                                <span className="material-symbols-outlined" aria-hidden="true">verified</span>
                                Cadastro completo para faturamento
                            </span>
                        )}
                    </div>
                </form>

                {dadosCobrancaCompletos() && !editandoDocumento && (
                    <p className="plano-documento-ajuda">
                        <span className="material-symbols-outlined" aria-hidden="true">lock</span>
                        <span>Dados fiscais protegidos para segurança da emissão. Clique em <strong>Editar dados de pagamento</strong> para fazer qualquer correção.</span>
                    </p>
                )}
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
                        onClick={() => pagamentoAtual?.formaPagamento !== 'BOLETO'
                            && (pagamentoAtual?.pixCopiaCola || pagamentoAtual?.pixQrCodeBase64)
                            ? setModalPagamentoAberto(true)
                            : gerarPagamento('pix')}
                        type="button"
                    >
                        {gerando === 'pix'
                            ? 'Gerando Pix...'
                            : pagamentoAtual?.formaPagamento !== 'BOLETO'
                                && (pagamentoAtual?.pixCopiaCola || pagamentoAtual?.pixQrCodeBase64)
                                ? 'Ver Pix gerado'
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
                        onClick={() => pagamentoAtual?.formaPagamento === 'BOLETO'
                            && (pagamentoAtual?.linhaDigitavel || pagamentoAtual?.boletoUrl)
                            ? setModalPagamentoAberto(true)
                            : gerarPagamento('boleto')}
                        type="button"
                    >
                        {gerando === 'boleto'
                            ? 'Gerando boleto...'
                            : pagamentoAtual?.formaPagamento === 'BOLETO'
                                && (pagamentoAtual?.linhaDigitavel || pagamentoAtual?.boletoUrl)
                                ? 'Ver boleto gerado'
                                : 'Pagar com boleto'}
                    </button>
                </div>

            </section>

            <section className="plano-card plano-historico">
                <div className="plano-card-topo plano-historico-topo">
                    <div>
                        <span>Histórico</span>
                        <h2>Pagamentos</h2>
                    </div>
                    <div className="plano-historico-acoes-topo">
                        <div className="plano-historico-filtro">
                            <button
                                aria-label="Filtrar histórico por data"
                                aria-expanded={filtroDatasAberto}
                                aria-haspopup="dialog"
                                className="plano-historico-safra"
                                onClick={() => {
                                    if (!filtroDatasAberto) {
                                        setRascunhoFiltroDatas(filtroDatas)
                                    }
                                    setFiltroDatasAberto((aberto) => !aberto)
                                }}
                                type="button"
                            >
                                <span className="material-symbols-outlined" aria-hidden="true">calendar_month</span>
                                {rotuloFiltroDatas}
                                <span className="material-symbols-outlined plano-historico-filtro-seta" aria-hidden="true">expand_more</span>
                            </button>
                            {filtroDatasAberto && (
                                <div
                                    aria-label="Filtrar pagamentos por data"
                                    className="plano-historico-filtro-painel"
                                    role="dialog"
                                >
                                    <strong>Filtrar por período</strong>
                                    <label>
                                        De
                                        <input
                                            max={rascunhoFiltroDatas.fim || undefined}
                                            onChange={(evento) => setRascunhoFiltroDatas((filtro) => ({
                                                ...filtro,
                                                inicio: evento.target.value,
                                            }))}
                                            type="date"
                                            value={rascunhoFiltroDatas.inicio}
                                        />
                                    </label>
                                    <label>
                                        Até
                                        <input
                                            min={rascunhoFiltroDatas.inicio || undefined}
                                            onChange={(evento) => setRascunhoFiltroDatas((filtro) => ({
                                                ...filtro,
                                                fim: evento.target.value,
                                            }))}
                                            type="date"
                                            value={rascunhoFiltroDatas.fim}
                                        />
                                    </label>
                                    <div className="plano-historico-filtro-acoes">
                                        <button
                                            className="plano-historico-filtro-texto"
                                            onClick={limparFiltroDatas}
                                            type="button"
                                        >
                                            Limpar
                                        </button>
                                        <button
                                            className="plano-historico-filtro-texto"
                                            onClick={filtrarSafraAtual}
                                            type="button"
                                        >
                                            Safra atual
                                        </button>
                                        <button
                                            className="plano-historico-filtro-aplicar"
                                            disabled={Boolean(
                                                rascunhoFiltroDatas.inicio
                                                && rascunhoFiltroDatas.fim
                                                && rascunhoFiltroDatas.inicio > rascunhoFiltroDatas.fim,
                                            )}
                                            onClick={aplicarFiltroDatas}
                                            type="button"
                                        >
                                            Aplicar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button
                            className="plano-historico-atualizar"
                            disabled={atualizandoHistorico}
                            onClick={atualizarHistorico}
                            type="button"
                        >
                            <span className="material-symbols-outlined" aria-hidden="true">
                                {atualizandoHistorico ? 'progress_activity' : 'refresh'}
                            </span>
                            {atualizandoHistorico ? 'Atualizando...' : 'Atualizar histórico'}
                        </button>
                    </div>
                </div>

                {pagamentosFiltrados.length === 0 ? (
                    <div className="plano-historico-vazio">
                        {pagamentos.length === 0
                            ? 'Nenhum pagamento gerado ainda.'
                            : 'Nenhum pagamento encontrado nesse período.'}
                        {pagamentos.length > 0 && (
                            <button onClick={limparFiltroDatas} type="button">
                                Limpar filtro
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="plano-tabela-area plano-historico-tabela-area">
                        <table className="plano-tabela plano-historico-tabela">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Descrição</th>
                                    <th>Valor</th>
                                    <th>Forma</th>
                                    <th>Status</th>
                                    <th>Nota fiscal</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagamentosFiltrados.map((pagamento) => {
                                    const nota = notaPorPagamento.get(pagamento.id)
                                    const pago = ['CONFIRMED', 'RECEIVED']
                                        .includes(pagamento.status)
                                    const pendenteAtivo = cobrancaPendenteAtiva(pagamento)
                                    const classeStatus = pago
                                        ? 'pago'
                                        : pagamento.status === 'PENDING'
                                            ? 'pendente'
                                            : 'outro'

                                    return (
                                        <tr key={pagamento.id}>
                                            <td>
                                                <strong>
                                                    {formatarData(pagamento.pagoEm ?? pagamento.vencimento)}
                                                </strong>
                                            </td>
                                            <td>
                                                <div className="plano-historico-descricao">
                                                    <strong>{pagamento.descricao}</strong>
                                                    <span>
                                                        {pago
                                                            ? 'Mensalidade'
                                                            : pagamento.status === 'PENDING'
                                                                ? 'Mensalidade · Renovação regular'
                                                                : 'Cobrança da assinatura'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td><strong>{formatarDinheiro(pagamento.valor)}</strong></td>
                                            <td>
                                                <span className="plano-historico-forma">
                                                    {pagamento.formaPagamento === 'PIX' ? (
                                                        <img alt="" aria-hidden="true" src="/pix.svg" />
                                                    ) : (
                                                        <span className="material-symbols-outlined" aria-hidden="true">request_quote</span>
                                                    )}
                                                    {pagamento.formaPagamento === 'PIX' ? 'Pix' : 'Boleto'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`plano-historico-status ${classeStatus}`}>
                                                    <span />
                                                    {statusPagamentoLegivel(pagamento.status)}
                                                </span>
                                            </td>
                                            <td>
                                                {nota?.pdfUrl ? (
                                                    <a
                                                        className="plano-historico-link-nota"
                                                        href={nota.pdfUrl}
                                                        rel="noreferrer"
                                                        target="_blank"
                                                    >
                                                        <span className="material-symbols-outlined" aria-hidden="true">description</span>
                                                        Baixar NF-e (PDF)
                                                    </a>
                                                ) : (
                                                    <span className={`plano-historico-nota${pago ? ' disponivel' : ''}`}>
                                                        {nota
                                                            ? statusNotaLegivel(nota.status)
                                                            : pago
                                                                ? 'Nota fiscal em processamento'
                                                                : 'Disponível após pagamento'}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                {!pago && ['PENDING', 'OVERDUE', 'FAILED']
                                                    .includes(pagamento.status) ? (
                                                        <button
                                                            className="plano-historico-pagar"
                                                            onClick={() => abrirPagamentoDoHistorico(pagamento)}
                                                            type="button"
                                                        >
                                                            <span className="material-symbols-outlined" aria-hidden="true">
                                                                {pendenteAtivo ? 'qr_code_2' : 'refresh'}
                                                            </span>
                                                            {pendenteAtivo ? 'Pagar agora' : 'Nova cobrança'}
                                                        </button>
                                                    ) : pagamento.invoiceUrl ? (
                                                        <a
                                                            className="plano-historico-recibo"
                                                            href={pagamento.invoiceUrl}
                                                            rel="noreferrer"
                                                            target="_blank"
                                                        >
                                                            <span className="material-symbols-outlined" aria-hidden="true">receipt_long</span>
                                                            Recibo
                                                        </a>
                                                    ) : (
                                                        <span className="plano-historico-sem-acao">—</span>
                                                    )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <footer className="plano-historico-rodape">
                    <span>
                        <span className="material-symbols-outlined" aria-hidden="true">verified_user</span>
                        Mostrando {pagamentosFiltrados.length} de {pagamentos.length} pagamentos · Emissões processadas com segurança bancária
                    </span>
                    <strong>Total registrado: {pagamentos.length} {pagamentos.length === 1 ? 'fatura' : 'faturas'}</strong>
                </footer>
            </section>
            </div>

            <ModalAnimado
                aberto={modalPagamentoAberto}
                aoFechar={setModalPagamentoAberto}
                classeFundo="plano-pix-modal-fundo"
            >
                <section
                    aria-labelledby="plano-pagamento-titulo"
                    aria-modal="true"
                    className="plano-pix-modal"
                    role="dialog"
                >
                    <header className="plano-pix-modal-cabecalho">
                        <div>
                            <span>Pagamento da assinatura</span>
                            <h2 id="plano-pagamento-titulo">
                                Gestão Agrícola · {formatarDinheiro(pagamentoAtual?.valor ?? resumo?.valorMensal)} / mês
                            </h2>
                        </div>
                        <button
                            aria-label="Fechar pagamento"
                            className="plano-pix-fechar"
                            onClick={() => setModalPagamentoAberto(false)}
                            type="button"
                        >
                            <span className="material-symbols-outlined" aria-hidden="true">close</span>
                        </button>
                    </header>

                    <div className="plano-pix-modal-conteudo">
                        <div className="plano-pix-metodo">
                            {pagamentoAtual?.formaPagamento === 'BOLETO' ? (
                                <span className="material-symbols-outlined" aria-hidden="true">request_quote</span>
                            ) : (
                                <img alt="" aria-hidden="true" className="plano-pix-logo" src="/pix.svg" />
                            )}
                            {pagamentoAtual?.formaPagamento === 'BOLETO' ? 'Boleto bancário' : 'Pix instantâneo'}
                        </div>

                        <div className="plano-pix-valor">
                            <div>
                                <span>Valor da fatura</span>
                                <strong>{formatarDinheiro(pagamentoAtual?.valor ?? resumo?.valorMensal)}</strong>
                            </div>
                            <div>
                                <span>Vencimento</span>
                                <strong className="plano-pix-vencimento">
                                    {pagamentoAtual?.vencimento
                                        ? formatarData(pagamentoAtual.vencimento)
                                        : pagamentoAtual?.formaPagamento === 'BOLETO'
                                            ? 'Consulte o boleto'
                                            : 'Hoje (imediato)'}
                                </strong>
                            </div>
                        </div>

                        <div className={`plano-pix-qr-area${pagamentoAtual?.formaPagamento === 'BOLETO' ? ' plano-boleto-area' : ''}`}>
                            {pagamentoAtual?.formaPagamento === 'BOLETO' ? (
                                <div className="plano-boleto-icone">
                                    <span className="material-symbols-outlined" aria-hidden="true">description</span>
                                </div>
                            ) : pagamentoAtual?.pixQrCodeBase64 ? (
                                <img
                                    alt="QR Code para pagamento Pix"
                                    className="plano-pix-qr"
                                    src={`data:image/png;base64,${pagamentoAtual.pixQrCodeBase64}`}
                                />
                            ) : (
                                <div className="plano-pix-qr-indisponivel">
                                    <span className="material-symbols-outlined" aria-hidden="true">qr_code_2</span>
                                    <span>QR Code indisponível</span>
                                </div>
                            )}
                            <div className="plano-pix-instrucoes">
                                <strong className={`plano-pix-status${['CONFIRMED', 'RECEIVED'].includes(pagamentoAtual?.status) ? ' confirmado' : ''}`}>
                                    <span className="plano-pix-status-ponto" />
                                    {['CONFIRMED', 'RECEIVED'].includes(pagamentoAtual?.status)
                                        ? 'Pagamento confirmado'
                                        : pagamentoAtual?.formaPagamento === 'BOLETO'
                                            ? 'Aguardando pagamento do boleto'
                                            : 'Aguardando leitura do QR Code'}
                                </strong>
                                <p>
                                    {pagamentoAtual?.formaPagamento === 'BOLETO'
                                        ? <>Pague pelo aplicativo do seu banco usando a linha digitável ou <b>abra o boleto</b> para imprimir.</>
                                        : <>Abra o aplicativo do seu banco, escolha <b>Pix &gt; Pagar com QR Code</b> e aponte a câmera para o código ao lado.</>}
                                </p>
                                {pagamentoAtual?.formaPagamento === 'BOLETO' && pagamentoAtual?.boletoUrl && (
                                    <a
                                        className="plano-boleto-abrir"
                                        href={pagamentoAtual.boletoUrl}
                                        rel="noreferrer"
                                        target="_blank"
                                    >
                                        <span className="material-symbols-outlined" aria-hidden="true">open_in_new</span>
                                        Abrir boleto
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="plano-pix-copia">
                            <label htmlFor="plano-pix-codigo">
                                {pagamentoAtual?.formaPagamento === 'BOLETO' ? 'Linha digitável do boleto' : 'Código Pix Copia e Cola'}
                            </label>
                            <div>
                                <input
                                    id="plano-pix-codigo"
                                    readOnly
                                    value={pagamentoAtual?.formaPagamento === 'BOLETO'
                                        ? pagamentoAtual?.linhaDigitavel ?? ''
                                        : pagamentoAtual?.pixCopiaCola ?? ''}
                                />
                                <button
                                    disabled={pagamentoAtual?.formaPagamento === 'BOLETO'
                                        ? !pagamentoAtual?.linhaDigitavel
                                        : !pagamentoAtual?.pixCopiaCola}
                                    onClick={() => copiar(
                                        pagamentoAtual?.formaPagamento === 'BOLETO'
                                            ? pagamentoAtual?.linhaDigitavel
                                            : pagamentoAtual?.pixCopiaCola,
                                        pagamentoAtual?.formaPagamento === 'BOLETO' ? 'Boleto copiado.' : 'Pix copiado.',
                                    )}
                                    type="button"
                                >
                                    <span className="material-symbols-outlined" aria-hidden="true">content_copy</span>
                                    {pagamentoAtual?.formaPagamento === 'BOLETO'
                                        ? avisoCopia === 'Boleto copiado.' ? 'Boleto copiado' : 'Copiar boleto'
                                        : avisoCopia === 'Pix copiado.' ? 'Pix copiado' : 'Copiar Pix'}
                                </button>
                            </div>
                        </div>

                        <div className="plano-pix-seguranca">
                            <span className="material-symbols-outlined" aria-hidden="true">verified_user</span>
                            <span>
                                {pagamentoAtual?.formaPagamento === 'BOLETO'
                                    ? 'Ambiente seguro e criptografado. O acesso é liberado automaticamente após a confirmação bancária.'
                                    : 'Ambiente seguro e criptografado. Acesso liberado automaticamente após a confirmação do pagamento.'}
                            </span>
                        </div>
                    </div>

                    <footer className="plano-pix-modal-rodape">
                        <button
                            className="plano-pix-rodape-fechar"
                            onClick={() => setModalPagamentoAberto(false)}
                            type="button"
                        >
                            Fechar
                        </button>
                        <button
                            className="plano-pix-confirmar"
                            disabled={checandoPagamento}
                            onClick={confirmarPagamento}
                            type="button"
                        >
                            <span className="material-symbols-outlined" aria-hidden="true">
                                {checandoPagamento ? 'progress_activity' : 'check_circle'}
                            </span>
                            {checandoPagamento ? 'Verificando...' : 'Já realizei o pagamento'}
                        </button>
                    </footer>
                </section>
            </ModalAnimado>
        </main>
    )
}

export default PlanoPagamentos
