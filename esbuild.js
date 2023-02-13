
import esbuild from 'esbuild'

esbuild
      .build({
        entryPoints: [
          "js/winbox.js",         
        ],
        bundle: true,
        minify: false,
        sourcemap: true,
        outdir: "dist/",
        target: ["chrome107"], // https://en.wikipedia.org/wiki/Google_Chrome_version_history
        loader: {
            ".svg": "file",
          },
      })
      .catch((err) => {
        console.error(err);
      });
