import glslify from "vite-plugin-glslify";

/** @type {import('vite').UserConfig} */
export default {
  base: "./",
  root: "src/",
  publicDir: "../static/",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    host: true,
    open: !("SANDBOX_URL" in process.env || "CODESANDBOX_HOST" in process.env),
  },
  plugins: [glslify()],
};
