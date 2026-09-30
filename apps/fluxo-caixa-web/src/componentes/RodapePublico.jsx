import { Link } from 'react-router'
import { IconeFolha } from './Icones.jsx'
import '../App.css'

function RodapePublico() {
    return (
        <footer className="publica-rodape">
            <Link className="publica-marca" to="/">
                <span className="publica-marca-icone">
                    <IconeFolha />
                </span>
                <span>AgroGestao</span>
            </Link>

            <p>© 2026 AgroGestao. Todos os direitos reservados.</p>

            <div>
                <Link to="/termos-de-uso">Termos de uso</Link>
                <Link to="/politica-de-privacidade">
                    Política de privacidade
                </Link>
            </div>
        </footer>
    )
}

export default RodapePublico
