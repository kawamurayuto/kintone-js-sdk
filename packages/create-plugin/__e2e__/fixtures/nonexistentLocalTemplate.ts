import type { TestPattern } from "../e2e.test";
import { CREATE_PLUGIN_COMMAND } from "../utils/constants";

export const pattern: TestPattern = {
  description:
    "#JsSdkTest-NonexistentLocalTemplate Should fail when template directory does not exist",
  input: {
    command: CREATE_PLUGIN_COMMAND,
    outputDir: "test-nonexistent-template",
    commandArgument: `--template ./nonexistent-template`,
    questionsInput: [],
  },
  expected: {
    failure: {
      stderr: "Invalid template directory.*\\n.*must exist and contain a package\\.json file",
    },
  },
};
