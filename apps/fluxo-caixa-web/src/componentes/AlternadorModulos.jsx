import {
    useLocation,
    useNavigate,
} from 'react-router'
import './AlternadorModulos.css'

function AlternadorModulos() {
    const navigate = useNavigate()
    const location = useLocation()

    const controleFinanceiroAtivo =
        location.pathname.startsWith(
            '/dashboard/financeiro',
        )

    const contasFinanceirasAtivas =
        location.pathname.startsWith(
            '/dashboard/contas',
        )

    return (
        <nav
            aria-label="Alternar entre os módulos financeiros"
            className="alternador-modulos"
        >
            <button
                aria-current={
                    controleFinanceiroAtivo
                        ? 'page'
                        : undefined
                }
                className={
                    controleFinanceiroAtivo
                        ? 'alternador-modulos-botao ativo'
                        : 'alternador-modulos-botao'
                }
                onClick={() =>
                    navigate(
                        '/dashboard/financeiro',
                    )
                }
                type="button"
            >
                <span aria-hidden="true">
                    R$
                </span>

                Controle financeiro
            </button>

            <button
                aria-current={
                    contasFinanceirasAtivas
                        ? 'page'
                        : undefined
                }
                className={
                    contasFinanceirasAtivas
                        ? 'alternador-modulos-botao ativo'
                        : 'alternador-modulos-botao'
                }
                onClick={() =>
                    navigate(
                        '/dashboard/contas',
                    )
                }
                type="button"
            >
                <span aria-hidden="true">
                    📅
                </span>

                Contas a pagar e receber
            </button>
        </nav>
    )
}

export default AlternadorModulos