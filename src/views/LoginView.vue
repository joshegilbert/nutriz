<template>
  <v-container class="auth-wrapper" fluid>
    <v-row>
      <!-- Left hero panel (hidden on small screens) -->
      <v-col cols="12" md="6" class="hero-panel d-none d-md-flex">
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <v-chip class="hero-chip" color="white" variant="text">Coach Workspace</v-chip>
          <h1 class="hero-title">Simplify nutrition planning for your clients</h1>
          <p class="hero-subtitle">
            Manage foods, recipes, and client plans in one place. Clean, fast,
            and built for everyday coaching workflows.
          </p>
          <ul class="hero-bullets">
            <li>
              <v-icon>mdi-food-apple-outline</v-icon>
              <div>
                <strong>Structured Foods & Recipes</strong>
                <p>Keep go-to items organized with macros per serving.</p>
              </div>
            </li>
            <li>
              <v-icon>mdi-account-group-outline</v-icon>
              <div>
                <strong>Client-Centric</strong>
                <p>Track client goals, notes, and build personalized plans.</p>
              </div>
            </li>
            <li>
              <v-icon>mdi-clipboard-text-outline</v-icon>
              <div>
                <strong>Shareable Summaries</strong>
                <p>Export clean daily/weekly plan summaries in seconds.</p>
              </div>
            </li>
          </ul>
        </div>
      </v-col>

      <!-- Right form panel -->
      <v-col cols="12" md="6" class="form-panel">
        <div class="form-wrapper">
          <v-card elevation="2" class="auth-card pa-6">
            <div class="card-header mb-4">
              <h2>{{ mode === 'login' ? 'Welcome back' : 'Create your account' }}</h2>
              <p v-if="mode === 'login'">Login to continue to your dashboard.</p>
              <p v-else>Get started in under a minute.</p>
            </div>

            <v-alert
              v-if="errorMessage"
              type="error"
              class="mb-4"
              border="start"
              :text="errorMessage"
            />

            <v-form @submit.prevent="handleSubmit">
              <v-text-field
                v-model="email"
                label="Email"
                prepend-inner-icon="mdi-email-outline"
                autocomplete="username"
                :disabled="isSubmitting"
                required
              />

              <v-text-field
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                label="Password"
                prepend-inner-icon="mdi-lock-outline"
                :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                @click:append-inner="showPassword = !showPassword"
                :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
                :disabled="isSubmitting"
                required
              />

              <v-text-field
                v-if="mode === 'register'"
                v-model="confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                label="Confirm Password"
                prepend-inner-icon="mdi-lock-check-outline"
                :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                @click:append-inner="showPassword = !showPassword"
                autocomplete="new-password"
                :disabled="isSubmitting"
                required
              />

              <v-btn
                type="submit"
                block
                color="primary"
                class="mt-2"
                :loading="isSubmitting"
              >
                {{ mode === 'login' ? 'Login' : 'Create Account' }}
              </v-btn>
            </v-form>

            <div class="switcher mt-5">
              <span v-if="mode === 'login'">
                New here?
                <v-btn variant="text" size="small" class="px-2" @click="switchMode('register')">
                  Create an account
                </v-btn>
              </span>
              <span v-else>
                Already have an account?
                <v-btn variant="text" size="small" class="px-2" @click="switchMode('login')">
                  Login instead
                </v-btn>
              </span>
            </div>

            <div class="footer-copy">
              <small>Use demo: coach@nutriz.com / DemoPass123!</small>
            </div>
          </v-card>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const mode = ref('login'); // 'login' | 'register'
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const errorMessage = ref('');
const isSubmitting = ref(false);
const showPassword = ref(false);

function switchMode(next) {
  mode.value = next;
  errorMessage.value = '';
}

async function handleSubmit() {
  if (isSubmitting.value) return;
  errorMessage.value = '';

  if (!email.value || !password.value) {
    errorMessage.value = 'Please enter your email and password.';
    return;
  }

  if (mode.value === 'register' && password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.';
    return;
  }

  isSubmitting.value = true;
  try {
    if (mode.value === 'login') {
      await authStore.login({ email: email.value, password: password.value });
    } else {
      await authStore.register({ email: email.value, password: password.value });
    }

    await authStore.fetchCurrentUser().catch(() => {});

    const redirect = typeof route.query.redirect === 'string' && route.query.redirect ? route.query.redirect : '/clients';
    await router.replace(redirect);
  } catch (error) {
    errorMessage.value = authStore.error || (mode.value === 'login' ? 'Invalid credentials. Please try again.' : 'Unable to register. Please try again.');
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
