# Simulador de Aposentadoria

Três calculadoras simples para planejar a aposentadoria com juros compostos.

## As calculadoras

1. **Quanto vou ter?** Mostra quanto você acumula poupando um valor por mês.
2. **Quanto preciso poupar?** Mostra quanto guardar por mês para chegar a uma meta.
3. **Quanto posso gastar?** Mostra quanto dá para gastar por mês depois de aposentado, vivendo só dos juros ou usando todo o patrimônio ao longo dos anos.

A taxa padrão é de 0,5% ao mês acima da inflação (cerca de 6,17% ao ano). Você pode mudar a taxa no topo da página.

## Como usar

Abra o arquivo `index.html` no navegador, entre com seu e-mail e senha (ou crie uma conta) e use as calculadoras. Não precisa de instalação, mas precisa de internet para o login.

## Login

O login é o mesmo do **Fluxo de Caixa**: os dois sistemas usam o mesmo projeto Supabase, então quem já tem conta em um entra no outro com o mesmo e-mail e senha. A tela tem entrar, criar conta, esqueci a senha e definir nova senha (pelo link do e-mail).

A calculadora só usa o login — os cálculos não são salvos no banco. Ao criar conta, o nome vai para a tabela `profiles` (a mesma do Fluxo de Caixa).

Para o link de "esqueci a senha" voltar para a calculadora, o endereço onde ela está publicada precisa estar em **Supabase → Authentication → URL Configuration → Redirect URLs**.

## Estrutura

```
index.html                  página principal: carregando, login e as calculadoras
frontend/
  css/styles.css            visual
  js/config.js              URL e chave do Supabase (mesmo projeto do Fluxo de Caixa)
  js/supabaseClient.js      inicializa o cliente Supabase
  js/auth.js                tela de entrar / criar conta / esqueci a senha
  js/session.js             mostra login ou calculadora conforme a sessão
  js/app.js                 as três calculadoras, abas e tema
backend/                    cálculos financeiros
```

## Aviso

Os valores estão no poder de compra de hoje, porque a taxa já desconta a inflação. É uma ferramenta de estudo, não uma recomendação de investimento.
