// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },

  devServer: {
    port: 3456,
  },
  runtimeConfig: {
    public: {
      wsUrl: import.meta.env.WS_URL || "",
      apiUrl: import.meta.env.API_URL || "",
    },
  },
  modules: ["@nuxtjs/tailwindcss", "@nuxtjs/google-fonts"],
  googleFonts: {
    families: {
      Nunito: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    },
  },
});
