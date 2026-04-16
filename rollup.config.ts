import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import type { Plugin, RollupOptions } from "rollup";

const dev = process.env.NODE_ENV === "development";

const terserPlugin = terser({
    compress: {
        ecma: 2020,
        passes: 3,
        unsafe: true,
        unsafe_arrows: true,
        unsafe_comps: true,
        pure_getters: true,
        drop_debugger: true,
        collapse_vars: true,
        reduce_vars: true,
    },
    mangle: { safari10: true, toplevel: true },
    format: { comments: false },
});

const VIRTUAL_ID = "virtual:civil-ext-shim-source";
const RESOLVED_ID = "\0virtual:civil-ext-shim-source";

function inlineShimPlugin(): Plugin {
    return {
        name: "inline-shim",
        resolveId(id) {
            if (id === VIRTUAL_ID) return RESOLVED_ID;
            return null;
        },
        load(id) {
            if (id !== RESOLVED_ID) return null;

            if (dev) {
                return `export default "";`;
            }

            const shimPath = resolve("dist", "civil-ext-shim.js");
            let src: string;
            try {
                src = readFileSync(shimPath, "utf8");
            } catch {
                this.error(
                    `[inline-shim] Cannot read ${shimPath}. ` +
                        "Ensure the shim IIFE (build #1) is written before the host module (build #2). " +
                        "Run 'bun run build' (not --watch) so builds complete sequentially.",
                );
                return null;
            }

            const escaped = src
                .replace(/\\/g, "\\\\")
                .replace(/`/g, "\\`")
                .replace(/\$\{/g, "\\${");

            return `export default \`${escaped}\`;`;
        },
    };
}

function tsPlugin(declaration: boolean): Plugin {
    return typescript({
        tsconfig: "./tsconfig.json",
        declaration,
        declarationDir: declaration ? "dist" : undefined,
        sourceMap: dev,
        inlineSources: dev,
    }) as Plugin;
}

const shimBundle: RollupOptions = {
    input: "src/shim/index.ts",
    output: {
        file: "dist/civil-ext-shim.js",
        format: "iife",
        name: "__civilExtShim__",
        compact: !dev,
        generatedCode: { arrowFunctions: true, constBindings: true },
        sourcemap: dev,
    },
    treeshake: {
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false,
    },
    plugins: [
        nodeResolve({ browser: true }),
        tsPlugin(false),
        ...(dev ? [] : [terserPlugin]),
    ],
};

const hostBundle: RollupOptions = {
    input: "src/index.ts",
    output: {
        file: "dist/index.js",
        format: "esm",
        sourcemap: dev,
        generatedCode: { arrowFunctions: true, constBindings: true },
    },
    treeshake: {
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false,
    },
    plugins: [
        nodeResolve({ browser: true }),
        tsPlugin(true),
        inlineShimPlugin(),
        ...(dev ? [] : [terserPlugin]),
    ],
};

export default [shimBundle, hostBundle];
