# Integracoes oficiais Receita Federal, SERPRO e fontes tributarias

Este documento descreve a arquitetura preparada para conectar o AgroGestao a fontes oficiais sem expor credenciais no frontend e sem fazer o backend depender dessas fontes para iniciar.

## Fontes oficiais pesquisadas

- SERPRO / Receita Federal: Solucao Consulta CNPJ para integracao de sistemas com a base da Receita Federal.
- Conecta gov.br: documentacao tecnica da API Consulta CNPJ, com endpoints de homologacao/producao e autenticacao por token.
- Portal do Simples Nacional: fonte oficial para regras, parametros e consultas relacionadas ao regime.
- Fontes normativas oficiais: Receita Federal, CONFAZ, SEFAZ e orgaos municipais quando houver ato normativo aplicavel.

## Principios

- O frontend chama apenas a API do AgroGestao.
- Segredos ficam somente no backend, em variaveis de ambiente ou secret files da infraestrutura.
- Nenhuma chamada externa ocorre em construtor, `@PostConstruct` ou startup obrigatorio.
- O provider padrao e `DISABLED`; nesse modo o sistema sobe normalmente e permite preenchimento manual.
- Consulta cadastral de CNPJ e motor tributario sao fluxos separados.
- Regras tributarias sao versionadas no banco antes de serem usadas pelo motor de simulacao.

## Variaveis de ambiente

```properties
OFFICIAL_CNPJ_PROVIDER=DISABLED
OFFICIAL_CNPJ_CACHE_TTL=7d
SERPRO_BASE_URL=
SERPRO_TOKEN_URL=
SERPRO_CONSUMER_KEY=
SERPRO_CONSUMER_SECRET=
SERPRO_CERTIFICATE_PATH=
SERPRO_CERTIFICATE_PASSWORD=
SERPRO_CNPJ_PATH_TEMPLATE=/v1/cnpj/{cnpj}
TAX_RULE_SYNC_ENABLED=false
```

Use `OFFICIAL_CNPJ_PROVIDER=SERPRO` somente depois de contratar/configurar o servico oficial e cadastrar as credenciais no backend. Nao commitar `consumer key`, `consumer secret`, certificados ou senhas.

## Endpoints

- `GET /api/v1/admin/integracoes/oficiais/status`
  - Restrito a administradores.
  - Retorna provider, status, se credencial esta configurada e ultimo teste.

- `POST /api/v1/admin/integracoes/oficiais/cnpj/testar`
  - Restrito a administradores.
  - Testa autenticacao/conectividade com o provider configurado.

- `GET /api/v1/cnpj/{cnpj}`
  - Normaliza e valida matematicamente o CNPJ antes de qualquer chamada externa.
  - Retorna DTO interno do AgroGestao, nunca o JSON bruto do fornecedor.

## Status da integracao

- `NAO_CONFIGURADO`
- `CONFIGURADO`
- `CONECTADO`
- `INDISPONIVEL`
- `CREDENCIAIS_INVALIDAS`
- `ERRO`

O Actuator principal nao deve ficar `DOWN` por indisponibilidade de SERPRO/Receita. A indisponibilidade aparece no diagnostico especifico da integracao.

## Cache e timeout

Consultas de CNPJ sao cacheadas por provider e CNPJ pelo periodo definido em `OFFICIAL_CNPJ_CACHE_TTL`. O cliente HTTP central possui timeout de conexao e leitura para evitar requests pendurados.

## Regras tributarias oficiais

A infraestrutura inclui:

- cadastro de fontes tributarias oficiais;
- versionamento de regras por regime, competencia e vigencia;
- status de regra: `IMPORTADA`, `AGUARDANDO_VALIDACAO`, `VALIDADA`, `ATIVA`, `SUBSTITUIDA`, `REVOGADA`;
- `TaxSourceRegistry` para registrar fontes;
- `TaxRuleUpdater` para futuras sincronizacoes controladas.

O motor tributario deve usar apenas regras `VALIDADA` e `ATIVA`, respeitando competencia e vigencia. Se nao houver regra validada para o cenario, a simulacao deve explicar que nao existe regra confiavel configurada, em vez de retornar zero automaticamente.

## Render

No Render, configure as variaveis acima em Environment Variables ou Secret Files. O certificado digital, quando exigido pelo contrato/oferta oficial usada, deve ficar fora do Git e ser montado como arquivo secreto.

## Desenvolvimento sem credencial

Com `OFFICIAL_CNPJ_PROVIDER=DISABLED`, a aplicacao inicia, os testes rodam e os formularios continuam aceitando preenchimento manual. Mocks devem ser usados apenas em testes automatizados.
