(function () {
  "use strict";

  function showView(name) {
    ["loading", "setup", "auth", "calc"].forEach(function (v) {
      var el = document.getElementById("view-" + v);
      if (el) el.hidden = v !== name;
    });
  }

  /* ============ configuração do Supabase ============ */
  if (!window.DB.isConfigured) {
    showView("setup");
    return;
  }

  var db = window.DB.client;

  /* ============ roteamento por sessão ============ */
  // O link de recuperação já chega com sessão válida, então INITIAL_SESSION,
  // SIGNED_IN e o getSession() inicial mandariam direto pra calculadora.
  // Enquanto a nova senha não for salva, qualquer rota cai na troca de senha.
  var recovering = window.DB.isRecovery;

  function route(session) {
    if (recovering && session) {
      document.getElementById("userbox").hidden = true;
      showView("auth");
      window.AuthView.showRecovery();
      return;
    }
    if (!session) {
      document.getElementById("userbox").hidden = true;
      window.AuthView.reset();
      showView("auth");
      return;
    }

    var metaName = session.user.user_metadata && session.user.user_metadata.full_name;
    document.getElementById("userbox-email").textContent = metaName || session.user.email;
    document.getElementById("userbox").hidden = false;
    showView("calc");

    // Conta criada antes do nome ir para o user_metadata: busca no perfil
    // (tabela compartilhada com o Fluxo de Caixa).
    if (!metaName) {
      db.from("profiles").select("full_name").eq("id", session.user.id).maybeSingle().then(function (res) {
        if (res.data && res.data.full_name) {
          document.getElementById("userbox-email").textContent = res.data.full_name;
        }
      });
    }
  }

  db.auth.onAuthStateChange(function (event, session) {
    if (event === "PASSWORD_RECOVERY") recovering = true;
    if (event === "SIGNED_OUT") recovering = false;
    // TOKEN_REFRESHED dispara sozinho em segundo plano; re-rotear aqui só
    // reanimaria a tela sem motivo.
    if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") return;
    route(session);
  });

  document.getElementById("btn-logout").addEventListener("click", function () {
    db.auth.signOut();
  });

  window.App = {
    refresh: function () { db.auth.getSession().then(function (res) { route(res.data.session); }); },
    finishRecovery: function () { recovering = false; window.App.refresh(); }
  };

  window.AuthView.mount();

  if (window.DB.linkError) window.AuthView.showLinkError(window.DB.linkError);

  showView("loading");
  db.auth.getSession().then(function (res) { route(res.data.session); });
})();
