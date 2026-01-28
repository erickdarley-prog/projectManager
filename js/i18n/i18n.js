(function () {
  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
  }
  // Normalização global desativada: manter apenas texto já traduzido
  function fixMojibake(str) { return str; }

  const I18N = {
    lang: 'es',
    dict: { phrases: {}, tokens: {} },
    patterns: [
      {
        re: /A soma dos pesos das tarefas está abaixo de 100% \(atual: (\d+)%\)\./,
        fn: function (_m, p1) {
          return `La suma de los pesos de las tareas está por debajo del 100% (actual: ${p1}%).`;
        },
      },
      {
        re: /A soma dos pesos das tarefas ultrapassa 100% \(atual: (\d+)%\)\./,
        fn: function (_m, p1) {
          return `La suma de los pesos de las tareas supera el 100% (actual: ${p1}%).`;
        },
      },
      {
        re: /Peso total das tarefas:\s*(.*)/,
        fn: function (_m, p1) {
          return `Peso total de las tareas: ${p1}`;
        },
      },
      {
        re: /(\d+)% da capacidade semanal utilizada/,
        fn: function (_m, p1) {
          return `${p1}% de la capacidad semanal utilizada`;
        },
      },
      {
        // Tempo estimado restante: 3.5 sem (17.5 dias / 140 h)
        re: /Tempo estimado restante:\s*(\d+(?:[.,]\d+)?)\s*sem\s*\((\d+(?:[.,]\d+)?)\s*dias\s*\/\s*(\d+(?:[.,]\d+)?)\s*h\)/,
        fn: function (_m, w, d, h) {
          return `Tiempo estimado restante: ${w} semanas (${d} días / ${h} h)`;
        },
      },
      {
        // Aviso com lista de nomes
        re: /^Aviso: os seguintes desenvolvedores ativos ainda não possuem horas de trabalho por semana cadastradas: (.*)\.$/,
        fn: function (_m, names) {
          return `Aviso: los siguientes desarrolladores activos aún no poseen horas de trabajo por semana registradas: ${names}.`;
        },
      },
      {
        // Nenhum desenvolvedor ativo ... (NOMES)
        re: /^Nenhum desenvolvedor ativo possui horas de trabalho por semana cadastradas\. Edite os membros para preencher esse dado \((.*)\)\.$/,
        fn: function (_m, names) {
          return `Ningún desarrollador activo posee horas de trabajo por semana registradas. Edite los miembros para completar ese dato (${names}).`;
        },
      },
      {
        // Sufixo em tarefas quando dev não está mais na equipe
        re: /\s*\(não está mais na equipe\)/g,
        fn: function () { return ' (ya no está en el equipo)'; },
      },
      {
        // Alerta de soma de pesos no formulário de projeto
        re: /A soma dos pesos de todas as tarefas deste projeto precisa ser exatamente 100%\.[\s\S]*?Soma atual: (\d+)%\./,
        fn: function (_m, p1) {
          return `La suma de los pesos de todas las tareas de este proyecto debe ser exactamente 100%.\n\nSuma actual: ${p1}%.`;
        }
      },
      {
        // Conjunção portuguesa 'e' como palavra isolada -> 'y'
        re: /\be\b/gi,
        fn: function () { return 'y'; }
      },
    ],

    translate: function (value) {
      if (value == null) return value;
      let str = String(value);
      if (!str.trim()) return str;

      const phrases = (this.dict && this.dict.phrases) || {};
      const tokens = (this.dict && this.dict.tokens) || {};

      const exact = phrases[str];
      if (typeof exact === 'string') return exact;

      // Pattern-based replacements (keep first matching for simplicity)
      for (let i = 0; i < this.patterns.length; i++) {
        const p = this.patterns[i];
        if (p.re.test(str)) {
          try {
            return str.replace(p.re, p.fn);
          } catch (_) {
            // ignore
          }
        }
      }

      // Token-based replacements
      let out = str;
      for (const key in tokens) {
        if (!Object.prototype.hasOwnProperty.call(tokens, key)) continue;
        const val = tokens[key];
        try {
          const re = new RegExp(`\\b${escapeRegExp(key)}\\b`, 'gi');
          out = out.replace(re, val);
        } catch (_) {
          // fallback plain replace if regex fails
          out = out.split(key).join(val);
        }
      }
      return out;
    },

    translateElement: function (el) {
      if (!el) return;
      const self = this;
      function walk(node) {
        if (!node) return;
        const nodeType = node.nodeType;
        if (nodeType === 3) {
          // Text node
          const text = node.nodeValue;
          const tr = self.translate(text);
          if (tr !== text) node.nodeValue = tr;
          return;
        }
        if (nodeType !== 1) return; // Element only
        const tag = node.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE') return;
        // Permite marcar subárvores a serem ignoradas pela tradução
        try {
          if (node.hasAttribute && (node.hasAttribute('data-i18n-skip') || node.classList.contains('i18n-skip') || node.classList.contains('no-translate'))) {
            return; // não traduz este nó nem seus filhos
          }
        } catch (_) {}

        // Translate common attributes
        const attrs = ['title', 'placeholder', 'aria-label', 'aria-placeholder'];
        for (let i = 0; i < attrs.length; i++) {
          const a = attrs[i];
          if (node.hasAttribute && node.hasAttribute(a)) {
            const v = node.getAttribute(a);
            const trAttr = self.translate(v);
            if (trAttr !== v) node.setAttribute(a, trAttr);
          }
        }
        // Recurse
        const children = node.childNodes;
        for (let i = 0; i < children.length; i++) {
          walk(children[i]);
        }
      }
      walk(el);
    },

    scanAndTranslate: function (root) {
      const r = root || document.body;
      if (!r) return;
      this.translateElement(r);
      try {
        if (typeof document !== 'undefined' && document.title) {
          const newTitle = this.translate(document.title);
          if (newTitle && newTitle !== document.title) document.title = newTitle;
        }
      } catch (_) {}
    },

    init: function (defaultLang) {
      this.lang = defaultLang || 'es';
      // Load dictionary from window if present
      if (window.I18N_ES) {
        this.dict = window.I18N_ES;
      }

      // Override alert/confirm to auto-translate messages
      try {
        if (typeof window.alert === 'function') {
          const _alert = window.alert.bind(window);
          window.alert = (msg) => _alert(I18N.translate(String(msg)));
        }
        if (typeof window.confirm === 'function') {
          const _confirm = window.confirm.bind(window);
          window.confirm = (msg) => _confirm(I18N.translate(String(msg)));
        }
      } catch (_) {}

      const run = () => {
        try { I18N.scanAndTranslate(); } catch (_) {}
      };
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run, { once: true });
      } else {
        run();
      }

      try {
        const observer = new MutationObserver((mutations) => {
          for (const m of mutations) {
            if (m.type === 'childList') {
              m.addedNodes && m.addedNodes.forEach((n) => {
                if (n && n.nodeType === 1) I18N.translateElement(n);
              });
            } else if (m.type === 'characterData') {
              const n = m.target;
              const t = n && n.nodeValue;
              const tr = I18N.translate(t || '');
              if (t !== tr) n.nodeValue = tr;
            } else if (m.type === 'attributes') {
              const el = m.target;
              const val = el.getAttribute(m.attributeName);
              const tr = I18N.translate(val || '');
              if (val !== tr) el.setAttribute(m.attributeName, tr);
            }
          }
        });
        observer.observe(document.body, {
          subtree: true,
          childList: true,
          characterData: true,
          attributes: true,
          attributeFilter: ['title', 'placeholder', 'aria-label', 'aria-placeholder'],
        });
        this.observer = observer;
      } catch (_) {}
    },

    applyChartTranslations: function (chart, kind) {
      if (!chart) return;
      try {
        if (chart.data && Array.isArray(chart.data.datasets)) {
          chart.data.datasets.forEach((ds) => {
            if (ds && typeof ds.label === 'string') {
              ds.label = I18N.translate(ds.label);
            }
          });
        }
        // Traduz rótulos do eixo apenas quando não forem nomes de desenvolvedores
        if (chart.data && Array.isArray(chart.data.labels)) {
          if (kind !== 'dev') {
            chart.data.labels = chart.data.labels.map((lbl) =>
              typeof lbl === 'string' ? I18N.translate(lbl) : lbl
            );
          }
        }
        if (chart.options && chart.options.scales) {
          const scales = chart.options.scales;
          ['x', 'y', 'y1', 'y2'].forEach((axis) => {
            const cfg = scales[axis];
            if (cfg && cfg.title && typeof cfg.title.text === 'string') {
              cfg.title.text = I18N.translate(cfg.title.text);
            }
          });
        }
        chart.update();
      } catch (_) {}
    },
  };

  // Expose globally
  window.I18N = I18N;

  // Initialize immediately with Spanish as default
  try { I18N.init('es'); } catch (_) {}
})();

