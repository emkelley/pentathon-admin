<script setup lang="ts">
interface Settings {
  regularSubTime: number;
  tier2SubTime: number;
  tier3SubTime: number;
  primeSubTime: number;
}

interface Props {
  settings: Settings;
}

const props = defineProps<Props>();
const emit = defineEmits(["save-settings", "update-settings"]);
const { settings: timerSettings, saveSettings } = useTimer();

// Create local reactive copies of the settings that can be modified
const localSettings = reactive({
  regularSubTime: timerSettings.value.regularSubTime,
  tier2SubTime: timerSettings.value.tier2SubTime,
  tier3SubTime: timerSettings.value.tier3SubTime,
  primeSubTime: timerSettings.value.primeSubTime,
});

// Watch for changes in local settings and emit updates
watch(
  () => localSettings,
  (newSettings) => {
    emit("update-settings", { ...newSettings });
  },
  { deep: true }
);

// Watch for prop changes and update local settings
watch(
  () => props.settings,
  (newSettings) => {
    Object.assign(localSettings, newSettings);
  },
  { deep: true }
);

// Watch for changes in timer settings and update local settings
watch(
  () => timerSettings.value,
  (newSettings) => {
    Object.assign(localSettings, newSettings);
  },
  { deep: true }
);

// Handle saving settings
async function handleSaveSettings() {
  try {
    // Save to localStorage first
    localStorage.setItem("penta_settings", JSON.stringify(localSettings));

    // Then save to server
    const config = useRuntimeConfig();
    const baseUrl = config.public.apiUrl as string;
    const response = await fetch(`${baseUrl}/api/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(localSettings),
    });
    const result = await response.json();
    emit("save-settings", result);
  } catch (error) {
    const result = { success: true, message: "Settings saved locally (server sync failed)" };
    emit("save-settings", result);
  }
}
</script>

<template>
  <div class="settings-panel bg-slate-800/90 rounded-xl p-5 shadow-xl border border-white/10 h-fit">
    <h3 class="text-white mb-4 text-xl">⚙️ Settings</h3>

    <div class="settings-grid grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div class="setting-group mb-3">
        <label for="regularSubTime" class="block mb-1 text-gray-300 font-semibold text-sm">
          Tier 1 Sub (sec):
        </label>
        <input
          type="number"
          id="regularSubTime"
          v-model.number="localSettings.regularSubTime"
          min="0"
          class="w-full p-2 border-2 border-gray-600 rounded-lg text-sm transition-colors duration-300 bg-gray-900/80 text-white focus:outline-none focus:border-blue-400 focus:shadow-md focus:shadow-blue-400/20"
        />
      </div>

      <div class="setting-group mb-3">
        <label for="tier2SubTime" class="block mb-1 text-gray-300 font-semibold text-sm">
          Tier 2 Sub (sec):
        </label>
        <input
          type="number"
          id="tier2SubTime"
          v-model.number="localSettings.tier2SubTime"
          min="0"
          class="w-full p-2 border-2 border-gray-600 rounded-lg text-sm transition-colors duration-300 bg-gray-900/80 text-white focus:outline-none focus:border-blue-400 focus:shadow-md focus:shadow-blue-400/20"
        />
      </div>

      <div class="setting-group mb-3">
        <label for="tier3SubTime" class="block mb-1 text-gray-300 font-semibold text-sm">
          Tier 3 Sub (sec):
        </label>
        <input
          type="number"
          id="tier3SubTime"
          v-model.number="localSettings.tier3SubTime"
          min="0"
          class="w-full p-2 border-2 border-gray-600 rounded-lg text-sm transition-colors duration-300 bg-gray-900/80 text-white focus:outline-none focus:border-blue-400 focus:shadow-md focus:shadow-blue-400/20"
        />
      </div>

      <div class="setting-group mb-3">
        <label for="primeSubTime" class="block mb-1 text-gray-300 font-semibold text-sm">
          Prime Sub (sec):
        </label>
        <input
          type="number"
          id="primeSubTime"
          v-model.number="localSettings.primeSubTime"
          min="0"
          class="w-full p-2 border-2 border-gray-600 rounded-lg text-sm transition-colors duration-300 bg-gray-900/80 text-white focus:outline-none focus:border-blue-400 focus:shadow-md focus:shadow-blue-400/20"
        />
      </div>
    </div>

    <div class="flex gap-2 mb-2">
      <button
        class="btn-success flex-1 border-none text-white py-2 px-5 rounded-xl cursor-pointer text-sm font-bold transition-shadow duration-200 relative overflow-hidden uppercase tracking-wide"
        @click="handleSaveSettings"
      >
        Save
      </button>
    </div>
  </div>
</template>

<style scoped>
.btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 3px 10px rgba(102, 126, 234, 0.2);
}

.btn:hover {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.btn:active {
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.2);
}

.btn-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 3px 10px rgba(16, 185, 129, 0.2);
}

.btn-success:hover {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
}

.setting-group input:focus {
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
}
</style>
