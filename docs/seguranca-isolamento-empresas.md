# Isolamento de dados entre empresas

## Correcoes

- GET /api/v1/empresas retornava todos os cadastros para qualquer usuario autenticado, incluindo documento e nome. Agora produtores recebem somente sua empresa; contadores recebem sua empresa e vinculos ativos. Administradores autorizados mantem a visao global.
- Criacao avulsa de empresa exige administrador. Cadastro publico continua criando somente a empresa do novo usuario.
- Rotas administrativas verificam perfil e estado atual no banco, antes de executar o controller. Claims antigas nao mantem acesso apos rebaixamento.
- Autorizacao financeira verifica usuario ativo e empresa atual no banco; um token antigo de administrador nao ignora bloqueio.
- Contadores precisam de perfil CONTADOR e vinculo ATIVO para acessar empresas de terceiros. Um vinculo restante nao concede acesso a um ex-contador.
- Usuarios desativados sao negados nas rotas autenticadas. Usuarios bloqueados nao acessam a carteira ou documentos.
- A resposta 403 nao invalida o token: o usuario continua podendo acessar os recursos permitidos. O frontend nao foi alterado.

## Verificacao executavel

`IsolamentoEmpresaIntegrationTest` inicia o servidor HTTP completo em porta aleatoria com H2 exclusivo de testes, autentica requisicoes com JWT assinado por chave aleatoria temporaria e persiste empresas sinteticas distintas.

Testa listagem sem vazamento, ausencia de token, troca de empresa nos endpoints financeiros, fornecedores, categorias, contas, cobranca, contabilidade e exportacao, documento de outra empresa, leitura/exclusao de movimentacao de terceiro, tentativa de autopromocao, vinculo revogado, ex-contador, administrador rebaixado, conta desativada e conta bloqueada. Tambem verifica health UP e Cache-Control no-store.

H2 e dependencia somente de testes. Flyway fica desabilitado apenas nessa classe: os testes nao validam migrations MySQL nem substituem verificacao do deploy. Nenhum dado real de clientes e utilizado ou alterado. Nenhuma chave real e incluida.

## Limites da verificacao

A suite verifica os caminhos descritos, nao prova ausencia de todas as vulnerabilidades. Producao precisa receber o novo backend para aplicar as correcoes; startup e resultados locais nao confirmam deploy no Render. Administradores continuam tendo acesso global conforme regra existente.

Referencias: https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/ e https://docs.spring.io/spring-security/reference/servlet/authorization/architecture.html.
