import {
    lazy,
    Suspense,
    useEffect,
} from 'react'
import {
    useLocation,
    Route,
    Routes,
} from 'react-router'
import './App.css'
import './IdentidadeVisual.css'
import AcessibilidadeModais from './componentes/AcessibilidadeModais.jsx'
import ShellDashboard from './componentes/ShellDashboard.jsx'
import PaginaInicial from './PaginaInicial.jsx'
import CarregandoRota from './componentes/CarregandoRota.jsx'
import { registrarRotaAtual } from './navegacao.js'

const EscolhaModulo = lazy(() => import('./paginas/EscolhaModulo.jsx'))
const GestaoAgricola = lazy(() => import('./paginas/GestaoAgricola.jsx'))
const Dashboard = lazy(() => import('./paginas/Dashboard.jsx'))
const Movimentacoes = lazy(() => import('./paginas/Movimentacoes.jsx'))
const NovaMovimentacao = lazy(() => import('./paginas/NovaMovimentacao.jsx'))
const EditarMovimentacao = lazy(() => import('./paginas/EditarMovimentacao.jsx'))
const Categorias = lazy(() => import('./paginas/Categorias.jsx'))
const ContasFinanceiras = lazy(() => import('./paginas/ContasFinanceiras.jsx'))
const NovaContaFinanceira = lazy(() => import('./paginas/NovaContaFinanceira.jsx'))
const Fornecedores = lazy(() => import('./paginas/Fornecedores.jsx'))
const Login = lazy(() => import('./paginas/Login.jsx'))
const Cadastro = lazy(() => import('./paginas/Cadastro.jsx'))
const EsqueciSenha = lazy(() => import('./paginas/EsqueciSenha.jsx'))
const RedefinirSenha = lazy(() => import('./paginas/RedefinirSenha.jsx'))
const AdminPainel = lazy(() => import('./paginas/AdminPainel.jsx'))
const Perfil = lazy(() => import('./paginas/Perfil.jsx'))
const AppMobile = lazy(() => import('./paginas/AppMobile.jsx'))
const PlanoPagamentos = lazy(() => import('./paginas/PlanoPagamentos.jsx'))
const AdminAssinaturas = lazy(() => import('./paginas/AdminAssinaturas.jsx'))
const ProdutorColaborativo = lazy(() =>
    import('./paginas/ProdutorColaborativo.jsx'),
)
const ContadorCarteira = lazy(() => import('./paginas/ContadorCarteira.jsx'))

function App() {
    const location = useLocation()

    useEffect(() => {
        registrarRotaAtual(location)
    }, [location])

    let sessao = null
    try {
        const usuario = JSON.parse(localStorage.getItem('agrogestao_usuario') || 'null')
        const token = localStorage.getItem('agrogestao_token')
        if (usuario?.empresaId && token) sessao = { usuario }
    } catch { /* The page's existing session validation handles invalid storage. */ }
    const interna = sessao && (location.pathname.startsWith('/dashboard') || location.pathname === '/contador' || location.pathname.startsWith('/admin'))
    const rotas = (
        <Suspense fallback={<CarregandoRota />}>
            <Routes>
                <Route path="/dashboard/agricola" element={<GestaoAgricola />} />
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

                <Route
                    path="/dashboard/produtor"
                    element={<ProdutorColaborativo />}
                />

                <Route
                    path="/contador"
                    element={<ContadorCarteira />}
                />
            </Routes>
        </Suspense>
    )
    return <div className="ag-app"><AcessibilidadeModais />{interna ? <ShellDashboard sessao={sessao} ativo={location.pathname}>{rotas}</ShellDashboard> : rotas}</div>
}

export default App

