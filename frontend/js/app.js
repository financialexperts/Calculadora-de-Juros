(function () {
  "use strict";

  var Fi = Finance;
  var money = Format.money;
  var fmtNum = Format.fmtNum;
  var parseNumber = Format.parseNumber;
  var yearLabelLong = Format.yearLabelLong;

  // Monta o tooltip do gráfico: quando faz isso, quando chegou a este valor,
  // e como ele se divide — sempre com a cor só na "chave", nunca no texto.
  function tipHTML(k, main, rows) {
    var html = '<div class="tip__time">' + yearLabelLong(k) + '</div>';
    if (main) {
      html += '<div class="tip__label">' + main.label + '</div><div class="tip__main">' + money(main.value) + '</div>';
    }
    rows.forEach(function (r) {
      html += '<div class="tip__row"><i class="tip__key" style="background:var(--' + r.color + ')"></i>' +
        '<span class="tip__rowlabel">' + r.label + '</span><span class="tip__val">' + money(r.value) + '</span></div>';
    });
    return html;
  }

  /* ============ taxa global ============ */
  var rateInput = document.getElementById("taxa");
  var rateMonthLabel = document.getElementById("taxa-mes");
  var rateValueBox = rateInput.closest(".hero__note-value");

  function getRate() {
    var pct = parseNumber(rateInput.value);
    if (!isFinite(pct) || pct < 0 || pct > 100) return null;
    return pct / 100;
  }
  function updateRateLabels() {
    var i = getRate();
    if (i === null) {
      rateMonthLabel.textContent = "taxa inválida";
      rateValueBox.classList.add("is-error");
      return;
    }
    rateValueBox.classList.remove("is-error");
    rateMonthLabel.textContent = "ao mês";
  }

  /* ============ máscara e validação ============ */
  function formatOnBlur(el) {
    var kind = el.getAttribute("data-mask");
    var v = parseNumber(el.value);
    if (!isFinite(v)) return;
    if (kind === "money") el.value = fmtNum.format(v);
    else el.value = String(Math.round(v * 100) / 100).replace(".", ",");
  }

  function setError(id, msg) {
    var box = document.getElementById(id + "-box");
    var err = document.getElementById(id + "-err");
    if (!box || !err) return;
    if (msg) {
      box.classList.add("is-error");
      err.textContent = msg;
      err.classList.add("is-on");
    } else {
      box.classList.remove("is-error");
      err.textContent = "";
      err.classList.remove("is-on");
    }
  }

  // Lê um campo; retorna null e marca o erro quando inválido.
  // touched = false -> campo vazio não mostra erro (ainda não foi preenchido)
  function readField(id, opts, touched) {
    var el = document.getElementById(id);
    var raw = el.value.trim();
    if (!raw) {
      setError(id, touched ? "Preencha este campo." : "");
      return null;
    }
    var v = parseNumber(raw);
    if (!isFinite(v)) { setError(id, "Use apenas números. Ex.: " + opts.example); return null; }
    if (v <= 0) { setError(id, "O valor precisa ser maior que zero."); return null; }
    if (opts.max && v > opts.max) { setError(id, "Valor muito alto. Use até " + opts.maxLabel + "."); return null; }
    setError(id, "");
    return v;
  }

  // Como readField, mas o campo é opcional: vazio vale 0 e nunca mostra "preencha este campo".
  function readOptionalField(id, opts) {
    var el = document.getElementById(id);
    var raw = el.value.trim();
    if (!raw) { setError(id, ""); return 0; }
    var v = parseNumber(raw);
    if (!isFinite(v)) { setError(id, "Use apenas números. Ex.: " + opts.example); return null; }
    if (v < 0) { setError(id, "O valor não pode ser negativo."); return null; }
    if (opts.max && v > opts.max) { setError(id, "Valor muito alto. Use até " + opts.maxLabel + "."); return null; }
    setError(id, "");
    return v;
  }

  /* ============ estado de "campo tocado" ============ */
  var touched = {};
  function markTouched(id) { touched[id] = true; }
  function isTouched(id) { return !!touched[id]; }

  /* ============ Calculadora 1 ============ */
  function calc1(force) {
    var i = getRate();
    var inicial = readOptionalField("c1-inicial", { example: "10.000,00", max: 1e12, maxLabel: "R$ 1 trilhão" });
    var pmt = readField("c1-aporte", { example: "1.000,00", max: 1e9, maxLabel: "R$ 1 bilhão" }, force || isTouched("c1-aporte"));
    var anos = readField("c1-anos", { example: "30", max: 100, maxLabel: "100 anos" }, force || isTouched("c1-anos"));
    var ans = document.getElementById("c1-answer");

    if (i === null || inicial === null || pmt === null || anos === null) {
      ans.classList.add("is-empty");
      document.getElementById("c1-result").textContent = "R$ 0,00";
      document.getElementById("c1-caption").textContent = "Preencha os campos ao lado para ver o resultado.";
      ["c1-aportado", "c1-juros"].forEach(function (k) { document.getElementById(k).textContent = "—"; });
      Chart.draw(document.getElementById("c1-chart"), null);
      return;
    }

    var n = Fi.months(anos);
    var fv = Fi.futureValue(pmt, i, n, inicial);
    var aportado = inicial + pmt * n;
    var juros = fv - aportado;
    var anosLabel = fmtNum.format(anos).replace(",00", "") + " anos";

    ans.classList.remove("is-empty");
    document.getElementById("c1-result").textContent = money(fv);
    document.getElementById("c1-caption").innerHTML = inicial > 0
      ? "Partindo de <b>" + money(inicial) + "</b> hoje e poupando <b>" + money(pmt) + "</b> por mês durante <b>" + anosLabel + "</b> (" + n + " meses), você chega a <b>" + money(fv) + "</b>."
      : "Poupando <b>" + money(pmt) + "</b> por mês durante <b>" + anosLabel + "</b> (" + n + " meses), você chega a <b>" + money(fv) + "</b>.";
    document.getElementById("c1-aportado").textContent = money(aportado);
    document.getElementById("c1-juros").textContent = money(juros);

    var serie = Fi.accumulationSeries(pmt, i, n, inicial);
    Chart.draw(document.getElementById("c1-chart"), {
      totalYears: anos,
      band: { top: serie.map(function (p) { return p.total; }), bottom: serie.map(function (p) { return p.base; }) },
      tooltip: function (k) {
        var p = serie[k];
        return tipHTML(k, { label: "Patrimônio", value: p.total }, [
          { color: "accent", label: "Depositado", value: p.base },
          { color: "warm", label: "Juros", value: p.total - p.base }
        ]);
      }
    });
  }

  /* ============ Calculadora 2 ============ */
  function calc2(force) {
    var i = getRate();
    var inicial = readOptionalField("c2-inicial", { example: "10.000,00", max: 1e12, maxLabel: "R$ 1 trilhão" });
    var meta = readField("c2-meta", { example: "1.000.000,00", max: 1e12, maxLabel: "R$ 1 trilhão" }, force || isTouched("c2-meta"));
    var anos = readField("c2-anos", { example: "30", max: 100, maxLabel: "100 anos" }, force || isTouched("c2-anos"));
    var ans = document.getElementById("c2-answer");

    if (i === null || inicial === null || meta === null || anos === null) {
      ans.classList.add("is-empty");
      document.getElementById("c2-result").textContent = "R$ 0,00";
      document.getElementById("c2-caption").textContent = "Preencha os campos ao lado para ver o resultado.";
      ["c2-aportado", "c2-juros", "c2-ano"].forEach(function (k) { document.getElementById(k).textContent = "—"; });
      Chart.draw(document.getElementById("c2-chart"), null);
      return;
    }

    var n = Fi.months(anos);
    var pmt = Fi.payment(meta, i, n, inicial);
    var anosLabel = fmtNum.format(anos).replace(",00", "") + " anos";
    var jaAtinge = pmt === 0;
    var fvFinal = jaAtinge ? Fi.futureValue(0, i, n, inicial) : meta;
    var aportado = inicial + pmt * n;
    var juros = fvFinal - aportado;

    ans.classList.remove("is-empty");
    document.getElementById("c2-result").textContent = money(pmt);
    document.getElementById("c2-caption").innerHTML = jaAtinge
      ? "Sozinho, o valor de <b>" + money(inicial) + "</b> que você já tem chega a <b>" + money(fvFinal) + "</b> em <b>" + anosLabel + "</b> — mais do que sua meta de <b>" + money(meta) + "</b> — mesmo sem guardar mais nada por mês."
      : (inicial > 0
        ? "Você já tem <b>" + money(inicial) + "</b>. Para completar <b>" + money(meta) + "</b> em <b>" + anosLabel + "</b>, guarde <b>" + money(pmt) + "</b> todo mês — cerca de <b>" + money(pmt / 30) + "</b> por dia."
        : "Para ter <b>" + money(meta) + "</b> em <b>" + anosLabel + "</b>, guarde <b>" + money(pmt) + "</b> todo mês — cerca de <b>" + money(pmt / 30) + "</b> por dia.");
    document.getElementById("c2-aportado").textContent = money(aportado);
    document.getElementById("c2-juros").textContent = money(juros);
    document.getElementById("c2-ano").textContent = money(pmt * 12);

    var serie = Fi.accumulationSeries(pmt, i, n, inicial);
    Chart.draw(document.getElementById("c2-chart"), {
      totalYears: anos,
      band: { top: serie.map(function (p) { return p.total; }), bottom: serie.map(function (p) { return p.base; }) },
      tooltip: function (k) {
        var p = serie[k];
        return tipHTML(k, { label: "Patrimônio", value: p.total }, [
          { color: "accent", label: "Depositado", value: p.base },
          { color: "warm", label: "Juros", value: p.total - p.base }
        ]);
      }
    });
  }

  /* ============ Calculadora 3 ============ */
  function calc3(force) {
    var i = getRate();
    var p = readField("c3-patrimonio", { example: "500.000,00", max: 1e12, maxLabel: "R$ 1 trilhão" }, force || isTouched("c3-patrimonio"));
    var anos = readField("c3-anos", { example: "25", max: 100, maxLabel: "100 anos" }, force || isTouched("c3-anos"));
    var aA = document.getElementById("c3a-answer"), aB = document.getElementById("c3b-answer");

    // Opção A depende só do patrimônio
    if (i === null || p === null) {
      aA.classList.add("is-empty");
      document.getElementById("c3a-result").textContent = "R$ 0,00";
      document.getElementById("c3a-caption").textContent = "Preencha o patrimônio para ver o resultado.";
    } else {
      var rendaA = Fi.incomePerpetual(p, i);
      aA.classList.remove("is-empty");
      document.getElementById("c3a-result").textContent = money(rendaA);
      document.getElementById("c3a-caption").innerHTML =
        "Você tira só o que rende. O patrimônio de <b>" + money(p) + "</b> continua de pé e a renda dura para sempre.";
    }

    if (i === null || p === null || anos === null) {
      aB.classList.add("is-empty");
      document.getElementById("c3b-result").textContent = "R$ 0,00";
      document.getElementById("c3b-caption").textContent = "Preencha os dois campos para ver o resultado.";
      Chart.draw(document.getElementById("c3-chart"), null);
      return;
    }

    var n = Fi.months(anos);
    var iB = 0.0087; // Opção B usa juros nominal fixo de 0,87% ao mês
    var rendaB = Fi.incomeDepleting(p, iB, n);

    aB.classList.remove("is-empty");
    document.getElementById("c3b-result").textContent = money(rendaB);
    document.getElementById("c3b-caption").innerHTML =
      "Você tira <b>" + money(rendaB) + "</b> por mês por <b>" + fmtNum.format(anos).replace(",00", "") + " anos</b>. No fim do prazo, o dinheiro acaba.";

    var serieB = Fi.depletionSeries(p, iB, n, rendaB);
    var serieA = [];
    for (var k = 0; k <= n; k++) serieA.push(p);

    Chart.draw(document.getElementById("c3-chart"), {
      totalYears: anos,
      series: [
        { values: serieA, color: "accent", dashed: true },
        { values: serieB, color: "warm", fill: true }
      ],
      tooltip: function (k) {
        return tipHTML(k, null, [
          { color: "accent", label: "Opção A", value: p },
          { color: "warm", label: "Opção B", value: serieB[k] }
        ]);
      }
    });
  }

  var calcs = { form1: calc1, form2: calc2, form3: calc3 };
  function runAll(force) { calc1(force); calc2(force); calc3(force); }

  /* ============ eventos ============ */
  var allInputs = Array.prototype.slice.call(document.querySelectorAll("input[data-mask]"));
  allInputs.forEach(function (el) {
    el.addEventListener("input", function () {
      markTouched(el.id);
      runAll(false);
    });
    el.addEventListener("blur", function () {
      markTouched(el.id);
      formatOnBlur(el);
      runAll(false);
    });
    el.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); el.blur(); runAll(true); }
    });
  });

  document.querySelectorAll("#view-calc .chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      var target = document.getElementById(chip.getAttribute("data-fill"));
      if (!target) return;
      var v = parseFloat(chip.getAttribute("data-value"));
      target.value = target.getAttribute("data-mask") === "money" ? fmtNum.format(v) : String(v);
      markTouched(target.id);
      runAll(false);
    });
  });

  document.querySelectorAll("#view-calc form").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fn = calcs[form.id];
      if (fn) fn(true);
    });
  });

  document.querySelectorAll("[data-clear]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var form = document.getElementById(btn.getAttribute("data-clear"));
      if (!form) return;
      form.querySelectorAll("input").forEach(function (el) {
        el.value = "";
        touched[el.id] = false;
        setError(el.id, "");
      });
      runAll(false);
      var first = form.querySelector("input");
      if (first) first.focus();
    });
  });

  rateInput.addEventListener("input", function () { updateRateLabels(); runAll(false); });
  rateInput.addEventListener("blur", function () {
    var v = parseNumber(rateInput.value);
    if (isFinite(v)) rateInput.value = String(Math.round(v * 10000) / 10000).replace(".", ",");
    updateRateLabels(); runAll(false);
  });

  /* ============ abas ============ */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('#view-calc [role="tab"]'));
  function selectTab(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
  }
  tabs.forEach(function (tab, idx) {
    tab.addEventListener("click", function () { selectTab(tab); });
    tab.addEventListener("keydown", function (e) {
      var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var next = tabs[(idx + d + tabs.length) % tabs.length];
      selectTab(next); next.focus();
    });
  });

  /* ============ tema ============ */
  var root = document.documentElement;
  var stored = null;
  try { stored = localStorage.getItem("tema"); } catch (err) { stored = null; }
  if (stored === "dark" || stored === "light") {
    root.setAttribute("data-theme", stored);
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    root.setAttribute("data-theme", "dark");
  }
  document.getElementById("tema").addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("tema", next); } catch (err) {}
  });

  /* ============ liquid glass: brilho que segue o ponteiro ============ */
  document.querySelectorAll(".glass").forEach(function (el) {
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--gx", ((e.clientX - r.left) / r.width * 100) + "%");
      el.style.setProperty("--gy", ((e.clientY - r.top) / r.height * 100) + "%");
    });
  });

  /* ============ início ============ */
  updateRateLabels();
  runAll(false);
})();
