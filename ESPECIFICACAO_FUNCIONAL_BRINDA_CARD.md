# BRINDA SERRA • PLATAFORMA OFICIAL
Especificação Funcional e Configuração do Sistema — BRINDA CARD
Documento Oficial Reestruturado por: 1. RESUMO DIDÁTICO | 2. PONTOS A SEREM DEFINIDOS | 3. ASSUNTOS (Mapeamento Completo)
Versão Oficial Consolidada | Outubro/2026 | Canela / Gramado - RS


---

## PARTE 1: RESUMO DIDÁTICO DO SISTEMA

Visão explicativa e direta de como o Brinda Serra e o Brinda Card funcionam

O BRINDA SERRA é uma plataforma própria e independente para venda, emissão, controle e validação digital de experiências turísticas na Serra Gaúcha, iniciando pelo circuito de cervejarias artesanais com o BRINDA CARD.


#### 1. O Conceito em Duas Camadas (Acesso Vitalício vs. Experiências Temporárias)

* O BRINDA CARD (Acesso Vitalício): O cliente paga R$ 10,00 uma única vez no cadastro inicial. Esse cadastro e login na plataforma são vitalícios. O cliente pode comprar apenas o cartão ou já adicionar experiências no ato da compra.
* PACOTE DE EXPERIÊNCIAS (Uso em 6 Meses): São os pacotes de visitas (BRINDA BEM com 3 experiências ou BRINDA PREMIUM com 5 experiências). Cada lote de experiências comprado tem validade de 6 MESES. O cliente pode voltar meses depois, logar e recarregar novas experiências quantas vezes quiser, sem nunca mais pagar a taxa do cartão.

#### 2. A Regra de Ouro da Plataforma (Anti-Repetição)


> 🔒 [BLOQUEIO POR ESTABELECIMENTO]: O mesmo QR Code BRINDA CARD não pode ser utilizado mais de uma vez na mesma cervejaria parceira. Se o cliente tentar visitar a mesma cervejaria novamente com o mesmo Card, o sistema bloqueia automaticamente a validação e NÃO desconta créditos do saldo do cliente.


#### 3. Como Funciona para Cada Papel

* Cliente / Pagador: Faz o cadastro, paga via PIX ou Cartão e gerencia seus QR Codes nominais. Pode comprar para si e para terceiros (amigos/família).
* Titular Beneficiário: Apresenta o QR Code no celular acompanhado de documento com foto na entrada da cervejaria para receber a degustação.
* Cervejaria Parceira: Possui login simples para ler o QR Code com a câmera do celular/tablet, checar a validade e dar baixa no saldo.
* Vendedores / Promotores: Indica clientes via código próprio (Uber, Promotores) ou seleção de Hotel. Recebe R$ 20,00 de comissão na 1ª compra de experiência do cliente, com bônus de R$ 200,00 se passar de 20 vendas no mês. Pagamento mensal todo dia 10.

#### 4. Regra Mandatória de Design, Emissão e Configuração do BRINDA CARD


