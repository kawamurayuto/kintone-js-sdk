import assert from "assert";
import {
  isNecessaryFile,
  getTemplateType,
  processTemplateFile,
  isLocalTemplatePath,
  validateLocalTemplate,
} from "../template";
import createBaseManifest from "./helpers/baseManifest";
import { promises as fs } from "fs";
import * as fsSync from "fs";
import path from "path";
import os from "os";

describe("template", () => {
  describe("getTemplateType", () => {
    it("should return be minimum", () => {
      assert.strictEqual(getTemplateType(createBaseManifest()), "minimum");
    });
  });

  describe("isLocalTemplatePath", () => {
    it("should return true for absolute paths (platform-specific)", () => {
      // Test absolute path for the current platform
      const absolutePath = path.resolve("/absolute/path");
      assert(isLocalTemplatePath(absolutePath));
    });

    it("should return true for relative paths starting with ./", () => {
      assert(isLocalTemplatePath("./relative/path"));
      assert(isLocalTemplatePath(".\\relative\\path"));
    });

    it("should return true for relative paths starting with ../", () => {
      assert(isLocalTemplatePath("../parent/path"));
      assert(isLocalTemplatePath("..\\parent\\path"));
    });

    it("should return false for built-in template names", () => {
      assert(!isLocalTemplatePath("minimum"));
      assert(!isLocalTemplatePath("modern"));
    });

    it("should return false for other strings", () => {
      assert(!isLocalTemplatePath("template-name"));
      assert(!isLocalTemplatePath("my-template"));
    });
  });

  describe("validateLocalTemplate", () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fsSync.mkdtempSync(
        path.join(os.tmpdir(), "test-validate-template-"),
      );
    });

    afterEach(() => {
      fsSync.rmSync(tempDir, { recursive: true, force: true });
    });

    it("should return true for valid template directory with package.json", () => {
      const packageJsonPath = path.join(tempDir, "package.json");
      fsSync.writeFileSync(packageJsonPath, JSON.stringify({ name: "test" }));

      assert(validateLocalTemplate(tempDir));
    });

    it("should return false if directory does not exist", () => {
      const nonexistentPath = path.join(tempDir, "nonexistent");
      assert(!validateLocalTemplate(nonexistentPath));
    });

    it("should return false if path is a file, not a directory", () => {
      const filePath = path.join(tempDir, "file.txt");
      fsSync.writeFileSync(filePath, "content");

      assert(!validateLocalTemplate(filePath));
    });

    it("should return false if package.json does not exist", () => {
      // tempDir exists but has no package.json
      assert(!validateLocalTemplate(tempDir));
    });
  });
  describe("isNecessaryFile", () => {
    it("should returns a boolean that shows whether the file should include or not", () => {
      const manifest = createBaseManifest();
      assert(!isNecessaryFile(manifest, "webpack.entry.json"));
      assert(!isNecessaryFile(manifest, "with-plugin-uploader.json"));
      assert(!isNecessaryFile(manifest, "js/mobile.js"));
      assert(!isNecessaryFile(manifest, "js/config.js"));
      assert(isNecessaryFile(manifest, "js/other.js"));
      assert(isNecessaryFile({ ...manifest, mobile: {} }, "js/mobile.js"));
      assert(isNecessaryFile({ ...manifest, config: {} }, "js/config.js"));
    });
  });
  describe("processTemplateFile", () => {
    let destDir: string;
    const manifest = createBaseManifest();

    beforeEach(async () => {
      destDir = await fs.mkdtemp(
        path.join(os.tmpdir(), "kintone-create-plugin-"),
      );
    });

    const patterns: Array<{ template: string; enablePluginUploader: boolean }> =
      [
        { template: "minimum", enablePluginUploader: false },
        { template: "minimum", enablePluginUploader: true },
        { template: "modern", enablePluginUploader: false },
        { template: "modern", enablePluginUploader: true },
      ];

    it.each(patterns)(
      "should convert package.json correctly (template: $template, enablePluginUploader: $enablePluginUploader)",
      async ({ template, enablePluginUploader }) => {
        const srcDir = path.resolve(
          __dirname,
          "..",
          "..",
          "templates",
          template,
        );

        await processTemplateFile(
          path.resolve(srcDir, "package.json"),
          srcDir,
          destDir,
          manifest,
          enablePluginUploader,
        );

        const packageJson = JSON.parse(
          await fs.readFile(path.resolve(destDir, "package.json"), "utf8"),
        );

        assert(packageJson.name);
        assert(packageJson.version);
        assert(packageJson.scripts);
        assert(packageJson.devDependencies);

        if (enablePluginUploader) {
          assert(packageJson.scripts.upload);
          assert(packageJson.devDependencies["@kintone/plugin-uploader"]);
        }
      },
    );

    it.each(patterns)(
      "should convert template file correctly (template: $template, enablePluginUploader: $enablePluginUploader)",
      async ({ template, enablePluginUploader }) => {
        const srcDir = path.resolve(
          __dirname,
          "..",
          "..",
          "templates",
          template,
        );

        const templateFile =
          template === "modern"
            ? path.resolve(srcDir, "plugin", "html", "config.html.tmpl")
            : path.resolve(srcDir, "src", "html", "config.html.tmpl");

        await processTemplateFile(
          templateFile,
          srcDir,
          destDir,
          manifest,
          enablePluginUploader,
        );

        const destFile =
          template === "modern"
            ? path.resolve(destDir, "plugin", "html", "config.html")
            : path.resolve(destDir, "src", "html", "config.html");
        assert(await fs.stat(destFile));
      },
    );
    it.each(patterns)(
      "should copy normal file correctly (template: $template, enablePluginUploader: $enablePluginUploader)",
      async ({ template, enablePluginUploader }) => {
        const srcDir = path.resolve(
          __dirname,
          "..",
          "..",
          "templates",
          template,
        );

        const templateFile = path.resolve(srcDir, ".gitignore");

        await processTemplateFile(
          templateFile,
          srcDir,
          destDir,
          manifest,
          enablePluginUploader,
        );

        assert(await fs.stat(path.resolve(destDir, ".gitignore")));
      },
    );

    it("should convert webpack.config.js correctly with modern template", async () => {
      const srcDir = path.resolve(__dirname, "..", "..", "templates", "modern");

      await processTemplateFile(
        path.resolve(srcDir, "webpack.config.template.js"),
        srcDir,
        destDir,
        manifest,
        false,
      );
      const destFile = path.resolve(destDir, "webpack.config.js");
      assert(await fs.stat(destFile));
    });
  });
});
