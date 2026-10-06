# Friction Radar - identidade visual

## Direcao

**Industrial Signal Instrument**.

O produto deve parecer um instrumento de diagnostico, nao um app SaaS generico. A marca vive dentro da interface: reticulas, marcadores numericos, leitura de carga, vermelho como atrito e verde acido como sinal detectado.

## Assinatura

- Nome sempre aparece como `FRICTION / RADAR` ou `FRICTION RADAR`.
- Verde radar: `#D6FF3F`.
- Vermelho atrito: `#FF3D2E`.
- Fundo: `#070807`.
- Tipografia display condensada/pesada + dados em mono.
- Numeracao tecnica (`01`, `02`, `FR//05`, `LOAD 140`).
- Graficos nao usam paletas multicoloridas: sinal e atrito sao a linguagem.

## Three.js

O objeto 3D funciona como escultura de diagnostico. Ele reage a carga de atrito do dia, mas nao carrega informacao indispensavel; assim pode ser reduzido ou desligado sem comprometer a UX.

## iPhone 11

O modo leve vem ativado por padrao:

- pixel ratio limitado;
- geometria simplificada;
- menos particulas;
- FPS limitado;
- pausa quando a pagina fica oculta;
- suporte a `prefers-reduced-motion`;
- opcao para desligar o 3D.
