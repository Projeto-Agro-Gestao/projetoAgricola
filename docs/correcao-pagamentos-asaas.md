# Geracao de Pix e boleto

## Correcoes

O formulario valida dados na tela, mas antes podia gerar cobranca com cadastro ainda nao salvo. A geracao agora salva os dados e so chama o endpoint de pagamento se a persistencia tiver sucesso. O backend sincroniza o customer existente com os dados atuais; se ele tiver sido removido, recria o vinculo no ambiente atual.

URL e ambiente antes tinham defaults independentes de Sandbox. Agora, com ASAAS_BASE_URL vazia, a URL acompanha ASAAS_ENVIRONMENT. Sem ambos, uma chave com prefixo de producao seleciona producao; caso contrario o padrao continua Sandbox. Uma URL oficial explicita tambem permite identificar o ambiente. Configuracoes contraditorias sao rejeitadas antes de enviar dados ou credencial ao Asaas. Esta validacao acontece sob demanda, nao bloqueia startup sem chave.

As chamadas enviam User-Agent identificando AgroGestao, Accept JSON e access_token sem espacos nas extremidades. A documentacao oficial exige identificar a aplicacao e utilizar chave e URL do mesmo ambiente.

Erros externos nao sao devolvidos como corpo bruto. Chave recusada (401 do Asaas) vira 502 no AgroGestao: nao e sessao expirada do usuario. Dados recusados geram 422; limite externo gera 503. As mensagens orientam a verificacao sem expor CPF/CNPJ, chave ou resposta externa. Nao ha retry automatico de POST de cobranca.

## Render

Para producao: ASAAS_ENVIRONMENT=PRODUCTION, ASAAS_API_KEY com chave de producao configurada como segredo. ASAAS_BASE_URL pode ficar ausente/vazia ou ser https://api.asaas.com/v3.

Para testes: ASAAS_ENVIRONMENT=SANDBOX, chave do Sandbox e URL ausente/vazia ou https://api-sandbox.asaas.com/v3.

Nao usar chave de producao em Sandbox nem vice-versa. Nao publicar a chave em frontend, Git ou mensagens. Verificar no painel Asaas as permissoes da chave, eventuais restricoes de IP, situacao da conta e habilitacao de meios de pagamento. Nao aumentar automaticamente o preco do plano nem substituir credenciais do usuario.

## Validacao e limites

Testes locais utilizam servidor HTTP simulado e mocks, sem emitir cobrancas reais. Cobrem customer, atualizacao, criacao Pix/boleto, leitura de QR/linha digitavel, ambiente, headers, erros e ordem de persistencia no frontend. Sem acesso aos logs/variaveis privadas do Render ou credenciais de teste Asaas, nao e possivel afirmar qual desses problemas corresponde a falha atualmente observada em producao. A verificacao real requer deploy e teste autorizado em Sandbox. Se a cobranca ja existir mas o QR/linha nao estiver disponivel, verificar a fatura/historico antes de gerar outra.

Fontes: [Autenticacao](https://docs.asaas.com/docs/authentication), [Criar cobranca](https://docs.asaas.com/reference/criar-nova-cobranca), [Atualizar cliente](https://docs.asaas.com/reference/atualizar-cliente-existente).
