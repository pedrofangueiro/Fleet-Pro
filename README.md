# Fleet Pro

Aplicação web para conferir a frota de uma estação de rent-a-car.

## O problema

Todos os dias, as matrículas da estação são conferidas uma a uma, à mão, contra uma folha com a lista. Se falta ou sobra um carro, é preciso perceber porquê — e isso custa tempo e atenção.

## O que a app faz

O Fleet Pro recebe a lista de viaturas (PDF, Excel ou foto) e fotografias das matrículas no formato português `AA-00-AA`. Lê as matrículas com inteligência artificial e compara-as com a lista.

O resultado aparece em quatro grupos:

- **Confirmadas** — na lista e vistas nas fotos
- **Em falta** — na lista, mas não encontradas
- **Não previstas** — vistas nas fotos, mas fora da lista
- **A verificar** — leituras duvidosas, para revisão

O resultado pode ser exportado em Excel.

## Como usar

1. Carrega a lista de viaturas (PDF, Excel ou foto).
2. Adiciona as fotos das matrículas.
3. Confere. A app lê as matrículas e mostra o resultado.
4. Revisa o que estiver **a verificar** e exporta o Excel, se precisares.

A leitura por IA só funciona dentro do Claude. Fora do Claude, a interface e a comparação manual continuam disponíveis, mas as fotos não são lidas automaticamente.

## Demo

[link da demo]

A demo pede para iniciares sessão no Claude, porque a leitura das matrículas depende dessa ligação.

## Resultados do teste real

[a preencher]

## Como foi construída com IA

O Fleet Pro foi construído com o Claude (Anthropic): interface, lógica de conferência e leitura das matrículas nas fotos. A leitura por IA corre apenas no ambiente do Claude; por isso a versão completa da app está publicada como Artifact.

## Tecnologias

- HTML, CSS e JavaScript
- [pdf.js](https://mozilla.github.io/pdf.js/) — leitura de PDF
- [SheetJS](https://sheetjs.com/) — leitura e exportação de Excel

As bibliotecas estão na pasta `vendor/`. Não há servidor próprio nem passo de compilação. Os dados da sessão ficam no navegador.
