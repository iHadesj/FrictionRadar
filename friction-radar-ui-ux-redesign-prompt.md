# Prompt de alteração de UI/UX — Friction Radar

Quero que você **redesenhe e refatore a experiência visual do aplicativo Friction Radar já existente**.

Este é um trabalho de **alteração de UI/UX e motion design**, não uma reconstrução do produto do zero.

O aplicativo já funciona e possui:

- React + TypeScript + Vite;
- IndexedDB/Dexie como fonte principal de dados;
- PWA offline-first;
- Service Worker;
- Three.js;
- Framer Motion;
- captura de atritos;
- histórico de sinais;
- análise de padrões;
- configurações;
- backup JSON;
- notificações e preferências de performance.

Preserve toda essa lógica. O problema atual está na apresentação: apesar de possuir uma identidade industrial forte, a interface ainda parece um **site responsivo composto por seções, cards, faixas, grades e um bottom navigation convencional**. Também há animações simples demais, como páginas aparecendo por `opacity + translateY` e um formulário abrindo como um bottom sheet retangular.

Quero que o Friction Radar passe a parecer um **instrumento vivo de detecção de interferências**, e não um dashboard estilizado.

---

# 1. Objetivo da alteração

Transformar o Friction Radar em uma experiência:

- mais orgânica;
- mais espacial;
- mais gestual;
- menos quadrada;
- menos parecida com site;
- menos parecida com template de dashboard;
- menos reconhecível como “vibe coding”;
- mais integrada entre páginas, navegação, dados e marca;
- repleta de animações fortes e incomuns, mas naturais;
- otimizada para funcionar de forma fluida no iPhone 11.

A interface inteira deve parecer parte de um único campo de radar.

Não quero uma coleção de componentes independentes entrando na tela.

Quero que o app pareça um sistema físico contínuo, no qual:

- o radar detecta sinais;
- os sinais deformam o campo;
- padrões criam zonas de pressão;
- a captura nasce do núcleo;
- as páginas se transformam umas nas outras;
- a navegação percorre uma rota visível;
- a confirmação de uma ação retorna ao radar como um pulso.

---

# 2. Direção visual obrigatória

## Nome da direção

**Organic Signal Cartography**

## Conceito

> O atrito não é mostrado dentro de cards. Ele aparece como uma interferência que distorce um campo vivo de radar.

O design deve misturar:

- instrumento de diagnóstico;
- radar;
- cartografia de sinais;
- interferência elétrica;
- gráfico topográfico;
- interface industrial experimental;
- sistema de telemetria;
- composição editorial assimétrica.

Não deixar o produto amigável demais ou com aparência de aplicativo wellness.

Ele ainda deve parecer técnico, preciso e intenso.

O “orgânico” não significa blobs decorativos, cores pastéis, cantos arredondados por toda parte ou aparência infantil.

Neste produto, orgânico significa:

- curvas com função;
- caminhos;
- órbitas;
- ondas;
- contornos;
- campos de força;
- deformação;
- elementos conectados;
- movimento contínuo;
- assimetria controlada;
- formas que reagem ao estado dos dados.

---

# 3. Identidade que deve ser preservada

Preservar os fundamentos atuais da marca:

```txt
FRICTION / RADAR
verde radar: #D6FF3F
vermelho atrito: #FF3D2E
fundo profundo: #070807
texto principal claro
informações técnicas em monoespaçada
numeração técnica
FR//05
LOAD 140
LOCAL / READY
```

Mas evoluir a aplicação desses elementos.

O verde e o vermelho não devem ser usados apenas como cor de botão, barra ou borda.

Eles devem se comportar como matéria do sistema:

- verde = campo, sinal, varredura, atividade normal;
- vermelho = interferência, pressão, rompimento, concentração de atrito.

Criar uma escala tonal completa para fundo, campo, ruído, linhas e estados, sem transformar a interface em uma paleta multicolorida.

A marca deve aparecer em toda a experiência, não apenas no logo.

A assinatura reconhecível do produto será:

> Um campo de radar assimétrico que se deforma conforme os atritos registrados.

