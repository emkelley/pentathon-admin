<template>
  <div
    class="styling-section bg-slate-800/90 rounded-xl p-4 h-fit shadow-xl border border-white/10 flex flex-col"
  >
    <h3 class="text-white mb-3 text-lg flex items-center gap-2">🎨 Timer Styling</h3>

    <div class="styling-controls flex flex-col gap-3 flex-1">
      <div class="styling-row flex gap-8">
        <div class="styling-group flex flex-col gap-1">
          <label for="timerColor" class="text-gray-300 font-semibold text-sm">Text Color:</label>
          <input
            type="color"
            id="timerColor"
            v-model="stylingData.timerColor"
            class="w-15 h-9 border-2 border-gray-600 rounded-md cursor-pointer bg-gray-900/80"
          />
          <div class="flex gap-1 mt-1">
            <button
              v-for="color in textColorPresets"
              :key="color.name"
              @click="stylingData.timerColor = color.value"
              :style="{ backgroundColor: color.value }"
              :title="color.name"
              class="w-6 h-6 rounded border border-gray-500 cursor-pointer hover:scale-110 transition-transform"
            ></button>
          </div>
        </div>

        <div class="styling-group flex flex-col gap-1">
          <label for="shadowColor" class="text-gray-300 font-semibold text-sm">Shadow Color:</label>
          <input
            type="color"
            id="shadowColor"
            v-model="stylingData.timerShadowColor"
            class="w-15 h-9 border-2 border-gray-600 rounded-md cursor-pointer bg-gray-900/80"
          />
          <div class="flex gap-1 mt-1">
            <button
              v-for="color in shadowColorPresets"
              :key="color.name"
              @click="stylingData.timerShadowColor = color.value"
              :style="{ backgroundColor: color.value }"
              :title="color.name"
              class="w-6 h-6 rounded border border-gray-500 cursor-pointer hover:scale-110 transition-transform"
            ></button>
          </div>
        </div>
      </div>

      <div class="styling-row flex gap-2">
        <div class="styling-group flex-1 flex flex-col gap-1">
          <label for="shadowBlur" class="text-gray-300 font-semibold text-sm"
            >Shadow Blur (px):</label
          >
          <input
            type="number"
            id="shadowBlur"
            v-model.number="stylingData.timerShadowBlur"
            min="0"
            max="20"
            class="p-2 border-2 border-gray-600 rounded-lg text-sm bg-gray-900/80 text-white transition-colors duration-300 focus:outline-none focus:border-blue-400"
          />
        </div>
        <div class="styling-group flex-1 flex flex-col gap-1">
          <label for="shadowOpacity" class="text-gray-300 font-semibold text-sm"
            >Shadow Opacity:</label
          >
          <div class="flex items-center gap-2">
            <input
              type="range"
              id="shadowOpacity"
              v-model.number="stylingData.timerShadowOpacity"
              min="0"
              max="1"
              step="0.1"
              class="flex-1"
            />
            <span class="text-gray-300 font-bold text-sm min-w-[30px]">{{
              stylingData.timerShadowOpacity
            }}</span>
          </div>
        </div>
      </div>

      <div class="styling-row flex gap-2">
        <div class="styling-group flex-1 flex flex-col gap-1">
          <label for="shadowX" class="text-gray-300 font-semibold text-sm"
            >Shadow X Offset (px):</label
          >
          <input
            type="number"
            id="shadowX"
            v-model.number="stylingData.timerShadowX"
            min="-10"
            max="10"
            class="p-2 border-2 border-gray-600 rounded-lg text-sm bg-gray-900/80 text-white transition-colors duration-300 focus:outline-none focus:border-blue-400"
          />
        </div>
        <div class="styling-group flex-1 flex flex-col gap-1">
          <label for="shadowY" class="text-gray-300 font-semibold text-sm"
            >Shadow Y Offset (px):</label
          >
          <input
            type="number"
            id="shadowY"
            v-model.number="stylingData.timerShadowY"
            min="-10"
            max="10"
            class="p-2 border-2 border-gray-600 rounded-lg text-sm bg-gray-900/80 text-white transition-colors duration-300 focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>

      <div class="styling-actions flex gap-2 mt-2 flex-wrap">
        <button
          class="btn-info border-none text-white py-2 px-4 rounded-xl cursor-pointer text-xs font-bold transition-shadow duration-200 relative overflow-hidden uppercase tracking-wide flex-1 min-w-[90px]"
          @click="previewStyle"
        >
          Preview
        </button>
        <button
          class="btn-success border-none text-white py-2 px-4 rounded-xl cursor-pointer text-xs font-bold transition-shadow duration-200 relative overflow-hidden uppercase tracking-wide flex-1 min-w-[90px]"
          @click="saveStyle"
        >
          Save Style
        </button>
        <button
          class="btn-secondary border-none text-white py-2 px-4 rounded-xl cursor-pointer text-xs font-bold transition-shadow duration-200 relative overflow-hidden uppercase tracking-wide flex-1 min-w-[90px]"
          @click="resetStyle"
        >
          Reset
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface TimerStyling {
  timerColor: string;
  timerFont: string;
  timerShadowColor: string;
  timerShadowBlur: number;
  timerShadowOpacity: number;
  timerShadowX: number;
  timerShadowY: number;
}