> 🔒 [PADRÃO VISUAL OFICIAL E IMUTÁVEL]: O BRINDA CARD deve ser emitido e apresentado EXATAMENTE no formato visual oficial homologado: proporção de cartão de crédito (1.586:1), fundo degradê Verde Serrano (#2D362C a #3F4A3E), moldura interna em acabamento foil dourado (#C9A86A), logotipo oficial em moldura circular à esquerda, badge 'VIP PASS' dourado à direita, chip metálico 'DIGITAL MEMBER', bloco com QR Code nítido à direita com código alfanumérico, nome completo do titular em caixa alta no rodapé esquerdo e prazo de validade de 6 meses à direita.

* Entrega Multicanal Padronizada: O mesmo formato e identidade visual deve ser mantido de forma idêntica em TODOS os canais: 1. Na tela do site (Área do Cliente e comprovante de compra); 2. No e-mail enviado ao cliente (HTML responsivo de alta fidelidade); 3. No voucher digital / PDF gerado para download e apresentação nas cervejarias parceiras.
* Padrão do Configurador de Vendas: A tela de seleção de compra deve seguir estritamente o modelo homologado: Bloco superior de Adesão BRINDA Card (R$ 10,00, gerando login pessoal e acesso vitalício) + Bloco de Cervejarias com 3 opções claras: 1. Apenas o Cartão Base (por enquanto - R$ 0,00 adicionais); 2. Brinda Bem (Recomendado - 3 cervejarias por R$ 130,00); 3. Brinda Premium (Mais Econômico - 5 cervejarias por R$ 190,00).

---

## PARTE 2: PONTOS A SEREM DEFINIDOS (COM APONTAMENTOS DE PAULA PASCHOALIN)

Reunião de todas as dúvidas, pendências comerciais e definições jurídicas do projeto

Abaixo estão consolidados todos os pontos que exigem definição comercial ou jurídica, integrando as anotações do relatório original e os apontamentos trazidos por Paula Paschoalin:


---

## PARTE 3: ASSUNTOS (ESPECIFICAÇÃO COMPLETA REORGANIZADA)

Organização de todos os requisitos do documento original por assuntos temáticos, preservando 100% dos textos e anotações


### ASSUNTO 1: OBJETIVOS, PRINCÍPIO DO MVP E PRIORIDADES

Criar uma plataforma própria e independente para a BRINDA SERRA, iniciando pelo produto BRINDA CARD. O sistema deverá permitir a venda, emissão, controle e validação digital dos Cards de experiências cervejeiras.

Princípio do MVP (Primeiro Vender, Depois Expandir): A primeira versão deve ser simples, objetiva e focada em colocar o produto à venda. O MVP deve resolver perfeitamente: CADASTRO → VENDA → PAGAMENTO → EMISSÃO DO CARD → QR CODE → VALIDAÇÃO → CONTROLE → COMISSÃO → SAC → ADMINISTRAÇÃO. Funcionalidades adicionais somente deverão entrar quando houver necessidade real. O objetivo é colocar o BRINDACARD em operação rapidamente, com uma experiência simples para o cliente e total controle administrativo para a proprietária.

Prioridade Especial de Automação: Como a BRINDA SERRA está começando com uma estrutura enxuta, o sistema deverá priorizar automação de tarefas repetitivas: PAGAMENTO AUTOMÁTICO, EMISSÃO AUTOMÁTICA DO CARD, QR CODE AUTOMÁTICO, VALIDAÇÃO AUTOMÁTICA, CONTROLE AUTOMÁTICO DE UTILIZAÇÕES, COMISSÃO AUTOMÁTICA, SAC AUTOMATIZADO COM IA. A proprietária deverá entrar manualmente apenas nos casos que realmente necessitem de decisão ou atendimento humano.


### ASSUNTO 2: PRODUTOS, MODALIDADES E REGRAS DE UTILIZAÇÃO

Inicialmente existirão duas modalidades de experiências:

BRINDA BEM: Direito a 3 experiências cervejeiras.

BRINDA PREMIUM: Direito a 5 experiências cervejeiras.

Validade das Experiências: Cada experiência terá validade de 6 meses, conforme a regra comercial definida pela administração. O cliente poderá utilizar suas experiências durante o período de validade.

O Brinda Card Vitalício: O BRINDA CARD em si é pago somente 1 vez para fazer o cadastro na plataforma e é vitalício. O cliente pode comprar as experiências junto na primeira compra do cartão ou comprar somente o cartão e depois voltar, se logar e comprar as experiências quantas vezes quiser.


> ⚠️ [ANOTAÇÃO ORIGINAL / ALERTA]: CONFORME APONTAMENTO DE PAULA PASCHOALIN: A venda do cartão casada com experiência é vedada por lei (Art. 39, I do CDC). O sistema deve permitir a compra avulsa apenas do Card por R$ 10,00.


#### Regra Fundamental de Utilização (Anti-Repetição)

O mesmo QR CODE BRINDA CARD (seja de 3 ou de 5) não poderá ser utilizado mais de uma vez na mesma empresa (cervejaria, vinícola, etc). Essa regra deverá ser controlada automaticamente pelo sistema.

Exemplo de Uso: Um cliente possui um BRINDA PREMIUM. Ele poderá utilizar: Cervejaria A → 1 utilização; Cervejaria B → 1 utilização; Cervejaria C → 1 utilização; Cervejaria D → 1 utilização; Cervejaria E → 1 utilização.


#### Regra de Bloqueio Automático: Depois de utilizar o Card na Cervejaria A, uma nova tentativa de utilização desse mesmo Card na Cervejaria A deverá ser bloqueada automaticamente, mesmo que ainda existam experiências disponíveis no Card. O sistema deverá considerar a combinação: CARD + CERVEJARIA para impedir uma segunda utilização no mesmo estabelecimento.


> ⚠️ [ANOTAÇÃO ORIGINAL / ALERTA]: SOBRE SEGUNDA VISITA EM NOVO PACOTE: Conforme apontamento de Paula Paschoalin, a princípio as cervejarias não vão aceitar que o mesmo cliente/CPF volte a utilizar degustação cortesia na mesma cervejaria mesmo em nova compra futura. O sistema adota a trava no par CPF + CERVEJARIA.


### ASSUNTO 3: QR CODE NOMINAL, REGRAS DE SEGURANÇA E PADRÃO DE EMISSÃO


> 🔒 [PADRÃO MANDATÓRIO DE EMISSÃO DO CARTÃO]: O QR Code e o BRINDA CARD devem ser emitidos e enviados ao cliente EXATAMENTE no formato visual oficial homologado: cartão virtual em formato proporção cartão de crédito (1.586:1), fundo degradê Verde Serrano (#2D362C a #3F4A3E), moldura em foil dourado (#C9A86A), logotipo oficial circular à esquerda, badge 'VIP PASS' dourado à direita, chip dourado metálico 'DIGITAL MEMBER', bloco em fundo branco com QR Code escaneável e código alfanumérico nominal, nome do titular em destaque e validade de 6 meses. Esse formato é MANDATÓRIO e deve ser preservado de forma idêntica: 1. Na tela do sistema (Área do Cliente); 2. No e-mail transacional de envio do passe; 3. No arquivo digital (PDF/Voucher) para apresentação presencial nas cervejarias parceiras.

Após a aprovação do pagamento, o sistema deverá gerar o QR Code correspondente ao Card. O QR Code deverá estar vinculado ao cadastro do titular.

Controle de Saldo (Brinda Bem): BRINDA BEM: 3 utilizações disponíveis; 1ª validação → 2 restantes; 2ª validação → 1 restante; 3ª validação → Card/experiências esgotadas.

Controle de Saldo (Brinda Premium): BRINDA PREMIUM: 5 utilizações disponíveis; cada validação reduz uma utilização; após a quinta utilização, não haverá novas utilizações disponíveis.


#### Regra de Segurança: Antes de confirmar qualquer utilização, o sistema deverá verificar se aquele Card já foi utilizado anteriormente naquela mesma cervejaria. Se já tiver sido utilizado: UTILIZAÇÃO NÃO PERMITIDA. Mensagem sugerida: 'Este BRINDA BEM já foi utilizado nesta cervejaria. Você pode utilizar as experiências restantes em outras cervejarias participantes.' O sistema não deverá descontar uma experiência quando a utilização for bloqueada. O QR Code não deverá permitir utilização acima da quantidade contratada.

Registro Obrigatório de Cada Validação: Cliente/titular; Card; Cervejaria; Experiência utilizada; Data; Horário; Usuário que realizou a validação.


### ASSUNTO 4: CADASTRO DE CLIENTES E COMPRA PARA TERCEIROS

O cadastro deverá exigir obrigatoriamente: Nome completo, CPF, Data de nascimento, Telefone, E-mail e aceite dos Termos de Uso. O cadastro deverá possuir validações para evitar duplicidade de CPF/e-mail conforme as regras definidas pela plataforma.

Compra para Terceiros (Distinção de Papéis)

O sistema deverá permitir que uma pessoa faça uma compra para outras pessoas. Deve existir distinção entre:

PAGADOR: Pessoa responsável pelo pagamento. O SISTEMA REGISTRA ESSE COMO DETENTOR DO BRINDA CARD, OS DEMAIS CPFS NÃO PODEM SER REGISTRADOS COMO TITULARES, SOMENTE SERÃO UTILIZADOS DADOS PARA CRIAÇÃO DOS QR CODES. DESSA FORMA, FUTURAMENTE ELES PODEM SE CADASTRAR COM SEU CPF, COMPRAR O BRINDA CARD E LOGAR NO SITE INDIVIDUALMENTE.

TITULAR(ES) DO(S) CARD(S): Pessoa(s) que efetivamente utilizarão as experiências.

Exemplo Prático: João compra 3 Cards para: João, Maria e Pedro. O sistema deverá registrar João como pagador e gerar os Cards individualmente vinculados aos respectivos titulares. Cada titular deverá possuir seu próprio QR Code nominal. João é titular pagador – o CPF dele está vinculado ao login e Brinda Card. João comprou uma experiência para Maria – o CPF dela só aparece no QR code dela de utilização e não no cadastro do Brinda Card.


> ⚠️ [ANOTAÇÃO ORIGINAL / ALERTA]: LIMITAÇÃO DE TERCEIROS: Limitar compra para terceiros para evitar fraude de um único card ter uma lista enorme de experiências compradas para outras pessoas sem pagar a taxa do CARD. Limite definido no FAQ em até 3 convidados por titular pagante.


### ASSUNTO 5: ORIGEM DA VENDA, CANAIS DE AQUISIÇÃO E VENDEDORES

O campo COMO NOS CONHECEU? será obrigatório somente na 1ª compra. Após ser cadastrado no sistema e já possuir histórico de compra, o valor de R$ 10,00 do Brinda Card não será mais cobrado caso ele queira adicionar novas experiências futuramente e não será pago valor de comissão novamente ao vendedor da 1ª compra. O VALOR DA COMISSÃO É REFERENTE À 1ª EXPERIÊNCIA COMPRADA E NÃO À COMPRA DO CARD SOMENTE.

Opção HOTEL: Ao selecionar HOTEL, deverá aparecer outro campo obrigatório para selecionar qual hotel indicou a experiência. A lista deverá conter todos os hotéis cadastrados pela administração que possuem vendedores/parceiros vinculados (Ex: Hotel A, Hotel B, Hotel C, Hotel D). A administração deverá conseguir cadastrar, editar, ativar e desativar hotéis. O hotel poderá possuir vendedores associados.

Opção UBER: Ao selecionar UBER, deverá aparecer a possibilidade de identificar o motorista/vendedor responsável pela indicação. Os motoristas deverão ser cadastrados individualmente pelo sistema. Cada motorista poderá possuir um identificador próprio, um código gerado no momento do cadastro dele no sistema administrativo como vendedor (Ex: PEDRO DA SILVA – código: PEDRO01). Também poderão ser utilizados cartões/códigos de desconto específicos para incentivar a indicação e permitir a identificação da origem da venda.

Opção GOOGLE / INSTAGRAM: Computadas como vendas diretas próprias, sem comissão.

Opção OUTROS / VENDEDORES AVULSOS: Abrir opção de linha digitável (vai servir para novos clientes que já tiveram a experiência comprada por terceiros e agora querem ter o acesso de compra como titular e comprar o Brinda Card, ali escrevem que foi indicação, amigo, etc). Deve também abrir opção de vendedor autônomo com campo para digitar o código do vendedor – estes terão cartões para dar aos clientes com o site para compra e o código deles atrás. A opção outros só gera comissão se o campo de código do vendedor for preenchido. Deixar o sistema preparado para cadastrar vendedores avulsos que não estão em hotéis e não são ubers, com cadastro igual de Uber para gerar código de venda para eles serem identificados.


### ASSUNTO 6: REGRAS DE COMISSIONAMENTO E FECHAMENTO MENSAL

O vendedor será identificado principalmente através da informação fornecida no cadastro do cliente sobre a origem da compra.

Comissão Base: R$ 20,00 por venda NA PRIMEIRA COMPRA de experiência VINCULADA AO CPF DO TITULAR PAGADOR E NÃO VENDA DE TERCEIROS.

Bônus por Metas: BÔNUS DE R$ 200,00 quando o vendedor ultrapassar 20 vendas no mês. A regra deverá ser configurável no sistema para que a administração possa alterar futuramente sem necessidade de modificar o código.

Contabilização Automática: Vendedor; Quantidade de vendas no mês; Vendas aprovadas; Vendas canceladas; Comissão individual; Bônus mensal; Total a receber.

Ciclo de Pagamento das Comissões: A comissão deve ser calculada do dia 1 ao 31 de cada mês para ser paga todo dia 10 do mês seguinte, para evitar saldo negativo de vendas canceladas ou estornadas.


> ⚠️ [ANOTAÇÃO ORIGINAL / ALERTA]: PROBLEMA ANOTADO NO RELATÓRIO ORIGINAL: O sistema deverá considerar como venda válida para comissão somente a venda que cumprir as regras comerciais definidas pela administração, especialmente quanto à aprovação do pagamento e eventuais cancelamentos/estornos. A comissão é calculada de acordo com a venda nominal, ou seja, se o João comprar para ele e terceiros, a comissão é somente sobre o valor da compra nominal dele, do CPF do pagador e não nos QR gerados com CPF de terceiros. PROBLEMA: Vincular a comissão à compra do titular, que será feito no CPF do pagador, porém se ele comprar só o cartão ou se comprar só pra terceiros não tem como pagar comissão...


> ⚠️ [ANOTAÇÃO ORIGINAL / ALERTA]: QUESTÃO A RESOLVER (DO RELATÓRIO): Se o titular pagador estiver comprando somente para terceiros, não gera comissão por não gerar compra de experiência para ele utilizar. (Ponto a ser decidido pela administração).


### ASSUNTO 7: VALIDAÇÃO DE QR CODE E ACESSO DAS CERVEJARIAS

Cada cervejaria deverá possuir acesso próprio. A cervejaria poderá: acessar sua área, validar QR Codes, consultar utilização, visualizar histórico das validações e visualizar suas experiências cadastradas. A cervejaria não deverá ter acesso aos dados administrativos gerais da plataforma nem de edição.


#### Fluxo de Validação pela Cervejaria

Verificações Automáticas: Ao ler o QR Code o sistema deverá verificar: se o QR Code existe; se o Card está ativo; se o Card está dentro da validade; quantas experiências ainda estão disponíveis; quais experiências já foram utilizadas; quais experiências podem ser utilizadas naquela cervejaria; se aquele Card já foi utilizado anteriormente naquela cervejaria.


#### Regra de Bloqueio: Se o sistema identificar que o mesmo Card já foi utilizado naquela cervejaria, deverá impedir uma nova utilização. Mensagem sugerida: 'ESTE CARD JÁ FOI UTILIZADO NESTA CERVEJARIA. Você pode utilizar suas experiências restantes em outras cervejarias participantes.' Nenhuma experiência deverá ser descontada quando a validação for bloqueada.

Confirmação e Baixa: Se o Card ainda puder ser utilizado naquela cervejaria, a cervejaria deverá selecionar a experiência que está sendo utilizada. Antes da confirmação, o sistema deverá mostrar: CONFIRMAR UTILIZAÇÃO? Após confirmação: registrar a utilização; descontar uma experiência; registrar cervejaria; registrar usuário; registrar data e horário; atualizar o saldo do cliente; registrar que aquele Card já foi utilizado naquela cervejaria. Eventuais correções ou estornos deverão depender de autorização administrativa.


### ASSUNTO 8: INTEGRAÇÃO DE PAGAMENTOS E GATEWAY

O sistema deverá aceitar inicialmente PIX e Cartão de crédito. A plataforma deverá possuir uma camada de integração de pagamentos que permita trabalhar com OPÇÃO 1 — MERCADO PAGO ou OPÇÃO 2 — ASAAS. A escolha do gateway deverá ser configurável sem alterar a lógica principal do sistema.

Conceito Central do Pagamento: PEDIDO → PAGAMENTO → CONFIRMAÇÃO → EMISSÃO DO CARD. O sistema não deverá criar um Card ativo simplesmente porque o cliente iniciou o pagamento. O Card somente deverá ser considerado ativo após a confirmação efetiva do pagamento pelo gateway.

Requisitos de Integração: Criação do pedido; criação da cobrança; Pix; cartão de crédito; retorno do status do pagamento; confirmação automática; tratamento de pagamento pendente; pagamento aprovado; pagamento recusado; pagamento cancelado; estorno; chargeback, quando aplicável; webhooks/notificações do gateway; identificação única do pedido; prevenção de cobrança ou processamento duplicado.

Propriedade das Contas: As credenciais do gateway deverão pertencer à BRINDA SERRA, e não ao desenvolvedor. O desenvolvedor deverá utilizar ambiente de testes/sandbox durante o desenvolvimento e somente depois realizar a publicação em produção.


### ASSUNTO 9: ÁREA DO CLIENTE ('MINHA CONTA')

O cliente deverá possuir acesso à sua conta.

Dados Cadastrais do Cliente: Nome; CPF; E-mail e Telefone (opção de editar somente e-mail e telefone; nome e CPF ficam travados); Data do cadastro (a mesma da compra do Brinda Card).

Visualização de Passes: Cards adquiridos; status de cada Card; validade das experiências (6 meses); QR Code; experiências disponíveis; experiências utilizadas; experiências restantes; histórico de utilização com cervejarias onde o Card já foi utilizado.

Gestão de Compras para Terceiros: Lista e data de compra das experiências em seu nome e abaixo lista das experiências para terceiros – caso ele compre junto com o Brinda Card uma delas e dali uns dias resolva comprar mais uma. Quando a compra for feita para terceiros, o pagador deverá conseguir visualizar os Cards dos titulares associados à compra, conforme as regras de privacidade e acesso definidas.


### ASSUNTO 10: SAC COM INTELIGÊNCIA ARTIFICIAL E FILA HUMANA

A plataforma deverá possuir um agente de IA de atendimento, funcionando como primeira camada do SAC. O objetivo é que a cliente consiga tirar dúvidas comuns sem precisar falar diretamente com a proprietária.

Princípio do SAC com IA: A IA deverá funcionar como: PRIMEIRO ATENDIMENTO → RESOLVE O QUE É SIMPLES → ENCAMINHA O QUE É COMPLEXO. Ela não deve substituir o atendimento humano quando houver problema financeiro, contestação, estorno, fraude, erro de cadastro ou qualquer situação que necessite de decisão administrativa.

Base de Conhecimento Controlada: A IA deverá responder utilizando uma base de conhecimento controlada pela administração. A proprietária deverá conseguir atualizar informações como: perguntas frequentes; respostas; regras do Card; validade; cervejarias participantes; horários/informações fornecidas pelas cervejarias; regras comerciais; formas de pagamento; política de utilização; Termos de Uso; procedimentos de atendimento. A IA não deverá inventar regras ou informações. Quando não encontrar uma resposta segura na base de conhecimento, deverá informar que precisa de atendimento humano.

Transferência para Atendimento Humano: Quando a IA não conseguir resolver a questão, deverá encaminhar o cliente para atendimento humano. O sistema deverá registrar: nome do cliente; telefone; e-mail; assunto; pergunta realizada; conversa com a IA; data e horário; motivo do encaminhamento. Isso permitirá que a proprietária receba o atendimento já com o contexto, sem precisar perguntar tudo novamente.

Painel de Atendimento do SAC: Além do agente de IA, deverá existir uma área administrativa para acompanhamento dos atendimentos encaminhados para humanos. A proprietária deverá conseguir visualizar: atendimentos abertos; atendimentos em andamento; atendimentos resolvidos; cliente; telefone; e-mail; assunto; histórico da conversa com a IA; observações internas. O objetivo é permitir que uma única pessoa consiga administrar o atendimento sem perder o histórico.


#### Íntegra da Base de Conhecimento Oficial (Perguntas Frequentes / FAQ)


* ❓ O que é o BRINDA CARD?
👉 Um cartão virtual exclusivo que permite acesso com login e compra de experiências através do site www.brindaserra.com.br

* ❓ Como funciona?
👉 Após o primeiro cadastro do CPF e compra do cartão, ele é vitalício. As experiências selecionadas e compradas que vão gerar QR codes de uso tem validade de 6 meses, só podem ser utilizados pelo titular do CPF e mediante apresentação de documento válido. Após esse período sem utilização, não poderão mais ser resgatadas, sendo necessário uma nova compra de experiências e não do cartão em si. Não há devolução de valores para experiências não utilizadas dentro do prazo

* ❓ Qual a diferença entre BRINDA BEM E BRINDA PREMIUM?
👉 O Brinda Bem dá direito a ir em 3 cervejarias dentre as participantes no site no ato de utilização e experimentar a degustação oferecida por elas e, nas casas que há visitação da produção, fazer também o passeio guiado. O Brinda Premium dá direito a ir em 5 cervejarias dentre as participantes no site no ato de utilização e experimentar a degustação oferecida por elas e, nas casas que há visitação da produção, fazer também o passeio guiado. [Definir com eles pra depois definir na resposta do sistema]

* ❓ Posso comprar o Brinda Card e depois comprar as experiências em outro momento?
👉 Sim, pode realizar a compra do Brinda Card somente para ter acesso às experiências e sua página com login e voltar em outro momento comprar as opções que mais lhe agradar.

* ❓ Fiz a compra do Brinda Card, comprei as experiências e já utilizei. Posso continuar comprando experiências novamente?
👉 Sim, pode voltar e comprar novas experiências quantas vezes desejar sem ter que comprar o Brinda Card novamente. [Possível problema / solução: verificar com as cervejarias se depois da validação daquele QR code, numa futura compra com mesmo CPF e um novo QR code o cliente pode voltar a utilizar/degustar na mesma cervejaria desde que com um intervalo mínimo de tempo – definir com eles pra definir no sistema e nas regras de uso]

* ❓ Comprei e me arrependi, como cancelar?
👉 Caso tenha escolhido uma experiência e queira trocar por outra ou tenha se arrependido da compra, o usuário poderá cancelar a compra do cartão, desde que o pedido do cancelamento seja realizado em até 7 (sete) dias da data efetiva da compra, e constatada nenhuma utilização, em conformidade com o Art. 49 do Código de Defesa do Consumidor. O DIREITO DE ARREPENDIMENTO NÃO É APLICÁVEL no caso em que o usuário já tenha iniciado a utilização do serviço fornecido através do Brinda Card. Mesmo que esteja no prazo de 7 dias, se o usuário utilizou alguma validação, este abre mão, em pleno acordo, do direito de arrependimento, conforme dispõe o §4° do Artigo 54 do Código de Defesa do Consumidor.

* ❓ Qual a validade?
👉 A Validade do Brinda Card é vitalícia, é seu acesso à plataforma, já a validade das experiências compradas é de 6 meses a partir da data da compra.

* ❓ Onde posso utilizar?
👉 No ato da compra não é necessário escolher imediatamente os locais que quer ir e sim a quantidade de locais que quer visitar. Dentro dos 6 meses de validade pode visitar o site www.brindaserra.com.br e conferir na página quais cervejarias são participantes e quais as regras, horários de funcionamento das casas.

* ❓ Quais cervejarias participam?
👉 Todas que estiverem listadas na página de cervejarias no site www.brindaserra.com.br

* ❓ Como comprar?
👉 Faça o cadastro inicial, adquira o Brinda Card para ter seu login e acesso à plataforma de compra. Na plataforma de compra basta escolher quais experiências quer e adicionar à sua compra.

* ❓ Como pagar?
👉 O pagamento pode ser feito via PIX ou cartões

* ❓ Como funciona o Pix?
👉 No ato da compra é gerado um QR code de pagamento, após a confirmação, seu Card é liberado e receberá seu QR Code de utilização por email e na pagina de login do cliente

* ❓ Como funciona o cartão?
👉 No ato da compra é gerado um QR code de pagamento, após a confirmação, seu Card é liberado e receberá seu QR Code de utilização por email e na pagina de login do cliente

* ❓ Posso comprar para outra pessoa?
👉 Sim, é permitido comprar para terceiros desde que sejam maiores de idade e apresentem o documento original no ato de utilização. A compra para terceiros é limitada a 3 por titular pagante, basta definir que a compra é para terceiros e preencher o cadastro como responsável do pagamento.

* ❓ Como recebo meu Card?
👉 Via email e no próprio site em sua área de cliente

* ❓ Onde encontro meu QR Code?
👉 Após confirmação de compra seu QR code estará disponível em seu e-mail e em sua área de cliente

* ❓ Como utilizar o QR Code?
👉 Visite a página de cervejarias participantes próximo à data que pretende utilizar, veja as participantes e confira se é necessário agendar ou pode ir diretamente. Ao chegar ao estabelecimento, apresente seu QR Code para ser validada a utilização.

* ❓ Posso utilizar duas vezes na mesma cervejaria?
👉 Não, a degustação é uma experiência única em cada cervejaria – CADA CARD COMPRADO COM 3 OU 5, VERIFICAR COM A CERVEJARIA SE PODE VOLTAR A UTILIZAR COM NOVO CARD

* ❓ O que acontece se eu já utilizei naquela cervejaria?
👉 Não será permitido a utilização e não será descontada do seu Card como uma nova utilização.

* ❓ Quantas experiências ainda tenho?
👉 Depende do número de experiências que comprou e já utilizou. Confira em sua área de cliente fazendo login com seu CPF

* ❓ Como vejo meu histórico?
👉 Em sua área de cliente fazendo login com seu CPF

* ❓ O que acontece se meu pagamento estiver pendente?
👉 Caso o pagamento esteja pendente o QR Code para utilização não será gerado até que seja liberado o pagamento.

* ❓ Meu pagamento foi aprovado, mas não recebi o Card. O que faço?
👉 Verifique se o e-mail cadastrado está corretamente digitado e se ele não aparece em sua página de cliente dentro do site, caso não encontre, entre em contato pelo nosso SAC

* ❓ Meu QR Code não está funcionando. O que faço?
👉 Verifique se já não foram utilizadas as experiências escolhidas ou se o prazo de validade delas expirou. Caso não solucione as dúvidas, entre em contato pelo nosso SAC

* ❓ Meu Card expirou. O que acontece?
👉 O seu BRINDA CARD é vitalício, ele mantém seu cadastro como cliente ativo para que possa comprar quantas experiências quiser, mas caso tenha ultrapassado 6 meses da compra de alguma experiência que foi ou não foi utilizada, será necessária uma nova compra da experiência sem a necessidade de pagar novamente a taxa do Brinda Card.

* ❓ Quero ser vendedor. Como faço?
👉 Entre em contato pelo nosso email: brindacard@gmail.com

* ❓ Quero indicar o BRINDA CARD no meu hotel. Como faço?
👉 Entre em contato pelo nosso email: brindacard@gmail.com

* ❓ Quero ser motorista parceiro. Como faço?
👉 Entre em contato pelo nosso email: brindacard@gmail.com

* ❓ Quero ser uma cervejaria parceira. Como faço?
👉 Entre em contato pelo nosso email: brindacard@gmail.com

* ❓ Como entrar em contato com o atendimento humano?
👉 Entre em contato pelo nosso email: brindacard@gmail.com

### ASSUNTO 11: PÁGINA DE VENDAS, FLUXO DE COMPRA E CAPTAÇÃO DE LEADS

A página do BRINDA CARD deverá ser extremamente objetiva. O cliente precisa entender: O QUE É? COMO FUNCIONA? ONDE POSSO USAR? QUANTO CUSTA? QUAL A VALIDADE? Antes dos botões de compra, deverão aparecer links para a página de cervejarias participantes. Cada cervejaria poderá ser apresentada com: nome; logo/foto; localização; breve descrição da experiência; demais informações relevantes como necessidade de reserva ou não e horário de funcionamento. Depois disso, deverão aparecer claramente: COMPRAR BRINDA BEM; COMPRAR BRINDA PREMIUM. Também deverão existir: QUERO VENDER O BRINDA CARD; QUERO SER PARCEIRO CERVEJEIRO.


#### Fluxo Principal de Compra Desejado

SITE → BRINDA CARD → Visualização das cervejarias participantes → Escolha (Brinda Bem ou Brinda Premium) → COMPRAR → Perguntar: É para você ou para outra pessoa? → Cadastro do pagador → Cadastro do(s) titular(es) ONDE ENTRA O VALOR DA COMISSÃO AOS VENDEDORES SOBRE OS PRODUTOS OFERECIDOS SOMENTE VINCULANDO O CPF DO PAGADOR COM O MESMO CPF DO QR CODE GERADO SOMENTE PRA ELE.


> ⚠️ [ANOTAÇÃO ORIGINAL / ALERTA]: QUESTÃO A RESOLVER (DO RELATÓRIO): Se o titular pagador estiver comprando somente para terceiros, não gera comissão por não gerar compra de experiência para ele utilizar.

→ Campo obrigatório: PRIMEIRA COMPRA DAQUELE CPF (pode definir como campo obrigatório no momento da compra do BRINDA CARD que não será repetida. Após, quando cliente logar e quiser comprar novas experiências não será necessário responder isso) → COMO NOS CONHECEU? (Se HOTEL: selecionar hotel; Se UBER: identificar motorista; Se GOOGLE/INSTAGRAM: registrar origem; Se OUTROS: registrar origem) → Aceite obrigatório dos Termos de Uso → Pagamento: PIX ou cartão → Gateway: Mercado Pago ou Asaas → Pagamento aprovado → Geração do Card → Geração do QR Code nominal → Envio para o cliente → Card disponível na área do cliente.


#### Captação de Leads B2B

Lead Quero Vender o Brinda Card: Ao clicar em QUERO VENDER O BRINDA CARD deverá abrir um formulário simples. Campos: nome; telefone; e-mail, opcional; cidade/local; observação, opcional. O objetivo inicial é captar o interessado para contato comercial. O lead deverá aparecer no painel administrativo. Status sugeridos: Novo contato; Em contato; Aprovado; Ativo; Não interessado.

Lead Quero ser Parceiro Cervejeiro: Ao clicar em QUERO SER PARCEIRO CERVEJEIRO deverá abrir um formulário simples. Campos: nome; nome da cervejaria; telefone; e-mail, opcional; cidade; observação, opcional. O lead deverá aparecer no painel administrativo. Status sugeridos: Novo contato; Em contato; Em negociação; Aprovado; Parceiro ativo; Não aprovado.


### ASSUNTO 12: PAINEL ADMINISTRATIVO CENTRAL, HOTÉIS E RELATÓRIOS

A proprietária deverá ter acesso ao painel administrativo completo. Deverá conseguir administrar: clientes; pagadores; titulares; Cards; cervejarias; experiências; hotéis; vendedores; motoristas/Uber; vendas; pagamentos; gateway de pagamento; comissões; bônus; utilizações; validade; relatórios; leads; perguntas frequentes; base de conhecimento da IA; atendimentos encaminhados para humanos.

Gestão de Vendedores: A administração deverá conseguir: cadastrar vendedor; identificar categoria do vendedor; vincular vendedor a hotel, quando aplicável; cadastrar motorista/Uber; ativar/desativar/excluir vendedor; consultar vendas; consultar vendas por período; consultar comissão; consultar bônus; visualizar total de vendas; visualizar clientes associados às vendas; gerar relatório.

Gestão de Hotéis: Deverá existir cadastro específico para hotéis. Campos sugeridos: nome do hotel; endereço; telefone; contato responsável e função dele no hotel; vendedores vinculados; status ativo/inativo/excluir. O sistema deverá permitir que vários vendedores estejam associados ao mesmo hotel.


#### Relatórios Gerenciais por Período

Relatório de Vendas: Quantidade, valor, produto, data, forma de pagamento, status.

Relatório de Vendedores: Vendas, comissão, bônus, total a receber.

Relatório de Origem da Venda: Hotel, Uber, Google, Instagram, outros. Isso permitirá saber quais canais estão realmente trazendo clientes.

Relatório de Cervejarias: Quantidade de utilizações, clientes atendidos, experiências utilizadas, período.

Relatório de Cards: Ativos, utilizados parcialmente, esgotados, expirados.

Relatório de Auditoria de Utilização por Cervejaria: O sistema deverá permitir identificar quais Cards foram utilizados, em quais cervejarias, data e horário, quantidade de utilizações e tentativas bloqueadas por reutilização na mesma cervejaria.


### ASSUNTO 13: ARQUITETURA PARA EXPANSÃO FUTURA E GOVERNANÇA

Embora o primeiro produto seja o BRINDA CARD, a estrutura deverá permitir futuramente: CHOCO CARD – experiências com chocolate; WINE CARD – experiências com vinho; outras experiências; outros tipos de parceiros; outras cidades; outros estados. A arquitetura não deve ser criada de maneira que o sistema fique dependente exclusivamente de cervejarias. O ideal é trabalhar com conceitos gerais como: PRODUTO, EXPERIÊNCIA, PARCEIRO, CLIENTE, CARD, UTILIZAÇÃO. Isso permitirá expandir a plataforma sem reconstruí-la.

Controle, Segurança e Propriedade do Sistema

A proprietária deverá ser a administradora principal de todos os serviços utilizados no projeto. As contas principais deverão estar sob controle da proprietária: domínio; hospedagem; cloud; banco de dados; repositório de código; gateway de pagamento; conta de IA/API; e-mail; APIs; analytics; demais serviços utilizados. O desenvolvedor terá os acessos técnicos necessários.

O contrato deverá definir claramente: titularidade do código; entrega do código-fonte; acesso ao repositório; documentação; banco de dados; credenciais; backups; manutenção; segurança; propriedade dos materiais desenvolvidos; possibilidade de contratação futura de outro desenvolvedor.
