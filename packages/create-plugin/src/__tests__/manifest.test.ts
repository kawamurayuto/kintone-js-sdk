import assert from "assert";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { buildManifest } from "../manifest";

import createBaseManifest from "./helpers/baseManifest";

describe("manifest", () => {
  describe("buildManifest", () => {
    const templateType = "minimum";
    it("should include basic settings", () => {
      const baseManifest = createBaseManifest();
      // @ts-ignore We can fix this using conditional types
      const manifest = buildManifest(
        {
          name: baseManifest.name,
          description: baseManifest.name,
          homepage_url: {},
          supportMobile: false,
          enablePluginUploader: false,
        },
        templateType,
      );
      assert.strictEqual(manifest.manifest_version, 1);
      assert.strictEqual(manifest.name.en, "sample");
      assert.strictEqual(manifest.mobile, undefined);
    });
    it("should include mobile.js if the answers enable mobile", () => {
      const baseManifest = createBaseManifest();
      // @ts-ignore We can fix this using conditional types
      const manifest = buildManifest(
        {
          name: baseManifest.name,
          description: baseManifest.name,
          homepage_url: {},
          supportMobile: true,
          enablePluginUploader: false,
        },
        templateType,
      );
      assert(manifest.mobile && Array.isArray(manifest.mobile.js));
    });
    it("should include config if the answers enable config", () => {
      const baseManifest = createBaseManifest();
      // @ts-ignore We can fix this using conditional types
      const manifest = buildManifest(
        {
          name: baseManifest.name,
          description: baseManifest.name,
          homepage_url: {},
          supportMobile: false,
          enablePluginUploader: false,
        },
        templateType,
      );
      assert.deepStrictEqual(manifest.config && Object.keys(manifest.config), [
        "html",
        "js",
        "css",
        "required_params",
      ]);
    });

    describe("local template with manifest.template.json", () => {
      let tempDir: string;

      beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "test-template-"));
      });

      afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
      });

      it("should load manifest.template.json from local template", () => {
        const templateManifestPath = path.join(
          tempDir,
          "manifest.template.json",
        );
        const fixtureContent = fs.readFileSync(
          path.join(__dirname, "fixtures", "manifest.template.custom.json"),
          "utf-8",
        );
        fs.writeFileSync(templateManifestPath, fixtureContent);

        const baseManifest = createBaseManifest();
        // @ts-ignore We can fix this using conditional types
        const manifest = buildManifest(
          {
            name: baseManifest.name,
            description: baseManifest.name,
            homepage_url: {},
            supportMobile: false,
            enablePluginUploader: false,
          },
          tempDir,
        );

        assert.strictEqual(manifest.version, 2);
        assert.strictEqual(manifest.desktop?.js?.[0], "js/custom.js");
        assert.strictEqual(manifest.icon, "image/custom-icon.png");
      });

      it("should fall back to minimumManifest when manifest.template.json does not exist", () => {
        const baseManifest = createBaseManifest();
        // @ts-ignore We can fix this using conditional types
        const manifest = buildManifest(
          {
            name: baseManifest.name,
            description: baseManifest.name,
            homepage_url: {},
            supportMobile: false,
            enablePluginUploader: false,
          },
          tempDir,
        );

        assert.strictEqual(manifest.manifest_version, 1);
        assert.strictEqual(manifest.desktop?.js?.[0], "js/desktop.js");
      });

      it("should throw error when manifest.template.json is invalid (missing required keys)", () => {
        const templateManifestPath = path.join(
          tempDir,
          "manifest.template.json",
        );
        const fixtureContent = fs.readFileSync(
          path.join(__dirname, "fixtures", "manifest.template.invalid.json"),
          "utf-8",
        );
        fs.writeFileSync(templateManifestPath, fixtureContent);

        const baseManifest = createBaseManifest();
        assert.throws(() => {
          // @ts-ignore We can fix this using conditional types
          buildManifest(
            {
              name: baseManifest.name,
              description: baseManifest.name,
              homepage_url: {},
              supportMobile: false,
              enablePluginUploader: false,
            },
            tempDir,
          );
        }, /Invalid manifest\.template\.json.*missing required keys/);
      });

      it("should throw error when manifest.template.json has invalid JSON", () => {
        const templateManifestPath = path.join(
          tempDir,
          "manifest.template.json",
        );
        fs.writeFileSync(templateManifestPath, "{ invalid json }");

        const baseManifest = createBaseManifest();
        assert.throws(() => {
          // @ts-ignore We can fix this using conditional types
          buildManifest(
            {
              name: baseManifest.name,
              description: baseManifest.name,
              homepage_url: {},
              supportMobile: false,
              enablePluginUploader: false,
            },
            tempDir,
          );
        });
      });
    });
  });
});
