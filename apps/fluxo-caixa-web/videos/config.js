export const CONFIG = {
    baseURL:
        process.env.VIDEO_BASE_URL ||
        'https://projeto-agricola-eta.vercel.app',
    apiURL:
        process.env.VIDEO_API_URL ||
        'https://projetoagricola.onrender.com/api/v1',
    email:
        process.env.VIDEO_EMAIL || 'demo.videos@agrogestao.app',
    senha: process.env.VIDEO_SENHA || 'Demo@1234',
}
