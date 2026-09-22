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

  var client = isConfigured
    ? global.supabase.createClient(cfg.url, cfg.anonKey)
    : null;

  global.DB = {
    isConfigured: isConfigured,
    client: client,
    isRecovery: isRecovery,
    linkError: linkError
  };
})(window);
