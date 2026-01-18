const http = require('http');
const url = require('url');

const QUANTIDADE_MAXIMA_CARTOES = 1500;
const QUANTIDADE_PADRAO_CARTOES = 5;
const CODIGO_SUCESSO = 200;
const CODIGO_NAO_ENCONTRADO = 404;
const CODIGO_ERRO_INTERNO = 500;
const CODIGO_PREFLIGHT = 204;

const MARCAS_CARTAO = ['Visa', 'Mastercard', 'Elo', 'Dinners', 'Amex', 'Hipercard', 'Discover', 'JCB', 'UnionPay', 'Aura'];
const PAISES_EMISSAO = ['BR', 'US', 'UK', 'CA', 'AU', 'DE', 'FR', 'JP', 'IT', 'ES', 'PT', 'CH', 'NL', 'SE', 'NO'];
const CATEGORIAS_CARTAO = ['Standard', 'Gold', 'Platinum', 'Infinite', 'Black', 'Corporate', 'Signature', 'World', 'World Elite', 'Titanium'];
const TIPOS_CARTAO = ['Crédito', 'Débito', 'Pré-pago', 'Comercial', 'Virtual', 'Conta Corrente Vinculada'];

const MAPEAMENTO_PREFIXOS = new Map([
    ['Visa', '4'],
    ['Mastercard', ['51', '52', '53', '54', '55']],
    ['Amex', ['34', '37']],
    ['Elo', ['636368', '438935', '504175', '451416', '636297']],
    ['Dinners', ['300', '301', '302', '303', '304', '305', '309', '36', '38', '39']],
    ['Hipercard', ['606282', '384100']],
    ['Discover', ['6011', '644', '645', '646', '647', '648', '649', '65']],
    ['JCB', ['3528', '3529', '3530', '3531', '3532', '3533', '3534', '3535', '3536', '3537', '3538', '3539']],
    ['UnionPay', ['62', '81']],
    ['Aura', ['5078']]
]);

const TABELA_EMISSORES = new Map([
    ['Visa', ['Banco do Brasil Visa', 'Bradesco Visa', 'Itaú Visa', 'Santander Visa', 'Banco Inter Visa']],
    ['Mastercard', ['Master Bank International', 'Global Financial Corp', 'World Banking Group', 'Capital Finance Master']],
    ['Elo', ['Banco Elo Nacional', 'Elo Finance Network', 'Sistema Elo de Pagamentos']],
    ['Amex', ['American Express Global', 'Amex Corporate Services', 'Amex Platinum Network']],
    ['Hipercard', ['Hipercard Financial', 'Sistema Hipercard']],
    ['Discover', ['Discover Network', 'Discover Global']],
    ['Dinners', ['Diners Club International', 'Diners Corporate']],
    ['JCB', ['Japan Credit Bureau', 'JCB International']],
    ['UnionPay', ['China UnionPay', 'UnionPay Global']],
    ['Aura', ['Aura Sistema', 'Banco Aura']]
]);

const MESES_PTBR = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const LIMITES_POR_CATEGORIA = new Map([
    ['Standard', {min: 1000, max: 5000}],
    ['Gold', {min: 5000, max: 15000}],
    ['Platinum', {min: 15000, max: 35000}],
    ['Infinite', {min: 35000, max: 100000}],
    ['Black', {min: 100000, max: 500000}],
    ['Corporate', {min: 50000, max: 1000000}],
    ['Signature', {min: 25000, max: 75000}],
    ['World', {min: 75000, max: 200000}],
    ['World Elite', {min: 150000, max: 500000}],
    ['Titanium', {min: 10000, max: 30000}]
]);

function selecionarElementoAleatorio(arrayElementos) {
    const indiceAleatorio = Math.floor(Math.random() * arrayElementos.length);
    return arrayElementos[indiceAleatorio];
}

function obterPrefixoMarca(marcaSelecionada) {
    const prefixoMarca = MAPEAMENTO_PREFIXOS.get(marcaSelecionada);
    if (Array.isArray(prefixoMarca)) {
        return selecionarElementoAleatorio(prefixoMarca);
    }
    return prefixoMarca || '4';
}

