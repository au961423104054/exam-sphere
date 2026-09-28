/**
 * ExamSphere Functional Code Harness Service
 * Manages language-specific templates, function signatures, and server-side driver generation.
 * Enforces strict separation between candidate functional solution and execution driver.
 */

// Mapping helper for parameter and return types across languages
const mapType = (type, targetLang) => {
  const t = String(type || '').trim().toLowerCase();
  
  if (targetLang === 'java') {
    if (t === 'int' || t === 'integer') return 'int';
    if (t === 'int[]' || t === 'array<int>' || t === 'list<int>' || t === 'vector<int>') return 'int[]';
    if (t === 'string') return 'String';
    if (t === 'string[]' || t === 'array<string>' || t === 'list<string>' || t === 'vector<string>') return 'String[]';
    if (t === 'boolean' || t === 'bool') return 'boolean';
    if (t === 'boolean[]' || t === 'bool[]') return 'boolean[]';
    if (t === 'double' || t === 'float' || t === 'number') return 'double';
    if (t === 'double[]' || t === 'float[]' || t === 'number[]') return 'double[]';
    if (t === 'char') return 'char';
    if (t === 'void') return 'void';
    return type || 'Object';
  }

  if (targetLang === 'cpp') {
    if (t === 'int' || t === 'integer') return 'int';
    if (t === 'int[]' || t === 'array<int>' || t === 'list<int>' || t === 'vector<int>') return 'vector<int>&';
    if (t === 'string') return 'string';
    if (t === 'string[]' || t === 'array<string>' || t === 'list<string>' || t === 'vector<string>') return 'vector<string>&';
    if (t === 'boolean' || t === 'bool') return 'bool';
    if (t === 'double' || t === 'float' || t === 'number') return 'double';
    if (t === 'double[]' || t === 'float[]' || t === 'number[]') return 'vector<double>&';
    if (t === 'void') return 'void';
    return type || 'auto';
  }

  if (targetLang === 'python') {
    if (t === 'int' || t === 'integer') return 'int';
    if (t.includes('[]') || t.includes('array') || t.includes('vector') || t.includes('list')) return 'list';
    if (t === 'string') return 'str';
    if (t === 'boolean' || t === 'bool') return 'bool';
    if (t === 'double' || t === 'float' || t === 'number') return 'float';
    return 'any';
  }

  // JavaScript / TypeScript
  if (t === 'int' || t === 'double' || t === 'float' || t === 'number') return 'number';
  if (t.includes('[]') || t.includes('array') || t.includes('vector') || t.includes('list')) return 'Array';
  if (t === 'string') return 'string';
  if (t === 'boolean' || t === 'bool') return 'boolean';
  return 'any';
};

const getDefaultReturnValue = (returnType, language) => {
  const t = String(returnType || '').toLowerCase();
  if (t === 'void') return '';
  if (language === 'python') return 'return None';
  if (t === 'boolean' || t === 'bool') return 'return false;';
  if (t.includes('[]') || t.includes('vector') || t.includes('list')) {
    if (language === 'java') return 'return new ' + mapType(returnType, 'java') + '{};';
    if (language === 'cpp') return 'return {};';
    return 'return [];';
  }
  if (t === 'string' || t === 'str') {
    if (language === 'python') return 'return ""';
    return 'return "";';
  }
  if (t === 'int' || t === 'double' || t === 'float' || t === 'number') {
    return 'return 0;';
  }
  return 'return null;';
};

/**
 * Generate language-specific function signature string
 */
const generateFunctionSignature = (language, config = {}) => {
  const fnName = config.functionName || 'solve';
  const retType = config.returnType || 'int';
  const params = Array.isArray(config.parameters) && config.parameters.length > 0
    ? config.parameters
    : [{ name: 'arr', type: 'int[]' }];

  const lang = String(language || 'javascript').toLowerCase();

  if (lang === 'java') {
    const javaRet = mapType(retType, 'java');
    const javaParams = params.map((p) => `${mapType(p.type, 'java')} ${p.name}`).join(', ');
    return `public ${javaRet} ${fnName}(${javaParams})`;
  }

  if (lang === 'cpp') {
    let cppRet = mapType(retType, 'cpp');
    if (cppRet.endsWith('&')) cppRet = cppRet.slice(0, -1);
    const cppParams = params.map((p) => `${mapType(p.type, 'cpp')} ${p.name}`).join(', ');
    return `${cppRet} ${fnName}(${cppParams})`;
  }

  if (lang === 'python') {
    const pyParams = params.map((p) => p.name).join(', ');
    return `def ${fnName}(${pyParams}):`;
  }

  // JavaScript
  const jsParams = params.map((p) => p.name).join(', ');
  return `function ${fnName}(${jsParams})`;
};

