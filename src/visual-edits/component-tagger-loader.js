// src/visual-edits/component-tagger-loader.js
import { parse } from "@babel/parser";
import { walk } from "estree-walker";

export default function componentTaggerLoader(source) {
  const filename = this.resourcePath; 
  const relativePath = filename.replace(process.cwd() + "/", "");

  // Skip tagging UI component libraries (shadcn/ui, etc.)
  // These are wrapper components and should not be tagged
  if (relativePath.includes('/components/ui/') || 
      relativePath.includes('\\components\\ui\\')) {
    return source; // Return unchanged
  }

  const ast = parse(source, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
    ranges: true,
    tokens: true,
  });

  const patches = [];
  let jsxAttributeDepth = 0;

  walk(ast, {
    enter(node) {
      // Track when we enter a JSX attribute (like fallback={...})
      // Any JSX inside will be at depth > 0
      if (node.type === "JSXAttribute") {
        jsxAttributeDepth++;
      }
      
      // Skip tagging JSX elements that are inside attribute values
      // This avoids position calculation issues with nested JSX
      if (node.type === "JSXOpeningElement" && jsxAttributeDepth > 0) {
        return;
      }
      
      if (node.type === "JSXOpeningElement") {
        let name = "unknown";
        if (node.name.type === "JSXIdentifier") {
          name = node.name.name;
        } else if (node.name.type === "JSXMemberExpression") {
          name = node.name.property.name;
        }

        const loc = node.loc?.start || {};
        const idValue = `${relativePath}:${loc.line}:${loc.column}`;

        // Check if attributes already exist
        const hasId = node.attributes.some(
          (attr) => attr.type === "JSXAttribute" && attr.name.name === "data-appopen-id"
        );
        const hasName = node.attributes.some(
          (attr) => attr.type === "JSXAttribute" && attr.name.name === "data-appopen-name"
        );

        if (hasId && hasName) return;

        let inject = "";
        if (!hasId) inject += ` data-appopen-id="${idValue}"`;
        if (!hasName) inject += ` data-appopen-name="${name}"`;

        // Detect self-closing vs normal tag
        const isSelfClosing = node.selfClosing;

        // Insert position: before the closing bracket
        let insertPos;
        if (isSelfClosing) {
          // For self-closing: <Component />
          // Insert before " />"
          insertPos = node.end - 2;
        } else {
          // For opening tags: <Component>
          // Insert before ">"
          insertPos = node.end - 1;
        }

        patches.push([insertPos, insertPos, inject]);
      }
    },
    leave(node) {
      // Decrement depth when leaving a JSX attribute
      if (node.type === "JSXAttribute") {
        jsxAttributeDepth--;
      }
    },
  });

  // Apply patches backwards to maintain correct positions
  let code = source;
  for (let i = patches.length - 1; i >= 0; i--) {
    const [start, end, text] = patches[i];
    code = code.slice(0, start) + text + code.slice(end);
  }

  return code;
}
