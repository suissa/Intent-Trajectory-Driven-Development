# Intent Trajectory Driven Development

Esse é o documento que estou fazendo depois que percebi a forma que comecei esse módulo vertical, praticamente o inverso do
que fiz nesses meus 24 anos de profissão como DevWeb FullStack.

> Posso definir 2 categorias das formas que eu usava: **API Design-first**(Documentation-Driven Development) e **Schema-first**.

Agora não faço mais nenhum dos dois. Por isso vou documentar aqui a criação das Skills para poder reproduzir esse padrão em qualquer módulo/sistema 

## Intent Trajectory Destiny

Para iniciar o projeto você definir o que o sistema precisa ter para entregar para seu cliente/usuário.
Falando no meu contexto, sistemas empresariais, Precisa definir o que o sistema/empresa precisa ter para poder vender/entregar 
para o seu usuário/cliente.




### Intent Trajectory Behavior

Na primeira etapa eu defino o fluxo iniciando pela Intenção que a empresa deve receber para executar o seu comportamento ligando as 2 pontas opostas: **vendedor e comprador**.

```
Cliente
  │
  │ "Preciso fazer uma entrega"
  ▼
WhatsApp
  │
  ▼
Sistema
  │
  │ REQUEST_DELIVERY
  ▼
Motoboy disponível
  │
  │ "Existe uma solicitação de entrega"
  ▼
WhatsApp
```

### Intent Trajectory Evidence

```
CLIENTE ENVIA
      ↓
SISTEMA RECEBE
      ↓
SISTEMA IDENTIFICA
      ↓
SISTEMA ROTEIA
      ↓
MOTOBOY RECEBE
```




# Etapa 1


Você deve criar um script para simular a primeira etapa desse fluxo, que será como? 

1. Enviar uma requisição paraa evolution-go com o texto: "Preciso de uma entrega"
2. você terá que classificar corretamente para entregar para o MCP módulo do server do delivery. 

E quando a ação chegar no modulo, você vai fazer uma simulação de enviar cinco mensagens, como se tivesse cinco motoboys livres, só que as cinco mensagens devem ter o mesmo número que o meu, então para eu verificar, validar. Depois eu tenho que responder o endereço, como que vai ser. Então você tem que implementar toda a parte comunicacional, conversacional do agente para ele entender a entrega, o delivery e o que vai fazer. Depois que fechar essa conversa com o cliente, então aí você manda as mensagens pro meu WhatsApp, passando qual é o endereço para buscar a entrega e aonde tem que levar, correto? E já falando que o preço é tal, já que já recebeu o dinheiro e a pessoa que pegar pode ir entregando, já enviando o código pra gente, ou o Pix já vai ser feito. Beleza? Aí você vai fazer o seguinte: eu vou responder como um motoboy, falando: Beleza, eu tô livre. Aí você vai fazer o seguinte: você vai ter que mandar um link mágico para o usuário ser autenticado, a gente já temos ali essa funcionalidade toda, porém o que nós temos hoje é o usuário colocando o seu WhatsApp para depois receber o link mágico. A gente só vai pular uma etapa, correto? E aí o que vai acontecer? Depois que ela entrar no link mágico, ela vai colocar sua passkey e então vai abrir o aplicativo web que irá mostrar então a posição em tempo real do motoboy. A posição que você vai usar será a minha e a posição de destino eu vou enviar corretamente. E aí você vai ter que simular, por exemplo, a saída daqui do meu endereço até o endereço de destino, para que você peça o código de validação quando chegar lá. Aí eu repasso, você valida e aí essa primeira etapa finaliza. Vamos lá.
