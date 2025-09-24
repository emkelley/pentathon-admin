<script setup lang="ts">
interface Settings {
  regularSubTime: number;
  tier2SubTime: number;
  tier3SubTime: number;
  primeSubTime: number;
  giftSubTime: number;
}

interface Props {
  settings: Settings;
}

const props = defineProps<Props>();
const emit = defineEmits(["save-settings", "update-settings"]);

// Create local reactive copies of the settings that can be modified
const localSettings = reactive({
  regularSubTime: props.settings.regularSubTime,
  tier2SubTime: props.settings.tier2SubTime,
  tier3SubTime: props.settings.tier3SubTime,
  primeSubTime: props.settings.primeSubTime,
  giftSubTime: props.settings.giftSubTime,
});

// Auto-calculation feature
const useAutoCalculation = ref(localStorage.getItem("penta_useAutoCalc") === "true" || false);
const tier1BaseTime = ref(props.settings.regularSubTime);
const isSaving = ref(false);

// Save auto-calculation preference
watch(useAutoCalculation, (enabled) => {
  localStorage.setItem("penta_useAutoCalc", enabled.toString());
});

// Update tier1BaseTime when incoming settings change (but only if not using auto-calc)
watch(
  () => props.settings.regularSubTime,
  (newTime) => {
    if (!useAutoCalculation.value) {
      tier1BaseTime.value = newTime;
    }
  }
);

// Watch for auto-calculation changes
watch(tier1BaseTime, (newBaseTime) => {
  if (useAutoCalculation.value && newBaseTime > 0) {
    localSettings.regularSubTime = newBaseTime;
    localSettings.tier2SubTime = newBaseTime * 2;
    localSettings.tier3SubTime = newBaseTime * 3;
    localSettings.primeSubTime = newBaseTime;
    localSettings.giftSubTime = newBaseTime;
  }
});

watch(useAutoCalculation, (enabled) => {
  if (enabled && tier1BaseTime.value > 0) {
    localSettings.regularSubTime = tier1BaseTime.value;
    localSettings.tier2SubTime = tier1BaseTime.value * 2;
    localSettings.tier3SubTime = tier1BaseTime.value * 3;
    localSettings.primeSubTime = tier1BaseTime.value;
    localSettings.giftSubTime = tier1BaseTime.value;
  }
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
    if (!isSaving.value) {
      Object.assign(localSettings, newSettings);
    }
  },
  { deep: true }
);

// No direct composable coupling here; rely on props from parent

// Handle saving settings
async function handleSaveSettings() {
  try {
    isSaving.value = true;

    // Emit to parent with the current settings to ensure correct payload
    emit("save-settings", localSettings);

    // Keep saving state active for a moment to prevent immediate overwrites
    setTimeout(() => {
      isSaving.value = false;
    }, 1000);
  } catch (error) {
    console.error("Error saving settings:", error);
    isSaving.value = false;
  }
}
</script>

<template>
  <div class="settings-panel bg-slate-800/90 rounded-xl p-5 shadow-xl border border-white/10 h-fit">
    <h3 class="text-white mb-4 text-xl">⚙️ Settings</h3>

    <!-- Auto-calculation toggle -->
    <div class="auto-calc-section mb-4 p-3 bg-slate-700/50 rounded-lg border border-slate-600/50">
      <div class="flex items-center gap-3 mb-3">
        <input
          type="checkbox"
          id="useAutoCalculation"
          v-model="useAutoCalculation"
          class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
        />
        <label for="useAutoCalculation" class="text-sm font-medium text-gray-300">
          Auto-calculate all times based on Tier 1
        </label>
      </div>

      <div v-if="useAutoCalculation" class="setting-group">
        <label for="tier1BaseTime" class="block mb-1 text-gray-300 font-semibold text-sm">
          Tier 1 Base Time (sec):
        </label>
        <input
          type="number"
          id="tier1BaseTime"
          v-model.number="tier1BaseTime"
          min="0"
          class="w-full p-2 border-2 border-blue-500 rounded-lg text-sm transition-colors duration-300 bg-gray-900/80 text-white focus:outline-none focus:border-blue-400 focus:shadow-md focus:shadow-blue-400/20"
        />
        <p class="text-xs text-gray-400 mt-1">
          Tier 2: {{ tier1BaseTime * 2 }}s • Tier 3: {{ tier1BaseTime * 3 }}s • Prime:
          {{ tier1BaseTime }}s • Gift: {{ tier1BaseTime }}s
        </p>
      </div>
    </div>

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
          :disabled="useAutoCalculation"
          :class="[
            'w-full p-2 border-2 rounded-lg text-sm transition-colors duration-300 bg-gray-900/80 text-white focus:outline-none focus:border-blue-400 focus:shadow-md focus:shadow-blue-400/20',
            useAutoCalculation
              ? 'border-gray-500 opacity-60 cursor-not-allowed'
              : 'border-gray-600',
          ]"
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
          :disabled="useAutoCalculation"
          :class="[
            'w-full p-2 border-2 rounded-lg text-sm transition-colors duration-300 bg-gray-900/80 text-white focus:outline-none focus:border-blue-400 focus:shadow-md focus:shadow-blue-400/20',
            useAutoCalculation
              ? 'border-gray-500 opacity-60 cursor-not-allowed'
              : 'border-gray-600',
          ]"
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
          :disabled="useAutoCalculation"
          :class="[
            'w-full p-2 border-2 rounded-lg text-sm transition-colors duration-300 bg-gray-900/80 text-white focus:outline-none focus:border-blue-400 focus:shadow-md focus:shadow-blue-400/20',
            useAutoCalculation
              ? 'border-gray-500 opacity-60 cursor-not-allowed'
              : 'border-gray-600',
          ]"
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
          :disabled="useAutoCalculation"
          :class="[
            'w-full p-2 border-2 rounded-lg text-sm transition-colors duration-300 bg-gray-900/80 text-white focus:outline-none focus:border-blue-400 focus:shadow-md focus:shadow-blue-400/20',
            useAutoCalculation
              ? 'border-gray-500 opacity-60 cursor-not-allowed'
              : 'border-gray-600',
          ]"
        />
      </div>

      <div class="setting-group mb-3">
        <label for="giftSubTime" class="block mb-1 text-gray-300 font-semibold text-sm">
          Gift Sub Base (sec):
        </label>
        <input
          type="number"
          id="giftSubTime"
          v-model.number="localSettings.giftSubTime"
          min="0"
          :disabled="useAutoCalculation"
          :class="[
            'w-full p-2 border-2 rounded-lg text-sm transition-colors duration-300 bg-gray-900/80 text-white focus:outline-none focus:border-blue-400 focus:shadow-md focus:shadow-blue-400/20',
            useAutoCalculation
              ? 'border-gray-500 opacity-60 cursor-not-allowed'
              : 'border-gray-600',
          ]"
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
