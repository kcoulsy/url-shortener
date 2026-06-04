import adapter from "svelte-kit-sst";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  compilerOptions: {
    // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
    runes: ({ filename }) => (filename.split(/[/\\]/).includes("node_modules") ? undefined : true),
  },
  kit: {
    adapter: adapter(),
    alias: {
      "@urls": "../urls/src",
      $assets: "src/assets",
      $components: "src/components",
      $server: "src/server",
    },
  },
};

export default config;