Mesmo sem logo, uma captura de tela deve continuar parecendo Friction Radar.

---

# 4. O que deve ser preservado tecnicamente

Não remover nem quebrar:

- banco IndexedDB/Dexie;
- registros existentes do usuário;
- tipos de dados atuais;
- lógica de analytics;
- cálculo de carga, minutos, hotspots e categorias;
- exportação/importação JSON;
- preferências de movimento, 3D e modo leve;
- notificações;
- Service Worker;
- manifest da PWA;
- funcionamento offline;
- safe areas do iPhone;
- fallback sem Three.js;
- suporte a `prefers-reduced-motion`.

Não trocar IndexedDB por estado volátil.

Não alterar o schema de forma incompatível e não apagar dados existentes.

Pode refatorar componentes e estilos, mas mantenha os contratos de persistência e a lógica de domínio.

---

# 5. Diagnóstico do layout atual

O redesign deve eliminar estes padrões da versão atual:

- `metric-strip` com três caixas lado a lado;
- listas formadas por `signal-card` retangulares;
- `pattern-grid` composta por cards;
- configurações dentro de vários `settings-card`;
- radar preso dentro de um frame retangular;
- botão primário ocupando uma faixa retangular completa;
- bottom navigation tradicional com quatro colunas;
- botão flutuante quadrado/vermelho com “+”;
- bottom sheet retangular para registrar atrito;
- toast retangular surgindo na parte inferior;
- transições de página apenas com fade e pequeno movimento vertical;
- muitos divisores horizontais criando aparência de página web;
- excesso de bordas retas delimitando tudo.

Não tente resolver apenas adicionando `border-radius`.

O layout precisa ser recomposto.

---

# 6. Princípio estrutural: um único campo persistente

Criar um componente visual persistente chamado conceitualmente de:

```txt
RadarField
```

Ele deve continuar existindo durante a navegação e conectar todas as seções.

O background, o núcleo do radar, os ruídos, as linhas e o indicador de navegação não devem ser desmontados e recriados a cada troca de página.

As telas devem parecer diferentes estados do mesmo sistema.

Estrutura conceitual:

```txt
AppShell
├── PersistentRadarField
│   ├── ThreeRadarCore
│   ├── SVGContours
│   ├── SignalNoise
│   ├── ScanPath
│   └── DynamicAnnotations
├── TopSystemLayer
├── ActiveExperience
├── CurvedNavigation
└── CaptureAperture
```

Use camadas DOM + SVG + Three.js de forma coordenada.

Three.js não deve parecer um widget encaixado dentro da página.

Ele deve parecer parte do ambiente.

---

# 7. Home / Radar

A Home deve deixar de ser uma sequência vertical de:

```txt
título
radar
botão
métricas
insight
lista
```

Criar uma composição espacial contínua.

## Núcleo do radar

O núcleo deve ocupar a região dominante da primeira tela e parecer integrado ao background.

Ele pode ser parcialmente cortado pelas bordas do viewport.

Não colocá-lo dentro de um retângulo.

O núcleo deve responder a:

- quantidade de sinais de hoje;
- carga do dia;
- intensidade média;
- existência de hotspots;
- interação do usuário;
- movimento da interface.

Os dados não essenciais podem ser visuais, mas as informações importantes também precisam existir em texto acessível.

## Título

`ENCONTRE O ATRITO` pode continuar existindo, mas deve participar da composição.

Exemplos:

- texto atravessando parcialmente o campo;
- palavra `ATRITO` sendo cortada por uma linha de varredura;
- letras reagindo levemente ao scanner;
- título deslocado assimetricamente em relação ao radar.

Não centralizar tudo.

## Métricas

Remover o `metric-strip`.

Transformar as métricas em **marcadores orbitais** ao redor do núcleo.

Exemplo:

```txt
SINAIS HOJE // 05
MINUTOS // 38
LOAD // 142
```

Cada métrica pode estar ligada ao radar por uma linha fina, curva ou “leader line”.

Ao tocar, ela deve ganhar contexto sem abrir um card modal genérico.

