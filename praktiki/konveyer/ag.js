/* Конвейер агрегации в браузере для практикума модуля 4.

   AG.parse(text)              разбирает конвейер в синтаксисе mongosh: [ { $match: … }, … ]
                               или вызов целиком db.orders.aggregate([ … ]).
   AG.run(docs, pipeline)      выполняет конвейер; возвращает { docs, steps }, где steps —
                               сколько документов вышло из каждой стадии.

   Стадии модуля 4: $match $sort $limit $skip $project $addFields $set $unset $group
   $count $sortByCount $unwind $bucket $facet $replaceRoot $replaceWith $redact.
   Выражения: путь "$поле", $add $subtract $multiply $divide $round $concat $toString
   $cond $ifNull $eq $ne $gt $gte $lt $lte $and $or $not $in $size $mergeObjects
   $sortArray $literal. Аккумуляторы: $sum $avg $min $max $push $addToSet $first $last.
   Ошибки сервера повторены с теми же кодами. Каждый конвейер практикума сверен
   с MongoDB 7 (скрипт сверки лежит вне репозитория). */
(function (root) {
  const MQ = root.MQ || (typeof require !== 'undefined' ? require('./mq.js') : null);
  const { QueryError } = MQ;

  class AggError extends Error {
    constructor(code, message) { super(`Ошибка ${code}: ${message}`); this.code = code; }
  }
  const fail = (code, msg) => { throw new AggError(code, msg); };

  const isPlain = v => v !== null && typeof v === 'object' && !Array.isArray(v)
    && !(v instanceof Date) && !(v instanceof RegExp) && !(v instanceof MQ.OID);
  const clone = v => (Array.isArray(v) ? v.map(clone) : isPlain(v) ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clone(x)])) : v);

  /* ── Разбор ──────────────────────────────────────────────────── */
  function parse(text) {
    let src = String(text).trim().replace(/;\s*$/, '');
    const call = /^db\.(\w+)\.aggregate\(\s*([\s\S]*)\)$/.exec(src);
    let collection = null;
    if (call) { collection = call[1]; src = call[2]; }
    if (!src) throw new QueryError('Конвейер пуст: нужен список стадий [ … ]');
    const value = MQ.parse('{ p: ' + src + ' }').p;
    if (!Array.isArray(value)) throw new QueryError('Конвейер — список стадий в квадратных скобках: [ { $match: … }, … ]');
    value.forEach((st, i) => {
      if (!isPlain(st)) throw new QueryError(`Стадия ${i + 1} должна быть документом { … }`);
    });
    return { collection, pipeline: value };
  }

  /* ── Сравнение и пути ────────────────────────────────────────── */
  const ORDER = { missing: 0, null: 1, number: 2, string: 3, object: 4, array: 5, oid: 6, bool: 7, date: 8 };
  const kind = v => (v === undefined ? 'missing' : v === null ? 'null' : typeof v === 'number' ? 'number'
    : typeof v === 'string' ? 'string' : typeof v === 'boolean' ? 'bool' : v instanceof Date ? 'date'
      : v instanceof MQ.OID ? 'oid' : Array.isArray(v) ? 'array' : 'object');
  function cmp(a, b) {
    const ta = kind(a), tb = kind(b);
    if (ta !== tb) {
      const na = ta === 'missing' ? 'null' : ta, nb = tb === 'missing' ? 'null' : tb;
      if (na === nb) return 0;
      return ORDER[na] - ORDER[nb];
    }
    if (ta === 'null' || ta === 'missing') return 0;
    if (ta === 'number') return a - b;
    if (ta === 'string') return a < b ? -1 : a > b ? 1 : 0;
    if (ta === 'bool') return (a ? 1 : 0) - (b ? 1 : 0);
    if (ta === 'date') return a.getTime() - b.getTime();
    if (ta === 'oid') return a.hex < b.hex ? -1 : a.hex > b.hex ? 1 : 0;
    if (ta === 'array') {
      for (let k = 0; k < Math.min(a.length, b.length); k++) { const c = cmp(a[k], b[k]); if (c) return c; }
      return a.length - b.length;
    }
    const ka = Object.keys(a), kb = Object.keys(b);
    for (let k = 0; k < Math.min(ka.length, kb.length); k++) {
      if (ka[k] !== kb[k]) return ka[k] < kb[k] ? -1 : 1;
      const c = cmp(a[ka[k]], b[kb[k]]);
      if (c) return c;
    }
    return ka.length - kb.length;
  }
  /* В выражениях отсутствующее поле меньше null и не равно ему. */
  function ecmp(a, b) {
    if ((a === undefined) !== (b === undefined)) return a === undefined ? -1 : 1;
    return cmp(a, b);
  }

  function get(doc, path) {
    let v = doc;
    for (const p of path.split('.')) {
      if (Array.isArray(v)) v = v.filter(isPlain).map(x => x[p]).filter(x => x !== undefined);
      else if (isPlain(v)) v = v[p];
      else return undefined;
    }
    return v;
  }
  function setPath(doc, path, value) {
    const parts = path.split('.');
    let o = doc;
    for (let k = 0; k < parts.length - 1; k++) {
      if (!isPlain(o[parts[k]])) o[parts[k]] = {};
      o = o[parts[k]];
    }
    o[parts[parts.length - 1]] = value;
  }
  function delPath(doc, path) {
    const parts = path.split('.');
    let o = doc;
    for (let k = 0; k < parts.length - 1; k++) { o = o[parts[k]]; if (!isPlain(o)) return; }
    delete o[parts[parts.length - 1]];
  }

  /* ── Выражения ───────────────────────────────────────────────── */
  const nul = v => v === null || v === undefined;
  const truthy = v => !(v === false || v === null || v === undefined || v === 0);
  const number = (v, op) => { if (typeof v !== 'number') fail(16554, `${op} работает только с числами, а получено ${MQ.show(v)}`); return v; };
  function roundHalfEven(x, places) {
    const m = Math.pow(10, places || 0);
    const y = x * m, f = Math.floor(y), d = y - f;
    let r = d > 0.5 + 1e-9 ? f + 1 : d < 0.5 - 1e-9 ? f : (f % 2 === 0 ? f : f + 1);
    return r / m;
  }

  function expr(doc, e) {
    if (typeof e === 'string') {
      if (e.startsWith('$$')) {
        if (e === '$$ROOT' || e === '$$CURRENT') return doc;
        if (e === '$$REMOVE') return undefined;
        return e;
      }
      if (e.startsWith('$')) return get(doc, e.slice(1));
      return e;
    }
    if (Array.isArray(e)) return e.map(x => expr(doc, x));
    if (!isPlain(e)) return e;
    const keys = Object.keys(e);
    if (keys.length === 1 && keys[0].startsWith('$')) return operator(doc, keys[0], e[keys[0]]);
    if (keys.some(k => k.startsWith('$'))) fail(15983, `в выражении поле не может начинаться с $: ${keys.find(k => k.startsWith('$'))}`);
    const out = {};
    keys.forEach(k => { const v = expr(doc, e[k]); if (v !== undefined) out[k] = v; });
    return out;
  }

  function operator(doc, op, raw) {
    if (op === '$literal') return raw;
    if (op === '$cond') {
      const [c, t, f] = Array.isArray(raw) ? raw : [raw.if, raw.then, raw.else];
      return truthy(expr(doc, c)) ? expr(doc, t) : expr(doc, f);
    }
    if (op === '$sortArray') {
      const input = expr(doc, raw.input);
      if (nul(input)) return null;
      const dir = raw.sortBy;
      if (isPlain(dir)) {
        const [[k, d]] = Object.entries(dir);
        return input.slice().sort((a, b) => cmp(get(a, k), get(b, k)) * d);
      }
      return input.slice().sort((a, b) => cmp(a, b) * dir);
    }
    const args = (Array.isArray(raw) ? raw : [raw]).map(x => expr(doc, x));
    switch (op) {
      case '$add': return args.some(nul) ? null : args.reduce((s, v) => s + number(v, op), 0);
      case '$multiply': return args.some(nul) ? null : args.reduce((s, v) => s * number(v, op), 1);
      case '$subtract': return args.some(nul) ? null : number(args[0], op) - number(args[1], op);
      case '$divide': return args.some(nul) ? null : number(args[0], op) / number(args[1], op);
      case '$round': return nul(args[0]) ? null : roundHalfEven(number(args[0], op), args[1] || 0);
      case '$concat':
        if (args.some(nul)) return null;
        args.forEach(v => { if (typeof v !== 'string') fail(16702, `$concat принимает только строки, а получено ${MQ.show(v)}`); });
        return args.join('');
      case '$toString':
        if (nul(args[0])) return null;
        return args[0] instanceof Date ? args[0].toISOString() : String(args[0]);
      case '$ifNull': return args.find(v => !nul(v)) ?? null;
      case '$eq': return ecmp(args[0], args[1]) === 0;
      case '$ne': return ecmp(args[0], args[1]) !== 0;
      case '$gt': return ecmp(args[0], args[1]) > 0;
      case '$gte': return ecmp(args[0], args[1]) >= 0;
      case '$lt': return ecmp(args[0], args[1]) < 0;
      case '$lte': return ecmp(args[0], args[1]) <= 0;
      case '$and': return args.every(truthy);
      case '$or': return args.some(truthy);
      case '$not': return !truthy(args[0]);
      case '$in':
        if (!Array.isArray(args[1])) fail(40081, '$in: второй аргумент должен быть массивом');
        return args[1].some(v => ecmp(v, args[0]) === 0);
      case '$size':
        if (!Array.isArray(args[0])) fail(17124, '$size: значение должно быть массивом');
        return args[0].length;
      case '$mergeObjects': {
        const out = {};
        args.forEach(v => { if (nul(v)) return; if (!isPlain(v)) fail(40400, '$mergeObjects принимает только документы'); Object.assign(out, v); });
        return out;
      }
      default: fail(168, `неизвестный оператор выражения ${op}`);
    }
  }

  /* ── Аккумуляторы ────────────────────────────────────────────── */
  const ACC = ['$sum', '$avg', '$min', '$max', '$push', '$addToSet', '$first', '$last'];
  function accumulate(op, values) {
    const nums = values.filter(v => typeof v === 'number');
    switch (op) {
      case '$sum': return nums.reduce((s, v) => s + v, 0);
      case '$avg': return nums.length ? nums.reduce((s, v) => s + v, 0) / nums.length : null;
      case '$min': { const vs = values.filter(v => !nul(v)); return vs.length ? vs.reduce((m, v) => (cmp(v, m) < 0 ? v : m)) : null; }
      case '$max': { const vs = values.filter(v => !nul(v)); return vs.length ? vs.reduce((m, v) => (cmp(v, m) > 0 ? v : m)) : null; }
      case '$push': return values.filter(v => v !== undefined);
      case '$addToSet': {
        const out = [];
        values.forEach(v => { if (v !== undefined && !out.some(x => cmp(x, v) === 0 && kind(x) === kind(v))) out.push(v); });
        return out;
      }
      case '$first': return values.length ? (values[0] === undefined ? null : values[0]) : null;
      case '$last': return values.length ? (values[values.length - 1] === undefined ? null : values[values.length - 1]) : null;
    }
  }
  function accSpec(name, spec, stage) {
    if (!isPlain(spec) || Object.keys(spec).length !== 1) {
      if (isPlain(spec) && Object.keys(spec).length > 1) fail(40238, `у поля «${name}» должен быть один аккумулятор`);
      fail(40234, `поле «${name}» должно быть аккумулятором, например { $sum: … }`);
    }
    const [op] = Object.keys(spec);
    if (!ACC.includes(op)) fail(15952, `неизвестный аккумулятор ${op} в ${stage}`);
    return [op, spec[op]];
  }
  function groupDocs(docs, idExpr, fields, stage) {
    const accs = Object.entries(fields).map(([name, spec]) => [name, ...accSpec(name, spec, stage)]);
    const groups = new Map();
    docs.forEach(d => {
      let id = expr(d, idExpr);
      if (id === undefined) id = null;
      const key = JSON.stringify(id instanceof Date ? { $d: id.getTime() } : id);
      if (!groups.has(key)) groups.set(key, { id, vals: accs.map(() => []) });
      const g = groups.get(key);
      accs.forEach(([, op, e], k) => g.vals[k].push(op === '$sum' && typeof e === 'number' ? e : expr(d, e)));
    });
    return [...groups.values()].map(g => {
      const out = { _id: g.id };
      accs.forEach(([name, op], k) => { out[name] = accumulate(op, g.vals[k]); });
      return out;
    });
  }

  /* ── Стадии ──────────────────────────────────────────────────── */
  function sortDocs(docs, spec) {
    const keys = Object.entries(spec);
    return docs.map((d, i) => [d, i]).sort((x, y) => {
      for (const [k, dir] of keys) { const c = cmp(get(x[0], k), get(y[0], k)); if (c) return c * dir; }
      return x[1] - y[1];
    }).map(p => p[0]);
  }

  function project(docs, spec) {
    const entries = Object.entries(spec);
    const flagOf = v => (v === 0 || v === false ? 'out' : v === 1 || v === true || (typeof v === 'number') ? 'in' : 'expr');
    const nonId = entries.filter(([k]) => k !== '_id');
    const flags = nonId.map(([, v]) => (isPlain(v) && !Object.keys(v).some(k => k.startsWith('$')) ? 'in' : flagOf(v)));
    const excl = flags.includes('out');
    if (excl && flags.includes('in')) fail(31254, 'в одной проекции нельзя включать и исключать поля, кроме _id');
    if (excl && flags.includes('expr')) fail(31310, 'в исключающей проекции нельзя добавлять новые поля');
    const idSpec = spec._id;
    if (excl || (!nonId.length && flagOf(idSpec) === 'out')) {
      return docs.map(d => {
        const out = clone(d);
        entries.forEach(([k, v]) => { if (flagOf(v) === 'out') delPath(out, k); });
        return out;
      });
    }
    return docs.map(d => {
      const out = {};
      if (idSpec === undefined || flagOf(idSpec) === 'in') { if (d._id !== undefined) out._id = d._id; }
      else if (flagOf(idSpec) === 'expr') { const v = expr(d, idSpec); if (v !== undefined) out._id = v; }
      const incl = nonId.filter(([, v], i) => flags[i] === 'in').map(([k, v]) => [k, v]);
      // включённые поля — в порядке документа
      const paths = [];
      incl.forEach(([k, v]) => {
        if (isPlain(v)) Object.keys(v).forEach(sub => paths.push(k + '.' + sub)); else paths.push(k);
      });
      Object.keys(d).forEach(top => {
        if (top === '_id') return;
        const mine = paths.filter(p => p === top || p.startsWith(top + '.'));
        if (!mine.length) return;
        if (mine.includes(top)) { out[top] = clone(d[top]); return; }
        const sub = d[top];
        const pick = s => { const o = {}; mine.forEach(p => { const rest = p.slice(top.length + 1).split('.')[0]; if (isPlain(s) && s[rest] !== undefined) o[rest] = clone(s[rest]); }); return o; };
        if (Array.isArray(sub)) out[top] = sub.filter(isPlain).map(pick);
        else if (isPlain(sub)) out[top] = pick(sub);
      });
      nonId.forEach(([k, v], i) => { if (flags[i] === 'expr') { const val = expr(d, v); if (val !== undefined) setPath(out, k, val); } });
      return out;
    });
  }

  function addFields(docs, spec) {
    return docs.map(d => {
      const out = clone(d);
      Object.entries(spec).forEach(([k, v]) => {
        const val = expr(d, v);
        if (val === undefined) delPath(out, k); else setPath(out, k, val);
      });
      return out;
    });
  }

  function unwind(docs, arg) {
    const o = typeof arg === 'string' ? { path: arg } : arg;
    if (typeof o.path !== 'string' || !o.path.startsWith('$')) fail(28818, `путь в $unwind должен начинаться с $: ${o.path}`);
    const path = o.path.slice(1), idx = o.includeArrayIndex, keep = !!o.preserveNullAndEmptyArrays;
    const out = [];
    docs.forEach(d => {
      const v = get(d, path);
      if (Array.isArray(v) && v.length) {
        v.forEach((el, i) => { const c = clone(d); setPath(c, path, clone(el)); if (idx) setPath(c, idx, i); out.push(c); });
      } else if (v !== undefined && v !== null && !Array.isArray(v)) {
        const c = clone(d); if (idx) setPath(c, idx, null); out.push(c);
      } else if (keep) {
        const c = clone(d); if (Array.isArray(v)) delPath(c, path); if (idx) setPath(c, idx, null); out.push(c);
      }
    });
    return out;
  }

  function bucket(docs, a) {
    const b = a.boundaries;
    for (let k = 1; k < b.length; k++) if (cmp(b[k - 1], b[k]) >= 0) fail(40194, `границы $bucket должны идти по возрастанию: ${MQ.show(b[k - 1])} не меньше ${MQ.show(b[k])}`);
    const fields = a.output || { count: { $sum: 1 } };
    const buckets = new Map();
    docs.forEach(d => {
      const v = expr(d, a.groupBy);
      let key = null;
      for (let k = 0; k < b.length - 1; k++) if (cmp(v, b[k]) >= 0 && cmp(v, b[k + 1]) < 0 && kind(v) === kind(b[k])) { key = k; break; }
      if (key === null) {
        if (!('default' in a)) fail(40066, '$switch could not find a matching branch for an input, and no default was specified.');
        key = 'default';
      }
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(d);
    });
    // корзины выходят по возрастанию _id в общем порядке типов: строка default — раньше дат, позже чисел
    return [...buckets.keys()].map(k => {
      const g = groupDocs(buckets.get(k), null, fields, '$bucket')[0];
      g._id = k === 'default' ? a.default : b[k];
      return g;
    }).sort((x, y) => cmp(x._id, y._id));
  }

  function redact(doc, e) {
    const act = expr(doc, e);
    if (act === '$$PRUNE') return undefined;
    if (act === '$$KEEP') return doc;
    if (act !== '$$DESCEND') fail(17053, '$redact: выражение должно вернуть $$KEEP, $$PRUNE или $$DESCEND');
    const out = {};
    Object.keys(doc).forEach(k => {
      const v = doc[k];
      if (isPlain(v)) { const r = redact(v, e); if (r !== undefined) out[k] = r; }
      else if (Array.isArray(v)) out[k] = v.map(x => (isPlain(x) ? redact(x, e) : x)).filter(x => x !== undefined);
      else out[k] = v;
    });
    return out;
  }

  const STAGES = ['$match', '$sort', '$limit', '$skip', '$project', '$addFields', '$set', '$unset', '$group',
    '$count', '$sortByCount', '$unwind', '$bucket', '$facet', '$replaceRoot', '$replaceWith', '$redact'];

  function stage(docs, st, nested) {
    const keys = Object.keys(st);
    if (keys.length !== 1) fail(40323, 'стадия конвейера должна содержать ровно одно поле — имя стадии');
    const [name] = keys, a = st[name];
    if (!STAGES.includes(name)) fail(40324, `неизвестная стадия ${name}`);
    switch (name) {
      case '$match': return docs.filter(d => MQ.match(d, a));
      case '$sort': return sortDocs(docs, a);
      case '$limit': return docs.slice(0, a);
      case '$skip': return docs.slice(a);
      case '$project': return project(docs, a);
      case '$addFields': case '$set': return addFields(docs, a);
      case '$unset': { const ps = Array.isArray(a) ? a : [a]; return docs.map(d => { const c = clone(d); ps.forEach(p => delPath(c, p)); return c; }); }
      case '$group': {
        if (!('_id' in a)) fail(15955, 'у стадии $group нет обязательного поля _id');
        const { _id, ...fields } = a;
        return groupDocs(docs, _id, fields, '$group');
      }
      case '$count':
        if (typeof a !== 'string' || a.startsWith('$')) fail(40158, 'имя поля в $count не может начинаться с $');
        return docs.length ? [{ [a]: docs.length }] : [];
      case '$sortByCount': return sortDocs(groupDocs(docs, a, { count: { $sum: 1 } }, '$sortByCount'), { count: -1 });
      case '$unwind': return unwind(docs, a);
      case '$bucket': return bucket(docs, a);
      case '$facet': {
        if (nested) fail(40600, '$facet нельзя использовать внутри $facet');
        const out = {};
        Object.entries(a).forEach(([k, p]) => { out[k] = runPipeline(docs, p, true).docs; });
        return [out];
      }
      case '$replaceRoot': case '$replaceWith': {
        const e = name === '$replaceRoot' ? a.newRoot : a;
        return docs.map(d => {
          const v = expr(d, e);
          if (!isPlain(v)) fail(40228, `'newRoot' expression must evaluate to an object, but resulting value was: ${v === undefined ? 'MISSING' : MQ.show(v)}`);
          return v;
        });
      }
      case '$redact': return docs.map(d => redact(d, a)).filter(d => d !== undefined);
    }
  }

  function runPipeline(docs, pipeline, nested) {
    let cur = docs.map(clone);
    const steps = [];
    pipeline.forEach(st => {
      cur = stage(cur, st, nested);
      steps.push({ name: Object.keys(st)[0], count: cur.length });
    });
    return { docs: cur, steps };
  }

  const api = { parse, run: (docs, p) => runPipeline(docs, p, false), cmp, AggError, QueryError };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.AG = api;
})(typeof window !== 'undefined' ? window : globalThis);
