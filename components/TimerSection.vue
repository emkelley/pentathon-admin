<script setup lang="ts">
interface TimerData {
  timeRemaining: number;
  isActive: boolean;
}

interface TimerStyle {
  color: string;
  fontFamily: string;
  shadowColor: string;
  shadowBlur: number;
  shadowOpacity: number;
  shadowX: number;
  shadowY: number;
}

interface Props {
  timerData: TimerData;
  currentTimerStyle: TimerStyle;
}

const props = defineProps<Props>();
const emit = defineEmits([
  "start-timer",
  "stop-timer",
  "reset-timer",
  "add-time",
  "set-manual-timer",
  "show-status",
]);

// Manual timer inputs
const manualHours = ref(1);
const manualMinutes = ref(0);
const manualSeconds = ref(0);

// Computed properties
const formattedTime = computed(() => {
  const seconds = props.timerData.timeRemaining;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
});

const timerStyle = computed(() => {
  const style = props.currentTimerStyle;
  const shadowRgba = hexToRgba(style.shadowColor, style.shadowOpacity);

  return {
    color: style.color,
    fontFamily: style.fontFamily,
    textShadow: `${style.shadowX}px ${style.shadowY}px ${style.shadowBlur}px ${shadowRgba}`,
  };
});

// Helper functions
function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Event handlers
async function startTimer() {
  emit("start-timer");
}

async function stopTimer() {
  emit("stop-timer");
}

async function resetTimer() {
  const time = prompt("Reset timer to (seconds):", "3600");
  if (time === null) return;
  emit("reset-timer", parseInt(time));
}

async function addTime(seconds: number) {
  emit("add-time", seconds);
}

async function setManualTimer() {
  const hours = manualHours.value || 0;
  const minutes = manualMinutes.value || 0;
  const seconds = manualSeconds.value || 0;

  // Validate inputs
  if (hours < 0 || hours > 99) {
    emit("show-status", "Hours must be between 0 and 99", true);
    return;
  }
  if (minutes < 0 || minutes > 59) {
    emit("show-status", "Minutes must be between 0 and 59", true);
    return;
  }
  if (seconds < 0 || seconds > 59) {
    emit("show-status", "Seconds must be between 0 and 59", true);
    return;
  }

  // Calculate total seconds
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  if (totalSeconds === 0) {
    emit("show-status", "Timer cannot be set to 0", true);
    return;
  }

  emit("set-manual-timer", totalSeconds);
}

const overlayUrl = computed(() =>
  typeof window !== "undefined"
    ? `${window.location.origin}/overlay`
    : `https://pentathon.emk.dev/overlay`
);
</script>