Os marcadores devem continuar legíveis e ter área de toque adequada.

## Insight

O insight principal deve aparecer como uma anotação técnica ligada a uma parte específica do campo.

Não usar um painel retangular separado.

Exemplo:

```txt
01 // READOUT
└── seu maior hotspot hoje foi...
```

A linha pode nascer de uma zona vermelha do radar e conduzir o olhar até o texto.

## Hotspots

Os hotspots não devem ser apenas uma lista com barras.

Representá-los como zonas de pressão, pequenas crateras, nós ou deformações no campo.

Cada hotspot precisa apresentar:

- nome;
- recorrência;
- minutos;
- carga.

Ao tocar em um hotspot, ele se expande com `layoutId` e leva para a visão de padrões sem desaparecer e reaparecer como outro componente.

---

# 8. A ação de captura deve nascer do radar

Não usar um botão flutuante separado com `+` e não abrir um bottom sheet retangular convencional.

O núcleo do radar deve ser a principal ação de captura.

Pode existir um pequeno rótulo:

```txt
HOLD TO CAPTURE
REGISTRAR ATRITO
```

## Interação desejada

Ao tocar ou segurar o núcleo:

1. a varredura desacelera;
2. o centro sofre uma pequena tensão/deformação;
3. o campo ao redor é puxado para dentro;
4. o núcleo se expande usando `layoutId`;
5. ele se transforma na superfície de captura;
6. os campos do formulário surgem a partir de caminhos, não de cards.

Nome conceitual do componente:

```txt
CaptureAperture
```

A experiência pode ocupar quase toda a tela, mas deve manter conexão visual com o radar anterior.

## Formulário

Não empilhar todos os inputs dentro de uma caixa.

Estruturar o formulário como uma rota de sinal:

```txt
ATRITO
   ↓
CONTEXTO
   ↓
INTENSIDADE
   ↓
TEMPO
   ↓
NOTA
```

Os elementos podem se distribuir ao longo de uma curva ou trilha vertical assimétrica.

O título do atrito é o elemento principal.

Categorias e contextos podem ser nós que percorrem uma órbita curta ou faixa curva.

Eles precisam continuar sendo botões HTML acessíveis.

A intensidade pode ser representada por uma onda que aumenta em amplitude, mantendo controles de 1 a 5 acessíveis.

Os minutos podem ser ajustados por drag horizontal com fallback de input numérico.

## Salvar

Não usar apenas um botão retangular “MARCAR NO RADAR”.

Criar uma ação que pareça enviar o sinal ao sistema.

Exemplo:

- arrastar um marcador até o núcleo;
- pressionar um arco de transmissão;
- tocar em `TRANSMIT SIGNAL` integrado à trilha.

Mesmo com uma interação visual diferente, deve haver um botão semântico e claro.

## Confirmação

Ao salvar:

1. o formulário se contrai;
2. um ponto vermelho percorre o caminho inverso;
3. entra no radar;
4. gera uma onda concêntrica;
5. altera temporariamente a deformação do campo;
6. o novo sinal passa a existir na Home.

Não mostrar um toast retangular genérico.

A confirmação pode aparecer como uma pequena leitura próxima ao núcleo:

```txt
SIGNAL CAPTURED // FR-028
```

Depois ela se dissolve na interface.

---

# 9. Tela de sinais

A tela de sinais não deve ser uma lista de cards empilhados.

Transformá-la em um **Signal Stream**.

## Conceito

Cada atrito é um ponto capturado dentro de uma trilha contínua.

Pode lembrar:

- sismógrafo;
- trilha de telemetria;
- mapa de sinais;
- linha de eventos;
- rota topográfica.

Estrutura possível:

```txt
          ● sinal atual
        ╱
──────●─────────
    ╱
  ● sinal anterior
```

A linha pode atravessar a tela de maneira sinuosa.

Cada ponto varia em:

- tamanho pela intensidade;
- halo pela carga;
- densidade pela recorrência;
- deslocamento pelos minutos perdidos.

Ao tocar em um ponto:

