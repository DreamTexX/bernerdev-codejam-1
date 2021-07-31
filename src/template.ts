const decoder = new TextDecoder("utf-8");

export declare type Data = Record<
  string,
  string | number | Record<string, unknown> | undefined | unknown
>;

export function parseTemplate(path: string, d?: Data): string {
  const data: Data = {
    ...d,
    title: "Bernerdev CodeJam #1",
  };
  let template = decoder.decode(
    Deno.readFileSync(`${Deno.cwd()}/templates/${path}.html`)
  );
  template = resolveImports(template);
  template = evaluateConditionals(template, data);
  template = resolveData(template, data);
  return template;
}

function resolveImports(content: string): string {
  return content.replaceAll(/{{>(.*)}}/gim, (_, file) => {
    return decoder.decode(
      Deno.readFileSync(`${Deno.cwd()}/templates/includes/${file.trim()}.html`)
    );
  });
}

function evaluateConditionals(content: string, data: Data): string {
  let conditonalFound = false;
  content = content.replaceAll(
    /{{%if\s+(.*?)\s*?}}(.*?){{%endif\s*?}}/gs,
    (_, condition, content) => {
      conditonalFound = true;
      let expression = "";
      for (const key of Object.keys(data))
        expression += `const ${key} = ${JSON.stringify(data[key])}; `;
      expression += `(${condition}) ? true : false; `;
      let result = false;
      try {
        result = eval(expression);
      } catch (_) {
        // ignore
      }
      return result ? content : "";
    }
  );
  if (conditonalFound) return evaluateConditionals(content, data);
  return content;
}

function resolveData(content: string, data: Data): string {
  return content.replaceAll(/{{\s*([a-zA-Z0-9.]*)\s*}}/gim, (_, key) => {
    const keys: string[] = key.split(".");
    // deno-lint-ignore no-explicit-any
    let obj: any = data[keys[0]];
    if (keys.length > 1) {
      for (let i = 1; i < keys.length; i++) {
        if (obj === undefined) return "";
        if (typeof obj !== "object") return "";
        obj = obj[keys[i]];
      }
    }
    return (obj || "").toString();
  });
}
