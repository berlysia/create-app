#!/usr/bin/env node

// @ts-check
const fs = require("fs");
const path = require("path");
// const argv = require("minimist")(process.argv.slice(2));
const merge = require("lodash.merge");
const { copy, readJSON, writeJSON } = require("fs-extra");

function detectPackageManager() {
  if (/yarn/.test(process.env.npm_execpath)) return "yarn";
  if (/pnpm/.test(process.env.npm_execpath)) return "pnpm";
  return "npm";
}

const cwd = process.cwd();

function updatePkg(basePkg, templatePkg) {
  const result = JSON.parse(JSON.stringify(basePkg));
  return merge(result, templatePkg);
}

async function main() {
  const currentPkgPath = path.resolve(cwd, "package.json");
  const currentPkg = await readJSON(currentPkgPath);

  if (!currentPkg) {
    throw new Error("package.json was not found in current directory");
  }

  const templateName = "inject-base";
  const templateDir = path.resolve(__dirname, "templates", templateName);
  const templateDirFiles = (await fs.promises.readdir(templateDir)).filter(
    (x) => x !== "package.json"
  );
  const templatePkgPath = path.resolve(templateDir, "package.json");
  const templatePkg = await readJSON(templatePkgPath);

  await Promise.all(
    templateDirFiles.map((f) =>
      copy(path.join(templateDir, f), path.join(cwd, f))
    )
  );

  const updatedPkg = updatePkg(currentPkg, templatePkg);
  await writeJSON(currentPkgPath, updatedPkg, {
    spaces: 2,
  });

  const pkgMgr = detectPackageManager();
  console.log(`next -> \`${pkgMgr}\` install`);
}

main().catch((e) => console.error(e));
