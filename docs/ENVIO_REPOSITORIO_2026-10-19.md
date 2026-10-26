# Integração e envio ao repositório

Base: origin/main bd09ed1. Branch: feat/agro-integrado-video-20261019.

A cópia inicial de desenvolvimento estava fora do checkout Git e desatualizada em relação ao GitHub. Os novos recursos foram portados seletivamente para a versão atual, preservando Google, refresh de sessão, módulos fiscais e de compras e configurações de segurança. As alterações locais já existentes no checkout antigo foram preservadas e não incluídas neste envio.

## Conteúdo

- Módulo Safras e operações, romaneios, estoque, armazenagem, contratos, entregas, máquinas, conciliação, permissões, clima e adaptador de cotações.
- Vídeos agrícolas licenciados Pexels no login e cadastro, com MP4, WebM, posters e controle de reprodução. Google e cadastro atuais preservados.
- Migrations aditivas V35–V40, sem alterar V1–V34. Não aplicar as V25–V30 da cópia antiga neste repositório.
- Adaptação ao DTO financeiro atual e ao cliente central de API com renovação de sessão.
- Correção da expiração explícita negativa/zero de sessão e inicialização do e-mail lembrado sem atualização síncrona em efeito.
- Webhook sem token configurado rejeitado; valores comerciais preservados. CSV neutraliza fórmulas. Erro claro de duplicidade.

## Validação desta branch

- Backend: 136 testes, zero falhas e erros, em H2 isolado; inclui 23 testes agrícolas e regressão de isolamento/autenticação/refresh. Não altera o banco real.
- Frontend: build aprovado; testes remember, api, pagamentos e security aprovados.
- ESLint dos arquivos JS/JSX alterados: aprovado. Lint global ainda tem erros e avisos em telas preexistentes não alteradas, como AdminIntegracoes, AdminPainel e ContadorCarteira; não foi declarado aprovado globalmente.
- npm audit --omit=dev: zero vulnerabilidades. npm ci reportou duas vulnerabilidades altas no conjunto com dependências de desenvolvimento; nenhuma atualização automática foi aplicada.
- Revisão do staging: sem builds, dependências instaladas, backups ou arquivos .env reais. Verificação de padrões de tokens GitHub e chaves privadas sem ocorrências.

## Publicação e limites

Envio em branch separada, sem merge em main nem acionamento manual de deploy de produção. Serviços de hospedagem podem criar previews da branch conforme suas configurações externas. A integração ainda precisa de homologação MySQL e das configurações externas descritas em CONFIGURACAO_INTEGRACOES_AGRO.md. O relatório original registra o escopo da implementação inicial, e este documento prevalece quanto à integração e validação desta branch.

## Complemento: alterações locais dos últimos dias

Integradas nesta mesma branch as pendências do checkout antigo: SistemaVivo.css, período financeiro compartilhado por empresa, carregamento paginado de movimentações, correções de consultas fiscais, indicação de Meus dados e teste de período financeiro. Os ajustes antigos de navegação, expiração de sessão e título do teste de segurança já estavam atendidos pela versão mais recente e foram preservados sem duplicação. A rota agrícola passa a utilizar o shell autenticado compartilhado.

Validação do complemento: build e testes financeiro, remember, api, pagamentos e security aprovados. Sem mudanças adicionais no backend. Nenhum backup, dump de banco, segredo, node_modules, target ou dist incluído no envio. As cópias antigas foram preservadas.
