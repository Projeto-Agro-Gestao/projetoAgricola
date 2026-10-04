import { Link } from 'react-router'
import '../App.css'

/**
 * Marca oficial Agro Gestão (ícone + nome).
 * Reutilizável em cabeçalhos públicos (landing, login, etc.).
 *
 * props:
 * - to: destino do link (padrão "/"); se null, renderiza sem link.
 * - clara: variante para fundos escuros (ícone branco).
 */
function MarcaAgro({ to = '/', clara = false }) {
    const conteudo = (
        <>
            <span className="ag-marca-icone">
                <span
                    aria-hidden="true"
                    className="material-symbols-outlined"
                    style={{ fontSize: '22px' }}
                >
                    eco
                </span>
            </span>
            <span className="ag-marca-nome">Agro Gestão</span>
        </>
    )

    const classe = `ag-marca${clara ? ' ag-marca-clara' : ''}`

    if (to === null) {
        return <span className={classe}>{conteudo}</span>
    }

    return (
        <Link className={classe} to={to}>
            {conteudo}
        </Link>
    )
}

export default MarcaAgro
