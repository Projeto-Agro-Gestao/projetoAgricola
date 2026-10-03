const camposCobranca = [
    'documentoPagamento', 'cepCobranca', 'ruaCobranca', 'numeroCobranca',
    'bairroCobranca', 'cidadeCobranca', 'estadoCobranca',
]

export function criarAtualizacaoPerfil(formulario, original) {
    const dados = {
        nomeEmpresa: formulario.nomeEmpresa,
        nome: formulario.nome,
        telefone: formulario.telefone,
        agriculturaAtiva: formulario.agriculturaAtiva,
        pecuariaAtiva: formulario.pecuariaAtiva,
    }
    for (const campo of camposCobranca) {
        if (formulario[campo] !== original[campo]) dados[campo] = formulario[campo]
    }
    return dados
}