(function(){
  const PATH = 'js/i18n';
  const STORAGE_KEY = 'lang';
  const SUPPORTED = ['pt','es'];
  const HTML = document.documentElement;

  function get(obj, path){
    if(!obj) return undefined;
    return path.split('.').reduce((o,k)=> (o && Object.prototype.hasOwnProperty.call(o,k) ? o[k] : undefined), obj);
  }
  function format(str, params){
    if(!params) return str;
    return str.replace(/\{\{\s*(\w+)\s*\}\}/g, (_,k)=> (k in params ? String(params[k]) : ''));
  }

  const I18n = {
    locales: {},
    current: 'pt',
    fallback: 'pt',
    ready: Promise.resolve(),

    async load(lang){
      if(this.locales[lang]) return this.locales[lang];
      const url = `${PATH}/${lang}.json`;
      const res = await fetch(url, {cache:'no-cache'});
      if(!res.ok) throw new Error(`Failed to load locale: ${lang}`);
      const json = await res.json();
      this.locales[lang] = json;
      return json;
    },

    t(key, params){
      const cur = get(this.locales[this.current], key);
      if(typeof cur === 'string') return format(cur, params);
      const fb = get(this.locales[this.fallback], key);
      if(typeof fb === 'string') return format(fb, params);
      return key; // last resort
    },

    applyTranslations(root){
      const scope = root || document;
      const nodes = scope.querySelectorAll('[data-i18n]');
      nodes.forEach(el => {
        const key = el.getAttribute('data-i18n');
        const attrSpec = (el.getAttribute('data-i18n-attr')||'text').split('|');
        const txt = this.t(key);
        attrSpec.forEach(attr => {
          if(attr === 'text') el.textContent = txt;
          else el.setAttribute(attr, txt);
        });
      });
      // update <html lang>
      try { HTML.setAttribute('lang', this.current === 'pt' ? 'pt-BR' : this.current); } catch(_){}
    },

    async setLang(lang){
      if(!SUPPORTED.includes(lang)) lang = 'pt';
      if(!this.locales[lang]) await this.load(lang);
      this.current = lang;
      try { localStorage.setItem(STORAGE_KEY, lang); } catch(_){}
      this.applyTranslations(document);
      window.dispatchEvent(new CustomEvent('i18n:changed', {detail:{lang}}));
    },

    getLang(){ return this.current; },

    async init(opts){
      const def = (opts && opts.defaultLang) || 'es';
      const urlLang = new URLSearchParams(location.search).get('lang');
      let lang = urlLang || (()=>{try{return localStorage.getItem(STORAGE_KEY);}catch(_){return null;}})() || def;
      if(!SUPPORTED.includes(lang)) lang = 'es';

      // Preload fallback + selected
      this.ready = Promise.all([
        this.load(this.fallback),
        this.load(lang)
      ]).then(()=>{
        this.current = lang;
        if(document.readyState === 'loading'){
          document.addEventListener('DOMContentLoaded', ()=> this.applyTranslations(document));
        } else {
          this.applyTranslations(document);
        }
      });
      return this.ready;
    }
  };

  window.I18n = I18n;
})();
