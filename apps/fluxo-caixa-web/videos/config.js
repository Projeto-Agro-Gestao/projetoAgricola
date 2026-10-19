export const CONFIG = {
    baseURL:
        process.env.VIDEO_BASE_URL ||
        'https://projetoagricola.tadeu-ar.workers.dev',
    apiURL:
        process.env.VIDEO_API_URL ||
        'https://projetoagricola.onrender.com/api/v1',
    email: process.env.VIDEO_EMAIL,
    senha: process.env.VIDEO_SENHA,
}
