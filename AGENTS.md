# Contexto do projeto

- Este repositorio e um monorepo com um unico Git na raiz.
- Frontend: `apps/fluxo-caixa-web`.
- Backend: `apps/fluxo-caixa-api`.
- O remoto `origin` usa SSH: `git@github.com:Projeto-Agro-Gestao/projetoAgricola.git`.
- A branch `main` acompanha `origin/main`.
- Antes de commits e envios, confira o estado atual do Git e preserve alteracoes existentes do usuario.
- Sempre que o usuario solicitar realizar um commit, isso inclui criar o commit e envia-lo para `origin/main`, sem excecao e sem pedir nova confirmacao. Essa e uma autorizacao permanente do usuario para envio direto a `main` neste repositorio.
- Confirme a raiz do Git antes de editar; copias antigas em outras pastas nao sao a fonte principal deste checkout.
- Nao enviar .env real, credenciais, banco, backups, node_modules, dist ou target. Nao alterar precos comerciais, destruir dados ou prejudicar Asaas/autenticacao.
