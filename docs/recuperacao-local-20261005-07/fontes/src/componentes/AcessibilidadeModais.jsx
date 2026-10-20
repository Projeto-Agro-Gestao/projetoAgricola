import { useEffect } from 'react'

// Legacy dialogs retain their own close handlers and saving/deletion guards.
export default function AcessibilidadeModais() {
    useEffect(() => {
        let atual = null
        let focoAnterior = null
        let overflowAnterior = ''
        const seletor = '[role="dialog"][aria-modal="true"]'
        const focaveis = () => atual ? [...atual.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')].filter(el => el.getClientRects().length) : []
        function fechar() {
            const botao = [...atual.querySelectorAll('button')].find(el => /fechar|cancelar|voltar/i.test(el.getAttribute('aria-label') || el.textContent))
            if (botao && !botao.disabled) botao.click()
        }
        function sincronizar() {
            const proximo = [...document.querySelectorAll(seletor)].at(-1) || null
            if (proximo === atual) return
            if (atual) {
                document.body.style.overflow = overflowAnterior
                if (focoAnterior?.isConnected) focoAnterior.focus()
            }
            atual = proximo
            if (atual) {
                focoAnterior = document.activeElement
                overflowAnterior = document.body.style.overflow
                document.body.style.overflow = 'hidden'
                atual.tabIndex = -1
                if (!atual.hasAttribute('aria-label') && !atual.hasAttribute('aria-labelledby')) {
                    atual.setAttribute('aria-label', atual.querySelector('h2, h3')?.textContent || 'Confirmação')
                }
                ;(focaveis()[0] || atual).focus()
            }
        }
        function teclado(evento) {
            if (!atual) return
            if (evento.key === 'Escape') { evento.preventDefault(); fechar() }
            if (evento.key === 'Tab') {
                const itens = focaveis()
                if (!itens.length) { evento.preventDefault(); atual.focus(); return }
                const primeiro = itens[0], ultimo = itens.at(-1)
                if (evento.shiftKey && (document.activeElement === primeiro || !atual.contains(document.activeElement))) { evento.preventDefault(); ultimo.focus() }
                else if (!evento.shiftKey && (document.activeElement === ultimo || !atual.contains(document.activeElement))) { evento.preventDefault(); primeiro.focus() }
            }
        }
        function clique(evento) {
            if (atual && evento.target === atual.parentElement && /modal-fundo/.test(evento.target.className)) fechar()
        }
        const observador = new MutationObserver(sincronizar)
        observador.observe(document.body, { childList: true, subtree: true })
        document.addEventListener('keydown', teclado)
        document.addEventListener('click', clique)
        sincronizar()
        return () => {
            observador.disconnect()
            document.removeEventListener('keydown', teclado)
            document.removeEventListener('click', clique)
            if (atual) {
                document.body.style.overflow = overflowAnterior
                if (focoAnterior?.isConnected) focoAnterior.focus()
            }
        }
    }, [])
    return null
}
