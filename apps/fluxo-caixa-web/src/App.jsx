import {
    Route,
    Routes,
} from 'react-router'
import PaginaInicial from './PaginaInicial.jsx'
import EscolhaModulo from './paginas/EscolhaModulo.jsx'
import Dashboard from './paginas/Dashboard.jsx'
import Movimentacoes from './paginas/Movimentacoes.jsx'
import NovaMovimentacao from './paginas/NovaMovimentacao.jsx'
import EditarMovimentacao from './paginas/EditarMovimentacao.jsx'
import Categorias from './paginas/Categorias.jsx'
import ContasFinanceiras from './paginas/ContasFinanceiras.jsx'
import NovaContaFinanceira from './paginas/NovaContaFinanceira.jsx'
import Fornecedores from './paginas/Fornecedores.jsx'
import Login from './paginas/Login.jsx'
import Cadastro from './paginas/Cadastro.jsx'
import EsqueciSenha from './paginas/EsqueciSenha.jsx'
import RedefinirSenha from './paginas/RedefinirSenha.jsx'
import AdminPainel from './paginas/AdminPainel.jsx'
import Perfil from './paginas/Perfil.jsx'
import AppMobile from './paginas/AppMobile.jsx'
import PlanoPagamentos from './paginas/PlanoPagamentos.jsx'
import AdminAssinaturas from './paginas/AdminAssinaturas.jsx'

function App() {
    return (
        <Routes>
            <Route
                path="/"
                element={<PaginaInicial />}
            />

            <Route
                path="/login"
                element={<Login />}
            />

            <Route
                path="/cadastro"
                element={<Cadastro />}
            />

            <Route
                path="/esqueci-senha"
                element={<EsqueciSenha />}
            />

            <Route
                path="/redefinir-senha"
                element={<RedefinirSenha />}
            />

            <Route
                path="/admin"
                element={<AdminPainel />}
            />

            <Route
                path="/admin/assinaturas"
                element={<AdminAssinaturas />}
            />

            <Route
                path="/dashboard"
                element={<EscolhaModulo />}
            />

            <Route
                path="/app"
                element={<AppMobile />}
            />

            <Route
                path="/dashboard/perfil"
                element={<Perfil />}
            />

            <Route
                path="/dashboard/plano"
                element={<PlanoPagamentos />}
            />

            <Route
                path="/dashboard/financeiro"
                element={<Dashboard />}
            />

            <Route
                path="/dashboard/movimentacoes"
                element={<Movimentacoes />}
            />

            <Route
                path="/dashboard/movimentacoes/nova"
                element={<NovaMovimentacao />}
            />

            <Route
                path="/dashboard/movimentacoes/:movimentacaoId/editar"
                element={<EditarMovimentacao />}
            />

            <Route
                path="/dashboard/categorias"
                element={<Categorias />}
            />

            <Route
                path="/dashboard/contas"
                element={<ContasFinanceiras />}
            />

            <Route
                path="/dashboard/contas/nova"
                element={<NovaContaFinanceira />}
            />

            <Route
                path="/dashboard/fornecedores"
                element={<Fornecedores />}
            />
        </Routes>
    )
}

export default App