- o caminho ao redor se abre;
- os detalhes se revelam ao lado;
- os pontos vizinhos se afastam;
- o item não vira simplesmente um card por cima.

Use `layout`, `layoutId`, `AnimatePresence` e springs para redistribuir os elementos.

## Exclusão

No gesto lateral, o sinal pode:

- deformar;
- se desprender da linha;
- ser arrastado para uma zona de descarte;
- se dissolver em ruído.

Também oferecer uma ação acessível por botão/menu, não depender apenas do gesto.

## Agrupamento temporal

Datas podem aparecer como nós maiores no caminho.

Evitar headers de tabela e caixas por dia.

---

# 10. Tela de padrões

A tela de padrões deve abandonar o grid de cards.

Criar um **Pattern Field**.

## Visualização principal

Hotspots devem formar clusters conectados.

Quanto maior o load:

- maior a massa do cluster;
- mais forte a deformação;
- maior a presença do vermelho;
- menor a distância do núcleo central;
- maior o movimento interno.

Cada cluster precisa continuar informando:

- título;
- número de ocorrências;
- minutos;
- carga.

## Interação

Ao tocar em um cluster:

- ele cresce;
- passa para o centro;
- os demais se afastam;
- abre detalhes e recomendações;
- mantém continuidade com o hotspot visto na Home.

Use o mesmo `layoutId` entre Home e Patterns.

## Categorias

“Load by area” não deve ser uma lista de barras.

Pode se tornar:

- anéis de contorno;
- faixas topográficas;
- bandas curvas;
- linhas de densidade;
- regiões conectadas.

Use rótulos claros e valores numéricos para não depender somente da forma.

## Regra de recorrência

A mensagem:

```txt
SE REPETIU 3X, NÃO É AZAR.
```

pode continuar, mas deve estar integrada como uma grande anotação editorial no campo, não dentro de um card vermelho.

O texto pode ser atravessado por sinais recorrentes ou revelado conforme os clusters se alinham.

---

# 11. Configurações

Não organizar configurações em uma pilha de cards.

Criar uma área chamada conceitualmente de:

```txt
RADAR CONTROL
```

Ela deve parecer uma camada de calibração do instrumento.

Agrupar seções por linhas, trilhas e níveis de profundidade, sem colocar cada uma dentro de um retângulo.

## Controles

Substituir toggles quadrados genéricos por controles próprios:

- trilho de sinal;
- nó que percorre uma linha;
- dial simplificado;
- seletor de duas posições integrado a uma curva.

Os controles continuam sendo `input` ou `button` acessíveis.

Manter:

- elemento 3D;
- modo leve;
- reduzir movimento;
- teste de notificação;
- ativar push;
- exportar JSON;
- importar JSON;
- estado PWA.

Ações de backup podem parecer comandos do sistema:

```txt
> EXPORT LOCAL ARCHIVE
> RESTORE LOCAL ARCHIVE
```

Mas devem continuar claras para usuários não técnicos.

---

# 12. Navegação

Remover a bottom bar tradicional dividida em quatro colunas.

Criar uma **Curved Navigation Rail**.

## Conceito

Uma linha curva acompanha a parte inferior da tela, respeitando a safe area do iPhone.

Quatro nós ficam posicionados ao longo da linha:

```txt
RADAR
SINAIS
PADRÕES
CONTROLE
```

O indicador ativo se desloca fisicamente ao longo da curva.

A curva pode se deformar levemente quando o usuário muda de seção.

Cada nó precisa ter pelo menos 44×44px de área interativa.

Não depender de hover.

## Transição de páginas

Não desmontar uma página, fazer fade e depois mostrar outra.

Ao mudar de seção:

- o campo persistente se reposiciona;
- o núcleo muda de escala;
- o indicador percorre a linha da navegação;
- rótulos e visualizações antigas se afastam;
- os novos elementos nascem de pontos já existentes.

Evitar `AnimatePresence mode="wait"` para uma simples troca completa de tela.

Permitir sobreposição coordenada durante a transformação.

---

# 13. Linguagem de motion

Quero muitas animações, mas não animação gratuita.

