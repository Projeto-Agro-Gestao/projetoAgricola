# Plano de vídeos do AgroGestão para Instagram

## Objetivo

Produzir uma série de Reels verticais que mostre, em poucos segundos, como o AgroGestão ajuda o produtor rural e o contador a organizar a rotina financeira e fiscal. Cada vídeo terá captura real da aplicação, narração em português e legendas na tela.

## O que já existe no projeto

O frontend já inclui um fluxo de produção em `apps/fluxo-caixa-web/videos`:

- Playwright grava as telas em vídeo nos formatos horizontal e vertical.
- Os roteiros de captura ficam em `videos/cenas.js`.
- `videos/pos-producao/narracao.js` gera voz com OpenAI ou ElevenLabs.
- `videos/pos-producao/build.js` usa FFmpeg para montar os vídeos e inserir legendas.
- Os comandos `videos`, `videos:voice` e `videos:build` já estão no `package.json`.

**Antes de gravar:** `videos/config.js` tem como padrão URLs da aplicação e API publicadas. Configure `VIDEO_BASE_URL` e `VIDEO_API_URL` em `videos/.env` para um ambiente de demonstração ou homologação, e use contas fictícias. Não execute `videos:seed` contra a API publicada: esse comando cria movimentações e contas.

O fluxo cobre atualmente páginas como painel financeiro, movimentações, categorias, contas e fornecedores. Para divulgar os fluxos colaborativos mais recentes, será necessário acrescentar cenas para o painel do produtor (`/dashboard/produtor`) e para a carteira do contador (`/contador`), além dos respectivos textos de narração e legendas.

## Série inicial: seis Reels

Formato principal: vertical 9:16, 1080 × 1920, entre 20 e 35 segundos. Manter a interface legível, usar dados fictícios e deixar espaço para as legendas sem cobrir botões ou valores.

### 1. Visão geral — controle da propriedade

**Tela:** página inicial e painel financeiro.

**Narração:** “Na correria da propriedade, fica difícil saber exatamente quanto entrou e quanto saiu. Com o AgroGestão, você organiza receitas e despesas e acompanha o resultado do mês em um só lugar. Mais clareza para cuidar do seu negócio rural.”

**Chamada na tela:** “Sua gestão rural em um só lugar.”

### 2. Lançamento de receita ou despesa

**Tela:** `/dashboard/movimentacoes/nova`; mostrar o preenchimento de um lançamento fictício.

**Narração:** “Fez uma venda ou teve uma despesa na propriedade? Registre o valor, escolha a categoria e informe a data. Assim, cada movimentação fica organizada e o resultado financeiro acompanha a realidade do seu negócio.”

**Chamada na tela:** “Registre em poucos passos.”

### 3. Pendências do contador

**Tela:** `/dashboard/produtor`; destacar a lista de pendências e a ação disponível em uma delas.

**Narração:** “O contador pediu um documento ou precisa de uma informação? No painel do produtor, você acompanha as pendências, confere o que falta e sabe qual é o próximo passo. Tudo mais organizado entre você e a contabilidade.”

**Chamada na tela:** “Pendências claras. Próximos passos organizados.”

### 4. Envio de documentos

**Tela:** `/dashboard/produtor`; enviar um arquivo fictício ou previamente preparado e mostrar o documento na lista.

**Narração:** “Notas, recibos e comprovantes podem ficar junto da rotina financeira. Envie o documento pelo painel do produtor e facilite o acesso da contabilidade às informações necessárias.”

**Chamada na tela:** “Documentos organizados para a contabilidade.”

### 5. Carteira do contador

**Tela:** `/contador`; mostrar a carteira, selecionar um cliente de demonstração e destacar pendências ou documentos.

**Narração:** “Para o contador, acompanhar vários produtores exige organização. A carteira reúne os clientes e ajuda a localizar documentos, pendências e movimentações que precisam de atenção.”

**Chamada na tela:** “Uma visão mais organizada da carteira.”

### 6. Visão tributária gerencial

**Tela:** `/contador`; mostrar a visão ou simulação tributária de um cliente fictício.

**Narração:** “Com as informações organizadas, o contador pode consultar uma visão gerencial de receitas, despesas e estimativas tributárias. É um apoio para a análise profissional e para orientar as próximas conversas com o produtor.”

**Chamada na tela:** “Informação organizada para apoiar decisões.”

## Plano de produção

1. **Preparar ambiente de demonstração:** apontar `VIDEO_BASE_URL` e `VIDEO_API_URL` para um ambiente de demonstração ou homologação; usar contas próprias para gravação, com dados fictícios, sem informações reais de clientes. Configurar uma conta de produtor e uma de contador, pois cada perfil acessa áreas diferentes.
2. **Atualizar as cenas:** acrescentar capturas verticais para `/dashboard/produtor` e `/contador` em `videos/cenas.js`. Para cenas autenticadas, confirmar que a conta configurada tem o perfil necessário.
3. **Revisar os textos:** adaptar as narrações e legendas aos elementos que realmente aparecem na captura. Não prometer funções que não estejam visíveis ou disponíveis.
4. **Gerar voz:** configurar `TTS_PROVIDER` e a chave correspondente em `videos/.env`; escolher uma voz natural em português brasileiro e ouvir os arquivos antes da montagem.
5. **Gravar e montar:** produzir primeiro um Reel piloto, revisar enquadramento, ritmo, áudio e legendas; depois gravar a série completa.
6. **Revisão final:** assistir aos vídeos em um celular, conferir legibilidade sem áudio, confirmar que não aparecem dados pessoais, e exportar o MP4 final para publicação.

## Comandos existentes

Executar dentro de `apps/fluxo-caixa-web`:

```bash
npm run videos -- dashboard-9x16
npm run videos:voice -- dashboard-9x16
npm run videos:build -- dashboard-9x16
```

Os nomes acima ilustram o fluxo já configurado. As cenas novas de produtor e contador precisam ser adicionadas ao roteiro antes de usar os comandos com esses nomes. O FFmpeg também precisa estar instalado no ambiente de produção.

## Critérios para considerar a série pronta

- Seis vídeos verticais com captura atual da aplicação.
- Narração clara em português brasileiro e legendas revisadas.
- Interface legível em tela de celular e sem dados reais expostos.
- Uma chamada final coerente com o objetivo do vídeo.
- Arquivos finais revisados antes de publicar no Instagram.
