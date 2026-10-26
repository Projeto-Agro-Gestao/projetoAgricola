import { useEffect, useState } from 'react'
const cenas = ['trigo', 'milho', 'soja']
const chavePreferencia = 'agrogestao_video_fundo'
function obterEscolha() {
    try {
        const valor = localStorage.getItem(chavePreferencia)
        return valor === 'ativo' ? true : valor === 'inativo' ? false : null
    } catch { return null }
}

export default function FundoAutenticacao() {
    const [cena] = useState(() => cenas[Math.floor(Math.random() * cenas.length)])
    const imagemCampo = `/media/colheita-${cena}.jpg`
    const [reproduzir, setReproduzir] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !navigator.connection?.saveData)
    const [falhou, setFalhou] = useState(false)
    const [escolha, setEscolha] = useState(obterEscolha)
    const ativo = escolha ?? reproduzir
    useEffect(() => {
        const movimento = window.matchMedia('(prefers-reduced-motion: reduce)')
        const conexao = navigator.connection
        const atualizar = () => setReproduzir(!movimento.matches && !conexao?.saveData)
        movimento.addEventListener('change', atualizar)
        conexao?.addEventListener('change', atualizar)
        return () => { movimento.removeEventListener('change', atualizar); conexao?.removeEventListener('change', atualizar) }
    }, [])
    return <>
    <div className="ag-auth-fundo" aria-hidden="true" data-midia={falhou ? 'fallback-erro' : ativo ? 'video' : 'fallback-preferencia'}>
        <img src={imagemCampo} alt="" decoding="async" />
        {ativo && !falhou && <video autoPlay muted loop playsInline preload="metadata" poster={imagemCampo} onError={() => setFalhou(true)}>
            <source src={`/media/colheita-${cena}.webm`} type="video/webm" />
            <source src={`/media/colheita-${cena}-mobile.mp4`} media="(max-width: 600px)" type="video/mp4" />
            <source src={`/media/colheita-${cena}.mp4`} type="video/mp4" />
        </video>}
        <div className="ag-auth-contraste" />
    </div>
    <button type="button" className="ag-auth-video-controle" aria-pressed={ativo && !falhou}
        onClick={() => {
            const proxima = falhou || !ativo
            setFalhou(false)
            setEscolha(proxima)
            try { localStorage.setItem(chavePreferencia, proxima ? 'ativo' : 'inativo') } catch { /* A reprodução continua sem armazenamento. */ }
        }}>
        {falhou ? 'Tentar carregar vídeo' : ativo ? 'Desativar vídeo de fundo' : 'Ativar vídeo de fundo'}
    </button>
    </>
}
