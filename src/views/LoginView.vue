<template>
  <v-container class="auth-wrapper pa-0" fluid>
    <v-row class="fill-height g-0" no-gutters>
      <v-col cols="12" md="6" class="hero-panel d-none d-md-flex">
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <v-chip
            class="hero-chip mb-6"
            color="white"
            prepend-icon="mdi-leaf"
            size="large"
            variant="text"
          >
            Nutriz Coach Suite
          </v-chip>
          <h1 class="hero-title">
            Design nourishing programs with confidence.
          </h1>
          <p class="hero-subtitle">
            Streamline onboarding, build data-backed meal plans, and deliver
            memorable client experiences — all from one professional workspace.
          </p>
          <ul class="hero-bullets">
            <li v-for="item in heroHighlights" :key="item.title">
              <v-icon icon="mdi-check-circle-outline" size="22" />
              <div>
                <strong>{{ item.title }}</strong>
                <p>{{ item.copy }}</p>
              </div>
            </li>
          </ul>
        </div>
      </v-col>

      <v-col cols="12" md="6" class="form-panel">
        <div class="form-wrapper">
          <v-card class="auth-card" elevation="12">
            <v-card-text>
              <div class="card-header">
                <h2>{{ headline }}</h2>
                <p>{{ helperText }}</p>
              </div>

              <v-alert
                v-if="errorMessage"
                border="start"
                class="mb-4"
                density="comfortable"
                type="error"
                :text="errorMessage"
              />

              <v-form @submit.prevent="handleSubmit">
                <v-text-field
                  v-model="email"
                  class="mb-3"
                  label="Email"
                  prepend-inner-icon="mdi-email-outline"
                  autocomplete="username"
                  density="comfortable"
                  variant="outlined"
                />

                <v-text-field
                  v-model="password"
                  class="mb-3"
                  :label="isRegistering ? 'Password (min 6 characters)' : 'Password'"
                  type="password"
                  prepend-inner-icon="mdi-lock-outline"
                  :autocomplete="isRegistering ? 'new-password' : 'current-password'"
                  density="comfortable"
                  variant="outlined"
                />

                <v-text-field
                  v-if="isRegistering"
                  v-model="confirmPassword"
                  class="mb-3"
                  label="Confirm password"
                  type="password"
                  prepend-inner-icon="mdi-lock-check-outline"
                  autocomplete="new-password"
                  density="comfortable"
                  variant="outlined"
                />

                <v-select
                  v-if="isRegistering"
                  v-model="role"
                  class="mb-3"
                  :items="roleOptions"
                  label="Role"
                  prepend-inner-icon="mdi-account-badge-outline"
                  density="comfortable"
                  variant="outlined"
                />

                <v-btn
                  :prepend-icon="isRegistering ? 'mdi-account-plus' : 'mdi-login'"
                  block
                  class="mt-1"
                  color="primary"
                  density="comfortable"
                  :loading="isSubmitting"
                  size="large"
                  type="submit"
                >
                  {{ primaryActionLabel }}
                </v-btn>
              </v-form>

              <v-divider class="my-6"></v-divider>

              <div class="switcher">
                <span>{{ secondaryHelper }}</span>
                <v-btn
                  class="mt-2"
                  color="primary"
                  variant="text"
                  @click="toggleMode"
                >
                  {{ secondaryActionLabel }}
                </v-btn>
              </div>
            </v-card-text>
          </v-card>

          <p class="footer-copy">
            Need help getting started? Review the onboarding checklist in the
            documentation for step-by-step guidance.
          </p>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const router = useRouter();
const authStore = useAuthStore();

const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const role = ref("nutritionist");
const errorMessage = ref("");
const isSubmitting = ref(false);
const isRegistering = ref(false);

const heroHighlights = computed(() => [
  {
    title: "Centralised programs",
    copy: "Manage clients, foods, and recipes in one secure portal designed for nutrition workflows.",
  },
  {
    title: "Smart nutrition math",
    copy: "Automatic macro calculations keep every meal balanced as you customise servings.",
  },
  {
    title: "Client-ready visuals",
    copy: "Share elegant dashboards and summaries that make progress crystal clear.",
  },
]);

const roleOptions = computed(() => [
  { title: "Nutritionist", value: "nutritionist" },
  { title: "Admin", value: "admin" },
]);

const headline = computed(() =>
  isRegistering.value ? "Create your Nutriz account" : "Welcome back"
);

const helperText = computed(() =>
  isRegistering.value
    ? "Set up your workspace to start creating client-ready meal plans."
    : "Sign in with your credentials to pick up where you left off."
);

const primaryActionLabel = computed(() =>
  isRegistering.value ? "Create account" : "Login"
);

const secondaryActionLabel = computed(() =>
  isRegistering.value ? "Already have an account? Sign in" : "Need an account? Create one"
);

const secondaryHelper = computed(() =>
  isRegistering.value
    ? "Switch back to sign in if you have credentials already."
    : "New to Nutriz? Create a secure account in seconds."
);

function toggleMode() {
  isRegistering.value = !isRegistering.value;
  errorMessage.value = "";
  confirmPassword.value = "";
  role.value = "nutritionist";
  isSubmitting.value = false;
}

async function handleSubmit(event) {
  event?.preventDefault();
  if (isSubmitting.value) return;

  if (!email.value || !password.value) {
    errorMessage.value = "Please provide both email and password.";
    return;
  }

  if (isRegistering.value) {
    if (password.value.length < 6) {
      errorMessage.value = "Password must be at least 6 characters long.";
      return;
    }

    if (password.value !== confirmPassword.value) {
      errorMessage.value = "Passwords do not match.";
      return;
    }
  }

  isSubmitting.value = true;
  errorMessage.value = "";
  try {
    const payload = { email: email.value, password: password.value };
    if (isRegistering.value) {
      await authStore.register({ ...payload, role: role.value });
    } else {
      await authStore.login(payload);
    }
    await authStore.fetchCurrentUser().catch(() => {});
    await router.replace("/clients");
  } catch (error) {
    const fallbackMessage = isRegistering.value
      ? "Unable to create account. Please try again."
      : "Invalid credentials. Please try again.";
    errorMessage.value = authStore.error || fallbackMessage;
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
