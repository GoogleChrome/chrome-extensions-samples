import { defineConfig } from 'vite';
import { resolve } from 'path';
import checker from 'vite-plugin-checker';

export default defineConfig({
    plugins: [
        checker({
            typescript: true,
        }),
    ],
    // Plain esbuild JSX transform (no @preact/preset-vite): that preset pulls
    // in Babel plus Prefresh HMR, neither of which helps a content script
    // that's never live-reloaded inside the host page.
    esbuild: {
        jsx: 'automatic',
        jsxImportSource: 'preact',
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                content: resolve(__dirname, 'src/content.tsx'),
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
