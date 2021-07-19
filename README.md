# REACT  
## Estilo de programação  

Para todos os projetos da web, iremos usar os estilos adotados no AirBnb, que é amplamente adota pela comunidade.  
Javascript:  
En => https://github.com/airbnb/javascript#objects  
Br => https://github.com/armoucar/javascript-style-guide  

React:  
En => https://github.com/airbnb/javascript/tree/master/react  
Br => https://github.com/ronal2do/airbnb-react-styleguide    
  
Logo seguindo esses padrões iremos manter um codigo limpo capaz de ser manipulado por qualquer pessoa que já leu essas documentações.  

## Estrutura das pastas em conjunto com as documentações de cima.

- src/  
--- pages/  
----- Message/  
------- MessageItem/  
------------ index.tsx  
------------ test.ts  
------------ style.css  
------- MessageList/  
------------ index.tsx  
------------ test.ts  
------------ style.css  
------- index.tsx  
------- test.ts  
------- style.css  
--- components/  
--- layouts/  
----- home/  
------- index.tsx  
------- test.ts  
------- style.css  
--- hooks/  
--- contexts/  
-----Message/  
-------index.ts  
--- helpers/  
-----FormatDate  
-------index.ts  
--- services/  
----- Message/   
------- index.ts    
------- test.ts  

<b>pages</b> deve armazenar todos os componentes relacionado aquela pagina, logo se um componente for usado apenas naquela pagina ele deve ser armazenado dentro da pasta da pagina como exemplo tem MessageList.  
<b>components</b> deve armazenar componentes singulares que são reaproveitados em diversas paginas.  
<b>layouts</b> deve armazenar todos os layouts que são em comum entre varias paginas.   
<b>context</b> deve armazenar todos os contextos API do react que serão utilizados no aplicativo, caso seja usado redux a pasta deve ser chamar store.  
<b>helpers</b> deve armazenar funções que manipulam alguma informação mas é usado em diversos componentes, como exemplo uma função para formatar data do formato Y-m-d para d-m-Y.  
<b>hooks</b> deve armazenar todos os hooks customizados feito para o sistema, logo sua logica pode ser reaproveitado para todos os componentes.    
<b>services</b> deve armazenar todas as informações para acesso a API, logo toda chamada para api deve ser feita o uso de uma função no service.  

# Git  
## Git Flow

Para todos os projetos da web, deve ser usado o git flow.
Como há otimos guias, inclusive em portugues, irei deixar o guia de como usar o git flow da Atlassian:
https://www.atlassian.com/br/git/tutorials/comparing-workflows/gitflow-workflow e um inglês que no meu ponto de vista é mais completo:
https://nvie.com/posts/a-successful-git-branching-model/

Iremos usar uma mistura dos dois mundos para ter um padrão em comum.

<b>Os nome das Branchs devem seguir esses modelos:</b>
master, develop, release/*, hotfix/* e feature/*

<b>Sempre que for feito um merge com a master deve ser usado git tag para sabermos as versões da aplicação se um dia precisar.
Logo isso se aplica em merge da dev => master e hotfix => master.</b>
exemplo: git tag -a 1.2

<b> Se for fazer um hotfix primeiro use o merge da hotfix para master e depois aplique uma tag 1.2.1 por exemplo, e DEPOIS aplique um merge da master para dev </b>

# Padrão para os commits

Traduzindo algumas partes para melhorar entendimento, caso a pessoa não saiba Inglês.

## Formato do Commit

### Padrão
<pre>
<b><a href="#types">&lt;type&gt;</a></b></font>(<b><a href="#scopes">&lt;optional scope&gt;</a></b>): <b><a href="#subject">&lt;subject&gt;</a></b>
<sub>empty separator line</sub>
<b><a href="#body">&lt;optional body&gt;</a></b>
<sub>empty separator line</sub>
<b><a href="#footer">&lt;optional footer&gt;</a></b>
</pre>

### Merge
<pre>
Merge branch '<b>&lt;branch name&gt;</b>'
</pre>
<sup>Follows default git merge message</sup>

### Revert
<pre>
Revert "<b>&lt;commit headline&gt;</b>"
<sub>empty separator line</sub>
This reverts commit <b>&lt;commit hash&gt;</b>.
<b>&lt;optinal reason&gt;</b>
</pre>
<sup>Follows default git revert message</sup>

### Types
* Alterações relevantes API
    * `feat` Commits que adiciona uma nova feature
    * `fix` Commits que corrige bugs
* `refactor` Commits para reescrita ou reestrutura do codigo sem alterar o comportamento da feature
    * `perf` Commits que são semelhantes ao refactor porém nesse caso há melhoria de perfomace(Desempenho)
* `style` Commits que não afetam o significado (white-space, formatting, missing semi-colons, etc)
* `test` Commits para adicionar ou corrigir testes automatizados
* `doc` Commits para mudança em documentação
* `build` Commits para components de "buildagem" exemplo: ci pipeline, dependencies, project version e etc...
* `ops` Commits para components operacional que envolve infraestrutura, deploy, backup, docker e etc...

### Scopes
O `escopo` fornece informações contextuais adicionais.
* É uma parte ** opcional ** do formato
* Os escopos permitidos dependem do projeto específico
* Não use identificadores de problema como escopos

### Subject
O `assunto` contém uma descrição sucinta da mudança.
* É uma parte ** obrigatória ** do formato
* Use o tempo presente imperativo: "mudança", não "mudou" nem "mudanças"
* Não coloque a primeira letra em maiúscula
* Sem ponto (.) No final

### Body
O `corpo` deve incluir a motivação para a mudança e contrastar isso com o comportamento anterior.
* É uma parte ** opcional ** do formato
* Use o tempo presente imperativo: "mudança", não "mudou" nem "mudanças"
* Este é o lugar para mencionar os identificadores de problemas e suas relações

### Footer
O `rodapé` deve conter qualquer informação sobre ** Mudanças significativas ** e também é o lugar para ** fazer referência a problemas ** aos quais este commit se refere.
* É uma parte ** opcional ** do formato
* ** opcionalmente ** referencie um problema por seu id.
* ** Breaking Changes ** deve começar com a palavra `BREAKING CHANGES:` seguida por espaço ou duas novas linhas. O resto da mensagem de confirmação é então usada para isso.

### Examples
* ```
  feat(shopping cart): add the amazing button
  ```
* ```
  feat: remove ticket list endpoint
  
  refers to JIRA-1337
  BREAKING CHANGES: ticket enpoints no longer supports list all entites.
  ```
* ```
  fix: add missing parameter to service call
  
  The error occurred because of <reasons>.
  ```
* ```
  build: release version 1.0.0
  ```
* ```
  build: update dependencies
  ```
* ```
  refactor: implement calculation method as recursion
  ```
* ```
  style: remove empty line
  ```
* ```
  revert: refactor: implement calculation method as recursion
  
  This reverts commit 221d3ec6ffeead67cee8c730c4a15cf8dc84897a.
  ```

### Reference
https://gist.github.com/qoomon/5dfcdf8eec66a051ecd85625518cfd13
