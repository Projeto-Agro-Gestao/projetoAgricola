import fotoCampo from '../assets/campo-agro-gestao.png'

export default function ImagemCampo({ className = '', prioritaria = false }) {
    return <img className={`ag-imagem-campo ${className}`} src={fotoCampo}
        alt="Agricultora observando uma plantação de soja com um tablet ao pôr do sol. Imagem ilustrativa."
        loading={prioritaria ? 'eager' : 'lazy'} fetchPriority={prioritaria ? 'high' : 'auto'} decoding="async" width="1672" height="941" />
}
