import { defineConfig } from "tsup";

export default defineConfig({
    clean: true,
    dts: true,
    entry: ["src/**/*.ts"],
    format: ["cjs", "esm"],
    sourcemap: false,
    minify: false,
    splitting: false,
    target: "esnext",
    outDir: "dist",
    bundle: false,
    config: "tsconfig.build.json",
});