Defina uma linguagem de motion com quatro níveis.

## 13.1 Movimento ambiente

Movimento quase imperceptível:

- radar respirando;
- ruído deslocando lentamente;
- linhas orbitais com drift mínimo;
- pequenas oscilações dos clusters.

Não deixar dezenas de loops chamativos rodando simultaneamente.

## 13.2 Movimento de estado

Mudanças causadas por dados:

- novo sinal gera pulso;
- carga alta comprime o campo;
- hotspot recorrente cria interferência;
- online/offline altera frequência do LED/sinal;
- redução de movimento estabiliza tudo.

## 13.3 Movimento de navegação

Transformações espaciais entre seções:

- shared layout transitions;
- expansão do núcleo;
- clusters mudando de posição;
- paths desenhados e apagados;
- máscaras revelando conteúdo;
- elementos preservando origem e destino.

## 13.4 Movimento gestual

O objeto acompanha diretamente o dedo:

- drag com resistência;
- elasticidade controlada;
- velocidade influenciando o retorno;
- elementos vizinhos reagindo ao deslocamento;
- feedback imediato ao pressionar.

---

# 14. Animações que não devem ser usadas como padrão

Evitar usar repetidamente:

```ts
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
```

Evitar:

- cards aparecendo um por um com stagger;
- pop de escala em todo componente;
- bounce exagerado;
- fade genérico em toda troca de rota;
- bottom sheet comum;
- modal central com backdrop e card;
- animação decorativa sem ligação com a ação;
- cada componente animando isoladamente.

`opacity` e `transform` podem ser usados, mas como parte de uma coreografia, não como a ideia inteira.

---

# 15. Técnicas de Framer Motion obrigatórias

Usar Framer Motion estruturalmente.

Aplicar, quando fizer sentido:

```txt
layout
layoutId
AnimatePresence
useMotionValue
useSpring
useTransform
useScroll
useVelocity
useMotionValueEvent
drag
dragElastic
dragConstraints
motion.path
pathLength
```

Criar tokens de movimento centralizados.

Exemplo conceitual:

```ts
export const springs = {
  field: { type: 'spring', stiffness: 110, damping: 24, mass: 0.9 },
  gesture: { type: 'spring', stiffness: 260, damping: 28, mass: 0.7 },
  settle: { type: 'spring', stiffness: 170, damping: 32, mass: 1.1 }
}
```

Não copiar obrigatoriamente esses valores; calibrar em aparelho real.

A sensação deve ser:

- precisa;
- com inércia curta;
- sem bounce de brinquedo;
- rápida o bastante para uso diário;
- natural o bastante para parecer física.

---

# 16. Entrada do aplicativo

Não fazer uma intro longa.

Na primeira abertura da sessão:

1. um pequeno ponto verde aparece;
2. ele inicia uma varredura curta;
3. a linha desenha parte do campo;
4. o nome `FRICTION / RADAR` é revelado por máscara;
5. o núcleo se estabiliza;
6. os dados ocupam suas posições orbitais.

Duração total recomendada: aproximadamente 650–900ms.

Nas aberturas seguintes da mesma sessão, usar uma versão muito mais curta.

Não bloquear a interação por vários segundos.

Não repetir uma intro cinematográfica completa toda vez que o usuário volta da multitarefa.

---

# 17. Tipografia

A tipografia atual baseada em `Impact` transmite peso, mas pode parecer improvisada ou genérica.

Substituir por uma dupla tipográfica com mais identidade:

- uma fonte display condensada, agressiva e técnica;
- uma fonte mono legível para dados.

As fontes devem ser empacotadas localmente para manter o offline-first.

Não depender de Google Fonts em tempo de execução.

Não usar Inter, Roboto ou Arial como identidade principal.

Usar tipografia como forma:

- títulos parcialmente cortados;
- números grandes como parte do campo;
- alinhamentos assimétricos;
- rótulos seguindo linhas;
- contraste entre dados mínimos e títulos massivos.

Não comprometer legibilidade.

---

# 18. Formas e composição

Não substituir retângulos duros por dezenas de pills.

