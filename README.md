# Friction Radar

PWA React + TypeScript + IndexedDB para registrar e descobrir atritos recorrentes do dia a dia.

## Stack

- React 19
- TypeScript
- Vite
- Dexie / IndexedDB (dados locais)
- Three.js (nucleo 3D do radar, carregado sob demanda)
- Framer Motion (campo persistente, transicoes espaciais, gestos)
- Fontes locais via Fontsource: Big Shoulders Display + JetBrains Mono
- Service Worker manual (offline + handler de Web Push)

## Direcao visual: Organic Signal Cartography

O app e um unico campo de radar persistente (`src/components/radar/RadarField.tsx`) que nunca e desmontado.
Cada secao e um estado desse campo: o nucleo muda de pose por aba e, com o scroll, recua ate o fim do
trilho de navegacao curvo. O nucleo e a acao de captura (toque ou segure) e se abre na `CaptureAperture`.

- `src/app` — AppShell, geometria do campo, preferencias de movimento, store sobre o Dexie
- `src/components` — campo/nucleo/contornos, navegacao curva, readout, marca
- `src/features` — home (zonas de pressao), capture (rota de sinal), signals (stream), patterns (clusters), settings (radar control)
- `src/motion` — springs, tokens e variantes compartilhadas

## Rodar

```bash
npm install
npm run dev
```

Build de producao:

```bash
npm run build
npm run preview
```

## iPhone / PWA

1. Publique em HTTPS.
2. Abra a URL no iPhone.
3. Compartilhar -> Adicionar a Tela de Inicio.
4. Deixe "Abrir como App" ativado.

O app foi pensado para safe areas, standalone mode e tela de 375x812 do iPhone 11.

## Offline-first

Os registros ficam em IndexedDB, no proprio dispositivo. Depois da primeira visita online, o Service Worker usa cache do shell e dos assets acessados para reabrir offline.

Use Ajustes -> Exportar JSON para ter backup manual dos dados.

## Notificacoes

O build inclui:

- pedido de permissao e notificacao de teste;
- Service Worker com `push` e `notificationclick`;
- suporte a badge via Badging API quando disponivel.

Para push real quando o app estiver fechado, ainda e necessario um endpoint Web Push/VAPID para enviar a mensagem ao subscription endpoint do navegador. Isso e deliberadamente opcional: o app continua 100% funcional localmente sem servidor.

## Widget de iOS

Uma PWA nao consegue instalar um WidgetKit nativo. Para widget de Home/Lock Screen, o caminho e empacotar a mesma UI com Capacitor e adicionar uma extensao WidgetKit em Swift. O banco local/sincronizacao precisaria ser compartilhado com o container nativo.

## Performance no iPhone 11

A tela 3D:

- limita `devicePixelRatio`;
- usa menos pontos/segmentos no modo leve;
- limita FPS;
- pausa quando a pagina fica escondida;
- respeita `prefers-reduced-motion`;
- pode ser desligada em Ajustes.
