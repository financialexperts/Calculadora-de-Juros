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

O login é o mesmo do **Fluxo de Caixa**: os dois sistemas usam o mesmo projeto Supabase, então quem já tem conta em um entra no outro com o mesmo e-mail e senha. A tela tem entrar, criar conta, esqueci a senha e definir nova senha (pelo link do e-mail). Nas abas de entrar e de criar conta, o botão **Continuar com o Google** entra com a conta do Google: quem ainda não tem conta ganha uma na hora, com o nome do Google, e quem já tem conta com o mesmo e-mail entra nela mesma.

A calculadora só usa o login — os cálculos não são salvos no banco. Ao criar conta, o nome vai para a tabela `profiles` (a mesma do Fluxo de Caixa).

Para o link de "esqueci a senha" e o login com o Google voltarem para a calculadora, o endereço onde ela está publicada precisa estar em **Supabase → Authentication → URL Configuration → Redirect URLs** (por isso o Google não funciona com o `index.html` aberto direto do computador, pelo `file://`). Além disso, o Google precisa estar ligado em **Authentication → Sign In / Providers → Google**, com o Client ID e o Client Secret de um cliente OAuth do Google Cloud (que tem que ter `https://xorqsuqjmvkyzgagdxfz.supabase.co/auth/v1/callback` em *URIs de redirecionamento autorizados*). Enquanto ele estiver desligado, o botão só avisa que o login com o Google ainda não está disponível.

## Estrutura

```
index.html                  página principal: carregando, login e as calculadoras
frontend/
  css/styles.css            visual
  js/config.js              URL e chave do Supabase (mesmo projeto do Fluxo de Caixa)
  js/supabaseClient.js      inicializa o cliente Supabase
  js/auth.js                tela de entrar / criar conta / esqueci a senha
  js/google-auth.js         botão "Continuar com o Google" (a mesma cópia em todos os sistemas)
  js/session.js             mostra login ou calculadora conforme a sessão
  js/app.js                 as três calculadoras, abas e tema
backend/                    cálculos financeiros
```

## Aviso

Os valores estão no poder de compra de hoje, porque a taxa já desconta a inflação. É uma ferramenta de estudo, não uma recomendação de investimento.
