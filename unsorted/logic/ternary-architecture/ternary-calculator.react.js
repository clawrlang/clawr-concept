import React, { useState } from 'react';
import { Calculator, RotateCcw, Info } from 'lucide-react';

const TernaryCalculator = () => {
  const [inputA, setInputA] = useState('0');
  const [inputB, setInputB] = useState('0');
  const [operation, setOperation] = useState('AND');
  const [showInfo, setShowInfo] = useState(false);
  const [showKMap, setShowKMap] = useState(false);

  const tritValues = ['-', '0', '+'];
  
  // Ternary operations
  const operations = {
    'NOT': (a) => {
      const map = {'-': '+', '0': '0', '+': '-'};
      return map[a];
    },
    'ROT-UP': (a) => {
      const map = {'-': '0', '0': '+', '+': '-'};
      return map[a];
    },
    'ROT-DOWN': (a) => {
      const map = {'-': '+', '0': '-', '+': '0'};
      return map[a];
    },
    'IS-PLUS': (a) => {
      return a === '+' ? '+' : '-';
    },
    'IS-ZERO': (a) => {
      return a === '0' ? '+' : '-';
    },
    'IS-MINUS': (a) => {
      return a === '-' ? '+' : '-';
    },
    'AND': (a, b) => {
      const order = {'-': 0, '0': 1, '+': 2};
      return tritValues[Math.min(order[a], order[b])];
    },
    'OR': (a, b) => {
      const order = {'-': 0, '0': 1, '+': 2};
      return tritValues[Math.max(order[a], order[b])];
    },
    'XOR': (a, b) => {
      const notA = operations['NOT'](a);
      const notB = operations['NOT'](b);
      const left = operations['AND'](notA, b);
      const right = operations['AND'](a, notB);
      return operations['OR'](left, right);
    },
    'MUL': (a, b) => {
      if (a === '0' || b === '0') return '0';
      if (a === b) return '+';
      return '-';
    },
    'SUM': (a, b) => {
      const vals = {'-': -1, '0': 0, '+': 1};
      const sum = vals[a] + vals[b];
      const mod = ((sum % 3) + 3) % 3;
      return ['-', '0', '+'][mod === 2 ? 0 : mod === 0 ? 1 : 2];
    },
    'SUB': (a, b) => {
      const vals = {'-': -1, '0': 0, '+': 1};
      const diff = vals[a] - vals[b];
      const mod = ((diff % 3) + 3) % 3;
      return ['-', '0', '+'][mod === 2 ? 0 : mod === 0 ? 1 : 2];
    },
    'CONS': (a, b) => {
      if (a === b) return a;
      return '0';
    },
    'ANY': (a, b) => {
      if (a === '0') return b;
      if (b === '0') return a;
      if (a === b) return a;
      return '0';
    }
  };

  const monadicOps = ['NOT', 'ROT-UP', 'ROT-DOWN', 'IS-PLUS', 'IS-ZERO', 'IS-MINUS'];
  const isMonadic = monadicOps.includes(operation);

  const calculateResult = () => {
    if (isMonadic) {
      return operations[operation](inputA);
    }
    return operations[operation](inputA, inputB);
  };

  const result = calculateResult();

  const opDescriptions = {
    'NOT': 'Negation: switches + and -, leaves 0 unchanged',
    'ROT-UP': 'Rotate up: - → 0 → + → -',
    'ROT-DOWN': 'Rotate down: + → 0 → - → +',
    'IS-PLUS': 'Returns + if input is +, otherwise -',
    'IS-ZERO': 'Returns + if input is 0, otherwise -',
    'IS-MINUS': 'Returns + if input is -, otherwise -',
    'AND': 'Returns the minimum value',
    'OR': 'Returns the maximum value',
    'XOR': 'True if inputs differ',
    'MUL': 'Multiplication: copies/negates/zeros',
    'SUM': 'Addition mod 3 (balanced)',
    'SUB': 'Subtraction mod 3 (balanced)',
    'CONS': 'Consensus: returns value if both agree, else 0',
    'ANY': 'Gullibility: accepts any non-0 input'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Calculator className="w-8 h-8 text-cyan-400" />
              <h1 className="text-3xl font-bold text-white">Ternary Logic Calculator</h1>
            </div>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Info className="w-6 h-6 text-cyan-400" />
            </button>
          </div>

          {showInfo && (
            <div className="mb-6 p-4 bg-cyan-500/10 border border-cyan-400/30 rounded-lg">
              <p className="text-cyan-100 text-sm">
                Ternary logic uses three values: <strong>-</strong> (negative/false), 
                <strong> 0</strong> (unknown/neutral), and <strong>+</strong> (positive/true).
                Explore the operations from the Clawr documentation!
              </p>
            </div>
          )}

          {/* Operation Selector */}
          <div className="mb-6">
            <label className="block text-cyan-400 font-semibold mb-3">Operation</label>
            <select
              value={operation}
              onChange={(e) => setOperation(e.target.value)}
              className="w-full bg-white/10 text-white border border-white/30 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <optgroup label="Monadic (1 input)">
                {monadicOps.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </optgroup>
              <optgroup label="Dyadic (2 inputs)">
                {Object.keys(operations).filter(op => !monadicOps.includes(op)).map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </optgroup>
            </select>
            <p className="text-cyan-200 text-sm mt-2 italic">
              {opDescriptions[operation]}
            </p>
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-cyan-400 font-semibold mb-3">
                Input A {isMonadic && '(only input)'}
              </label>
              <div className="flex gap-3">
                {tritValues.map(val => (
                  <button
                    key={val}
                    onClick={() => setInputA(val)}
                    className={`flex-1 py-4 rounded-lg font-bold text-xl transition-all ${
                      inputA === val
                        ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {!isMonadic && (
              <div>
                <label className="block text-cyan-400 font-semibold mb-3">Input B</label>
                <div className="flex gap-3">
                  {tritValues.map(val => (
                    <button
                      key={val}
                      onClick={() => setInputB(val)}
                      className={`flex-1 py-4 rounded-lg font-bold text-xl transition-all ${
                        inputB === val
                          ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/50'
                          : 'bg-white/10 text-white/60 hover:bg-white/20'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Result */}
          <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-xl p-8 border-2 border-cyan-400/30">
            <div className="text-center">
              <div className="text-cyan-400 text-sm font-semibold mb-2">RESULT</div>
              <div className="flex items-center justify-center gap-4 mb-4">
                <span className="text-white text-2xl font-mono">{inputA}</span>
                <span className="text-cyan-400 text-xl">{operation}</span>
                {!isMonadic && <span className="text-white text-2xl font-mono">{inputB}</span>}
                <span className="text-cyan-400 text-xl">=</span>
                <div className="bg-white/20 px-8 py-4 rounded-lg">
                  <span className="text-white text-4xl font-bold font-mono">{result}</span>
                </div>
              </div>
            </div>
          </div>

          {/* K-map and Truth Table Toggle */}
          <div className="mt-8">
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-cyan-400 font-semibold">Visualization</h3>
              <div className="flex gap-2 bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => setShowKMap(false)}
                  className={`px-4 py-2 rounded transition-colors ${
                    !showKMap ? 'bg-cyan-500 text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Truth Table
                </button>
                <button
                  onClick={() => setShowKMap(true)}
                  className={`px-4 py-2 rounded transition-colors ${
                    showKMap ? 'bg-cyan-500 text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  K-map
                </button>
              </div>
            </div>

            {showKMap ? (
              /* K-map Visualization */
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                {isMonadic ? (
                  /* 1D K-map for monadic operations */
                  <div>
                    <div className="text-center text-cyan-400 text-sm mb-4 font-mono">
                      {operation} = [{tritValues.map(a => operations[operation](a)).join(' ')}]
                    </div>
                    <div className="flex justify-center gap-2">
                      {tritValues.map((a, idx) => (
                        <div key={a} className="flex flex-col items-center">
                          <div className="text-cyan-400 text-xs mb-2 font-mono">a={a}</div>
                          <div
                            className={`w-24 h-24 flex items-center justify-center text-3xl font-bold font-mono rounded-lg border-2 transition-all ${
                              a === inputA
                                ? 'bg-cyan-500/30 border-cyan-400 text-white shadow-lg shadow-cyan-500/50'
                                : 'bg-white/10 border-white/30 text-white/80'
                            }`}
                          >
                            {operations[operation](a)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* 2D K-map for dyadic operations */
                  <div>
                    <div className="text-center text-cyan-400 text-sm mb-4">
                      <div className="font-mono mb-2">{operation} K-map</div>
                      <div className="text-xs text-cyan-400/60">Rows = a, Columns = b</div>
                    </div>
                    <div className="flex justify-center">
                      <div className="inline-block">
                        {/* Column headers */}
                        <div className="flex mb-2">
                          <div className="w-16"></div>
                          {tritValues.map(b => (
                            <div key={b} className="w-24 text-center">
                              <div className="text-purple-400 font-mono text-sm">b={b}</div>
                            </div>
                          ))}
                        </div>
                        {/* Rows */}
                        {tritValues.map((a, rowIdx) => (
                          <div key={a} className="flex mb-2">
                            {/* Row header */}
                            <div className="w-16 flex items-center justify-center">
                              <div className="text-cyan-400 font-mono text-sm">a={a}</div>
                            </div>
                            {/* Cells */}
                            {tritValues.map((b, colIdx) => {
                              const cellResult = operations[operation](a, b);
                              const isSelected = a === inputA && b === inputB;
                              return (
                                <div
                                  key={`${a}${b}`}
                                  className={`w-24 h-24 flex items-center justify-center text-3xl font-bold font-mono rounded-lg border-2 transition-all ${
                                    isSelected
                                      ? 'bg-cyan-500/30 border-cyan-400 text-white shadow-lg shadow-cyan-500/50 scale-105'
                                      : 'bg-white/10 border-white/30 text-white/80 hover:bg-white/20'
                                  }`}
                                >
                                  {cellResult}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Matrix notation */}
                    <div className="mt-6 text-center">
                      <div className="inline-block bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="text-cyan-400 text-xs mb-2">Matrix Notation:</div>
                        <div className="font-mono text-white text-sm">
                          {operation} = <span className="text-cyan-400">[</span>
                          {tritValues.map((a, rowIdx) => (
                            <div key={a} className="inline">
                              {rowIdx > 0 && <br />}
                              <span className="ml-8">{tritValues.map(b => 
                                <span key={`${a}${b}`} className="mx-1">
                                  {operations[operation](a, b)}
                                </span>
                              )}</span>
                              {rowIdx < tritValues.length - 1 && ','}
                            </div>
                          ))}
                          <span className="text-cyan-400">]</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Truth Table */
              <div className="bg-white/5 rounded-lg overflow-hidden border border-white/10">
                <table className="w-full">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="p-3 text-cyan-400 text-left">A</th>
                      {!isMonadic && <th className="p-3 text-cyan-400 text-left">B</th>}
                      <th className="p-3 text-cyan-400 text-left">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isMonadic ? (
                      tritValues.map(a => (
                        <tr key={a} className={`border-t border-white/10 ${a === inputA ? 'bg-cyan-500/20' : ''}`}>
                          <td className="p-3 text-white font-mono">{a}</td>
                          <td className="p-3 text-white font-mono font-bold">{operations[operation](a)}</td>
                        </tr>
                      ))
                    ) : (
                      tritValues.flatMap(a => 
                        tritValues.map(b => (
                          <tr key={`${a}${b}`} className={`border-t border-white/10 ${a === inputA && b === inputB ? 'bg-cyan-500/20' : ''}`}>
                            <td className="p-3 text-white font-mono">{a}</td>
                            <td className="p-3 text-white font-mono">{b}</td>
                            <td className="p-3 text-white font-mono font-bold">{operations[operation](a, b)}</td>
                          </tr>
                        ))
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-cyan-200/60 text-sm">
          Based on the Clawr ternary logic documentation
        </div>
      </div>
    </div>
  );
};

export default TernaryCalculator;
