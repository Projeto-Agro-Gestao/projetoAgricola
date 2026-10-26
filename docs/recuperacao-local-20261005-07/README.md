# Recuperação das alterações que ficaram fora do Git

A evidência local mais antiga encontrada é IMPLEMENTACAO_DESIGN.md, que registra trabalho de 05/10/2026 sem repositório Git detectável. Há complementos de 07/10/2026 e alterações no checkout antigo descritas em ALTERACOES_VISUAL_FINANCEIRO.md. Isso identifica trabalho local não enviado; não prova que todos os envios de outras cópias cessaram nessa data. O GitHub recebeu commits posteriores em 09/10 e 19/10.

## O que foi enviado e o que este diretório preserva

- 7d2610a: integração agrícola e vídeos sobre a main atual, com migrations renumeradas V35–V40.
- 199d12f: padronização visual interna, período financeiro, paginação e área fiscal recuperados do checkout antigo.
- 7d79f5c: preferência persistente para reprodução do vídeo.
- Este diretório: fontes originais em fontes/, documentos originais de design e patch das diferenças entre o backup anterior a 05/10 e a cópia local remanescente, com manifesto SHA-256 por arquivo.

O patch preserva código original que ainda não tinha sido enviado como histórico. NÃO deve ser aplicado inteiro sobre a aplicação atual: ele compara uma base antiga e contém interfaces, caminhos e lógica substituídos por versões posteriores. A recuperação histórica não significa que todas essas interfaces antigas foram ativadas na aplicação atual.

Acessibilidade de modais já tem implementação equivalente em useFecharModal.js; navegação antiga e IdentidadeVisual.css foram substituídas pelo shell atual e SistemaVivo.css. AlternadorModulos foi removido no histórico remoto no commit 155aba4 e não é ressuscitado como código ativo. Correções de hooks de telas antigas estão preservadas no patch, mas sua portabilidade para telas mais novas exige revisão própria.

Não inclui senhas, arquivos .env, banco, builds, node_modules, QA com dados simulados ou vídeos originais. Os caminhos no manifesto são relativos. As cópias de trabalho antigas permanecem intactas.

Validação da recuperação: patch aplicado em diretório temporário contra o backup anterior e 49/49 arquivos reconstruídos comparados com as fontes locais. As fontes completas também foram copiadas e os hashes SHA-256 conferidos contra o manifesto; não dependem do patch para consulta. Nenhuma alteração no código ativo nesta etapa.
