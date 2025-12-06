// import { chromeLauncher } from "@web/test-runner-chrome";
// import { puppeteerLauncher } from "@web/test-runner-puppeteer";
import { importMapsPlugin } from "@web/dev-server-import-maps";
import { seleniumLauncher } from "@web/test-runner-selenium";
import { Builder } from "selenium-webdriver";
import { Options } from "selenium-webdriver/firefox.js";

// https://github.com/modernweb-dev/web/issues/2847
// ^ not super useful to us, because p5 package browser defines non-module :/
// https://modern-web.dev/docs/dev-server/plugins/import-maps/
// https://github.com/rollup/plugins/tree/master/packages/node-resolve
export default {
  // TODO all config values
  files: "test/*.test.js",
  // nodeResolve: true,
  // nodeResolve: {
  //  //browser: true,
  //  mainFields: ["browser"],
  //  //resolveOnly: ["p5"]
  // },
  plugins: [
    importMapsPlugin({
      inject: {
        importMap: {
          imports: {
            "chai": "./node_modules/chai/index.js",
            "p5": "./node_modules/p5/lib/p5.esm.min.js",
            "#sticky": "./src/sticky.js",
            "#util": "./src/util.js",
          },
        },
      },
    }),
  ],
  // browsers: [chromeLauncher({ launchOptions: { browser: "firefox" } })],
  // browsers: [puppeteerLauncher({ launchOptions: { browser: "firefox" } })],
  browsers: [
    seleniumLauncher({
      driverBuilder:
        new Builder().forBrowser("firefox")
          .setFirefoxOptions(new Options().addArguments("--headless")),
    }),
  ],
};
