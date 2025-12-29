"use strict";

import * as fs from "fs";
import * as path from "path";
import type { Answers } from "./qa";
import type { TemplateType } from "./template";
import { isLocalTemplatePath } from "./template";

const TEMPLATE_MANIFEST_FILENAME = "manifest.template.json";

const minimumManifest = {
  $schema:
    "https://raw.githubusercontent.com/kintone/js-sdk/%40kintone/plugin-manifest-validator%4010.2.0/packages/plugin-manifest-validator/manifest-schema.json",
  manifest_version: 1,
  version: 1,
  type: "APP",
  desktop: {
    js: ["js/desktop.js"],
    css: ["css/51-modern-default.css", "css/desktop.css"],
  },
  icon: "image/icon.png",
  config: {
    html: "html/config.html",
    js: ["js/config.js"],
    css: ["css/51-modern-default.css", "css/config.css"],
    required_params: ["message"],
  },
};

const modernManifest = {
  $schema:
    "https://raw.githubusercontent.com/kintone/js-sdk/%40kintone/plugin-manifest-validator%4010.2.0/packages/plugin-manifest-validator/manifest-schema.json",
  manifest_version: 1,
  version: 1,
  type: "APP",
  desktop: {
    js: ["js/desktop.js"],
    css: ["css/desktop.css"],
  },
  icon: "image/icon.png",
  config: {
    html: "html/config.html",
    js: ["js/config.js"],
    css: ["css/51-modern-default.css", "css/config.css"],
    required_params: ["message"],
  },
};

export interface Manifest {
  manifest_version: number;
  version: number;
  type: "APP";
  name: {
    ja?: string;
    en: string;
    zh?: string;
    es?: string;
  };
  description?: {
    ja?: string;
    en: string;
    zh?: string;
    es?: string;
  };
  icon: string;
  homepage_url?: {
    ja?: string;
    en?: string;
    zh?: string;
    es?: string;
  };
  desktop?: {
    js?: string[];
    css?: string[];
  };
  mobile?: {
    js?: string[];
    css?: string[];
  };
  config?: {
    html?: string;
    js?: string[];
    css?: string[];
    required_params?: string[];
  };
}

const answer2Manifest = (answers: Answers): Manifest => {
  const filteredAnswer = Object.keys(answers).reduce((acc, key) => {
    if (typeof answers[key] === "boolean") {
      return acc;
    }
    if (
      typeof answers[key] === "string" &&
      (answers[key] === "" || answers[key] == null)
    ) {
      return acc;
    }
    return { ...acc, ...{ [key]: answers[key] } };
  }, {}) as { [key: string]: string };
  return Object.keys(filteredAnswer).reduce((acc, key) => {
    if (
      typeof filteredAnswer[key] === "object" &&
      !Array.isArray(filteredAnswer[key]) &&
      Object.keys(filteredAnswer[key]).length === 0
    ) {
      return acc;
    }
    return { ...acc, ...{ [key]: filteredAnswer[key] } };
  }, {}) as Manifest;
};

/**
 * Validate if the loaded manifest has all required keys from built-in manifests
 * @param manifest - Manifest object to validate
 * @returns true if valid, false otherwise
 */
const isValidTemplateManifest = (
  manifest: any,
): manifest is Partial<Manifest> => {
  if (!manifest || typeof manifest !== "object") {
    return false;
  }

  // Get all keys from modernManifest (which has all keys from minimumManifest too)
  const requiredKeys = Object.keys(modernManifest);

  // Check if all required keys exist in the loaded manifest
  for (const key of requiredKeys) {
    if (!(key in manifest)) {
      return false;
    }
  }

  return true;
};

/**
 * Load template manifest from local template directory if it exists
 * @param localTemplatePath - Local template directory path
 * @returns Template manifest object or null if the template manifest file does not exist
 * @throws Error if the template manifest file exists but is invalid
 */
const loadTemplateManifest = (
  localTemplatePath: string,
): Partial<Manifest> | null => {
  const templatePath = path.resolve(localTemplatePath);
  const templateManifestPath = path.join(
    templatePath,
    TEMPLATE_MANIFEST_FILENAME,
  );

  if (!fs.existsSync(templateManifestPath)) {
    return null;
  }

  const content = fs.readFileSync(templateManifestPath, "utf-8");
  const manifest = JSON.parse(content);

  // Validate the loaded manifest
  if (!isValidTemplateManifest(manifest)) {
    throw new Error(
      `Invalid ${TEMPLATE_MANIFEST_FILENAME} in ${templateManifestPath}: missing required keys`,
    );
  }

  return manifest;
};

/**
 * Build the manifest setting
 * @param answers
 * @param templateType - Built-in template name or local directory path
 */
export const buildManifest = (
  answers: Answers,
  templateType: TemplateType | string,
): Manifest => {
  // Determine default manifest based on template type
  let defaultManifest;
  if (isLocalTemplatePath(templateType)) {
    defaultManifest = loadTemplateManifest(templateType);
  }

  if (!defaultManifest) {
    defaultManifest =
      templateType === "modern" ? modernManifest : minimumManifest;
  }

  let manifest = {
    ...defaultManifest,
    ...answer2Manifest(answers),
  };

  if (answers.supportMobile) {
    manifest = {
      ...manifest,
      ...{
        mobile: {
          js: ["js/mobile.js"],
          css: ["css/mobile.css"],
        },
      },
    };
  }
  return manifest;
};
