function animarScroll([destino, ms]) {
    const inicio = window.scrollY
    const distancia = destino - inicio
    const t0 = performance.now()

    return new Promise((resolve) => {
        function passo(agora) {
            const progresso = Math.min((agora - t0) / ms, 1)
            const suavizado =
                progresso < 0.5
                    ? 2 * progresso * progresso
                    : 1 - Math.pow(-2 * progresso + 2, 2) / 2

            window.scrollTo(0, inicio + distancia * suavizado)

            if (progresso < 1) {
                requestAnimationFrame(passo)
            } else {
                resolve()
            }
        }

        requestAnimationFrame(passo)
    })
}

export async function rolarAte(page, seletor, duracao = 1800) {
    const destino = await page.evaluate((sel) => {
        const elemento = document.querySelector(sel)

        return elemento
            ? elemento.getBoundingClientRect().top + window.scrollY
            : null
    }, seletor)

    if (destino === null) {
        return
    }

    await page.evaluate(animarScroll, [destino, duracao])
    await page.waitForTimeout(250)
}

export async function rolarParaFim(page, duracao = 1800) {
    const destino = await page.evaluate(
        () =>
            document.documentElement.scrollHeight - window.innerHeight,
    )

    await page.evaluate(animarScroll, [destino, duracao])
    await page.waitForTimeout(250)
}

export async function pausa(page, ms = 1200) {
    await page.waitForTimeout(ms)
}
