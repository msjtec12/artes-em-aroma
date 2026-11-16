export interface EditorialGuide {
  slug: string;
  title: string;
  subtitle: string;
  problemAddressed: string;
  targetAudience: string;
  mainAnswer: string;
  explanations: string[];
  examples: string[];
  careInstructions: string;
  relatedProductSlugs: string[];
  responsibleSource: string;
  readingTime: string;
  updatedAt: string;
}

export const EDITORIAL_GUIDES: EditorialGuide[] = [
  {
    slug: "como-escolher-essencia-para-velas",
    title: "Como escolher uma essência para velas artesanais",
    subtitle: "Critérios práticos de solubilidade, família olfativa e testes de queima.",
    problemAddressed:
      "Dificuldade em obter boa exalação de aroma (a frio e a quente) ou separação de óleo na cera vegetal.",
    targetAudience:
      "Fabricantes de velas artesanais iniciantes e pequenos produtores de home fragrance.",
    mainAnswer:
      "Para velas aromáticas, escolha sempre essências lipossolúveis (compatíveis com ceras e óleos) desenvolvidas para suportar temperaturas de fusão, realizando testes de bancada em pequenos lotes com a cera escolhida.",
    explanations: [
      "As ceras vegetais (como a cera de coco T-02 ou blends de soja) possuem base lipídica. Por isso, essências hidrossolúveis (feitas apenas para água ou álcool) não se misturam adequadamente e podem decantar no fundo do pote.",
      "A performance do aroma em uma vela depende da tríade: Cera + Essência + Calibre do Pavio. Um pavio subdimensionado gera túnel e pouca piscina de cera derretida, reduzindo a projeção do perfume.",
      "Notas cítricas são mais voláteis e oferecem frescor imediato ao abrir o pote, enquanto notas amadeiradas, âmbar e florais densos costumam apresentar maior sustentação durante a queima.",
    ],
    examples: [
      "Linha Relaxante para Quartos: Essência Lavanda Provençal em Cera Vegetal de Coco.",
      "Linha Recepção e Sala de Estar: Essência Bamboo & Chá Branco (versão lipossolúvel para velas).",
    ],
    careInstructions:
      "Respeite a temperatura de adição recomendada para a cera utilizada e aguarde o tempo de cura antes de realizar o teste de queima. Nunca adicione essência com a cera em temperatura excessivamente alta para evitar evaporação precoce das notas de saída.",
    relatedProductSlugs: [
      "cera-vegetal-coco-t02-1kg",
      "essencia-bamboo-cha-branco-100ml",
      "pavio-algodao-encerado-ilhos-20un",
    ],
    responsibleSource: "Curadoria Editorial Loja Artes em Aroma — Suzano/SP",
    readingTime: "4 min",
    updatedAt: "2026-11-16",
  },
  {
    slug: "diferencas-entre-familias-olfativas",
    title: "Diferenças entre famílias olfativas na perfumaria artesanal",
    subtitle: "Como classificar aromas florais, herbais, cítricos e amadeirados para compor coleções equilibradas.",
    problemAddressed:
      "Dúvida na hora de montar um portfólio variado de aromas que agrade diferentes perfis de clientes.",
    targetAudience:
      "Empreendedores de perfumaria artesanal, saboaria e aromatização de ambientes.",
    mainAnswer:
      "As famílias olfativas agrupam fragrâncias pelas suas notas predominantes (Cítrica, Herbal, Floral, Frutal, Amadeirada e Oriental/Adocicada), permitindo criar coleções com propostas claras para cada ambiente ou ocasião.",
    explanations: [
      "Família Cítrica e Verde: transmite limpeza, energia e leveza. Muito procurada para salas, escritórios, lavabos e uso diurno.",
      "Família Floral e Herbal: associa aconchego, serenidade e cuidado pessoal. É a favorita para sabonetes artesanais, águas de lençóis e quartos.",
      "Família Amadeirada e Âmbar: entrega sofisticação, calor e presença marcante, ideal para linhas premium de inverno ou ambientes amplos.",
    ],
    examples: [
      "Floral Herbal: Essência Lavanda Provençal.",
      "Cítrico Verde Floral: Essência Bamboo & Chá Branco.",
      "Frutal Amadeirado: Essência Flor de Figo & Âmbar.",
    ],
    careInstructions:
      "Ao avaliar várias essências seguidas, faça pausas em ambiente arejado para evitar saturação olfativa.",
    relatedProductSlugs: [
      "essencia-lavanda-100ml",
      "essencia-bamboo-cha-branco-100ml",
      "essencia-flor-de-figo-ambar-100ml",
    ],
    responsibleSource: "Curadoria Editorial Loja Artes em Aroma — Suzano/SP",
    readingTime: "4 min",
    updatedAt: "2026-11-16",
  },
  {
    slug: "materiais-basicos-para-comecar-sabonetes-artesanais",
    title: "Materiais básicos para começar a fazer sabonetes artesanais",
    subtitle: "O guia objetivo para produzir suas primeiras barras glicerinadas pelo método melt & pour.",
    problemAddressed:
      "Iniciantes que não sabem por onde começar ou compram equipamentos complexos sem necessidade inicial.",
    targetAudience:
      "Pessoas começando a produzir itens artesanais para venda, lembrancinhas ou uso próprio.",
    mainAnswer:
      "Para iniciar com segurança e baixo investimento pelo método de derreter e moldar (melt & pour), você precisa de Base Glicerinada Vegetal, essência própria para saboaria, forma de silicone e utensílios básicos de fusão e medição.",
    explanations: [
      "A Base Glicerinada Vegetal já passou pelo processo químico de saponificação. Isso significa que você não precisa manipular soda cáustica no método melt & pour, tornando o processo acessível e seguro em ateliês domésticos.",
      "A escolha entre base branca (opaca e cremosa) e base transparente (cristalina) define o visual final da barra.",
      "Após derreter suavemente sem deixar ferver, incorpora-se a essência cosmética e verte-se nas formas.",
    ],
    examples: [
      "Sabonete Botânico de Lavanda: Base Glicerinada Vegetal Branca (1 kg) + Essência Lavanda Provençal.",
    ],
    careInstructions:
      "Não deixe a base glicerinada ferver no derretimento, pois o excesso de temperatura causa perda de umidade e transpiração futura na barra.",
    relatedProductSlugs: [
      "base-glicerinada-vegetal-branca-1kg",
      "essencia-lavanda-100ml",
    ],
    responsibleSource: "Curadoria Editorial Loja Artes em Aroma — Suzano/SP",
    readingTime: "5 min",
    updatedAt: "2026-11-16",
  },
  {
    slug: "tipos-de-ceras-e-suas-caracteristicas",
    title: "Tipos de ceras para velas e suas características",
    subtitle: "Entenda quando escolher ceras para recipiente (container) ou ceras para moldes.",
    problemAddressed:
      "Escolha incorreta do tipo de cera para o recipiente ou molde desejado.",
    targetAudience: "Artesãos e fabricantes de velas aromáticas.",
    mainAnswer:
      "Ceras macias de baixo ponto de fusão (como a Cera Vegetal de Coco T-02) são formuladas para velas em potes (recipientes), enquanto velas desmoldadas exigem blends mais rígidos.",
    explanations: [
      "Velas em Pote (Container): exigem ceras com boa aderência ao vidro, queima lenta e superfície cremosa, como o blend vegetal de coco.",
      "Facilidade de Uso: ceras fornecidas em flocos ou pastilhas facilitam a pesagem em balança de precisão e derretem de forma homogênea.",
    ],
    examples: [
      "Vela em pote de vidro com tampa de madeira utilizando Cera Vegetal de Coco T-02 e Pavio de Algodão Encerado.",
    ],
    careInstructions:
      "Controle sempre a temperatura de fusão com termômetro culinário/laboratorial para preservar a estrutura cristalina da cera vegetal.",
    relatedProductSlugs: [
      "cera-vegetal-coco-t02-1kg",
      "pavio-algodao-encerado-ilhos-20un",
    ],
    responsibleSource: "Curadoria Editorial Loja Artes em Aroma — Suzano/SP",
    readingTime: "3 min",
    updatedAt: "2026-11-16",
  },
  {
    slug: "como-organizar-escolha-essencias-aromatizadores",
    title: "Como organizar a escolha de essências para aromatizadores",
    subtitle: "Dicas para difusores de varetas e home sprays com ótimo desempenho.",
    problemAddressed:
      "Dúvida sobre quais insumos combinar para produzir difusores de varetas e home sprays.",
    targetAudience: "Pequenos negócios de aromatização e artesãos.",
    mainAnswer:
      "Combine uma Base Veículo para Aromatizador de qualidade, uma essência adequada à proposta do ambiente e um frasco com varetas difusoras ou válvula spray compatível.",
    explanations: [
      "Difusor de Varetas: libera o aroma de maneira contínua e suave por capilaridade. Ideal para lavabos, quartos e recepções.",
      "Home Spray: oferece perfumação imediata no ar ou sobre cortinas e tecidos (respeitando distância segura).",
    ],
    examples: [
      "Difusor Âmbar 250 ml com Base Veículo para Aromatizador e Essência Bamboo & Chá Branco.",
    ],
    careInstructions:
      "Líquidos com base alcoólica são inflamáveis. Mantenha os difusores longe de velas acesas ou fontes de calor.",
    relatedProductSlugs: [
      "base-veiculo-aromatizador-1l",
      "frasco-vidro-ambar-250ml",
      "essencia-bamboo-cha-branco-100ml",
    ],
    responsibleSource: "Curadoria Editorial Loja Artes em Aroma — Suzano/SP",
    readingTime: "3 min",
    updatedAt: "2026-11-16",
  },
  {
    slug: "como-identificar-volume-adequado-pequenos-projetos",
    title: "Como identificar o volume adequado de insumos para pequenos projetos",
    subtitle: "Planejamento de compras inteligente para testes de bancada e primeiras encomendas.",
    problemAddressed:
      "Desperdício de matéria-prima ou falta de insumo no meio de uma encomenda artesanal.",
    targetAudience: "Artesãos iniciantes e produtores de pequenos lotes.",
    mainAnswer:
      "Para testar novas fragrâncias e validar a aceitação dos seus clientes, inicie com frascos de essência de 100 ml e pacotes de 1 kg de base ou cera; ao validar suas fragrâncias campeãs de venda, migre para volumes de 500 ml e caixas de 5 kg para otimizar o custo unitário.",
    explanations: [
      "Lote Piloto (Validação): 100 ml de essência e 1 kg de cera vegetal ou base glicerinada permitem produzir diversas unidades de teste para avaliar fixação, acabamento e receptividade.",
      "Lote de Produção (Escala Artesanal): embalagens maiores de 500 ml de essência e 5 kg de cera reduzem o custo por grama/ml sem imobilizar capital excessivo.",
    ],
    examples: [
      "Início: 1x Cera de Coco 1 kg + 1x Essência 100 ml + 1x Pacote de Pavios (20 un).",
      "Reposição de linha fixa: Caixa 5 kg de Cera de Coco + Frasco 500 ml da fragrância principal.",
    ],
    careInstructions:
      "Identifique sempre seus lotes de teste com etiqueta contendo data, nome da essência e variante utilizada.",
    relatedProductSlugs: [
      "essencia-lavanda-100ml",
      "cera-vegetal-coco-t02-1kg",
      "base-glicerinada-vegetal-branca-1kg",
    ],
    responsibleSource: "Curadoria Editorial Loja Artes em Aroma — Suzano/SP",
    readingTime: "4 min",
    updatedAt: "2026-11-16",
  },
];