<template>
  <div
    class="timer-section bg-gradient-to-br from-slate-800 to-slate-700 text-white rounded-xl p-5 text-center shadow-2xl border border-white/10"
  >
    <div class="text-7xl font-bold mb-2" :style="timerStyle" ref="timerDisplay">
      {{ formattedTime }}
    </div>
    <div class="timer-status text-base mb-4 opacity-90">
      <code class="bg-gray-800 text-gray-300 px-3 py-2 rounded-md text-sm font-mono">
        OBS Overlay:
        <a :href="overlayUrl" target="_blank" class="text-blue-400 hover:text-blue-300">
          {{ overlayUrl }}
        </a>
      </code>
    </div>

    <!-- Timer Controls -->
    <div class="timer-controls flex gap-2 justify-center flex-wrap my-8">
      <button
        class="btn-success border-none text-white py-2 px-5 rounded-xl cursor-pointer text-sm font-bold transition-shadow duration-200 relative overflow-hidden uppercase tracking-wide disabled:opacity-60 disabled:cursor-not-allowed"
        @click="startTimer"
        :disabled="timerData.isActive"
      >
        ▶️ Start
      </button>
      <button
        class="btn-danger border-none text-white py-2 px-5 rounded-xl cursor-pointer text-sm font-bold transition-shadow duration-200 relative overflow-hidden uppercase tracking-wide disabled:opacity-60 disabled:cursor-not-allowed"
        @click="stopTimer"
        :disabled="!timerData.isActive"
      >
        ⏸️ Stop
      </button>
      <button
        class="btn-secondary border-none text-white py-2 px-5 rounded-xl cursor-pointer text-sm font-bold transition-shadow duration-200 relative overflow-hidden uppercase tracking-wide"
        @click="resetTimer"
      >
        🔄 Reset
      </button>
    </div>

    <!-- Manual Timer Controls -->
    <div
      class="manual-timer-controls mt-4 pt-4 border-t-2 border-white/20 bg-white/10 rounded-xl p-4"
    >
      <div
        class="manual-timer-inputs flex items-center justify-center mb-4 bg-white/15 p-4 rounded-xl backdrop-blur-sm md:flex-row flex-col md:gap-2 gap-4"
      >
        <div class="time-input-group flex flex-col items-center gap-1">
          <input
            type="number"
            v-model.number="manualHours"
            min="0"
            max="99"
            class="time-input w-[70px] h-11 p-2 border-2 border-white/40 rounded-xl bg-white/95 text-gray-800 text-lg font-bold text-center transition-all duration-200 shadow-sm hover:border-white/60 focus:border-green-500 focus:bg-white focus:shadow-md focus:outline-none"
          />
          <label class="text-white/95 text-xs font-bold uppercase tracking-wide text-shadow"
            >Hours</label
          >
        </div>
        <div
          class="time-separator hidden md:block text-white text-3xl font-bold opacity-90 text-shadow -mt-4"
        >
          :
        </div>
        <div class="time-input-group flex flex-col items-center gap-1">
          <input
            type="number"
            v-model.number="manualMinutes"
            min="0"
            max="59"
            class="time-input w-[70px] h-11 p-2 border-2 border-white/40 rounded-xl bg-white/95 text-gray-800 text-lg font-bold text-center transition-all duration-200 shadow-sm hover:border-white/60 focus:border-green-500 focus:bg-white focus:shadow-md focus:outline-none"
          />
          <label class="text-white/95 text-xs font-bold uppercase tracking-wide text-shadow"
            >Minutes</label
          >
        </div>
        <div
          class="time-separator hidden md:block text-white text-3xl font-bold opacity-90 text-shadow -mt-4"
        >
          :
        </div>
        <div class="time-input-group flex flex-col items-center gap-1">
          <input
            type="number"
            v-model.number="manualSeconds"
            min="0"
            max="59"
            class="time-input w-[70px] h-11 p-2 border-2 border-white/40 rounded-xl bg-white/95 text-gray-800 text-lg font-bold text-center transition-all duration-200 shadow-sm hover:border-white/60 focus:border-green-500 focus:bg-white focus:shadow-md focus:outline-none"
          />
          <label class="text-white/95 text-xs font-bold uppercase tracking-wide text-shadow"
            >Seconds</label
          >
        </div>
      </div>
      <button
        class="btn-success border-none text-white py-2 px-5 rounded-xl cursor-pointer text-sm font-bold transition-shadow duration-200 relative overflow-hidden uppercase tracking-wide w-full mt-2"
        @click="setManualTimer"
      >
        Manually Set Timer
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

.btn:disabled {
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.1);
}

.btn-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 3px 10px rgba(16, 185, 129, 0.2);
}

.btn-success:hover {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 3px 10px rgba(239, 68, 68, 0.2);
}

.btn-danger:hover {
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
}

.btn-secondary {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  box-shadow: 0 3px 10px rgba(107, 114, 128, 0.2);
}

.btn-secondary:hover {
  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.25);
}

.quick-add-btn {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.2);
}

.quick-add-btn:hover {
  box-shadow: 0 3px 10px rgba(139, 92, 246, 0.25);
}

.quick-add-btn:active {
  box-shadow: 0 2px 6px rgba(139, 92, 246, 0.2);
}

.text-shadow {
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}
</style>