Evitar excesso de:

- bordas arredondadas uniformes;
- cápsulas;
- blobs gratuitos;
- glassmorphism;
- blur pesado;
- sombras SaaS;
- caixas translúcidas.

Usar:

- SVGs próprios;
- máscaras;
- linhas curvas;
- círculos incompletos;
- arcos;
- contornos topográficos;
- espaços negativos;
- sobreposição;
- formas assimétricas;
- recortes com propósito;
- pseudo-elementos como extensões de paths.

O conteúdo pode aparecer diretamente no fundo quando não precisa de container.

Quando precisar de separação, usar alinhamento, espaço, trajetória e contraste antes de adicionar uma caixa.

---

# 19. Three.js

Manter Three.js, mas integrá-lo melhor.

O `RadarScene` atual não deve continuar parecendo uma animação colocada dentro de um `radar-frame` retangular.

Refatorar para um núcleo 3D integrado ao campo.

Pode continuar usando geometria wireframe, anéis e scanner, porém:

- o canvas deve se misturar ao layout;
- anotações DOM devem parecer presas ao objeto;
- intensidade deve deformar a geometria;
- carga deve influenciar rotação, compressão e ruído;
- a abertura de captura deve transformar o mesmo núcleo;
- o scroll pode deslocar suavemente a câmera;
- a navegação pode mudar o enquadramento, não recriar toda a cena.

Não usar Three.js em todas as páginas como múltiplos canvases.

Preferir um canvas persistente quando viável.

## Performance obrigatória

Para iPhone 11:

- limitar DPR;
- manter modo leve ativo por padrão;
- limitar FPS quando apropriado;
- pausar quando `document.hidden`;
- reduzir partículas;
- evitar post-processing pesado;
- evitar shaders complexos sem necessidade;
- lazy-load de Three.js quando possível;
- desmontar listeners corretamente;
- usar ResizeObserver com cuidado;
- ter fallback CSS/SVG;
- não deixar o canvas impedir scroll ou toque.

Three.js nunca deve conter informação indispensável.

---

# 20. Scroll

O scroll deve continuar nativo.

Não implementar scroll-jacking.

Usar `useScroll` apenas para criar respostas naturais:

- núcleo reduzindo e se deslocando;
- título saindo da frente do campo;
- anotações mudando de profundidade;
- linhas se estendendo;
- indicadores fixando temporariamente;
- header compactando.

Evitar grandes parallax que causem enjoo ou prejudiquem leitura.

---

# 21. Microinterações

Adicionar microinterações específicas à marca.

Exemplos:

## Ao tocar no radar

- scanner converge para o ponto do toque;
- núcleo responde com uma compressão curta;
- pequena leitura técnica aparece.

## Ao selecionar intensidade

- a amplitude de uma onda aumenta;
- o vermelho ocupa mais espaço;
- o feedback acompanha o dedo.

## Ao alterar minutos

- um arco temporal cresce ou retrai;
- o valor se move ao longo dele.

## Ao selecionar categoria

- o nó escolhido entra na rota principal;
- os outros se redistribuem.

## Ao abrir um sinal

- o caminho se separa e cria espaço;
- o detalhe emerge da própria linha.

## Ao excluir

- o sinal perde conexão;
- desfaz-se em partículas/ruído leve;
- a trilha se recompõe.

## Ao exportar backup

- uma linha percorre os registros;
- conclui em `ARCHIVE READY`.

Não exagerar na duração.

---

# 22. Feedback háptico

Em navegadores compatíveis, usar `navigator.vibrate()` de forma muito moderada e somente quando permitido.

Exemplos:

- captura concluída;
- mudança de intensidade;
- encaixe de gesto;
- exclusão confirmada.

Não depender do háptico para entendimento.

Não vibrar em todo toque.

---

# 23. Mobile-first e iPhone 11

O alvo principal é o iPhone 11 instalado como PWA.

Projetar primeiro para:

```txt
414 × 896 CSS px
portrait
uso com uma mão
```

Também testar:

```txt
375px
390px
430px
768px
1024px
1440px+
```

