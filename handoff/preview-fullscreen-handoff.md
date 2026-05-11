# Handoff: Preview Fullscreen do Case no Portfolio

## Objetivo

Exibir este projeto de cliente dentro da pagina de cases de sucesso do portfolio como uma experiencia fullscreen interativa, com comportamento real do site: animacoes, cliques, navegacao, scroll, responsividade e interacao completa em desktop e mobile.

Nao deve parecer um link comum abrindo outro site. A experiencia deve parecer uma camada premium do proprio portfolio, com botao de fechar `X` e retorno ao case.

## O Que Entregar ao Dev do Portfolio

Enviar exatamente estes itens:

1. O bundle completo do projeto em pasta ou zip.
2. Este arquivo de handoff.
3. O nome do projeto/case que deve aparecer no viewer.
4. A frase curta de apoio opcional para o header do viewer.
5. O comportamento desejado:
   - abrir em tela cheia
   - fechar no `X`
   - fechar com `ESC` no desktop
   - bloquear o scroll do portfolio enquanto o viewer estiver aberto
   - manter o usuario na pagina de cases ao fechar

## Arquivo de Entrega Gerado

Foi criada uma copia completa do projeto atual nestes caminhos:

- Pasta: `C:\Users\arthu\Website 3D - Arquitetura - entrega-20260511-150302`
- Zip: `C:\Users\arthu\Website 3D - Arquitetura - entrega-20260511-150302.zip`

Essa copia ja serve como bundle de entrega para o outro dev.

## Estrutura Recomendada no Portfolio

Publicar o projeto em uma subpasta do mesmo dominio do portfolio, por exemplo:

```text
/case-previews/aurelian-cliente/
  index.html
  css/
  js/
  frames/
  ...
```

Nao transformar o projeto em um unico arquivo HTML. Manter a estrutura estatica com caminhos relativos intactos.

## Solucao Tecnica Recomendada

Implementar um `viewer fullscreen` no portfolio que abre um `iframe` ocupando praticamente toda a tela.

Fluxo:

1. Usuario clica no case.
2. O portfolio abre um overlay fullscreen.
3. Esse overlay renderiza um header minimo com:
   - nome do projeto
   - botao `X`
4. Abaixo do header, um `iframe` ocupa o restante da viewport.
5. O `iframe` carrega a URL publicada do projeto.
6. Ao fechar, o usuario volta para a pagina de cases no mesmo contexto.

## URL Recomendada do Iframe

```text
/case-previews/aurelian-cliente/index.html?embed=1
```

O parametro `embed=1` e opcional, mas recomendado para futuras adaptacoes de modo embed.

## O Que o Dev do Portfolio Precisa Fazer

### 1. Publicar o bundle

- Receber a pasta/zip do projeto.
- Extrair e publicar o conteudo em uma subpasta do dominio do portfolio.
- Garantir que todos os assets continuem acessiveis por caminhos relativos.

### 2. Criar o viewer fullscreen

Implementar uma camada fullscreen com:

- `position: fixed`
- `inset: 0`
- `z-index` alto
- fundo escuro ou neutro
- header superior discreto
- botao de fechar
- area principal com iframe

### 3. Comportamento do viewer

- Abrir somente ao clicar no case.
- Criar ou carregar o `iframe` somente na abertura.
- Bloquear o scroll do `body` quando aberto.
- Fechar ao clicar no `X`.
- Fechar com tecla `ESC` no desktop.
- Restaurar o scroll do portfolio ao fechar.
- Se possivel, integrar com `history.pushState` para que o botao voltar do navegador feche o viewer antes de sair da pagina.

### 4. Responsividade

- O viewer deve funcionar bem em desktop e mobile.
- Em mobile, respeitar safe area do iPhone/Android.
- O botao `X` deve permanecer visivel e clicavel em qualquer viewport.
- O iframe deve ocupar toda a area util abaixo do header.

### 5. Performance

- Nao preloadar esse projeto no carregamento inicial da pagina de portfolio.
- Carregar o iframe apenas quando o usuario abrir o case.
- Exibir um loading elegante ate o iframe estar pronto.

## Requisitos Visuais do Viewer

- Nao parecer modal pequeno.
- Nao parecer popup simples.
- Nao mostrar moldura de navegador.
- Deve parecer uma experiencia premium do proprio portfolio.
- O foco principal e a visualizacao detalhada do site do cliente.

## Opcional Recomendado

Se quiser elevar a integracao:

1. Criar um modo embed no projeto com `?embed=1`.
2. Nesse modo, o projeto pode:
   - ajustar detalhes de UX se necessario
   - enviar `postMessage` ao portfolio quando terminar de carregar
3. O portfolio pode ouvir esse evento e remover o loader.

Exemplo de evento:

```js
window.parent.postMessage({ type: 'case-preview-ready' }, '*');
```

## Critérios de Aceite

O trabalho esta correto quando:

1. O usuario clica no case e abre uma visualizacao fullscreen.
2. O projeto roda com interacao real.
3. O `X` fecha imediatamente e devolve o usuario ao portfolio.
4. O viewer funciona bem no celular e no desktop.
5. O usuario nao sente que saiu do portfolio para um link externo comum.

## Mensagem Curta Para Enviar ao Dev

```text
Preciso que voce implemente um viewer fullscreen interativo dentro da minha pagina de cases de sucesso.

Vou te enviar um bundle estatico completo de um projeto de cliente. Esse projeto precisa ser publicado em uma subpasta do meu dominio e exibido dentro de um overlay fullscreen com iframe, header minimo e botao X para fechar.

O usuario deve conseguir interagir com tudo: animacoes, scroll, navegacao, cliques e responsividade em desktop e mobile.

Nao quero um modal pequeno. Quero uma experiencia praticamente em tela cheia, premium, integrada ao portfolio. Ao fechar, o usuario precisa voltar ao case sem perder o contexto.

Use o arquivo de handoff enviado junto como especificacao principal.
```
