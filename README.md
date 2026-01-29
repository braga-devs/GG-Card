A **GG-CARD** API gera cartões de crédito/débito fictícios para testes de desenvolvimento, disponível em https://gg-card.vercel.app. O endpoint principal GET /gerar-cartoes?quantidade=N produz números válidos pelo algoritmo Luhn com detalhes completos como bandeira (Visa, Mastercard, Elo), CVV, validade, limite e emissor.

A API suporta até 1.500 cartões por requisição, com padrão de 5 quando não especificado. Retorna dados estruturados em JSON incluindo país de emissão, categoria (Gold, Platinum, Black), tipo de cartão e informações financeiras simuladas, todas em português brasileiro.

Além da geração, oferece endpoints de monitoramento: /status para informações do sistema, /health para verificação de saúde e /configuracoes para listar opções disponíveis. Todos incluem headers CORS e segurança apropriados.

Aviso crítico: Os cartões são exclusivamente fictícios para ambientes de desenvolvimento, não funcionam em transações reais e devem ser usados apenas em testes seguros. A API inclui múltiplos avisos de segurança em todas as respostas.

Para uso imediato: curl "https://gg-card.vercel.app/gerar-cartoes?quantidade=3" retorna dados prontos para testes, com estrutura padronizada e metadados de controle para integração em sistemas de desenvolvimento.
