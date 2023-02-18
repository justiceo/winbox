import esbuild from "esbuild";

esbuild
  .build({
    entryPoints: ["src/winbox.js", "src/winbox.css"],
    bundle: true,
    minify: false,
    sourcemap: true,
    outdir: "dist/",
    target: ["chrome107"], // https://en.wikipedia.org/wiki/Google_Chrome_version_history
    loader: {
      ".svg": "dataurl",
    },
  })
  .catch((err) => {
    console.error(err);
  });
