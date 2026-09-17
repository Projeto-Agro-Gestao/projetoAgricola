import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.jsx'

function marcarCamposObrigatorios() {
    document
        .querySelectorAll('input[required][id], select[required][id], textarea[required][id]')
        .forEach((campo) => {
            const rotulo = document.querySelector(`label[for="${campo.id}"]`)

            if (rotulo) {
                rotulo.classList.add('campo-obrigatorio')
            }
        })
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </StrictMode>,
)

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
    })
}

marcarCamposObrigatorios()

const observadorCamposObrigatorios = new MutationObserver(
    marcarCamposObrigatorios,
)

observadorCamposObrigatorios.observe(document.body, {
    childList: true,
    subtree: true,
})