Respeitar:

```css
env(safe-area-inset-top)
env(safe-area-inset-bottom)
```

Os controles principais precisam estar acessíveis com o polegar.

A navegação curva não pode colocar ações importantes em regiões difíceis de alcançar.

Gestos devem possuir alternativas por toque.

Nenhuma função pode depender de hover.

---

# 24. Performance de animação

Quero muitas animações, mas performance é critério de aceite.

Priorizar:

```txt
transform
opacity
SVG pathLength
motion values
CSS variables animadas por transform
```

Usar com moderação:

```txt
clip-path
mask
filter
blur
```

Evitar animações contínuas de:

```txt
width
height
top
left
box-shadow pesado
filter blur pesado
background-position em áreas enormes
```

Não aplicar `will-change` globalmente.

Usar apenas em elementos que realmente animam.

Não manter listeners ou requestAnimationFrame desnecessários fora da tela.

Meta: manter sensação próxima de 60 FPS no iPhone 11 e degradar com elegância no modo leve.

---

# 25. Reduced motion

`prefers-reduced-motion` e a preferência interna do app precisam continuar funcionando.

No modo reduzido:

- remover rotações contínuas;
- reduzir deformações;
- eliminar parallax;
- trocar morphs por mudanças imediatas ou dissoluções curtas;
- manter feedback de estado;
- preservar toda a informação;
- manter layout e navegação utilizáveis.

Não simplesmente desativar todos os estilos.

---

# 26. Acessibilidade

Apesar do visual experimental:

- usar HTML semântico;
- todos os controles devem ser alcançáveis por teclado;
- manter focus states visíveis;
- botões precisam ser botões reais;
- inputs precisam de labels;
- gestos devem ter alternativa;
- touch target mínimo de 44×44px;
- texto deve manter contraste adequado;
- não usar somente cor para indicar intensidade;
- manter leitura por screen reader;
- dialogs devem tratar foco e Escape;
- não esconder informação essencial dentro do canvas.

---

# 27. Arquitetura sugerida de componentes

Refatorar a estrutura atual para algo próximo de:

```txt
src/
  app/
    AppShell.tsx
    MotionProvider.tsx

  components/
    brand/
      BrandMark.tsx
      SystemStatus.tsx

    radar/
      RadarField.tsx
      RadarCore.tsx
      RadarAnnotations.tsx
      RadarContours.tsx
      RadarMetricNode.tsx
      RadarScene.tsx

    navigation/
      CurvedNavigation.tsx
      NavigationPath.tsx

    feedback/
      SignalPulse.tsx
      SystemReadout.tsx

  features/
    capture/
      CaptureAperture.tsx
      SignalRouteForm.tsx
      IntensityWave.tsx
      TimeArc.tsx

    signals/
      SignalStream.tsx
      SignalNode.tsx
      SignalDetails.tsx

    patterns/
      PatternField.tsx
      HotspotCluster.tsx
      CategoryContours.tsx

    settings/
      RadarControl.tsx
      SignalToggle.tsx
      ArchiveControls.tsx

  motion/
    springs.ts
    transitions.ts
    motionTokens.ts
    useMotionPreferences.ts

  styles/
    tokens.css
    global.css
```

Essa estrutura é uma referência, não uma obrigação absoluta.

O importante é evitar continuar concentrando toda a experiência dentro de um único `App.tsx` muito grande.

---

# 28. Estratégia de migração

Executar a alteração em etapas sem quebrar o produto.

## Etapa 1 — auditoria

- mapear comportamento atual;
- confirmar schema do Dexie;
- confirmar funcionalidades das quatro seções;
- identificar componentes que podem ser preservados;
- registrar screenshots do antes.

## Etapa 2 — fundação

- separar tokens visuais;
- criar tokens de motion;
- criar `MotionProvider`;
- implementar controle central de reduced motion e low power;
- construir o campo persistente.

## Etapa 3 — Home

- remover radar retangular;
- criar núcleo integrado;
- converter métricas em nós;
- converter insight em anotação;
- converter hotspots em zonas do campo.

