import { svelte } from "@sveltejs/vite-plugin-svelte";
import fg from "fast-glob";
import { resolve } from "path";
import livereload from "rollup-plugin-livereload";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import zipPack from "vite-plugin-zip-pack";

const env = process.env;
const isSrcmap = env.VITE_SOURCEMAP === "inline";
const isDev = env.NODE_ENV === "development";

const outputDir = isDev ? "dev" : "dist";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },

  plugins: [
    svelte(),

    viteStaticCopy({
      targets: [
        { src: "./README*.md", dest: "./" },
        { src: "./plugin.json", dest: "./" },
        { src: "./preview.png", dest: "./" },
        { src: "./icon.png", dest: "./" },
      ],
    }),
  ],

  define: {
    "process.env.DEV_MODE": JSON.stringify(isDev),
    "process.env.NODE_ENV": JSON.stringify(env.NODE_ENV),
  },

  build: {
    outDir: outputDir,
    emptyOutDir: false,
    minify: true,
    sourcemap: isSrcmap ? "inline" : false,

    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      fileName: "index",
      formats: ["cjs"],
    },
    rollupOptions: {
      plugins: [
        ...(isDev
          ? [
              livereload(outputDir),
              {
                name: "watch-external",
                async buildStart() {
                  const files = await fg(["./README*.md", "./plugin.json"]);
                  for (let file of files) {
                    this.addWatchFile(file);
                  }
                },
              },
            ]
          : [
              zipPack({
                inDir: "./dist",
                outDir: "./",
                outFileName: "package.zip",
              }),
            ]),
      ],

      external: ["siyuan", "process"],

      output: {
        entryFileNames: "[name].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "style.css") {
            return "index.css";
          }
          return assetInfo.name;
        },
      },
    },
  },
});
