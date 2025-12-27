import type { TestPattern } from "../e2e.test";
import { CREATE_PLUGIN_COMMAND } from "../utils/constants";
import path from "path";
import fs from "fs";

export const pattern: TestPattern = {
  description:
    "#JsSdkTest-InvalidLocalTemplate Should fail when template directory does not contain package.json",
  prepareFn: ({ workingDir }: { workingDir: string }) => {
    // Create an invalid template directory without package.json
    const templateDir = path.join(workingDir, "invalid-template");
    fs.mkdirSync(templateDir, { recursive: true });

    // Create some files but no package.json
    fs.writeFileSync(path.join(templateDir, "README.md"), "Invalid template");
  },
  input: {
    command: CREATE_PLUGIN_COMMAND,
    outputDir: "test-invalid-template",
    commandArgument: `--template ./invalid-template`,
    questionsInput: [],
  },
  expected: {
    failure: {
      stderr: "Invalid template directory.*\\n.*must exist and contain a package\\.json file",
    },
  },
};
