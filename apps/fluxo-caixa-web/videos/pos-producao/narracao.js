import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const diretorio = path.dirname(fileURLToPath(import.meta.url))
const saida = path.join(diretorio, 'audio')

fs.mkdirSync(saida, { recursive: true })

const NARRACAO = {
    'landing-16x9':
        'Sua propriedade no controle, sem planilha. Com o AgroGestão você registra receitas e despesas, organiza as categorias e vê quanto entrou, quanto saiu e quanto sobrou. Comece agora no AgroGestão.',
    'login-16x9':
        'Entrar é rápido. E-mail, senha, e pronto: você já está no painel da sua propriedade.',
    'dashboard-16x9':
        'Tudo em uma tela. Quanto entrou, quanto saiu, o resultado, a margem de lucro e o gráfico do seu fluxo de caixa.',
    'movimentacoes-16x9':
        'Chega de caderno. Todas as movimentações organizadas, com filtro por categoria e histórico completo.',
    'nova-movimentacao-16x9':
        'Lançar é fácil: valor, categoria e data. Receita ou despesa em poucos toques.',
    'categorias-16x9':
        'Categorias do seu jeito. Crie, edite e ative conforme a sua atividade.',
    'contas-16x9':
        'Nunca mais perca um vencimento. Controle o que você tem a pagar e a receber, com lembretes.',
    'fornecedores-16x9':
        'Seus fornecedores em um só lugar, com histórico de compras e cotações.',
    'perfil-16x9':
        'Mantenha os dados da sua propriedade atualizados e escolha as suas atividades.',
    'app-mobile-9x16':
        'Do celular, em segundos. Veja o movimento do dia e lance receitas e despesas onde você estiver.',
}

async function gerarOpenAI(texto, destino) {
    const key = process.env.OPENAI_API_KEY

    if (!key) {
        throw new Error('Defina OPENAI_API_KEY.')
    }

    const resposta = await fetch(
        'https://api.openai.com/v1/audio/speech',
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${key}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: process.env.TTS_MODEL || 'gpt-4o-mini-tts',
                voice: process.env.TTS_VOICE || 'alloy',
                input: texto,
                response_format: 'mp3',
            }),
        },
    )

    if (!resposta.ok) {
        throw new Error(
            `OpenAI TTS falhou (${resposta.status}): ${await resposta.text()}`,
        )
    }

    fs.writeFileSync(
        destino,
        Buffer.from(await resposta.arrayBuffer()),
    )
}

async function gerarElevenLabs(texto, destino) {
    const key = process.env.ELEVENLABS_API_KEY
    const voz =
        process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'

    if (!key) {
        throw new Error('Defina ELEVENLABS_API_KEY.')
    }

    const resposta = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voz}`,
        {
            method: 'POST',
            headers: {
                'xi-api-key': key,
                'Content-Type': 'application/json',
                Accept: 'audio/mpeg',
            },
            body: JSON.stringify({
                text: texto,
                model_id:
                    process.env.TTS_MODEL || 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                },
            }),
        },
    )

    if (!resposta.ok) {
        throw new Error(
            `ElevenLabs TTS falhou (${resposta.status}): ${await resposta.text()}`,
        )
    }

    fs.writeFileSync(
        destino,
        Buffer.from(await resposta.arrayBuffer()),
    )
}

function textoDe(nome) {
    if (NARRACAO[nome]) {
        return NARRACAO[nome]
    }

    const alternativo = nome.endsWith('-9x16')
        ? nome.replace('-9x16', '-16x9')
        : nome.replace('-16x9', '-9x16')

    return NARRACAO[alternativo]
}

async function main() {
    const provedor = (process.env.TTS_PROVIDER || 'openai').toLowerCase()
    const gerar =
        provedor === 'elevenlabs' ? gerarElevenLabs : gerarOpenAI

    const pedidos = process.argv.slice(2)

    const alvos = pedidos.length
        ? pedidos
        : Object.keys(NARRACAO).flatMap((chave) => [
              chave,
              chave.replace('-16x9', '-9x16'),
          ])

    for (const nome of alvos) {
        const texto = textoDe(nome)

        if (!texto) {
            console.warn(`Sem roteiro para "${nome}", pulando.`)
            continue
        }

        const destino = path.join(saida, `${nome}.mp3`)

        if (fs.existsSync(destino) && !process.env.TTS_FORCE) {
            console.log(`= já existe: ${nome}.mp3`)
            continue
        }

        console.log(`▶ TTS (${provedor}) ${nome}`)
        await gerar(texto, destino)
        console.log(`✔ ${destino}`)
    }

    console.log(`\nÁudios em ${saida}`)
}

main().catch((erro) => {
    console.error(erro)
    process.exit(1)
})
