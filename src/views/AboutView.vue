<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="text-h4 text-center mt-4">
            About Nutriz
          </v-card-title>
          <v-card-text class="pa-5">
            <p class="text-body-1">
              Nutriz is a modern, intuitive application designed to help
              nutritionists and dietitians manage their clients, create
              customized meal plans, and track their progress effectively.
            </p>

            <v-divider class="my-4"></v-divider>

            <h2 class="text-h5 mb-3">Our Mission</h2>
            <p class="text-body-1">
              Our mission is to empower nutrition professionals with the tools
              they need to provide the best possible care to their clients. We
              believe that by streamlining the administrative and planning
              aspects of their work, we can help them focus on what truly

              matters: helping people achieve their health and wellness goals.
            </p>

            <v-divider class="my-4"></v-divider>

            <h2 class="text-h5 mb-3">Technologies Used</h2>
            <p class="text-body-1">
              This application is built with a modern, open-source tech stack:
            </p>
            <v-list lines="one">
              <v-list-item
                prepend-icon="mdi-vuejs"
                title="Vue.js"
                subtitle="The progressive JavaScript framework for building user interfaces."
              ></v-list-item>
              <v-list-item
                prepend-icon="mdi-vuetify"
                title="Vuetify"
                subtitle="A Vue UI Library with beautifully handcrafted Material Components."
              ></v-list-item>
              <v-list-item
                prepend-icon="mdi-router"
                title="Vue Router"
                subtitle="The official router for Vue.js for creating a single-page application experience."
              ></v-list-item>
              <v-list-item
                prepend-icon="mdi-pinia"
                title="Pinia"
                subtitle="The intuitive, type-safe, and flexible state management library for Vue."
              ></v-list-item>
              <v-list-item
                prepend-icon="mdi-language-javascript"
                title="Vite"
                subtitle="A next-generation frontend tooling that provides a faster and leaner development experience."
              ></v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
// No script logic needed for this view
</script>
