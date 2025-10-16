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

<style scoped>
.auth-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #f7f9fc 0%, #eef3ff 100%);
}

.hero-panel {
  position: relative;
  overflow: hidden;
  background: linear-gradient(140deg, #2563eb 0%, #0ea5e9 35%, #10b981 100%);
  color: #ffffff;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top left, rgba(255, 255, 255, 0.2), transparent 55%),
    radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.15), transparent 45%);
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 1;
  padding: 96px 72px;
  max-width: 520px;
  margin-left: auto;
}

.hero-chip {
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.9;
}

.hero-title {
  font-size: clamp(2.4rem, 2.2rem + 0.8vw, 3.1rem);
  font-weight: 700;
  margin-bottom: 24px;
  line-height: 1.15;
}

.hero-subtitle {
  font-size: 1.1rem;
  line-height: 1.6;
  opacity: 0.9;
}

.hero-bullets {
  list-style: none;
  padding: 0;
  margin: 36px 0 0;
  display: grid;
  gap: 20px;
}

.hero-bullets li {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.hero-bullets strong {
  display: block;
  font-size: 1.05rem;
  margin-bottom: 4px;
}

.hero-bullets p {
  margin: 0;
  opacity: 0.85;
  line-height: 1.5;
}

.form-panel {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: clamp(32px, 8vw, 80px) clamp(20px, 8vw, 80px);
}

.form-wrapper {
  width: 100%;
  max-width: 440px;
}

.auth-card {
  border-radius: 22px;
  backdrop-filter: blur(6px);
}

.card-header h2 {
  font-size: 1.9rem;
  font-weight: 600;
  margin-bottom: 6px;
}

.card-header p {
  margin: 0;
  color: rgba(15, 23, 42, 0.65);
}

.switcher {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  color: rgba(15, 23, 42, 0.7);
}

.footer-copy {
  text-align: center;
  margin-top: 32px;
  font-size: 0.95rem;
  color: rgba(15, 23, 42, 0.55);
}

@media (max-width: 959px) {
  .hero-panel {
    display: none !important;
  }

  .form-panel {
    padding-top: 96px;
    padding-bottom: 72px;
    background: linear-gradient(160deg, rgba(37, 99, 235, 0.08), rgba(16, 185, 129, 0.05));
  }

  .footer-copy {
    margin-top: 24px;
  }
}
</style>
