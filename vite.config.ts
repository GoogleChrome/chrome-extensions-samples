import { defineConfig } from 'vite';
import { resolve } from 'path';
import checker from 'vite-plugin-checker';

export default defineConfig({
    plugins: [
        checker({
            typescript: true,
        }),
    ],
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                // content.ts (the isolated-world UI mount) is added back once
                // the Preact overlay + store land — see the rebuild plan.
                interceptor: resolve(__dirname, 'src/interceptor.ts'),
                background: resolve(__dirname, 'src/background.ts'),
            },
            output: {
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                assetFileNames: '[name].[ext]',
            },
        },
        emptyOutDir: true,
    },
});
