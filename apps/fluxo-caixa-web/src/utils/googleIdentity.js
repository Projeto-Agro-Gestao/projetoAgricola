export function carregarGoogleIdentityScript() {
    if (window.google?.accounts?.id) {
        return Promise.resolve(window.google)
    }

    return new Promise((resolve, reject) => {
        const scriptExistente = document.querySelector(
            'script[data-google-identity="true"]',
        )

        if (scriptExistente) {
            scriptExistente.addEventListener('load', () =>
                resolve(window.google),
            )
            scriptExistente.addEventListener('error', reject)
            return
        }

        const script = document.createElement('script')
        script.async = true
        script.defer = true
        script.dataset.googleIdentity = 'true'
        script.src = 'https://accounts.google.com/gsi/client'

        script.onload = () => resolve(window.google)
        script.onerror = reject

        document.head.appendChild(script)
    })
}

export async function renderizarBotaoGoogle({
    clientId,
    elementId,
    onCredential,
    text = 'continue_with',
}) {
    const google = await carregarGoogleIdentityScript()
    const elemento = document.getElementById(elementId)

    if (!elemento || !clientId) {
        return
    }

    elemento.innerHTML = ''

    google.accounts.id.initialize({
        client_id: clientId,
        callback: (resposta) => {
            if (resposta?.credential) {
                onCredential(resposta.credential)
            }
        },
    })

    google.accounts.id.renderButton(elemento, {
        locale: 'pt-BR',
        shape: 'rectangular',
        size: 'large',
        text,
        theme: 'outline',
        width: elemento.clientWidth || 360,
    })
}