interface Props {
  styling: TimerStyling;
}

const props = defineProps<Props>();
const emit = defineEmits(["preview-style", "save-style", "reset-style", "update-styling"]);

// Create local reactive copy of styling
const stylingData = reactive({ ...props.styling });

// Color presets for quick selection
const textColorPresets = [
  { name: "Brand Green", value: "#65e7b9" },
  { name: "Mint Green", value: "#60e9b9" },
  { name: "White", value: "#ffffff" },
  { name: "Light Blue", value: "#60a5fa" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
  { name: "Orange", value: "#f97316" },
  { name: "Yellow", value: "#eab308" },
];

const shadowColorPresets = [
  { name: "Black", value: "#000000" },
  { name: "Dark Gray", value: "#374151" },
  { name: "Brand Green Dark", value: "#047857" },
  { name: "Blue Dark", value: "#1e40af" },
  { name: "Purple Dark", value: "#7c3aed" },
  { name: "Red Dark", value: "#dc2626" },
];

// Watch for changes in styling and emit updates
watch(
  () => stylingData,
  (newStyling) => {
    emit("update-styling", { ...newStyling });
  },
  { deep: true }
);

// Watch for prop changes and update local styling
watch(
  () => props.styling,
  (newStyling) => {
    Object.assign(stylingData, newStyling);
  },
  { deep: true }
);

function previewStyle() {
  emit("preview-style", { ...stylingData });
}

function saveStyle() {
  emit("save-style", { ...stylingData });
}

function resetStyle() {
  const defaultStyling = {
    timerColor: "#60e9b9",
    timerFont: "'Nunito', sans-serif",
    timerShadowColor: "#000000",
    timerShadowBlur: 4,
    timerShadowOpacity: 0.3,
    timerShadowX: 2,
    timerShadowY: 2,
  };

  Object.assign(stylingData, defaultStyling);
  emit("reset-style", defaultStyling);
}
</script>

<style scoped>
.btn-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 3px 10px rgba(16, 185, 129, 0.2);
}

.btn-success:hover {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
}

.btn-success:active {
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.2);
}

.btn-secondary {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  box-shadow: 0 3px 10px rgba(107, 114, 128, 0.2);
}

.btn-secondary:hover {
  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.25);
}

.btn-secondary:active {
  box-shadow: 0 2px 6px rgba(107, 114, 128, 0.2);
}

.btn-info {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  box-shadow: 0 3px 10px rgba(6, 182, 212, 0.2);
}

.btn-info:hover {
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.25);
}

.btn-info:active {
  box-shadow: 0 2px 6px rgba(6, 182, 212, 0.2);
}

input:focus,
select:focus {
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
}

input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}

input[type="color"]::-webkit-color-swatch {
  border: none;
  border-radius: 4px;
}
</style>
