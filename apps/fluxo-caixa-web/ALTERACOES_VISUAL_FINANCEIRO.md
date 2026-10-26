# Alterações de 07/10/2026

Implementadas na cópia Git atualizada de `Projeto-Agro-Gestao/projetoAgricola`, em `apps/fluxo-caixa-web`.

## Visual

- Identidade do DESIGN_SYSTEM.md aplicada às áreas autenticadas: verde, âmbar, superfícies brancas, campos neutros, foco visível e movimento reduzido.
- Navegação compartilhada também em movimentações, fiscal, Meus dados, plano, administração e formulários. As páginas que já tinham ShellDashboard não recebem uma segunda navegação.
- Cabeçalhos com a fotografia já utilizada no login, destaques nos indicadores e módulos e sidebar verde.
- Configurações passou a Meus dados. Administração e pagamentos têm indicação de navegação ativa.
- Correção da largura administrativa: a tabela rola dentro do seu painel, sem ampliar a página inteira.

## Dados

- O dashboard utilizava 30 dias; a lista sem datas consultava somente o mês corrente. A área fiscal usava o ano corrente.
- Os três módulos agora enviam explicitamente o período selecionado. O período fica na sessão, separado por empresa. A tela fiscal permite informar outro intervalo.
- As consultas fiscais continuam pelos endpoints de contador existentes, com validação de autorização no backend. Nenhum token ou vínculo de acesso foi modificado.
- Dashboard e lista percorrem a paginação das movimentações. Erros de resposta não são interpretados como lista vazia.
- Respostas antigas de outro cliente/período não substituem a seleção fiscal atual. Dados monetários fiscais ausentes mostram “Não disponível”.
- O botão para voltar das movimentações à lista normal não reabre a lixeira automaticamente.
- Sessões com expiração explicitamente não positiva são rejeitadas, preservando a preferência de lembrar o e-mail.

## Validação

- Build de produção passou.
- Testes de período, fuso de São Paulo, isolamento por empresa, paginação e falhas passaram.
- Testes de sessão/lembrar acesso, cliente de API/refresh e fluxo de pagamentos passaram.
- Lint dos arquivos de código alterados passou.
- Revisão no navegador feita com respostas locais simuladas e escritas bloqueadas. Conferidos visualmente movimentações, contador/fiscal, fornecedores, Meus dados, administração e pagamentos. Conferido o mesmo lançamento em financeiro/lista/fiscal.
- Lint global: 14 erros e 5 avisos em arquivos não alterados (AdminIntegracoes, Cadastro, Fornecedores, Login, NovaContaFinanceira, NovaMovimentacao e ProdutorColaborativo; avisos adicionais em AdminAssinaturas e PlanoPagamentos).
- Teste de cabeçalhos de segurança encontrou uma expectativa antiga do título do login. A expectativa foi atualizada; o teste completo não foi repetido depois disso.

## Publicação

As mudanças foram integradas em 19/10/2026 à branch feat/agro-integrado-video-20261019 do repositório Projeto-Agro-Gestao/projetoAgricola para envio. Navegação autenticada mais recente, vídeos e módulos agrícolas preservados. Build e testes financeiro, remember, api, pagamentos e security foram repetidos e passaram nesta integração. Não houve merge em main nem deploy manual de produção. A revisão com dados simulados não substitui a homologação com backend e banco reais.
