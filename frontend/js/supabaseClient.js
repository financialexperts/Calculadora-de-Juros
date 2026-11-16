(function (global) {
  "use strict";

  var cfg = global.SUPABASE_CONFIG || {};
  var isConfigured = !!(cfg.url && cfg.anonKey && cfg.url.indexOf("COLE_AQUI") === -1 && global.supabase);

  // Lido antes do createClient: o Supabase consome e apaga o #hash do link
  // do e-mail ao iniciar, e aí não dá mais pra saber que era recuperação.
  var hash = global.location.hash || "";
  var isRecovery = /type=recovery/.test(hash);
  var linkError = /error_code=otp_expired/.test(hash)
    ? "Esse link expirou ou já foi usado. Peça um novo em \"Esqueci minha senha\"."
    : null;

  // A volta do "Continuar com o Google" (o google-auth.js marca a ida nesta
  // aba). Erro na volta vira o aviso da tela de login e sai do endereço, pra
  // não aparecer de novo ao recarregar a página; desistir na tela do Google
  // (access_denied) só traz a pessoa de volta, sem aviso.
  var oauthReturn = false;
  try {
    oauthReturn = global.sessionStorage.getItem("oauth-google") === "1";
    global.sessionStorage.removeItem("oauth-google");
  } catch (err) {}
  var returned = (global.location.search || "") + hash;
  if (oauthReturn && !linkError && /(^|[?&#])error=/.test(returned)) {
    oauthReturn = false;
    if (!/error=access_denied/.test(returned)) linkError = "Não foi possível entrar com o Google. Tente de novo.";
    try { global.history.replaceState(null, "", global.location.pathname); } catch (err) {}
  }

  var client = isConfigured
    ? global.supabase.createClient(cfg.url, cfg.anonKey)
    : null;

  global.DB = {
    isConfigured: isConfigured,
    client: client,
    isRecovery: isRecovery,
    linkError: linkError,
    oauthReturn: oauthReturn
  };
})(window);
