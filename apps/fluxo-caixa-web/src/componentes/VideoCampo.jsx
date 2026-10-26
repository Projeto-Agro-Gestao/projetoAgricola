import { useEffect, useState } from 'react'
import './VideoCampo.css'

const cenas = ['trigo', 'milho', 'soja']

export default function VideoCampo() {
    const [cena] = useState(() => cenas[Math.floor(Math.random() * cenas.length)])
    const [permitido, setPermitido] = useState(() =>
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
        && !navigator.connection?.saveData,
    )
    const [escolha, setEscolha] = useState(null)
    const [falhou, setFalhou] = useState(false)
    const ativo = (escolha ?? permitido) && !falhou
    const poster = `/media/colheita-${cena}.jpg`

    useEffect(() => {
        const movimento = window.matchMedia('(prefers-reduced-motion: reduce)')
        const conexao = navigator.connection
        const atualizar = () => setPermitido(!movimento.matches && !conexao?.saveData)
        movimento.addEventListener('change', atualizar)
        conexao?.addEventListener('change', atualizar)
        return () => {
            movimento.removeEventListener('change', atualizar)
            conexao?.removeEventListener('change', atualizar)
        }
    }, [])

    return (
        <div className="ag-video-campo">
            <div className="ag-video-campo-midia" aria-hidden="true">
                <img src={poster} alt="" fetchPriority="high" />
                {ativo && (
                    <video autoPlay muted loop playsInline preload="metadata"
                        poster={poster} onError={(evento) => {
                            if (evento.target === evento.currentTarget) setFalhou(true)
                        }}>
                        <source src={`/media/colheita-${cena}-mobile.mp4`} media="(max-width: 600px)" type="video/mp4" />
                        <source src={`/media/colheita-${cena}.webm`} type="video/webm" />
                        <source src={`/media/colheita-${cena}.mp4`} type="video/mp4" />
                    </video>
                )}
            </div>
            <button className="ag-video-campo-controle" type="button" aria-pressed={ativo}
                onClick={() => {
                    setEscolha(!ativo)
                    setFalhou(false)
                }}>
                {falhou ? 'Tentar carregar vídeo' : ativo ? 'Pausar vídeo de fundo' : 'Reproduzir vídeo de fundo'}
            </button>
        </div>
    )
}
