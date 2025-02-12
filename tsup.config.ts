import { defineConfig } from "tsup";

export default defineConfig({
    clean: true,
    dts: true,
    entry: ["src/**/*.ts"],
    format: ["esm", "cjs"],
    sourcemap: false,
    minify: false,
    splitting: false,
    target: "es6",
    outDir: "dist",
    bundle: false,
});
