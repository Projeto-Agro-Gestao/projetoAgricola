import { Link } from 'react-router'

export function IconeAgro({ nome, className = '', ...props }) {
    return <span aria-hidden="true" className={`material-symbols-outlined ${className}`} {...props}>{nome}</span>
}

export default function MarcaAgro() {
    return <Link to="/" className="ag-marca"><span className="ag-marca-icone"><IconeAgro nome="eco" /></span><strong>Agro Gestão</strong></Link>
}
