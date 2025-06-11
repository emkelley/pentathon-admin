<script setup lang="ts">
// Use the timer composable
const {
  timerData,
  events,
  loadSettings,
  settings,
  currentTimerStyle,
  startTimer,
  stopTimer,
  resetTimer,
  addTime,
  saveSettings,
  saveTimerStyle,
  initialize,
} = useTimer();

// Status message state
const statusMessage = ref("");
const statusIsError = ref(false);
const statusVisible = ref(false);
const config = useRuntimeConfig();
const wsUrl = config.public.wsUrl;
// Timer styling state for the form
const timerStyling = ref({
  timerColor: currentTimerStyle.value.color,
  timerFont: currentTimerStyle.value.fontFamily,
  timerShadowColor: currentTimerStyle.value.shadowColor,
  timerShadowBlur: currentTimerStyle.value.shadowBlur,
  timerShadowOpacity: currentTimerStyle.value.shadowOpacity,
  timerShadowX: currentTimerStyle.value.shadowX,
  timerShadowY: currentTimerStyle.value.shadowY,
});

// Watch for changes in currentTimerStyle and update timerStyling
watch(
  currentTimerStyle,
  (newStyle) => {
    timerStyling.value = {
      timerColor: newStyle.color,
      timerFont: newStyle.fontFamily,
      timerShadowColor: newStyle.shadowColor,
      timerShadowBlur: newStyle.shadowBlur,
      timerShadowOpacity: newStyle.shadowOpacity,
      timerShadowX: newStyle.shadowX,
      timerShadowY: newStyle.shadowY,
    };
  },
  { deep: true }
);

// Status message helper
function showStatus(message: string, isError = false) {
  statusMessage.value = message;
  statusIsError.value = isError;
  statusVisible.value = true;

  setTimeout(() => {
    statusVisible.value = false;
  }, 3000);
}

// Event handlers
async function handleStartTimer() {
  const result = await startTimer();
  showStatus(result.message, !result.success);
}

async function handleStopTimer() {
  const result = await stopTimer();
  showStatus(result.message, !result.success);
}

async function handleResetTimer(time: number) {
  const result = await resetTimer(time);
  showStatus(result.message, !result.success);
}

async function handleAddTime(seconds: number) {
  const result = await addTime(seconds);
  showStatus(result.message, !result.success);
}

async function handleSetManualTimer(totalSeconds: number) {
  const result = await resetTimer(totalSeconds);
  showStatus(result.message, !result.success);
}

async function handleSaveSettings(settingsToSave?: any) {
  // If settings are passed from the component, use those; otherwise use the composable's settings
  if (settingsToSave) {
    // Update the composable's settings first
    Object.assign(settings.value, settingsToSave);

    // Save directly with the provided settings
    try {
      const config = useRuntimeConfig();
      const baseUrl = config.public.apiUrl as string;
      const response = await fetch(`${baseUrl}/api/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsToSave),
      });
      const result = await response.json();
      showStatus(result.message, !result.success);
    } catch (error) {
      showStatus("Settings saved locally (server sync failed)", false);
    }
  } else {
    // Fallback to composable's saveSettings
    const result = await saveSettings();
    showStatus(result.message, !result.success);
  }
}

function updateSettings(newSettings: any) {
  // Settings are handled by the composable via reactive refs
}

async function handlePreviewStyle(stylingData: any) {
  // Update the timer styling for preview
  updateTimerStyling(stylingData);
  showStatus('Style preview applied! Click "Save Style" to make it permanent.');
}

async function handleSaveTimerStyle(stylingData: any) {
  const result = await saveTimerStyle(stylingData);
  showStatus(result.message, !result.success);
}

function handleResetStyle(defaultStyling: any) {
  updateTimerStyling(defaultStyling);
  showStatus('Timer style reset to defaults. Click "Save Style" to make it permanent.');
}

function updateTimerStyling(newStyling: any) {
  timerStyling.value = { ...newStyling };
}

// Initialize on client side
onMounted(async () => {
  const settings = await loadSettings();
  console.log(settings);
  initialize();
});

// Set page title
useHead({
  title: "Penta Subathon Timer - Admin Panel",
  meta: [{ name: "description", content: "Admin panel for managing the Penta Subathon Timer" }],
  link: [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap",
    },
  ],
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-4 text-sm">
    <div
      class="admin-container bg-slate-900/95 backdrop-blur-lg rounded-2xl p-5 shadow-2xl max-w-7xl mx-auto border border-white/10"
    >
      <!-- Header -->
      <div class="header text-center mb-5">
        <h1
          class="text-white flex items-center justify-center gap-4 text-4xl mb-1 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text font-bold"
        >
          <img src="/favicon.png" alt="Pentathon Logo" class="w-10 h-10" />
          Pentathon Timer v2
        </h1>
        <p class="text-gray-400 text-sm">Made by @0NEGUY in chat</p>
      </div>

      <!-- Main Grid -->
      <div class="main-grid grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <TimerSection
          :timer-data="timerData"
          :current-timer-style="currentTimerStyle"
          @start-timer="handleStartTimer"
          @stop-timer="handleStopTimer"
          @reset-timer="handleResetTimer"
          @add-time="handleAddTime"
          @set-manual-timer="handleSetManualTimer"
          @show-status="showStatus"
        />

        <SettingsPanel
          :settings="settings"
          @save-settings="handleSaveSettings"
          @update-settings="updateSettings"
        />
      </div>

      <!-- Content Grid -->
      <div class="content-grid grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        <div class="lg:col-span-2 xl:col-span-3">
          <StylingSection
            :styling="timerStyling"
            @preview-style="handlePreviewStyle"
            @save-style="handleSaveTimerStyle"
            @reset-style="handleResetStyle"
            @update-styling="updateTimerStyling"
          />
        </div>

        <div class="lg:col-span-1 xl:col-span-2 lg:col-start-3 xl:col-start-4">
          <EventsList :events="events" />
        </div>
      </div>

      <!-- Status Message -->
      <StatusMessage :message="statusMessage" :is-error="statusIsError" :visible="statusVisible" />
    </div>
  </div>
</template>

<style scoped>
/* Responsive adjustments */
@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr 1fr;
  }
  .content-grid > div:last-child {
    grid-column: 1 / -1;
  }
}

@media (max-width: 768px) {
  .main-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }

  .admin-container {
    padding: 15px;
  }
}
</style>
