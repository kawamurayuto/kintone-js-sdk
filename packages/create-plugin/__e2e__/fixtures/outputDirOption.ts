import type { TestPattern } from "../e2e.test";
import {
  ANSWER_NO,
  CREATE_PLUGIN_COMMAND,
  DEFAULT_ANSWER,
} from "../utils/constants";
import { getBoundMessage } from "../../src/messages";
import * as fs from "fs";
import * as path from "path";

const m = getBoundMessage("en");

export const pattern: TestPattern = {
  description:
    "#JsSdkTest-OutputDir Should able to create a plugin with --output-dir option",
  prepareFn: ({ workingDir }: { workingDir: string }) => {
    // Create parent directory for --output-dir option
    const parentDir = path.join(workingDir, "plugins");
    fs.mkdirSync(parentDir, { recursive: true });
  },
  input: {
    command: CREATE_PLUGIN_COMMAND,
    outputDir: "test-output-dir",
    commandArgument: "--output-dir plugins --skip-install",
    questionsInput: [
      {
        question: m("Q_NameEn"),
        answer: "output-dir-test",
      },
      {
        question: m("Q_DescriptionEn"),
        answer: "Testing --output-dir option",
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
        name: { en: "output-dir-test" },
        description: { en: "Testing --output-dir option" },
      },
    },
  },
};
