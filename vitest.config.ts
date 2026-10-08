import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "jsdom",
        restoreMocks: true,
        clearMocks: true,
        include: ["src/**/*.test.{ts,tsx}"],
    },
});

