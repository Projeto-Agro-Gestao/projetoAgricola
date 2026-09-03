export const API_BASE_URL =
    import.meta.env.VITE_API_URL ??
    'http://localhost:8080/api/v1'

export const API_LOGIN_URL =
    `${API_BASE_URL}/auth/login`

export const API_CADASTRO_URL =
    `${API_BASE_URL}/auth/cadastro`

export const API_ESQUECI_SENHA_URL =
    `${API_BASE_URL}/auth/esqueci-senha`

export const API_REDEFINIR_SENHA_URL =
    `${API_BASE_URL}/auth/redefinir-senha`
