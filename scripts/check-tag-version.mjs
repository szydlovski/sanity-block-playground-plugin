import { readFileSync } from "node:fs";

const ref = process.env.GITHUB_REF_NAME || "";
if (!ref) {
  console.error("GITHUB_REF_NAME is missing.");
  process.exit(1);
}

if (!/^v\d+\.\d+\.\d+(-.+)?$/.test(ref)) {
  console.error(`Tag "${ref}" must look like vX.Y.Z.`);
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const expected = `v${pkg.version}`;

if (ref !== expected) {
  console.error(`Tag/version mismatch: tag=${ref}, package.json=${expected}`);
  process.exit(1);
}

console.log(`Tag ${ref} matches package.json version.`);
