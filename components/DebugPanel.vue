<template>
  <div v-if="isVisible" class="debug-panel">
    <h3>Debug Panel</h3>
    <div class="debug-info">
      <p><strong>Time Remaining:</strong> {{ timerData.timeRemaining }}s</p>
      <p><strong>Is Active:</strong> {{ timerData.isActive ? "Yes" : "No" }}</p>
      <p><strong>Is Flashing:</strong> {{ isFlashing ? "Yes" : "No" }}</p>
    </div>

    <!-- Basic Controls Section -->
    <div class="debug-section">
      <h4 class="section-header" @click="toggleSection('basicControls')">
        <span class="collapse-indicator">{{ sections.basicControls ? "▼" : "▶" }}</span>
        Basic Controls
      </h4>
      <div v-if="sections.basicControls" class="debug-controls">
        <button @click="handleAddTime(30)" class="debug-btn">+30s</button>
        <button @click="handleAddTime(60)" class="debug-btn">+1m</button>
        <button @click="handleAddTime(300)" class="debug-btn">+5m</button>
        <button @click="handleFlash" class="debug-btn flash-btn">Test Flash</button>
        <button @click="handleToggle" class="debug-btn">
          {{ timerData.isActive ? "Pause" : "Start" }}
        </button>
      </div>
    </div>

    <!-- Subscription Tests Section -->
    <div class="debug-section">
      <h4 class="section-header" @click="toggleSection('subscriptionTests')">
        <span class="collapse-indicator">{{ sections.subscriptionTests ? "▼" : "▶" }}</span>
        Subscription Tests
      </h4>
      <div v-if="sections.subscriptionTests" class="subscription-controls">
        <button @click="handleSimulateSub('1')" class="debug-btn sub-tier1">Tier 1 Sub</button>
        <button @click="handleSimulateSub('2')" class="debug-btn sub-tier2">Tier 2 Sub</button>
        <button @click="handleSimulateSub('3')" class="debug-btn sub-tier3">Tier 3 Sub</button>
        <button @click="handleSimulateSub('prime')" class="debug-btn sub-prime">Prime Sub</button>
        <button @click="handleSimulateGift('1', 1)" class="debug-btn sub-gift">Gift Sub</button>
        <button @click="handleSimulateGift('1', 5)" class="debug-btn sub-gift-bomb">Gift 5x</button>
        <button @click="handleSimulateGift('1', 25)" class="debug-btn sub-gift-bomb">
          Gift 25x
        </button>
        <button @click="handleSimulateResub('1', 12)" class="debug-btn sub-resub">12m Resub</button>
        <button @click="handleSimulateRandomSub" class="debug-btn sub-random">Random Sub</button>
      </div>
    </div>

    <!-- Toast Tests Section -->
    <div class="debug-section">
      <h4 class="section-header" @click="toggleSection('toastTests')">
        <span class="collapse-indicator">{{ sections.toastTests ? "▼" : "▶" }}</span>
        Toast Tests
      </h4>
      <div v-if="sections.toastTests" class="toast-controls">
        <button @click="handleTestToast('added', 30)" class="debug-btn toast-add">
          Toast +30s
        </button>
        <button @click="handleTestToast('added', 300)" class="debug-btn toast-add">
          Toast +5m
        </button>
        <button @click="handleTestToast('removed', 60)" class="debug-btn toast-remove">
          Toast -1m
        </button>
        <button @click="handleTestToast('removed', 180)" class="debug-btn toast-remove">
          Toast -3m
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";

interface TimerData {
  timeRemaining: number;
  isActive: boolean;
}

interface Props {
  timerData: TimerData;
  isFlashing: boolean;
  isVisible: boolean;
}

interface Emits {
  addTime: [seconds: number];
  flash: [];
  toggle: [];
  testToast: [type: "added" | "removed", amount: number];
  simulateSub: [tier: string];
  simulateGift: [tier: string, count: number];
  simulateResub: [tier: string, months: number];
  simulateRandomSub: [];
}

