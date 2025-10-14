<template>
  <v-container class="d-flex justify-center align-center h-100">
    <v-card width="400" title="Login to Nutriz 🥗">
      <v-card-text>
        <v-alert
          v-if="errorMessage"
          type="error"
          class="mb-4"
          border="start"
          :text="errorMessage"
        />
        <v-text-field
          v-model="email"
          label="Email"
          prepend-inner-icon="mdi-email-outline"
          autocomplete="username"
        ></v-text-field>
        <v-text-field
          v-model="password"
          label="Password"
          type="password"
          prepend-inner-icon="mdi-lock-outline"
          autocomplete="current-password"
        ></v-text-field>
        <v-btn
          block
          color="primary"
          class="mt-2"
          :loading="isSubmitting"
          @click="handleLogin"
        >
          Login
        </v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const router = useRouter();
const authStore = useAuthStore();

const email = ref("");
const password = ref("");
const errorMessage = ref("");
const isSubmitting = ref(false);

async function handleLogin() {
  if (!email.value || !password.value || isSubmitting.value) return;
  isSubmitting.value = true;
  errorMessage.value = "";
  try {
    await authStore.login({ email: email.value, password: password.value });
    await authStore.fetchCurrentUser().catch(() => {});
    await router.replace("/clients");
  } catch (error) {
    errorMessage.value =
      authStore.error || "Invalid credentials. Please try again.";
  } finally {
    isSubmitting.value = false;
  }
}
</script>
