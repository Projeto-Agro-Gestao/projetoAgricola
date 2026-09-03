import {
    useRef,
    useState,
} from 'react'
import './CampoComVoz.css'

function obterReconhecimento() {
    return window.SpeechRecognition
        ?? window.webkitSpeechRecognition
        ?? null
}

function CampoComVoz({
    label,
    value,
    onChange,
    multiline = false,
    disabled = false,
    placeholder = '',
    type = 'text',
    ...props
}) {
    const reconhecimentoRef =
        useRef(null)

    const [ouvindo, setOuvindo] =
        useState(false)

    const [erroVoz, setErroVoz] =
        useState('')

    const suportaVoz =
        typeof window !== 'undefined'
        && Boolean(obterReconhecimento())

    function alterarValor(evento) {
        onChange(evento.target.value)
    }

    function iniciarVoz() {
        if (!suportaVoz || disabled) {
            return
        }

        const SpeechRecognition =
            obterReconhecimento()

        const reconhecimento =
            new SpeechRecognition()

        reconhecimento.lang = 'pt-BR'
        reconhecimento.interimResults = false
        reconhecimento.maxAlternatives = 1

        reconhecimento.onstart = () => {
            setErroVoz('')
            setOuvindo(true)
        }

        reconhecimento.onerror = () => {
            setErroVoz(
                'Nao consegui ouvir. Tente novamente ou use o microfone do teclado.',
            )
            setOuvindo(false)
        }

        reconhecimento.onend = () => {
            setOuvindo(false)
        }

        reconhecimento.onresult = (evento) => {
            const texto =
                evento.results?.[0]?.[0]?.transcript
                    ?.trim()

            if (!texto) {
                return
            }

            const separador =
                multiline && value
                    ? ' '
                    : ''

            onChange(`${value ?? ''}${separador}${texto}`)
        }

        reconhecimentoRef.current =
            reconhecimento

        reconhecimento.start()
    }

    const Campo =
        multiline ? 'textarea' : 'input'

    return (
        <label className="campo-voz">
            <span>{label}</span>

            <div className="campo-voz-controle">
                <Campo
                    disabled={disabled}
                    onChange={alterarValor}
                    placeholder={placeholder}
                    type={multiline ? undefined : type}
                    value={value}
                    {...props}
                />

                {suportaVoz && (
                    <button
                        aria-label={`Falar ${label}`}
                        className={
                            ouvindo
                                ? 'campo-voz-botao campo-voz-botao-ativo'
                                : 'campo-voz-botao'
                        }
                        disabled={disabled}
                        onClick={iniciarVoz}
                        title="Falar"
                        type="button"
                    >
                        {ouvindo ? '...' : 'Voz'}
                    </button>
                )}
            </div>

            {erroVoz && (
                <small className="campo-voz-erro">
                    {erroVoz}
                </small>
            )}
        </label>
    )
}

export default CampoComVoz
