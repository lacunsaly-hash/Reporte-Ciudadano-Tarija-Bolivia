/* ===== Reporte Ciudadano · lógica ===== */
(function () {
  "use strict";

  const WA = "59172981122";
  const KEY_R = "rc_reports", KEY_P = "rc_profile";
  const $ = (id) => document.getElementById(id);

  const CATS = [
    { n: "Calles y baches", i: "🕳️", d: "Baches, hundimientos y calles dañadas." },
    { n: "Basura y limpieza", i: "🗑️", d: "Basura acumulada y falta de limpieza." },
    { n: "Alumbrado público", i: "💡", d: "Luminarias apagadas o dañadas." },
    { n: "Fugas de agua", i: "💧", d: "Tuberías rotas o agua desperdiciada." },
    { n: "Semáforos y señalización", i: "🚦", d: "Semáforos dañados, señales faltantes." },
    { n: "Espacios públicos", i: "🌳", d: "Plazas, parques y áreas verdes." },
    { n: "Alcantarillado", i: "🌀", d: "Alcantarillas tapadas o sin tapa." },
    { n: "Otros problemas urbanos", i: "📌", d: "Cualquier otro inconveniente urbano." }
  ];
  const IMP = [
    { n: "Reporta lo que ves", i: "👁️", t: "Cada reporte cuenta", x: "Si ves un bache, una luminaria apagada o basura acumulada, repórtalo. Una descripción clara y una ubicación precisa ayudan a que el problema sea identificado." },
    { n: "Aporta evidencia", i: "📸", t: "Una foto vale más", x: "Toma una fotografía del problema y guárdala. Aunque el enlace de WhatsApp no adjunta archivos automáticamente, puedes enviarla manualmente en la conversación." },
    { n: "Participa en comunidad", i: "🤝", t: "Juntos somos más", x: "Comparte la plataforma con tus vecinos y revisa si el problema ya fue reportado. La participación colectiva fortalece la voz de tu barrio." },
    { n: "Haz seguimiento", i: "🔎", t: "No olvides tu código", x: "Guarda tu código de seguimiento y consúltalo en la sección Seguimiento para revisar el estado de tu reporte registrado." }
  ];
  const STATES = [
    { n: "Recibido", c: "#6b7280" }, { n: "En revisión", c: "#d99100" },
    { n: "En proceso", c: "#1a5fd1" }, { n: "Atendido", c: "#7c3aed" }, { n: "Resuelto", c: "#16a265" }
  ];

  /* ---------- LocalStorage seguro ---------- */
  const load = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch (e) { return def; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

  /* ---------- Tarjetas dinámicas ---------- */
  $("catGrid").innerHTML = CATS.map((c, i) =>
    `<button type="button" class="card click" data-cat="${i}"><div class="ico">${c.i}</div><h3>${c.n}</h3><p>${c.d}</p></button>`).join("");
  $("rCat").innerHTML = '<option value="">Selecciona…</option>' + CATS.map((c) => `<option>${c.n}</option>`).join("");
  $("impGrid").innerHTML = IMP.map((c, i) =>
    `<button type="button" class="card click big-ico" data-imp="${i}"><div class="ico">${c.i}</div><h3>${c.n}</h3></button>`).join("");

  function showImp(i) {
    $("impTitle").textContent = IMP[i].t; $("impText").textContent = IMP[i].x;
    document.querySelectorAll("[data-imp]").forEach((b) => b.classList.toggle("active", +b.dataset.imp === i));
  }
  showImp(0);

  /* ---------- Modales ---------- */
  let lastFocus = null;
  function openModal(m) { lastFocus = document.activeElement; m.hidden = false; document.body.style.overflow = "hidden"; const f = m.querySelector("input,select,button"); f && f.focus(); }
  function closeModals() { document.querySelectorAll(".modal").forEach((m) => (m.hidden = true)); document.body.style.overflow = ""; lastFocus && lastFocus.focus && lastFocus.focus(); }

  function openReport(cat) {
    const p = load(KEY_P, {});
    if (!$("rName").value) $("rName").value = p.name || "";
    if (!$("rPhone").value) $("rPhone").value = p.phone || "";
    if (cat !== undefined) $("rCat").value = cat;
    $("rDate").textContent = new Date().toLocaleString("es-BO");
    $("rErr").textContent = "";
    openModal($("reportModal"));
  }

  /* ---------- Eventos globales (delegación) ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-report],[data-cat],[data-imp],[data-close]");
    if (!t) return;
    if (t.hasAttribute("data-report")) { $("menu").classList.remove("open"); openReport(); }
    else if (t.dataset.cat !== undefined) openReport(CATS[+t.dataset.cat].n);
    else if (t.dataset.imp !== undefined) showImp(+t.dataset.imp);
    else if (t.hasAttribute("data-close")) closeModals();
  });
  document.querySelectorAll(".modal").forEach((m) => m.addEventListener("click", (e) => { if (e.target === m) closeModals(); }));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModals(); });

  /* ---------- Menú móvil ---------- */
  $("burger").addEventListener("click", () => {
    const o = $("menu").classList.toggle("open"); $("burger").setAttribute("aria-expanded", o);
  });
  $("menu").querySelectorAll("a").forEach((a) => a.addEventListener("click", () => $("menu").classList.remove("open")));

  /* ---------- Geolocalización ---------- */
  $("gpsBtn").addEventListener("click", () => {
    const m = $("gpsMsg");
    if (!navigator.geolocation) { m.textContent = "Tu navegador no admite geolocalización. Escribe la ubicación manualmente."; return; }
    m.textContent = "Solicitando permiso de ubicación…";
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const la = p.coords.latitude.toFixed(6), lo = p.coords.longitude.toFixed(6);
        const cur = $("rLoc").value.trim();
        $("rLoc").value = (cur ? cur + " | " : "") + `GPS: ${la}, ${lo} (https://maps.google.com/?q=${la},${lo})`;
        m.textContent = "Ubicación obtenida. Puedes editarla si lo necesitas.";
      },
      () => { m.textContent = "No se pudo obtener la ubicación. Escríbela manualmente."; },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  $("rPhoto").addEventListener("change", (e) => {
    const f = e.target.files[0];
    $("photoName").textContent = f ? "Foto seleccionada: " + f.name + " (envíala manualmente en WhatsApp)" : "Ninguna foto seleccionada.";
  });

  /* ---------- Código único ---------- */
  function newCode(existing) {
    const d = new Date(), pad = (n) => String(n).padStart(2, "0");
    const base = `RC-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-`;
    const ch = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let c;
    do { c = base + Array.from({ length: 6 }, () => ch[Math.floor(Math.random() * ch.length)]).join(""); }
    while (existing.some((r) => r.code === c));
    return c;
  }

  /* ---------- Envío del reporte ---------- */
  let sending = false;
  $("reportForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (sending) return; // evita envíos repetidos
    const f = { name: $("rName"), cat: $("rCat"), desc: $("rDesc"), loc: $("rLoc") };
    let bad = false;
    Object.values(f).forEach((el) => { const v = !el.value.trim() || (el === f.desc && el.value.trim().length < 10); el.classList.toggle("bad", v); bad = bad || v; });
    if (bad) { $("rErr").textContent = "Completa nombre, tipo de problema, ubicación y una descripción de al menos 10 caracteres."; return; }
    $("rErr").textContent = "";

    const reports = load(KEY_R, []);
    const loc = f.loc.value.trim();
    // Comparación básica de duplicados: misma categoría y ubicación similar
    const dup = reports.find((r) => r.cat === f.cat.value && (norm(r.loc).includes(norm(loc)) || norm(loc).includes(norm(r.loc))));
    if (dup && !confirm(`Ya existe un reporte guardado en este navegador con la misma categoría y ubicación similar (código ${dup.code}).\n\n¿Deseas crear uno nuevo de todos modos?`)) return;
    if (!confirm("¿Confirmas que la información es real y está correcta para enviar el reporte?")) return;

    sending = true; $("sendBtn").disabled = true;
    const rep = {
      code: newCode(reports), name: f.name.value.trim(), phone: $("rPhone").value.trim(),
      cat: f.cat.value, desc: f.desc.value.trim(), loc, date: new Date().toISOString(), status: 0
    };
    reports.push(rep);
    if (!save(KEY_R, reports)) { alert("No se pudo guardar en el navegador (¿modo privado o almacenamiento lleno?)."); }

    const msg = `Nuevo reporte ciudadano.\n\nCódigo de seguimiento: ${rep.code}\n\nNombre: ${rep.name}\n\nTipo de problema: ${rep.cat}\n\nDescripción: ${rep.desc}\n\nUbicación: ${rep.loc}\n\nContacto: ${rep.phone || "No indicado"}`;
    const url = `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;

    $("reportForm").reset(); $("photoName").textContent = "Ninguna foto seleccionada. La foto no se adjunta automáticamente a WhatsApp.";
    $("gpsMsg").textContent = "";
    closeModals();
    $("okCode").textContent = rep.code; $("okWa").href = url; $("okTrack").dataset.code = rep.code;
    openModal($("okModal"));
    window.open(url, "_blank", "noopener");
    setTimeout(() => { sending = false; $("sendBtn").disabled = false; }, 3000);
  });
  ["rName", "rCat", "rDesc", "rLoc"].forEach((id) => $(id).addEventListener("input", (e) => e.target.classList.remove("bad")));

  $("okTrack").addEventListener("click", () => {
    const c = $("okTrack").dataset.code; closeModals();
    $("trackCode").value = c; showTrack(c); $("seguimiento").scrollIntoView();
  });

  /* ---------- Seguimiento ---------- */
  function showTrack(code) {
    const box = $("trackResult");
    const r = load(KEY_R, []).find((x) => x.code.toLowerCase() === code.trim().toLowerCase());
    if (!r) {
      box.innerHTML = `<div class="res"><h3>😕 Código no encontrado</h3><p>No hay un reporte con ese código en este navegador. Revisa que esté bien escrito o registra uno nuevo.</p><br><button class="btn btn-green" data-report>Registrar un reporte</button></div>`;
      return;
    }
    const s = STATES[r.status], pct = (r.status + 1) / STATES.length * 100;
    box.innerHTML = `<div class="res"><h3>Reporte ${esc(r.code)}</h3>
      <dl><dt>Estado</dt><dd><span class="badge" style="background:${s.c}">${s.n}</span></dd>
      <dt>Categoría</dt><dd>${esc(r.cat)}</dd><dt>Ubicación</dt><dd>${esc(r.loc)}</dd>
      <dt>Creado</dt><dd>${new Date(r.date).toLocaleString("es-BO")}</dd><dt>Descripción</dt><dd>${esc(r.desc)}</dd></dl>
      <div class="bar"><i style="width:${pct}%;background:${s.c}"></i></div>
      <div class="steps">${STATES.map((x, i) => `<span class="${i <= r.status ? "on" : ""}" style="--c:${x.c}">${x.n}</span>`).join("")}</div></div>`;
  }
  $("trackForm").addEventListener("submit", (e) => { e.preventDefault(); showTrack($("trackCode").value); });

  /* ---------- Perfil local ---------- */
  const prof = load(KEY_P, {});
  $("pName").value = prof.name || ""; $("pPhone").value = prof.phone || ""; $("pEmail").value = prof.email || "";
  $("profileForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!$("pName").value.trim()) { $("pMsg").textContent = "Escribe al menos tu nombre."; return; }
    save(KEY_P, { name: $("pName").value.trim(), phone: $("pPhone").value.trim(), email: $("pEmail").value.trim() });
    $("pMsg").textContent = "✅ Perfil guardado en este navegador. Se usará al crear reportes.";
  });
  $("pClear").addEventListener("click", () => {
    try { localStorage.removeItem(KEY_P); } catch (e) {}
    $("profileForm").reset(); $("pMsg").textContent = "Perfil borrado.";
  });
})();
