<template>
  <v-container class="d-flex justify-center align-center h-100">
    <v-card width="400" title="Login to Nutriz 🥗">
      <v-card-text>
        <v-text-field
          label="Email"
          prepend-inner-icon="mdi-email-outline"
        ></v-text-field>
        <v-text-field
          label="Password"
          type="password"
          prepend-inner-icon="mdi-lock-outline"
        ></v-text-field>
        <v-btn block color="primary" class="mt-2">Login</v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
// Login logic will go here
</script>
