// =============================================
// PARSER
// =============================================
const Parser = {
  tokenize(code) {
    const tokens = [];
    const regex = /\s*(!=|<=|>=|==|&&|\|\||\.\.|=>|[+\-*\/\^%?:(),.[\]{}<>!]|\d+\.?\d*|"[^"]*"|[a-zA-Z_][a-zA-Z0-9_]*)\s*/g;
    let match;
    while ((match = regex.exec(code)) !== null) if (match[1]) tokens.push(match[1]);
    return tokens;
  },
  parse(code) {
    const tokens = this.tokenize(code);
    let pos = 0;
    const peek = () => tokens[pos];
    const consume = (expected) => {
      const t = tokens[pos++];
      if (expected && t !== expected) throw new Error(`Expected '${expected}' but got '${t || 'EOF'}'`);
      return t;
    };

    const expr = () => {
      let node = or();
      if (peek() === '?') {
        consume();
        const t = expr();
        consume(':');
        const f = expr();
        node = { type: 'ternary', cond: node, t, f };
      }
      return node;
    };
    const or = () => { let l = and(); while (peek() === '||') { consume(); l = { type: 'binop', op: '||', l, r: and() }; } return l; };
    const and = () => { let l = eq(); while (peek() === '&&') { consume(); l = { type: 'binop', op: '&&', l, r: eq() }; } return l; };
    const eq = () => { let l = cmp(); while (peek() === '==' || peek() === '!=') { const op = consume(); l = { type: 'binop', op, l, r: cmp() }; } return l; };
    const cmp = () => { let l = add(); while (['<', '>', '<=', '>='].includes(peek())) { const op = consume(); l = { type: 'binop', op, l, r: add() }; } return l; };
    const add = () => { let l = mul(); while (peek() === '+' || peek() === '-') { const op = consume(); l = { type: 'binop', op, l, r: mul() }; } return l; };
    const mul = () => { let l = modop(); while (peek() === '*' || peek() === '/') { const op = consume(); l = { type: 'binop', op, l, r: modop() }; } return l; };
    const modop = () => { let l = powop(); while (peek() === '%') { consume(); l = { type: 'binop', op: '%', l, r: powop() }; } return l; };
    const powop = () => { let l = unary(); if (peek() === '^') { consume(); return { type: 'binop', op: '^', l, r: powop() }; } return l; };

    const unary = () => {
      if (peek() === '-') { consume(); return { type: 'unary', op: '-', arg: unary() }; }
      if (peek() === '!') { consume(); return { type: 'unary', op: '!', arg: unary() }; }
      return postfix();
    };

    const postfix = () => {
      let node = atom();
      while (peek() === '[') {
        consume();
        const index = expr();
        consume(']');
        node = { type: 'index', target: node, index };
      }
      return node;
    };

    const atom = () => {
      const t = peek();
      if (t === '(') { consume(); const n = expr(); consume(')'); return n; }
      if (t === '{') {
        consume();
        const items = [];
        if (peek() !== '}') { items.push(expr()); while (peek() === ',') { consume(); items.push(expr()); } }
        consume('}');
        return { type: 'array', items };
      }
      if (t && t.startsWith('"')) { consume(); return { type: 'str', val: t.slice(1, -1) }; }
      if (t && /^\d/.test(t)) { consume(); return { type: 'num', val: parseFloat(t) }; }
      if (t && /^[a-zA-Z_]/.test(t)) {
        consume();
        if (peek() === '(') {
          consume();
          const args = [];
          if (peek() !== ')') { args.push(expr()); while (peek() === ',') { consume(); args.push(expr()); } }
          consume(')');
          return { type: 'call', name: t, args };
        }
        return { type: 'var', name: t };
      }
      if (pos < tokens.length) consume(); // skip unknown
      return { type: 'num', val: 0 };
    };

    const result = expr();
    return result;
  }
};

// support Node.js require for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Parser };
}