/**
 * Generate starter template code for a specific language
 */
const generateStarterTemplate = (language, config = {}) => {
  const fnName = config.functionName || 'solve';
  const retType = config.returnType || 'int';
  const className = config.className || 'Solution';
  const params = Array.isArray(config.parameters) && config.parameters.length > 0
    ? config.parameters
    : [{ name: 'arr', type: 'int[]' }];

  const lang = String(language || 'javascript').toLowerCase();
  const defaultReturn = getDefaultReturnValue(retType, lang);

  if (lang === 'java') {
    const sig = generateFunctionSignature('java', config);
    return `class ${className} {
    ${sig} {
        // Write your solution here
        ${defaultReturn}
    }
}`;
  }

  if (lang === 'cpp') {
    const sig = generateFunctionSignature('cpp', config);
    return `class ${className} {
public:
    ${sig} {
        // Write your solution here
        ${defaultReturn}
    }
};`;
  }

  if (lang === 'python') {
    const sig = generateFunctionSignature('python', config);
    return `${sig}
    # Write your solution here
    ${defaultReturn || 'pass'}`;
  }

  // JavaScript
  const sig = generateFunctionSignature('javascript', config);
  const paramDocs = params.map((p) => ` * @param {${mapType(p.type, 'javascript')}} ${p.name}`).join('\n');
  const returnDoc = ` * @return {${mapType(retType, 'javascript')}}`;

  return `/**
${paramDocs}
${returnDoc}
 */
${sig} {
  // Write your solution here
  ${defaultReturn}
}`;
};

/**
 * Generate starter templates for all supported languages
 */
const generateStarterTemplatesAllLanguages = (config = {}) => {
  return {
    javascript: generateStarterTemplate('javascript', config),
    python: generateStarterTemplate('python', config),
    java: generateStarterTemplate('java', config),
    cpp: generateStarterTemplate('cpp', config)
  };
};

/**
 * Robustly parses test-case input string into typed arguments corresponding to parameters
 */
