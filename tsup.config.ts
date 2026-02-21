import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/server.ts'],  // your main file
  outDir: 'dist',            // output folder
  format: ['esm'],           // module format
  clean: true,               // clean output folder before build
  sourcemap: true,           // optional: generates source maps
  minify: false,             // optional: minify code
  dts: false                  // optional: generate TypeScript declaration files
})
