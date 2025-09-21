import { defineConfig } from "vite"
import { resolve } from "path"
import { ductSSGPlugin } from "@duct-ui/cli/vite-plugin"

export default defineConfig({
  root: ".",
  server: {
    port: 3009
  },
  resolve: {
    alias: {
      "@components": resolve(__dirname, "./src/components"),
      "@utils": resolve(__dirname, "./src/utils"),
      "@types": resolve(__dirname, "./src/types"),
      "@data": resolve(__dirname, "./src/data")
    }
  },
  plugins: [
    ductSSGPlugin()
  ],
  build: {
    emptyOutDir: true,
    rollupOptions: {
      output: {
        format: "es",
        dir: "dist",
      },
    }
  },
})