## Etapa 4 — captura

- substituir botão flutuante e bottom sheet;
- implementar `CaptureAperture`;
- criar transição compartilhada a partir do núcleo;
- implementar animação de transmissão do sinal.

## Etapa 5 — páginas secundárias

- criar Signal Stream;
- criar Pattern Field;
- criar Radar Control;
- implementar navegação curva.

## Etapa 6 — Three.js

- integrar o canvas persistente;
- conectar deformação aos dados;
- otimizar para modo leve.

## Etapa 7 — QA

- testar offline;
- testar persistência;
- testar PWA standalone;
- testar import/export;
- testar notificações;
- testar iPhone 11;
- testar reduced motion;
- testar teclado e screen reader;
- testar desempenho.

---

# 29. O que não deve ser feito

Não criar:

- dashboard SaaS;
- bento grid;
- layout ShadCN padrão;
- sequência de cards arredondados;
- cards com gradiente e glassmorphism;
- navbar comum com quatro ícones igualmente espaçados;
- formulário em modal central;
- bottom sheet genérico;
- vários popups;
- página que parece landing page;
- hero + seção + seção + seção;
- vários retângulos com borda neon;
- partículas aleatórias apenas para parecer futurista;
- animações iguais em todos os componentes;
- clone do Linear;
- clone de painel cyberpunk genérico;
- excesso de glow;
- excesso de ruído que prejudique leitura;
- fonte Impact como solução final;
- interface que perde personalidade quando Three.js está desligado.

---

# 30. Critérios de aceite visual

O redesign só está pronto quando:

- a Home não parece uma página web composta por seções;
- o radar não está preso dentro de um retângulo;
- as métricas não estão em uma faixa de três cards;
- os sinais não são uma lista de cards;
- os padrões não são um grid de cards;
- as configurações não são uma pilha de cards;
- a navegação não parece uma bottom bar convencional;
- a captura não abre como bottom sheet convencional;
- as transições possuem origem e destino visíveis;
- os elementos se transformam entre telas;
- a interface parece uma única superfície contínua;
- a marca continua reconhecível sem o logo;
- o design continua forte com Three.js desligado;
- a versão reduzida continua clara;
- o app permanece confortável no iPhone 11;
- nenhuma animação importante trava o scroll;
- o produto parece um instrumento, não um site.

---

# 31. Critérios de aceite funcional

Além do visual, confirmar que:

- registros antigos continuam visíveis;
- adicionar atrito funciona;
- excluir atrito funciona;
- analytics continuam corretos;
- hotspots continuam corretos;
- filtros e categorias continuam corretos;
- backup exporta;
- backup importa;
- preferências persistem;
- notificações continuam acessíveis;
- o app abre offline;
- o service worker continua funcionando;
- a PWA continua instalável;
- não existem erros de console;
- não existem vazamentos de listeners ou animation frames;
- o bundle continua razoável;
- a aplicação continua usável sem o canvas 3D.

---

# 32. Entrega esperada

Antes de alterar o código, apresente brevemente:

1. diagnóstico da UI atual;
2. direção visual escolhida;
3. mapa de transformações entre telas;
4. linguagem de motion;
5. componentes que serão refatorados;
6. riscos de performance e mitigação.

Depois implemente a alteração completa.

Ao finalizar, entregue:

- resumo das mudanças;
- estrutura final dos componentes;
- lista de arquivos alterados;
- decisões de motion;
- decisões de performance;
- checklist de PWA/offline;
- checklist de acessibilidade;
- pontos que precisam de teste em iPhone real.

Não pare em wireframe ou proposta conceitual.

Implemente o redesign funcional no projeto React existente.

---

# Resultado desejado

O Friction Radar deve deixar de parecer:

> um dashboard escuro com radar, cards e animações adicionadas.

E passar a parecer:

> um campo vivo de detecção, no qual todo atrito registrado deixa uma deformação visível e toda interação percorre o mesmo sistema físico.

A experiência deve ser intensa, memorável e animada, mas ainda rápida o suficiente para ser usada várias vezes por dia.
