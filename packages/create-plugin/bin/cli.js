#!/usr/bin/env node

"use strict";

const osLocale = require("os-locale");
const meow = require("meow");
const run = require("../dist/src/index");
const { getDefaultLang } = require("../dist/src/lang");
const {
  isValidTemplateType,
  isLocalTemplatePath,
  validateLocalTemplate,
  SUPPORT_TEMPLATE_TYPE,
} = require("../dist/src/template");

const cli = meow(
  `
  Usage
    $ create-kintone-plugin <directory>
    $ create-kintone-plugin <directory> --output-dir <parent-directory>
  Options
    --lang Using language (en or ja)
    --template A template for a generated plug-in (${SUPPORT_TEMPLATE_TYPE.join(
      ","
    )} or a local directory path: the default value is minimum)
    --output-dir Parent directory for the plugin (plugin will be created at <output-dir>/<directory>)
    --skip-install Skip npm install after plugin creation
  Examples
    $ create-kintone-plugin my-plugin
    $ create-kintone-plugin my-plugin --template modern
    $ create-kintone-plugin my-plugin --template ./my-custom-template
    $ create-kintone-plugin my-plugin --template /path/to/template
    $ create-kintone-plugin my-plugin --output-dir plugins --skip-install
`,
  {
    flags: {
      lang: {
        type: "string",
        default: getDefaultLang(osLocale.sync()),
      },
      template: {
        type: "string",
        default: "minimum",
      },
      outputDir: {
        type: "string",
      },
      skipInstall: {
        type: "boolean",
        default: false,
      },
    },
  }
);

const path = require("path");

const directoryName = cli.input[0];
const { lang, template, outputDir, skipInstall } = cli.flags;

if (!directoryName) {
  console.error("Please specify the output directory");
  cli.showHelp();
}

// Build the full output path
const directory = outputDir ? path.join(outputDir, directoryName) : directoryName;

if (lang !== "ja" && lang !== "en") {
  console.error("--lang option only supports en or ja");
  cli.showHelp();
}

// Validate template: either a built-in template or a valid local path
if (!isValidTemplateType(template) && !isLocalTemplatePath(template)) {
  console.error(
    `--template option only supports ${SUPPORT_TEMPLATE_TYPE.join(",")} or a local directory path`
  );
  cli.showHelp();
}

// If it's a local path, validate the template directory
if (isLocalTemplatePath(template)) {
  if (!validateLocalTemplate(template)) {
    console.error(
      `Invalid template directory: ${template}\n` +
      `The template directory must exist and contain a package.json file.`
    );
    process.exit(1);
  }
}

run(directory, lang, template, skipInstall);