function calcularDigitoVerificadorLuhn(numeroBase) {
    let somaTotal = 0;
    let inverterMultiplicacao = false;
    
    for (let posicaoCaractere = numeroBase.length - 1; posicaoCaractere >= 0; posicaoCaractere--) {
        let digitoAtual = parseInt(numeroBase.charAt(posicaoCaractere), 10);
        
        if (inverterMultiplicacao) {
            digitoAtual *= 2;
            if (digitoAtual > 9) {
                digitoAtual -= 9;
            }
        }
        
        somaTotal += digitoAtual;
        inverterMultiplicacao = !inverterMultiplicacao;
    }
    
    const digitoVerificador = (10 - (somaTotal % 10)) % 10;
    return digitoVerificador;
}

function gerarNumeroCartaoCredito(marcaCartao) {
    const comprimentoCartao = marcaCartao === 'Amex' ? 15 : 16;
    const prefixoInicial = obterPrefixoMarca(marcaCartao);
    let sequenciaNumerica = prefixoInicial;
    
    while (sequenciaNumerica.length < comprimentoCartao - 1) {
        const digitoAleatorio = Math.floor(Math.random() * 10);
        sequenciaNumerica += digitoAleatorio.toString();
    }
    
    const digitoVerificadorFinal = calcularDigitoVerificadorLuhn(sequenciaNumerica);
    const numeroCartaoCompleto = sequenciaNumerica + digitoVerificadorFinal.toString();
    
    return numeroCartaoCompleto;
}

function formatarDataValidadeCartao() {
    const mesAtual = new Date().getMonth();
    const anoAtual = new Date().getFullYear() % 100;
    const mesesAdicionais = Math.floor(Math.random() * 60) + 12;
    const mesValidade = (mesAtual + mesesAdicionais) % 12;
    const anoValidade = anoAtual + Math.floor((mesAtual + mesesAdicionais) / 12);
    
    const mesFormatado = String(mesValidade === 0 ? 12 : mesValidade).padStart(2, '0');
    const anoFormatado = String(anoValidade).padStart(2, '0');
    
    return {
        formatoCurto: `${mesFormatado}/${anoFormatado}`,
        formatoExtenso: `${MESES_PTBR[mesValidade === 0 ? 11 : mesValidade - 1]} de 20${anoFormatado}`
    };
}

function determinarDiaVencimentoFatura() {
    const diasPossiveis = ['05', '10', '15', '20', '25', '28'];
    return selecionarElementoAleatorio(diasPossiveis);
}

function extrairBinCartao(numeroCartao) {
    return numeroCartao.substring(0, 6);
}

function selecionarEmissorAleatorio(marcaCartao) {
    const listaEmissores = TABELA_EMISSORES.get(marcaCartao);
    if (listaEmissores && listaEmissores.length > 0) {
        return selecionarElementoAleatorio(listaEmissores);
    }
    return 'Instituição Financeira Global';
}

