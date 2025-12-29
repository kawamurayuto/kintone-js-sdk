import type { TestPattern } from "../e2e.test";
import {
  ANSWER_NO,
  CREATE_PLUGIN_COMMAND,
  DEFAULT_ANSWER,
} from "../utils/constants";
import { getBoundMessage } from "../../src/messages";
import path from "path";
import fs from "fs";

const m = getBoundMessage("en");

export const pattern: TestPattern = {
  description:
    "#JsSdkTest-LocalTemplate Should use manifest.template.json from local template",
  prepareFn: ({ workingDir }: { workingDir: string }) => {
    // Copy minimum template to working directory
    const templateDir = path.join(workingDir, "custom-template");
    const builtInTemplateDir = path.resolve(
      __dirname,
      "..",
      "..",
      "templates",
      "minimum",
    );

    // Copy directory recursively (Node.js 20 compatible)
    const copyRecursive = (src: string, dest: string) => {
      fs.mkdirSync(dest, { recursive: true });
      const entries = fs.readdirSync(src, { withFileTypes: true });

      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
          copyRecursive(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    };

    copyRecursive(builtInTemplateDir, templateDir);

    // Add custom manifest.template.json with all values changed
    const customManifest = {
      $schema:
        "https://raw.githubusercontent.com/kintone/js-sdk/%40kintone/plugin-manifest-validator%4010.2.0/packages/plugin-manifest-validator/manifest-schema.json",
      manifest_version: 1,
      version: 99,
      type: "APP",
      desktop: {
        js: ["js/custom-desktop.js", "js/custom-lib.js"],
        css: ["css/custom-desktop.css"],
      },
      icon: "image/custom-icon.png",
      config: {
        html: "html/custom-config.html",
        js: ["js/custom-config.js"],
        css: ["css/custom-config.css"],
        required_params: ["customParam1", "customParam2"],
      },
    };

    fs.writeFileSync(
      path.join(templateDir, "manifest.template.json"),
      JSON.stringify(customManifest, null, 2),
    );
  },
  input: {
    command: CREATE_PLUGIN_COMMAND,
    outputDir: "test-local-template",
    commandArgument: `--template ./custom-template`,
    template: "minimum",
    questionsInput: [
      {
        question: m("Q_NameEn"),
        answer: "local-template-test",
      },
      {
        question: m("Q_DescriptionEn"),
        answer: "Testing local template with manifest.template.json",
      },
      {
        question: m("Q_SupportJa"),
        answer: DEFAULT_ANSWER,
      },
      {
        question: m("Q_SupportZh"),
        answer: DEFAULT_ANSWER,
      },
      {
        question: m("Q_SupportEs"),
        answer: DEFAULT_ANSWER,
      },
      {
        question: m("Q_WebsiteUrlEn"),
        answer: DEFAULT_ANSWER,
      },
      {
        question: m("Q_MobileSupport"),
        answer: ANSWER_NO,
      },
      {
        question: m("Q_EnablePluginUploader"),
        answer: ANSWER_NO,
      },
    ],
  },
  expected: {
    success: {
      manifestJson: {
        name: { en: "local-template-test" },
        description: { en: "Testing local template with manifest.template.json" },
        version: 99, // Should use custom version from manifest.template.json
        desktop: {
          js: ["js/custom-desktop.js", "js/custom-lib.js"], // Should use custom JS files from manifest.template.json
          css: ["css/custom-desktop.css"], // Should use custom CSS from manifest.template.json
        },
        icon: "image/custom-icon.png", // Should use custom icon from manifest.template.json
        config: {
          html: "html/custom-config.html", // Should use custom HTML from manifest.template.json
          js: ["js/custom-config.js"], // Should use custom JS from manifest.template.json
          css: ["css/custom-config.css"], // Should use custom CSS from manifest.template.json
          required_params: ["customParam1", "customParam2"], // Should use custom params from manifest.template.json
        },
      },
    },
  },
};
