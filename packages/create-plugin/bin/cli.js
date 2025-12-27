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
  Options
    --lang Using language (en or ja)
    --template A template for a generated plug-in (${SUPPORT_TEMPLATE_TYPE.join(
      ","
    )} or a local directory path: the default value is minimum)
  Examples
    $ create-kintone-plugin my-plugin
    $ create-kintone-plugin my-plugin --template modern
    $ create-kintone-plugin my-plugin --template ./my-custom-template
    $ create-kintone-plugin my-plugin --template /path/to/template
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
    },
  }
);

const directory = cli.input[0];
const { lang, template } = cli.flags;

if (!directory) {
  console.error("Please specify the output directory");
  cli.showHelp();
}

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

run(directory, lang, template);