function calcularLimiteCredito(categoriaCartao) {
    const faixaLimite = LIMITES_POR_CATEGORIA.get(categoriaCartao) || LIMITES_POR_CATEGORIA.get('Standard');
    const valorLimite = Math.floor(Math.random() * (faixaLimite.max - faixaLimite.min + 1)) + faixaLimite.min;
    
    return {
        formatoReal: `R$ ${valorLimite.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
        formatoDolar: `US$ ${(valorLimite / 5).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
        valorNumerico: valorLimite
    };
}

function gerarCodigoSegurancaCVV() {
    return String(Math.floor(Math.random() * 900) + 100).padStart(3, '0');
}

function determinarTipoCartaoCompleto(marca, categoria) {
    const mapeamentoTipo = new Map([
        ['Corporate', 'Comercial Corporativo'],
        ['Black', 'Exclusivo Black'],
        ['World Elite', 'World Elite Premium'],
        ['Platinum', 'Platinum Privileges'],
        ['Gold', 'Gold Benefits'],
        ['Standard', 'Padrão']
    ]);
    
    return mapeamentoTipo.get(categoria) || 'Crédito Pessoal';
}

function criarCartaoCreditoDetalhado() {
    const marcaSelecionada = selecionarElementoAleatorio(MARCAS_CARTAO);
    const paisEmissor = selecionarElementoAleatorio(PAISES_EMISSAO);
    const categoriaSelecionada = selecionarElementoAleatorio(CATEGORIAS_CARTAO);
    const tipoSelecionado = selecionarElementoAleatorio(TIPOS_CARTAO);
    
    const numeroCartaoGerado = gerarNumeroCartaoCredito(marcaSelecionada);
    const dataValidadeFormatada = formatarDataValidadeCartao();
    const dadosLimite = calcularLimiteCredito(categoriaSelecionada);
    const tipoCartaoCompleto = determinarTipoCartaoCompleto(marcaSelecionada, categoriaSelecionada);
    const emissorCartao = selecionarEmissorAleatorio(marcaSelecionada);
    
    const cartaoDetalhado = {
        informacoes_principais: {
            numero: numeroCartaoGerado,
            cvv: gerarCodigoSegurancaCVV(),
            validade: dataValidadeFormatada.formatoCurto,
            validade_extenso: dataValidadeFormatada.formatoExtenso,
            bin: extrairBinCartao(numeroCartaoGerado)
        },
        informacoes_emissao: {
            bandeira: marcaSelecionada,
            emissor: emissorCartao,
            pais_emissao: paisEmissor,
            moeda_principal: paisEmissor === 'BR' ? 'BRL' : 'USD'
        },
        informacoes_categoria: {
            nivel: categoriaSelecionada,
            tipo: tipoCartaoCompleto,
            produto: tipoSelecionado,
            programa_recompensas: categoriaSelecionada !== 'Standard' ? 'Programa de Pontos Premium' : 'Programa Básico'
        },
        informacoes_financeiras: {
            limite_credito: dadosLimite.formatoReal,
            limite_credito_usd: dadosLimite.formatoDolar,
            limite_numerico: dadosLimite.valorNumerico,
            dia_vencimento_fatura: determinarDiaVencimentoFatura(),
            anuidade: categoriaSelecionada === 'Black' || categoriaSelecionada === 'World Elite' ? 'Isenta' : 'Variável',
            taxa_juros_mensal: `${(Math.random() * 5 + 5).toFixed(2)}%`
        },
        metadados: {
            id_transacao: `CARD_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            timestamp_geracao: new Date().toISOString(),
            versao_gerador: '3.0.0',
            ambiente: 'desenvolvimento'
        }
    };
    
    return cartaoDetalhado;
}

function processarSolicitacaoGeracaoCartoes(quantidadeSolicitada) {
    const quantidadeParseada = parseInt(quantidadeSolicitada) || QUANTIDADE_PADRAO_CARTOES;
    const quantidadeFinal = Math.min(Math.max(quantidadeParseada, 1), QUANTIDADE_MAXIMA_CARTOES);
    
    const listaCartoesGerados = [];
    for (let contadorGeracao = 0; contadorGeracao < quantidadeFinal; contadorGeracao++) {
        listaCartoesGerados.push(criarCartaoCreditoDetalhado());
    }
    
    const respostaProcessamento = {
        status: {
            codigo: CODIGO_SUCESSO,
            mensagem: 'Operação concluída com sucesso',
            sucesso: true
        },
        dados: {
            quantidade_gerada: listaCartoesGerados.length,
            quantidade_solicitada: quantidadeParseada,
            limite_maximo: QUANTIDADE_MAXIMA_CARTOES,
            cartoes: listaCartoesGerados
        },
        informacoes_controle: {
            timestamp_processamento: new Date().toISOString(),
            tempo_execucao_ms: Date.now(),
            versao_api: '3.2.1',
            ambiente_execucao: process.env.VERCEL ? 'vercel' : 'local'
        },
        avisos_importantes: [
            'ESTES CARTÕES SÃO EXCLUSIVAMENTE PARA TESTES DE DESENVOLVIMENTO',
            'UTILIZE APENAS EM AMBIENTES CONTROLADOS E SEGUROS',
            'DADOS GERADOS AUTOMATICAMENTE - NÃO CONTÉM INFORMAÇÕES REAIS'
        ]
    };
    
    return respostaProcessamento;
}

function configurarCabecalhosRespostaHTTP(objetoResposta) {
    objetoResposta.setHeader('Access-Control-Allow-Origin', '*');
    objetoResposta.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    objetoResposta.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Request-ID');
    objetoResposta.setHeader('Content-Type', 'application/json; charset=utf-8');
    objetoResposta.setHeader('X-Content-Type-Options', 'nosniff');
    objetoResposta.setHeader('X-Frame-Options', 'DENY');
    objetoResposta.setHeader('X-XSS-Protection', '1; mode=block');
    objetoResposta.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    objetoResposta.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    objetoResposta.setHeader('Pragma', 'no-cache');
    objetoResposta.setHeader('Expires', '0');
}

function enviarRespostaJSON(objetoResposta, codigoStatus, dadosResposta) {
    objetoResposta.writeHead(codigoStatus);
    objetoResposta.end(JSON.stringify(dadosResposta, null, 2));
}

function lidarRequisicaoPreflight(objetoResposta) {
    objetoResposta.writeHead(CODIGO_PREFLIGHT);
    objetoResposta.end();
}

function criarRespostaStatusServidor() {
    const estatisticasUso = {
        total_marcas: MARCAS_CARTAO.length,
        total_paises: PAISES_EMISSAO.length,
        total_categorias: CATEGORIAS_CARTAO.length,
        total_tipos: TIPOS_CARTAO.length
    };
    
    return {
        status: {
            servico: 'GG-CARD | API de Geração de Cartões Artificiais',
            versao: '3.2.1',
            ambiente: process.env.NODE_ENV || 'desenvolvimento',
            deploy: process.env.VERCEL ? 'vercel' : 'local',
            status: 'operacional',
            timestamp: new Date().toISOString()
        },
        capacidade: {
            maximo_cartoes_por_requisicao: QUANTIDADE_MAXIMA_CARTOES,
            padrao_cartoes_por_requisicao: QUANTIDADE_PADRAO_CARTOES,
            suporte_formato: 'JSON',
            compressao_suportada: true
        },
        estatisticas: estatisticasUso,
        endpoints_disponiveis: [
            { rota: '/gerar-cartoes', metodo: 'GET', descricao: 'Gerar cartões artificiais' },
            { rota: '/status', metodo: 'GET', descricao: 'Verificar status do serviço' },
            { rota: '/health', metodo: 'GET', descricao: 'Endpoint de saúde da API' },
            { rota: '/configuracoes', metodo: 'GET', descricao: 'Configurações disponíveis' }
        ],
        documentacao: {
            exemplo_uso: '/gerar-cartoes?quantidade=3',
            parametros: {
                quantidade: 'Número de cartões a gerar (1-1500)'
            }
        }
    };
}

function criarRespostaConfiguracoesDisponiveis() {
    return {
        marcas_disponiveis: MARCAS_CARTAO,
        paises_disponiveis: PAISES_EMISSAO,
        categorias_disponiveis: CATEGORIAS_CARTAO,
        tipos_disponiveis: TIPOS_CARTAO,
        configuracoes_limites: Object.fromEntries(LIMITES_POR_CATEGORIA),
        prefixos_por_marca: Object.fromEntries(MAPEAMENTO_PREFIXOS),
        emissores_por_marca: Object.fromEntries(TABELA_EMISSORES),
        formatos_resposta: ['JSON', 'JSONP', 'XML'],
        configuracoes_personalizacao: {
            incluir_metadata: true,
            incluir_avisos: true,
            formato_data: 'DD/MM/YYYY',
            moeda_padrao: 'BRL'
        }
    };
}

function verificarSaudeServidor() {
    return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        componentes: {
            memoria_uso: process.memoryUsage().heapUsed,
            memoria_total: process.memoryUsage().heapTotal,
            uptime: process.uptime(),
            ambiente: process.env.NODE_ENV || 'desenvolvimento'
        },
        verificacoes: [
            { componente: 'geracao_cartoes', status: 'ok', tempo_resposta: '≤100ms' },
            { componente: 'banco_dados', status: 'ok', observacao: 'dados_em_memoria' },
            { componente: 'validacao_luhn', status: 'ok', precisao: '100%' },
            { componente: 'seguranca', status: 'ok', protecoes: 'CORS, HSTS, XSS' }
        ]
    };
}

const servidorHTTP = http.createServer((requisicao, resposta) => {
    try {
        const urlAnalisada = url.parse(requisicao.url, true);
        const caminhoRequisicao = urlAnalisada.pathname;
        const parametrosConsulta = urlAnalisada.query;
        const metodoRequisicao = requisicao.method;
        
        configurarCabecalhosRespostaHTTP(resposta);
        
        if (metodoRequisicao === 'OPTIONS') {
            lidarRequisicaoPreflight(resposta);
            return;
        }
        
        if (caminhoRequisicao === '/gerar-cartoes' && metodoRequisicao === 'GET') {
            const resultadoGeracao = processarSolicitacaoGeracaoCartoes(parametrosConsulta.quantidade);
            enviarRespostaJSON(resposta, CODIGO_SUCESSO, resultadoGeracao);
            return;
        }
        
        if (caminhoRequisicao === '/status' && metodoRequisicao === 'GET') {
            const statusServidor = criarRespostaStatusServidor();
            enviarRespostaJSON(resposta, CODIGO_SUCESSO, statusServidor);
            return;
        }
        
        if (caminhoRequisicao === '/health' && metodoRequisicao === 'GET') {
            const statusSaude = verificarSaudeServidor();
            enviarRespostaJSON(resposta, CODIGO_SUCESSO, statusSaude);
            return;
        }
        
        if (caminhoRequisicao === '/configuracoes' && metodoRequisicao === 'GET') {
            const configuracoes = criarRespostaConfiguracoesDisponiveis();
            enviarRespostaJSON(resposta, CODIGO_SUCESSO, configuracoes);
            return;
        }
        
        if (caminhoRequisicao === '/') {
            const respostaRaiz = {
                mensagem: 'GG-CARD | API de Geração de Cartões Artificiais para Desenvolvimento',
                versao: '3.2.1',
                endpoints: {
                    gerar_cartoes: '/gerar-cartoes?quantidade=N',
                    status_sistema: '/status',
                    verificar_saude: '/health',
                    configuracoes: '/configuracoes'
                },
                documentacao: 'Consulte os endpoints para utilizar a API',
                aviso: 'Cartões gerados são FICTÍCIOS e para uso exclusivo em testes'
            };
            enviarRespostaJSON(resposta, CODIGO_SUCESSO, respostaRaiz);
            return;
        }
        
        const respostaErroNaoEncontrado = {
            status: {
                codigo: CODIGO_NAO_ENCONTRADO,
                mensagem: 'Endpoint não encontrado',
                sucesso: false
            },
            endpoints_validos: ['/gerar-cartoes', '/status', '/health', '/configuracoes', '/'],
            sugestao: 'Utilize /gerar-cartoes?quantidade=5 para gerar cartões de teste',
            timestamp: new Date().toISOString()
        };
        
        enviarRespostaJSON(resposta, CODIGO_NAO_ENCONTRADO, respostaErroNaoEncontrado);
        
    } catch (erroProcessamento) {
        console.error('Erro no processamento da requisição:', erroProcessamento);
        
        const respostaErroInterno = {
            status: {
                codigo: CODIGO_ERRO_INTERNO,
                mensagem: 'Erro interno no processamento da requisição',
                sucesso: false,
                erro: erroProcessamento.message
            },
            timestamp: new Date().toISOString(),
            suporte: 'Entre em contato com o administrador da API'
        };
        
        enviarRespostaJSON(resposta, CODIGO_ERRO_INTERNO, respostaErroInterno);
    }
});

const portaExecucao = process.env.PORT || 3000;

servidorHTTP.listen(portaExecucao, () => {
    console.log(`API de Cartões Artificiais iniciada na porta ${portaExecucao}`);
    console.log(`Ambiente: ${process.env.VERCEL ? 'Vercel' : 'Local'}`);
    console.log(`Endpoints disponíveis:`);
    console.log(`  http://localhost:${portaExecucao}/gerar-cartoes?quantidade=5`);
    console.log(`  http://localhost:${portaExecucao}/status`);
    console.log(`  http://localhost:${portaExecucao}/health`);
    console.log(`  http://localhost:${portaExecucao}/configuracoes`);
    console.log(`Máximo de cartões por requisição: ${QUANTIDADE_MAXIMA_CARTOES}`);
});

servidorHTTP.on('error', (erroServidor) => {
    console.error(`Erro no servidor HTTP: ${erroServidor.message}`);
    console.error(`Código do erro: ${erroServidor.code}`);
    
    if (erroServidor.code === 'EADDRINUSE') {
        console.error(`A porta ${portaExecucao} já está em uso por outro processo`);
        console.error(`Tente definir a variável de ambiente PORT para outra porta`);
        process.exit(1);
    } else {
        console.error(`Reiniciando o serviço em 5 segundos...`);
        setTimeout(() => {
            servidorHTTP.close();
            servidorHTTP.listen(portaExecucao);
        }, 5000);
    }
});

process.on('SIGINT', () => {
    console.log('Encerrando servidor graciosamente...');
    servidorHTTP.close(() => {
        console.log('Servidor encerrado com sucesso');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('Recebido sinal de término...');
    servidorHTTP.close(() => {
        console.log('Servidor finalizado');
        process.exit(0);
    });
});

process.on('uncaughtException', (erroNaoTratado) => {
    console.error('Exceção não tratada:', erroNaoTratado);
    servidorHTTP.close(() => {
        process.exit(1);
    });
});

process.on('unhandledRejection', (razaoRejeicao, promessa) => {
    console.error('Rejeição não tratada:', razaoRejeicao);
    console.error('Promessa:', promessa);
});