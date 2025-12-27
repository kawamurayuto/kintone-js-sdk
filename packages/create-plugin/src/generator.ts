"use strict";

import * as fs from "fs";
import { globSync } from "glob";
import * as path from "path";
import { installDependencies } from "./deps";
import type { Lang } from "./lang";
import type { Manifest } from "./manifest";
import { generatePrivateKey } from "./privateKey";
import type { TemplateType } from "./template";
import {
  isNecessaryFile,
  processTemplateFile,
  isLocalTemplatePath,
} from "./template";
import normalize from "normalize-path";

/**
 * Create a plugin project based on passed manifest and install dependencies
 * @param outputDirectory
 * @param manifest
 * @param lang
 * @param enablePluginUploader
 * @param templateType - Built-in template name or local directory path
 */
export const generatePlugin = async (
  outputDirectory: string,
  manifest: Manifest,
  lang: Lang,
  enablePluginUploader: boolean,
  templateType: TemplateType | string,
): Promise<void> => {
  // copy and build a project into the output diretory
  await buildProject(
    outputDirectory,
    manifest,
    enablePluginUploader,
    templateType,
  );
  // npm install
  installDependencies(outputDirectory, lang);
};

/**
 * Create a plugin project based on passed manifest
 * @param outputDirectory
 * @param manifest
 * @param enablePluginUploader
 * @param templateType - Built-in template name or local directory path
 */
const buildProject = async (
  outputDirectory: string,
  manifest: Manifest,
  enablePluginUploader: boolean,
  templateType: TemplateType | string,
): Promise<void> => {
  fs.mkdirSync(outputDirectory);

  // Determine template path: local path or built-in template
  let templatePath: string;
  if (isLocalTemplatePath(templateType)) {
    // Use absolute path for local template
    templatePath = path.resolve(templateType);
  } else {
    // This is necessary for unit testing
    // We use src/generator.ts directory instead of dist/src/generator.js when unit testing
    templatePath =
      __dirname.indexOf("dist") === -1
        ? path.join(__dirname, "..", "templates", templateType)
        : path.join(__dirname, "..", "..", "templates", templateType);
  }

  const templatePathPattern = normalize(path.resolve(templatePath, "**", "*"));
  const templateFiles = globSync(templatePathPattern, {
    dot: true,
  }).filter((file) => isNecessaryFile(manifest, file));
  for (const file of templateFiles) {
    await processTemplateFile(
      file,
      templatePath,
      outputDirectory,
      manifest,
      enablePluginUploader,
    );
  }

  fs.writeFileSync(
    path.resolve(outputDirectory, "private.ppk"),
    generatePrivateKey(),
  );

  // Determine manifest.json directory based on template structure
  // For built-in "modern" template, use "plugin" directory
  // For other templates, check if "plugin" directory exists, otherwise use "src"
  let manifestDir = "src";
  if (templateType === "modern") {
    manifestDir = "plugin";
  } else if (isLocalTemplatePath(templateType)) {
    // For local templates, check if plugin directory exists in template
    const pluginDirInTemplate = path.join(templatePath, "plugin");
    if (fs.existsSync(pluginDirInTemplate)) {
      manifestDir = "plugin";
    }
  }

  fs.writeFileSync(
    path.resolve(outputDirectory, manifestDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
};
