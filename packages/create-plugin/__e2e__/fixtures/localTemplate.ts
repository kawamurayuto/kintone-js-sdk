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
    "#JsSdkTest-LocalTemplate Should able to create a plugin with local template directory",
  prepareFn: ({ workingDir }: { workingDir: string }) => {
    // Create a local template directory based on minimum template
    const templateDir = path.join(workingDir, "custom-template");
    const builtInTemplateDir = path.resolve(
      __dirname,
      "..",
      "..",
      "templates",
      "minimum",
    );

    // Copy minimum template to working directory
    fs.cpSync(builtInTemplateDir, templateDir, { recursive: true });
  },
  input: {
    command: CREATE_PLUGIN_COMMAND,
    outputDir: "test-local-template",
    commandArgument: `--template ./custom-template`,
    template: "minimum", // Use minimum for manifest verification
    questionsInput: [
      {
        question: m("Q_NameEn"),
        answer: "local-template-test",
      },
      {
        question: m("Q_DescriptionEn"),
        answer: "Testing local template feature",
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
        description: { en: "Testing local template feature" },
        desktop: {
          js: ["js/desktop.js"],
          css: ["css/51-modern-default.css", "css/desktop.css"],
        },
      },
    },
  },
};
