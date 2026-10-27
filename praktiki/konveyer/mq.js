/* Маленький движок фильтров MongoDB для практикума «Аналитик данных».

   Делает три вещи:
     parse(text)          разбирает фильтр в синтаксисе mongosh: ключи без кавычек,
                          строки в '…' и "…", /шаблон/флаги, ISODate("…"), new Date("…"),
                          ObjectId("…"). Повторный ключ перезаписывает предыдущий —
                          так же, как в mongosh.
     match(doc, filter)   отвечает, подходит ли документ под фильтр.
     show(value)          печатает значение так, как его печатает mongosh.

   Поддерживаются операторы модуля 2 справочника: $eq $ne $gt $gte $lt $lte $in $nin
   $and $or $nor $not $exists $type $all $elemMatch $size $regex $options $expr
   (в $expr — сравнения, $and $or $not, $add $subtract $multiply $divide).
   Каждый запрос практикума сверен с настоящим сервером MongoDB 7
   (скрипт сверки лежит вне репозитория). */
(function (root) {
  class OID {
    constructor(hex) { this.hex = String(hex); }
    toString() { return this.hex; }
  }

  class QueryError extends Error {}

  /* ── Разбор текста ───────────────────────────────────────────── */
  function parse(text) {
    let i = 0;
    const src = String(text);
    const fail = msg => {
      const line = src.slice(0, i).split('\n').length;
      throw new QueryError(`${msg} (строка ${line})`);
    };
    const space = () => {
      while (i < src.length) {
        if (/\s/.test(src[i])) { i++; continue; }
        if (src.startsWith('//', i)) { while (i < src.length && src[i] !== '\n') i++; continue; }
        break;
      }
    };
    const peek = () => { space(); return src[i]; };
    const expect = ch => {
      if (peek() !== ch) fail(src[i] === undefined ? `Не хватает «${ch}» в конце` : `Ожидался символ «${ch}», а стоит «${src[i]}»`);
      i++;
    };

    const string = () => {
      const q = src[i++];
      let out = '';
      while (i < src.length && src[i] !== q) {
        if (src[i] === '\\') {
          const n = src[i + 1];
          out += n === 'n' ? '\n' : n === 't' ? '\t' : n;
          i += 2;
        } else if (src[i] === '\n') fail('Строка не закрыта кавычкой');
        else out += src[i++];
      }
      if (src[i] !== q) fail('Строка не закрыта кавычкой');
      i++;
      return out;
    };

    const ident = () => {
      const m = /^[$A-Za-z_Ѐ-ӿ][$\w.Ѐ-ӿ]*/.exec(src.slice(i));
      if (!m) return null;
      i += m[0].length;
      return m[0];
    };

    const value = () => {
      const ch = peek();
      if (ch === undefined) fail('Запрос оборвался');
      if (ch === '{') return object();
      if (ch === '[') return array();
      if (ch === '"' || ch === "'") return string();
      if (ch === '/') {
        const m = /^\/((?:\\.|[^\/\\\n])+)\/([a-z]*)/.exec(src.slice(i));
        if (!m) fail('Не удалось разобрать шаблон /…/');
        i += m[0].length;
        try { return new RegExp(m[1], m[2]); } catch (e) { fail('Ошибка в шаблоне: ' + e.message); }
      }
      const num = /^-?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(src.slice(i));
      if (num) { i += num[0].length; return Number(num[0]); }
      const start = i;
      let word = ident();
      if (word === 'new') { space(); word = ident(); }
      if (word === 'true') return true;
      if (word === 'false') return false;
      if (word === 'null') return null;
      if (word === 'ISODate' || word === 'Date' || word === 'ObjectId') {
        expect('(');
        const arg = peek() === ')' ? null : value();
        expect(')');
        if (word === 'ObjectId') return new OID(arg);
        const d = arg === null ? new Date() : new Date(arg);
        if (isNaN(d)) fail(`Не удалось разобрать дату «${arg}»`);
        return d;
      }
      i = start;
      fail(word ? `Неизвестное слово «${word}». Строки пишутся в кавычках` : `Непонятный символ «${src[i]}»`);
    };

    const object = () => {
      expect('{');
      const out = {};
      while (peek() !== '}') {
        let key;
        const ch = peek();
        if (ch === '"' || ch === "'") key = string();
        else {
          key = ident();
          if (!key) fail(`Ожидалось имя поля, а стоит «${src[i]}»`);
        }
        expect(':');
        const v = value();
        if (Object.prototype.hasOwnProperty.call(out, key)) delete out[key]; // повторный ключ встаёт на место последнего
        out[key] = v;
        if (peek() === ',') { i++; continue; }
        if (peek() !== '}') fail(src[i] === undefined ? 'Не хватает «}» в конце' : `Ожидалась запятая или «}», а стоит «${src[i]}»`);
      }
      i++;
      return out;
    };

    const array = () => {
      expect('[');
      const out = [];
      while (peek() !== ']') {
        out.push(value());
        if (peek() === ',') { i++; continue; }
        if (peek() !== ']') fail(src[i] === undefined ? 'Не хватает «]» в конце' : `Ожидалась запятая или «]», а стоит «${src[i]}»`);
      }
      i++;
      return out;
    };

    space();
    if (i >= src.length) return {};
    const v = value();
    space();
    if (i < src.length) fail(`Лишний текст после фильтра: «${src.slice(i, i + 20)}»`);
    if (!isPlain(v)) throw new QueryError('Фильтр должен быть документом в фигурных скобках { … }');
    return v;
  }

  /* Если вставлен целый вызов db.коллекция.find(…), достаём из него фильтр. */
  function unwrap(text) {
    const m = /^\s*db\.(\w+)\.find\(\s*([\s\S]*?)\s*\)\s*;?\s*$/.exec(text);
    if (!m) return { collection: null, filter: text };
    return { collection: m[1], filter: m[2] };
  }

  /* ── Типы и сравнение ────────────────────────────────────────── */
  const isPlain = v => v !== null && typeof v === 'object' && !Array.isArray(v)
    && !(v instanceof Date) && !(v instanceof RegExp) && !(v instanceof OID);

  /* Скобки типов: сравнения $gt/$lt работают только внутри одной скобки. */
  const bracket = v => {
    if (v === undefined) return 'missing';
    if (v === null) return 'null';
    if (typeof v === 'number') return 'number';
    if (typeof v === 'string') return 'string';
    if (typeof v === 'boolean') return 'bool';
    if (v instanceof Date) return 'date';
    if (v instanceof OID) return 'oid';
    if (Array.isArray(v)) return 'array';
    return 'object';
  };

  /* Общий порядок типов — для сравнений внутри $expr. */
  const ORDER = { missing: 0, null: 1, number: 2, string: 3, object: 4, array: 5, oid: 6, bool: 7, date: 8 };

  const cmp = (a, b) => {
    const ta = bracket(a), tb = bracket(b);
    if (ta !== tb) return ORDER[ta] - ORDER[tb];
    if (ta === 'null' || ta === 'missing') return 0;
    if (ta === 'number') return a - b;
    if (ta === 'string') return a < b ? -1 : a > b ? 1 : 0;
    if (ta === 'bool') return (a ? 1 : 0) - (b ? 1 : 0);
    if (ta === 'date') return a.getTime() - b.getTime();
    if (ta === 'oid') return a.hex < b.hex ? -1 : a.hex > b.hex ? 1 : 0;
    if (ta === 'array') {
      for (let k = 0; k < Math.min(a.length, b.length); k++) {
        const c = cmp(a[k], b[k]);
        if (c) return c;
      }
      return a.length - b.length;
    }
    const ka = Object.keys(a), kb = Object.keys(b);
    for (let k = 0; k < Math.min(ka.length, kb.length); k++) {
      if (ka[k] !== kb[k]) return ka[k] < kb[k] ? -1 : 1;
      const c = cmp(a[ka[k]], b[kb[k]]);
      if (c) return c;
    }
    return ka.length - kb.length;
  };

  /* Равенство как в MongoDB: вложенные документы — с порядком полей. */
  const same = (a, b) => {
    if (a === undefined) a = null;
    if (b === undefined) b = null;
    if (bracket(a) !== bracket(b)) return false;
    return cmp(a, b) === 0;
  };

  /* ── Значения по пути с точками ──────────────────────────────── */
  /* Возвращает все значения, до которых доходит путь. Если путь проходит
     через массив, берутся значения из каждого элемента — так MongoDB
     сопоставляет «experience.company». MISSING означает «поля нет»: его дают
     документ без поля и элемент-документ без поля. Пустой массив и массив
     строк по пути не дают ни значения, ни MISSING. */
  const MISSING = { missing: true };
  function reach(value, parts) {
    if (!parts.length) return [value === undefined ? MISSING : value];
    const [head, ...rest] = parts;
    if (Array.isArray(value)) {
      const out = [];
      if (/^\d+$/.test(head)) {
        if (+head < value.length) out.push(...reach(value[+head], rest));
      }
      value.forEach(el => { if (isPlain(el)) out.push(...reach(el[head], rest)); });
      return out;
    }
    if (isPlain(value)) return reach(value[head], rest);
    return [MISSING];
  }

  /* Значения для сравнения: сам массив и каждый его элемент. Отсутствие — не значение. */
  const spread = vals => {
    const out = [];
    vals.forEach(v => { if (v === MISSING) return; out.push(v); if (Array.isArray(v)) out.push(...v); });
    return out;
  };
  const present = vals => vals.some(v => v !== MISSING);

  const TYPES = {
    double: v => typeof v === 'number' && !Number.isInteger(v), 1: 'double',
    string: v => typeof v === 'string', 2: 'string',
    object: v => isPlain(v), 3: 'object',
    array: v => Array.isArray(v), 4: 'array',
    objectId: v => v instanceof OID, 7: 'objectId',
    bool: v => typeof v === 'boolean', 8: 'bool',
    date: v => v instanceof Date, 9: 'date',
    null: v => v === null, 10: 'null',
    regex: v => v instanceof RegExp, 11: 'regex',
    int: v => typeof v === 'number' && Number.isInteger(v), 16: 'int',
    long: () => false, 18: 'long',
    decimal: () => false, 19: 'decimal',
    number: v => typeof v === 'number',
  };
  const typeTest = t => {
    let k = t;
    if (typeof TYPES[k] === 'string') k = TYPES[k];
    if (typeof TYPES[k] !== 'function') throw new QueryError(`Неизвестный тип в $type: ${JSON.stringify(t)}`);
    return TYPES[k];
  };

  const OPS = new Set(['$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin', '$exists', '$type',
    '$all', '$elemMatch', '$size', '$regex', '$options', '$not']);

  const isOperatorDoc = v => isPlain(v) && Object.keys(v).length > 0 && Object.keys(v).every(k => k.startsWith('$'));

  /* Совпадение одного значения с образцом (для $eq, $in, $all). */
  const eqAny = (vals, pattern) => {
    if (pattern instanceof RegExp) return spread(vals).some(v => typeof v === 'string' && testRe(pattern, v));
    if (pattern === null) return vals.includes(MISSING) || spread(vals).some(v => v === null);
    return spread(vals).some(v => same(v, pattern));
  };
  const testRe = (re, s) => { re.lastIndex = 0; return re.test(s); };

  /* Проверка условия-оператора для поля. vals — значения по пути. */
  function fieldOps(vals, ops) {
    const keys = Object.keys(ops);
    for (const op of keys) {
      if (!OPS.has(op)) throw new QueryError(`Неизвестный оператор ${op}`);
      const arg = ops[op];
      let ok;
      switch (op) {
        case '$eq': ok = eqAny(vals, arg); break;
        case '$ne': ok = !eqAny(vals, arg); break;
        case '$gt': case '$gte': case '$lt': case '$lte': {
          if (arg instanceof RegExp) throw new QueryError(`${op} не принимает шаблон`);
          const pass = c => (op === '$gt' ? c > 0 : op === '$gte' ? c >= 0 : op === '$lt' ? c < 0 : c <= 0);
          const items = spread(vals);
          if (arg === null) ok = (op === '$gte' || op === '$lte') && (vals.includes(MISSING) || items.some(v => v === null));
          else ok = items.some(v => !Array.isArray(v) && bracket(v) === bracket(arg) && pass(cmp(v, arg)));
          break;
        }
        case '$in': case '$nin': {
          if (!Array.isArray(arg)) throw new QueryError(`${op} ожидает список в квадратных скобках`);
          const hit = arg.some(p => eqAny(vals, p));
          ok = op === '$in' ? hit : !hit;
          break;
        }
        case '$exists': ok = present(vals) === !!arg; break;
        case '$type': {
          const list = Array.isArray(arg) ? arg : [arg];
          const tests = list.map(typeTest);
          ok = spread(vals).some(v => tests.some(t => t(v)));
          break;
        }
        case '$all': {
          if (!Array.isArray(arg)) throw new QueryError('$all ожидает список в квадратных скобках');
          ok = arg.length > 0 && arg.every(p => eqAny(vals, p));
          break;
        }
        case '$size': ok = vals.some(v => Array.isArray(v) && v.length === arg); break;
        case '$elemMatch': {
          if (!isPlain(arg)) throw new QueryError('$elemMatch ожидает документ { … }');
          const asOps = isOperatorDoc(arg) && Object.keys(arg).every(k => OPS.has(k));
          ok = vals.some(v => Array.isArray(v) && v.some(el =>
            asOps ? fieldOps([el], arg) : (isPlain(el) && match(el, arg))));
          break;
        }
        case '$regex': {
          let re;
          try { re = arg instanceof RegExp ? new RegExp(arg.source, ops.$options || arg.flags) : new RegExp(arg, ops.$options || ''); }
          catch (e) { throw new QueryError('Ошибка в шаблоне: ' + e.message); }
          ok = spread(vals).some(v => typeof v === 'string' && testRe(re, v));
          break;
        }
        case '$options':
          if (!('$regex' in ops)) throw new QueryError('$options без $regex');
          ok = true; break;
        case '$not':
          if (arg instanceof RegExp) ok = !spread(vals).some(v => typeof v === 'string' && testRe(arg, v));
          else if (isOperatorDoc(arg)) ok = !fieldOps(vals, arg);
          else throw new QueryError('$not ожидает оператор { $… } или шаблон /…/');
          break;
      }
      if (!ok) return false;
    }
    return true;
  }

  /* ── $expr ───────────────────────────────────────────────────── */
  function exprValue(doc, e) {
    if (typeof e === 'string' && e.startsWith('$')) {
      const parts = e.slice(1).split('.');
      let v = doc;
      for (const p of parts) {
        if (Array.isArray(v)) v = v.filter(isPlain).map(x => x[p]).filter(x => x !== undefined);
        else if (isPlain(v)) v = v[p];
        else { v = undefined; break; }
      }
      return v;
    }
    if (Array.isArray(e)) return e.map(x => exprValue(doc, x));
    if (isPlain(e)) {
      const keys = Object.keys(e);
      if (keys.length === 1 && keys[0].startsWith('$')) {
        const op = keys[0];
        const args = (Array.isArray(e[op]) ? e[op] : [e[op]]).map(x => exprValue(doc, x));
        const nul = v => v === null || v === undefined;
        switch (op) {
          case '$eq': return cmp(args[0], args[1]) === 0;
          case '$ne': return cmp(args[0], args[1]) !== 0;
          case '$gt': return cmp(args[0], args[1]) > 0;
          case '$gte': return cmp(args[0], args[1]) >= 0;
          case '$lt': return cmp(args[0], args[1]) < 0;
          case '$lte': return cmp(args[0], args[1]) <= 0;
          case '$and': return args.every(truthy);
          case '$or': return args.some(truthy);
          case '$not': return !truthy(args[0]);
          case '$add': return args.some(nul) ? null : args.reduce((s, v) => s + num(v, op), 0);
          case '$multiply': return args.some(nul) ? null : args.reduce((s, v) => s * num(v, op), 1);
          case '$subtract': return args.some(nul) ? null : num(args[0], op) - num(args[1], op);
          case '$divide': return args.some(nul) ? null : num(args[0], op) / num(args[1], op);
          default: throw new QueryError(`Оператор ${op} внутри $expr в этом практикуме не используется`);
        }
      }
      const out = {};
      keys.forEach(k => { out[k] = exprValue(doc, e[k]); });
      return out;
    }
    return e;
  }
  const num = (v, op) => {
    if (typeof v !== 'number') throw new QueryError(`${op}: значение ${show(v)} — не число`);
    return v;
  };
  const truthy = v => !(v === false || v === null || v === undefined || v === 0);

  /* ── Сопоставление документа ─────────────────────────────────── */
  function match(doc, filter) {
    for (const key of Object.keys(filter)) {
      const cond = filter[key];
      if (key.startsWith('$')) {
        if (key === '$and' || key === '$or' || key === '$nor') {
          if (!Array.isArray(cond) || !cond.length) throw new QueryError(`${key} ожидает непустой список условий [ … ]`);
          cond.forEach(c => { if (!isPlain(c)) throw new QueryError(`Каждое условие в ${key} — документ { … }`); });
          const res = key === '$and' ? cond.every(c => match(doc, c))
            : key === '$or' ? cond.some(c => match(doc, c))
            : !cond.some(c => match(doc, c));
          if (!res) return false;
        } else if (key === '$expr') {
          if (!truthy(exprValue(doc, cond))) return false;
        } else {
          throw new QueryError(`Оператор ${key} не может стоять на месте имени поля`);
        }
        continue;
      }
      const vals = reach(doc, key.split('.'));
      if (isPlain(cond) && Object.keys(cond).some(k => k.startsWith('$'))) {
        if (!Object.keys(cond).every(k => k.startsWith('$'))) {
          throw new QueryError(`В условии на поле «${key}» нельзя смешивать операторы и обычные поля`);
        }
        if (!fieldOps(vals, cond)) return false;
      } else if (!eqAny(vals, cond)) {
        return false;
      }
    }
    return true;
  }

  function find(docs, filter) {
    return docs.filter(d => match(d, filter));
  }

  /* ── Печать как в mongosh ────────────────────────────────────── */
  function show(v, indent) {
    const pad = indent || '';
    if (v === undefined) return 'undefined';
    if (v === null) return 'null';
    if (typeof v === 'string') return `'${v.replace(/'/g, "\\'")}'`;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (v instanceof Date) return `ISODate('${v.toISOString()}')`;
    if (v instanceof OID) return `ObjectId('${v.hex}')`;
    if (v instanceof RegExp) return String(v);
    const inner = pad + '  ';
    if (Array.isArray(v)) {
      if (!v.length) return '[]';
      const flat = v.map(x => show(x, inner));
      const line = `[ ${flat.join(', ')} ]`;
      if (line.length <= 72 && !line.includes('\n')) return line;
      return `[\n${flat.map(x => inner + x).join(',\n')}\n${pad}]`;
    }
    const keys = Object.keys(v);
    if (!keys.length) return '{}';
    const key = k => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`);
    const flat = keys.map(k => `${key(k)}: ${show(v[k], inner)}`);
    const line = `{ ${flat.join(', ')} }`;
    if (line.length <= 72 && !line.includes('\n')) return line;
    return `{\n${flat.map(x => inner + x).join(',\n')}\n${pad}}`;
  }

  /* Данные стенда в EJSON → значения JS. */
  function revive(v) {
    if (Array.isArray(v)) return v.map(revive);
    if (v && typeof v === 'object') {
      if ('$oid' in v) return new OID(v.$oid);
      if ('$date' in v) return new Date(v.$date);
      const out = {};
      Object.keys(v).forEach(k => { out[k] = revive(v[k]); });
      return out;
    }
    return v;
  }

  const api = { parse, unwrap, match, find, show, revive, same, OID, QueryError };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.MQ = api;
})(typeof window !== 'undefined' ? window : globalThis);
