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
  try {
    console.log("Saving settings:", settingsToSave);

    // If settings are passed from the component, use those; otherwise use the composable's settings
    if (settingsToSave) {
      // Update the composable's settings first
      Object.assign(settings.value, settingsToSave);
      console.log("Updated composable settings:", settings.value);

      // Use composable's saveSettings (handles base URL fallback and errors)
      const result = await saveSettings();
      console.log("Save result:", result);
      showStatus(result.message, !result.success);
    } else {
      // Fallback to composable's saveSettings
      const result = await saveSettings();
      console.log("Fallback save result:", result);
      showStatus(result.message, !result.success);
    }
  } catch (error) {
    console.error("Error in handleSaveSettings:", error);
    showStatus("Failed to save settings", true);
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
  try {
    // Load settings from server first to ensure we have the most up-to-date values
    const loadedSettings = await loadSettings();
    console.log("Loaded settings from server:", loadedSettings);

    // Initialize the websocket and other connections
    initialize();
  } catch (error) {
    console.error("Failed to load initial settings:", error);
    // Still initialize even if settings load failed
    initialize();
  }
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
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Oxanium:wght@300..800&display=swap",
    },
  ],
});
</script>

<template>
  <div
    class="relative min-h-screen p-4 text-sm bg-gradient-to-br from-[#0a0f2a] via-[#11153a] to-[#0a1228] text-slate-200 overflow-hidden"
  >
    <div class="synthwave-grid pointer-events-none absolute inset-0"></div>
    <div
      class="admin-container relative bg-[#0b0f29]/80 backdrop-blur-xl rounded-2xl p-5 shadow-2xl max-w-7xl mx-auto border border-fuchsia-500/20 ring-1 ring-fuchsia-400/10"
    >
      <!-- Header -->
      <div class="header text-center mb-5">
        <h1
          class="title-font flex items-center justify-center gap-4 text-4xl mb-1 bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-300 bg-clip-text text-transparent font-extrabold drop-shadow-[0_0_6px_rgba(168,85,247,0.65)]"
        >
          <img src="/favicon.png" alt="Pentathon Logo" class="w-10 h-10" />
          Pentathon Timer v3
        </h1>
        <p class="text-fuchsia-200/60 text-sm">Made by just @0NEGUY</p>
      </div>

      <!-- Unified 12-col Grid -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <!-- Main Column -->
        <div class="xl:col-span-8 flex flex-col gap-5">
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

          <StylingSection
            :styling="timerStyling"
            @preview-style="handlePreviewStyle"
            @save-style="handleSaveTimerStyle"
            @reset-style="handleResetStyle"
            @update-styling="updateTimerStyling"
          />
        </div>

        <!-- Sidebar Column -->
        <div class="xl:col-span-4">
          <div class="sticky top-4 flex flex-col gap-5">
            <SettingsPanel
              :settings="settings"
              @save-settings="handleSaveSettings"
              @update-settings="updateSettings"
            />
            <EventsList :events="events" />
          </div>
        </div>
      </div>

      <!-- Status Message -->
      <StatusMessage :message="statusMessage" :is-error="statusIsError" :visible="statusVisible" />
    </div>
  </div>
</template>

<style scoped>
/* Midnight synthwave background grid overlay */
.synthwave-grid {
  background-image: radial-gradient(circle at 20% 10%, rgba(236, 72, 153, 0.12), transparent 40%),
    radial-gradient(circle at 80% 20%, rgba(34, 211, 238, 0.1), transparent 45%),
    radial-gradient(circle at 50% 80%, rgba(168, 85, 247, 0.1), transparent 40%),
    repeating-linear-gradient(
      0deg,
      rgba(168, 85, 247, 0.08) 0,
      rgba(168, 85, 247, 0.08) 1px,
      transparent 1px,
      transparent 80px
    ),
    repeating-linear-gradient(
      90deg,
      rgba(168, 85, 247, 0.08) 0,
      rgba(168, 85, 247, 0.08) 1px,
      transparent 1px,
      transparent 80px
    );
  filter: drop-shadow(0 0 10px rgba(236, 72, 153, 0.15));
}

/* Display font for the hero title */
.title-font {
  font-family: "Oxanium", "Nunito", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto,
    Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
  letter-spacing: 0.02em;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .admin-container {
    padding: 15px;
  }
}
</style>
