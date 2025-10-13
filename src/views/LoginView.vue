<template>
  <v-container class="d-flex justify-center align-center" style="min-height: 100vh;">
    <v-card width="400" title="Login to Nutriz 🥗">
      <v-card-text>
        <v-form ref="form" @submit.prevent="handleSubmit">
          <v-text-field
            v-model="credentials.email"
            label="Email"
            prepend-inner-icon="mdi-email-outline"
            type="email"
            :rules="[rules.required, rules.email]"
            autofocus
          ></v-text-field>
          <v-text-field
            v-model="credentials.password"
            label="Password"
            type="password"
            prepend-inner-icon="mdi-lock-outline"
            :rules="[rules.required]"
          ></v-text-field>
          <v-alert v-if="errorMessage" type="error" density="compact" class="mb-4">
            {{ errorMessage }}
          </v-alert>
          <v-btn
            :loading="authStore.loading"
            block
            color="primary"
            class="mt-2"
            type="submit"
          >
            Login
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/useAuthStore";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const form = ref(null);
const credentials = ref({ email: "", password: "" });
const errorMessage = ref("");

const rules = {
  required: (value) => !!value || "Required.",
  email: (value) => /.+@.+\..+/.test(value) || "Invalid e-mail.",
};

async function handleSubmit() {
  const { valid } = await form.value.validate();
  if (!valid) return;
  errorMessage.value = "";
  try {
    await authStore.login(credentials.value);
    const redirect = route.query.redirect || "/clients";
    router.push(redirect);
  } catch (err) {
    errorMessage.value = authStore.error || "Unable to login";
  }
}
</script>
