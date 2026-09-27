import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const diretorio = path.dirname(fileURLToPath(import.meta.url))
const saida = path.join(diretorio, 'audio')

fs.mkdirSync(saida, { recursive: true })

const NARRACAO = {
    'landing-16x9':
        'Conheça o AgroGestão, a plataforma de gestão financeira para o produtor rural. Registre receitas e despesas, organize suas categorias e acompanhe quanto entrou, quanto saiu e quanto sobrou na sua propriedade. Crie sua conta grátis.',
    'login-16x9':
        'Acesse sua conta com e-mail e senha. Com um toque, mostre ou oculte a senha e entre no painel da sua propriedade.',
    'dashboard-16x9':
        'No dashboard, veja o resumo do que entrou, do que saiu e do resultado. Acompanhe a margem de lucro, o ganho sobre o custo e o gráfico de fluxo de caixa por período.',
    'movimentacoes-16x9':
        'Todas as movimentações ficam organizadas em um só lugar. Filtre por categoria e acompanhe o histórico completo.',
    'nova-movimentacao-16x9':
        'Cadastre uma receita ou despesa em poucos campos: valor, categoria e data.',
    'categorias-16x9':
        'Personalize as categorias de receita e despesa. Crie, edite e ative conforme a sua atividade.',
    'contas-16x9':
        'Controle as contas a pagar e a receber, com previsão futura e lembretes de vencimento.',
    'fornecedores-16x9':
        'Cadastre e acompanhe seus fornecedores, com histórico de compras e cotações.',
    'perfil-16x9':
        'Mantenha os dados da propriedade atualizados e escolha as suas atividades.',
    'app-mobile-9x16':
        'Com o app simples, veja o movimento do dia e lance receitas e despesas em segundos, direto do celular.',
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

async function main() {
    const provedor = (process.env.TTS_PROVIDER || 'openai').toLowerCase()
    const gerar =
        provedor === 'elevenlabs' ? gerarElevenLabs : gerarOpenAI

    const nomes = process.argv.slice(2)

    const alvos = Object.entries(NARRACAO).filter(
        ([nome]) => nomes.length === 0 || nomes.includes(nome),
    )

    for (const [nome, texto] of alvos) {
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
