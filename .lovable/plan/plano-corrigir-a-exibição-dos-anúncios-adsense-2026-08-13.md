# Plano: corrigir a exibição dos anúncios AdSense

## Diagnóstico confirmado

- O site publicado carrega corretamente o script do AdSense com o publisher `ca-pub-3378474598402206`.
- O `ads.txt` está público e contém o mesmo publisher.
- A requisição de anúncio chega ao Google com resposta HTTP 200, mas o Google marca o resultado como `unfilled` — não entregou uma campanha para essa impressão.
- Na página inicial sem resultados, o bloco manual `7188987191` não é montado. O único elemento detectado é criado pelos anúncios automáticos, fica com tamanho `0 × 0` e termina como `unfilled`.
- Os blocos manuais atuais aparecem apenas em telas condicionais, como histórico, resultados gerados, comunidade, chat vazio, downloads e mercadinho.

## Alterações

1. **Adicionar um bloco manual elegível na página inicial**
   - Exibir uma unidade responsiva em uma posição estável abaixo da área principal de estudo, sem interromper formulário ou navegação.
   - Manter o vídeo promocional atual apenas como fallback quando o Google confirmar que não preencheu a impressão.

2. **Tornar o componente AdSense mais confiável**
   - Reservar largura e altura válidas antes de solicitar o anúncio, evitando requisições com formato `0x0`.
   - Solicitar o anúncio somente depois que o container estiver montado, visível e com largura mensurável.
   - Garantir uma única chamada ao AdSense por montagem, inclusive durante navegação interna da SPA.
   - Detectar corretamente `filled` e `unfilled`, mostrando o anúncio real no primeiro caso e o fallback no segundo.
   - Preservar os formatos normal e compacto e o comportamento responsivo em celular e desktop.

3. **Revisar os pontos existentes**
   - Confirmar que comunidade, Chat Buddy, downloads, histórico, resultados e mercadinho entregam ao Google containers com dimensões válidas.
   - Não adicionar anúncios extras nem alterar o sistema de recompensa.

4. **Validação**
   - Verificar no navegador as requisições, o `data-ad-client`, o `data-ad-slot`, as dimensões e o status final de cada bloco.
   - Testar página inicial e uma rota com anúncio compacto em desktop e mobile.
   - Confirmar que bloqueadores ou falta de inventário não quebram o layout e acionam o fallback.

## Limite externo

Esta correção fará todos os espaços manuais serem enviados corretamente e permanecerem elegíveis. Ela não consegue obrigar o Google a preencher uma impressão: se o status continuar `unfilled` depois disso, a causa restante estará na entrega/inventário da conta AdSense, e não na integração do site.