import { readdirSync } from "node:fs";
import { extname, resolve } from "node:path";

const root = resolve(process.argv[2] ?? ".");
const files = readdirSync(root, { recursive: true })
  .filter((name) => typeof name === "string")
  .filter((name) => !name.includes("node_modules"))
  .filter((name) => [".ts", ".tsx", ".py"].includes(extname(name)));

const typescript = files.filter((name) => [".ts", ".tsx"].includes(extname(name)));
const python = files.filter((name) => extname(name) === ".py");

let language = "unknown";
if (typescript.length > 0 && python.length === 0) language = "typescript";
if (python.length > 0 && typescript.length === 0) language = "python";
if (typescript.length > 0 && python.length > 0) language = "mixed";

console.log(JSON.stringify({ language, files }, null, 2));

if (language === "unknown" || language === "mixed") {
  process.exit(2);
}
