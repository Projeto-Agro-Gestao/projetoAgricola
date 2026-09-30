import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { IconeSetaEsquerda } from './Icones.jsx'
import CabecalhoPublico from './CabecalhoPublico.jsx'
import RodapePublico from './RodapePublico.jsx'
import '../App.css'
import './DocumentoLegal.css'

export const DATA_ATUALIZACAO = '[DATA DE ATUALIZAÇÃO]'

export function Placeholder({ children }) {
    return <span className="documento-placeholder">{children}</span>
}

export function Destaque({ children }) {
    return <p className="documento-destaque">{children}</p>
}

function DocumentoLegal({ etiqueta, titulo, descricao, secoes, relacionado }) {
    const [secaoAtiva, setSecaoAtiva] = useState('')
    const textoRef = useRef(null)

    useEffect(() => {
        const raiz = textoRef.current

        if (!raiz) {
            return undefined
        }

        const alvos = raiz.querySelectorAll('.documento-secao')

        const observador = new IntersectionObserver(
            (entradas) => {
                const visivel = entradas.find(
                    (entrada) => entrada.isIntersecting,
                )

                if (visivel) {
                    setSecaoAtiva(visivel.target.id)
                }
            },
            { rootMargin: '-18% 0px -70% 0px', threshold: 0 },
        )

        alvos.forEach((alvo) => observador.observe(alvo))

        return () => observador.disconnect()
    }, [secoes])

    function montarIndice() {
        return (
            <ol>
                {secoes.map((secao) => (
                    <li key={secao.id}>
                        <a
                            className={
                                secaoAtiva === secao.id ? 'ativo' : undefined
                            }
                            href={`#${secao.id}`}
                        >
                            {secao.numero}. {secao.titulo}
                        </a>
                    </li>
                ))}
            </ol>
        )
    }

    return (
        <div className="publica documento">
            <CabecalhoPublico />

            <main className="documento-pagina">
                <div className="documento-folha">
                    <header className="documento-topo">
                        <Link className="documento-voltar" to="/">
                            <IconeSetaEsquerda size={16} />
                            Voltar ao início
                        </Link>

                        <span className="publica-etiqueta">{etiqueta}</span>

                        <h1>{titulo}</h1>

                        <p className="documento-descricao">{descricao}</p>

                        <p className="documento-meta">
                            Última atualização: <b>{DATA_ATUALIZACAO}</b>
                        </p>

                        <p className="documento-relacionado">
                            Documento relacionado:{' '}
                            <Link to={relacionado.para}>
                                {relacionado.titulo}
                            </Link>
                        </p>
                    </header>

                    <div className="documento-corpo">
                        <nav
                            aria-label="Índice do documento"
                            className="documento-indice"
                        >
                            <strong>Índice</strong>
                            {montarIndice()}
                        </nav>

                        <details className="documento-indice-mobile">
                            <summary>Índice do documento</summary>
                            {montarIndice()}
                        </details>

                        <article className="documento-texto" ref={textoRef}>
                            {secoes.map((secao) => (
                                <section
                                    className="documento-secao"
                                    id={secao.id}
                                    key={secao.id}
                                >
                                    <h2>
                                        {secao.numero}. {secao.titulo}
                                    </h2>
                                    {secao.conteudo}
                                </section>
                            ))}
                        </article>
                    </div>
                </div>
            </main>

            <RodapePublico />
        </div>
    )
}

export default DocumentoLegal