// Props
const props = defineProps<Props>();

// Emits
const emit = defineEmits<Emits>();

// Reactive state for collapsible sections
const sections = reactive({
  basicControls: true,
  subscriptionTests: false,
  toastTests: false,
});

// Section toggle function
function toggleSection(sectionName: keyof typeof sections): void {
  sections[sectionName] = !sections[sectionName];
}

// Handlers
function handleAddTime(seconds: number): void {
  emit("addTime", seconds);
}

function handleFlash(): void {
  emit("flash");
}

function handleToggle(): void {
  emit("toggle");
}

function handleTestToast(type: "added" | "removed", amount: number): void {
  emit("testToast", type, amount);
}

function handleSimulateSub(tier: string): void {
  emit("simulateSub", tier);
}

function handleSimulateGift(tier: string, count: number): void {
  emit("simulateGift", tier, count);
}

function handleSimulateResub(tier: string, months: number): void {
  emit("simulateResub", tier, months);
}

function handleSimulateRandomSub(): void {
  emit("simulateRandomSub");
}
</script>

<style scoped>
.debug-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  min-width: 200px;
  font-family: "Courier New", monospace;
  font-size: 12px;
  z-index: 1000;
}

.debug-panel h3 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #60e9b9;
  text-align: center;
}

.debug-section {
  margin-bottom: 15px;
  border-top: 1px solid #333;
  padding-top: 10px;
}

.debug-section:first-of-type {
  border-top: none;
  padding-top: 0;
}

.section-header {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #ffa500;
  text-align: left;
  cursor: pointer;
  user-select: none;
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-header:hover {
  color: #ffcc00;
}

.collapse-indicator {
  font-size: 10px;
  color: #60e9b9;
  transition: transform 0.2s ease;
  width: 12px;
}

.debug-info {
  margin-bottom: 15px;
  border-bottom: 1px solid #333;
  padding-bottom: 10px;
}

.debug-info p {
  margin: 5px 0;
  font-size: 11px;
}

.debug-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.subscription-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.toast-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.debug-btn {
  padding: 8px 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  font-weight: bold;
  transition: all 0.2s ease;
}

.debug-btn:hover {
  background-color: #0056b3;
  transform: translateY(-1px);
}

.debug-btn:active {
  transform: translateY(0);
}

.flash-btn {
  background-color: #ff4757;
  grid-column: span 2;
}

.flash-btn:hover {
  background-color: #ff3838;
}

/* Subscription button styles */
.sub-tier1 {
  background-color: #9b59b6;
  color: white;
}

.sub-tier1:hover {
  background-color: #8e44ad;
}

.sub-tier2 {
  background-color: #3498db;
  color: white;
}

.sub-tier2:hover {
  background-color: #2980b9;
}

.sub-tier3 {
  background-color: #e74c3c;
  color: white;
}

.sub-tier3:hover {
  background-color: #c0392b;
}

.sub-prime {
  background-color: #f39c12;
  color: white;
}

.sub-prime:hover {
  background-color: #e67e22;
}

.sub-gift {
  background-color: #27ae60;
  color: white;
}

.sub-gift:hover {
  background-color: #229954;
}

.sub-gift-bomb {
  background-color: #e67e22;
  color: white;
}

.sub-gift-bomb:hover {
  background-color: #d35400;
}

.sub-resub {
  background-color: #8e44ad;
  color: white;
}

.sub-resub:hover {
  background-color: #7d3c98;
}

.sub-random {
  background-color: #34495e;
  color: white;
}

.sub-random:hover {
  background-color: #2c3e50;
}

.toast-add {
  background-color: #60e9b9;
  color: #000;
}

.toast-add:hover {
  background-color: #4dd4a4;
}

.toast-remove {
  background-color: #ff4757;
}

.toast-remove:hover {
  background-color: #ff3838;
}
</style>