const parseTestInput = (inputStr, parameters = []) => {
  if (!inputStr || typeof inputStr !== 'string') {
    return parameters.map(() => null);
  }

  const raw = inputStr.trim();
  if (!raw) return parameters.map(() => null);

  // 1. Direct JSON check
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === parameters.length) return parsed;
    if (typeof parsed === 'object' && parsed !== null) {
      const vals = parameters.map((p) => parsed[p.name]);
      if (vals.every((v) => v !== undefined)) return vals;
    }
  } catch (e) {}

  // 2. Tokenize by top-level delimiter (comma, newline, or semicolon) respecting [ ], { }, ( ), and quotes
  const tokens = [];
  let current = '';
  let bracketDepth = 0;
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    if ((char === '"' || char === "'") && (i === 0 || raw[i - 1] !== '\\')) {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (quoteChar === char) {
        inQuotes = false;
      }
      current += char;
    } else if (inQuotes) {
      current += char;
    } else if (char === '[' || char === '{' || char === '(') {
      bracketDepth++;
      current += char;
    } else if (char === ']' || char === '}' || char === ')') {
      bracketDepth = Math.max(0, bracketDepth - 1);
      current += char;
    } else if ((char === ',' || char === ';' || char === '\n') && bracketDepth === 0) {
      if (current.trim().length > 0) {
        tokens.push(current.trim());
      }
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim().length > 0) {
    tokens.push(current.trim());
  }

  // 3. For each token, check if it's in the form "paramName = value"
  const dict = {};
  tokens.forEach((t) => {
    const eqIdx = t.indexOf('=');
    if (eqIdx > 0) {
      const key = t.slice(0, eqIdx).trim();
      const valStr = t.slice(eqIdx + 1).trim();
      try {
        dict[key] = JSON.parse(valStr);
      } catch (e) {
        dict[key] = valStr.replace(/^['"]|['"]$/g, '');
      }
    }
  });

  if (Object.keys(dict).length > 0) {
    return parameters.map((p, idx) => {
      if (dict[p.name] !== undefined) return dict[p.name];
      const cleanVal = tokens[idx] ? tokens[idx].replace(/^.*?=\s*/, '').trim() : null;
      if (cleanVal === null) return null;
      try {
        return JSON.parse(cleanVal);
      } catch (e) {
        return cleanVal.replace(/^['"]|['"]$/g, '');
      }
    });
  }

  // Otherwise, use positional tokens
  return parameters.map((p, idx) => {
    const rawVal = tokens[idx] !== undefined ? tokens[idx] : tokens[0];
    if (rawVal === undefined) return null;
    const cleanVal = rawVal.trim();
    try {
      return JSON.parse(cleanVal);
    } catch (e) {
      return cleanVal.replace(/^['"]|['"]$/g, '');
    }
  });
};

/**
 * Ensures candidate code is normalized (e.g. wraps function inside Solution class if Java/C++ requires class)
 */
const normalizeCandidateCode = (language, candidateCode, config = {}) => {
  const lang = String(language || 'javascript').toLowerCase();
  const className = config.className || 'Solution';
  const code = (candidateCode || '').trim();

  if (lang === 'java') {
    if (!code.includes('class ') && !code.includes('interface ')) {
      return `public class ${className} {
    ${code}
}`;
    }
    // Ensure class is public for clean compilation
    return code.replace(/(?:public\s+)?class\s+(\w+)/, 'public class $1');
  }

  if (lang === 'cpp') {
    if (!code.includes('class ') && !code.includes('struct ')) {
      return `class ${className} {
public:
    ${code}
};`;
    }
    return code;
  }

  return code;
};

/**
 * Builds server-side Python executable script embedding the test harness
 */
const buildPythonHarnessScript = (candidateCode, question = {}, testCases = []) => {
  const fnName = question.functionName || 'solve';
  const className = question.className || 'Solution';
  const params = question.parameters || [{ name: 'arr', type: 'int[]' }];

  const testCasesJson = JSON.stringify(
    testCases.map((tc, idx) => ({
      index: idx,
      inputRaw: tc.input || '',
      expectedOutput: tc.expectedOutput || '',
      isHidden: !!tc.isHidden
    }))
  );

  const paramsJson = JSON.stringify(params);

  return `# -*- coding: utf-8 -*-
# --- CANDIDATE FUNCTIONAL SOLUTION ---
${candidateCode}

# --- SERVER-SIDE EXAMSPHERE TEST HARNESS (HIDDEN DRIVER) ---
import sys
import json
import time

def __examsphere_parse_test_input(raw_input, parameters):
    raw = (raw_input or "").strip()
    if not raw:
        return [None] * len(parameters)
    try:
        data = json.loads(raw)
        if isinstance(data, list) and len(data) == len(parameters):
            return data
        if isinstance(data, dict):
            vals = [data.get(p["name"]) for p in parameters]
            if all(v is not None for v in vals):
                return vals
    except:
        pass
    
    tokens = []
    current = ""
    bracket_depth = 0
    in_quotes = False
    quote_char = ""
    for idx, ch in enumerate(raw):
        if (ch == '"' or ch == "'") and (idx == 0 or raw[idx - 1] != '\\\\'):
            if not in_quotes:
                in_quotes = True
                quote_char = ch
            elif quote_char == ch:
                in_quotes = False
            current += ch
        elif in_quotes:
            current += ch
        elif ch in '[{(':
            bracket_depth += 1
            current += ch
        elif ch in ']})':
            bracket_depth = max(0, bracket_depth - 1)
            current += ch
        elif (ch == ',' or ch == ';' or ch == '\\n') and bracket_depth == 0:
            if current.strip():
                tokens.append(current.strip())
            current = ""
        else:
            current += ch
    if current.strip():
        tokens.append(current.strip())

    extracted = {}
    for t in tokens:
        if "=" in t:
            k, v = t.split("=", 1)
            k, v = k.strip(), v.strip()
            try:
                extracted[k] = json.loads(v)
            except:
                extracted[k] = v.strip('"\\'')
    
    if extracted:
        return [extracted.get(p["name"]) for p in parameters]
    
    result = []
    for idx, p in enumerate(parameters):
        val_str = tokens[idx] if idx < len(tokens) else tokens[0]
        try:
            result.append(json.loads(val_str))
        except:
            result.append(val_str.strip('"\\''))
    return result

def __examsphere_main():
    test_cases = json.loads('''${testCasesJson.replace(/\\/g, '\\\\').replace(/'''/g, "\\'\\'\\'")}''')
    parameters = json.loads('''${paramsJson.replace(/\\/g, '\\\\').replace(/'''/g, "\\'\\'\\'")}''')
    fn_name = "${fnName}"
    class_name = "${className}"

    runner = None
    if class_name in globals():
        try:
            cls_obj = globals()[class_name]
            if isinstance(cls_obj, type):
                instance = cls_obj()
                if hasattr(instance, fn_name):
                    runner = getattr(instance, fn_name)
        except Exception:
            pass
    if runner is None and fn_name in globals():
        runner = globals()[fn_name]

    if runner is None:
        sys.stderr.write(f"Solution function '{fn_name}' or class '{className}' not found in candidate code.\\n")
        sys.exit(1)

    results = []
    for tc in test_cases:
        args = __examsphere_parse_test_input(tc["inputRaw"], parameters)
        start_t = time.perf_counter()
        try:
            output = runner(*args)
            runtime_ms = int((time.perf_counter() - start_t) * 1000)
            
            if isinstance(output, (dict, list)):
                actual_str = json.dumps(output)
            elif isinstance(output, bool):
                actual_str = "true" if output else "false"
            elif output is None:
                actual_str = "null"
            else:
                actual_str = str(output)

            results.append({
                "testCaseIndex": tc["index"],
                "passed": None,
                "actualOutput": actual_str,
                "error": None,
                "executionTimeMs": runtime_ms,
                "isHidden": tc["isHidden"]
            })
        except Exception as e:
            runtime_ms = int((time.perf_counter() - start_t) * 1000)
            results.append({
                "testCaseIndex": tc["index"],
                "passed": False,
                "actualOutput": "",
                "error": f"{type(e).__name__}: {str(e)}",
                "executionTimeMs": runtime_ms,
                "isHidden": tc["isHidden"]
            })

    print("___EXAMSPHERE_RESULTS___")
    print(json.dumps(results))

if __name__ == "__main__":
    __examsphere_main()
`;
};

/**
 * Builds server-side Java Main class embedding the test harness
 */
const buildJavaHarnessCode = (candidateCode, question = {}) => {
  const fnName = question.functionName || 'solve';
  const className = question.className || 'Solution';
  const retType = mapType(question.returnType || 'int', 'java');
  const params = question.parameters || [{ name: 'arr', type: 'int[]' }];

  return `import java.util.*;
import java.io.*;

// --- SERVER-SIDE EXAMSPHERE TEST HARNESS (HIDDEN DRIVER) ---
public class Main {
    private static String serialize(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof int[]) return Arrays.toString((int[]) obj);
        if (obj instanceof double[]) return Arrays.toString((double[]) obj);
        if (obj instanceof boolean[]) return Arrays.toString((boolean[]) obj);
        if (obj instanceof String[]) return Arrays.toString((String[]) obj);
        if (obj instanceof List) return obj.toString();
        return String.valueOf(obj);
    }

    private static String extractValue(String line, String paramName) {
        line = line.trim();
        if (line.contains("=")) {
            String[] parts = line.split("=", 2);
            return parts[1].trim();
        }
        return line;
    }

    private static int[] parseIntArray(String s) {
        s = extractValue(s, "arr");
        s = s.replace("[", "").replace("]", "").trim();
        if (s.isEmpty()) return new int[0];
        String[] parts = s.split(",");
        int[] arr = new int[parts.length];
        for (int i = 0; i < parts.length; i++) {
            arr[i] = Integer.parseInt(parts[i].trim());
        }
        return arr;
    }

    public static void main(String[] args) {
        ${className} solver = new ${className}();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(System.in))) {
            String line;
            while ((line = br.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty()) continue;
                long start = System.currentTimeMillis();
                try {
                    String raw = line;
                    ${generateJavaInvocationSnippet(fnName, retType, params)}
                } catch (Throwable t) {
                    System.out.println("___EXAMSPHERE_ERROR___:" + t.getClass().getSimpleName() + ": " + t.getMessage());
                }
            }
        } catch (Exception e) {
            System.out.println("___EXAMSPHERE_ERROR___:" + e.getMessage());
        }
    }
}
`;
};

const generateJavaInvocationSnippet = (fnName, retType, params) => {
  if (params.length === 1 && params[0].type.includes('[]')) {
    return `int[] inputArr = parseIntArray(raw);
                    Object result = solver.${fnName}(inputArr);
                    long duration = System.currentTimeMillis() - start;
                    System.out.println("___EXAMSPHERE_OUT___:" + duration + ":" + serialize(result));`;
  }
  return `Object result = solver.${fnName}(parseIntArray(raw));
                    long duration = System.currentTimeMillis() - start;
                    System.out.println("___EXAMSPHERE_OUT___:" + duration + ":" + serialize(result));`;
};

module.exports = {
  mapType,
  getDefaultReturnValue,
  generateFunctionSignature,
  generateStarterTemplate,
  generateStarterTemplatesAllLanguages,
  parseTestInput,
  normalizeCandidateCode,
  buildPythonHarnessScript,
  buildJavaHarnessCode
};
