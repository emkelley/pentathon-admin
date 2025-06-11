<template>
  <div class="overlay-container">
    <div class="flex flex-col gap-4 h-full w-full items-center justify-center relative">
      <div class="timer-display" :class="timerDisplayClass" :style="timerDisplayStyle">
        {{ formattedTime }}
      </div>

      <!-- Toast Notification -->
      <Transition name="toast">
        <div
          v-if="currentToast.visible"
          class="absolute bottom-36 left-0 right-0 flex items-center justify-center gap-3 px-6 py-4.5 rounded-xl shadow-2xl font-nunito font-semibold z-[1000] text-black w-fit mx-auto"
          :style="toastStyle"
        >
          <div class="flex items-center justify-center gap-2">
            <div class="text-4xl font-bold">
              <template
                v-if="currentToast.type === 'subscription' && currentToast.subscriptionData"
              >
                {{ formatSubscriptionMessage(currentToast.subscriptionData) }}
              </template>
              <template v-else>
                {{ currentToast.amount }}
              </template>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Debug Panel -->
    <DebugPanel
      :timer-data="timerData"
      :is-flashing="isFlashing"
      :is-visible="isDebugMode"
      @add-time="addTestTime"
      @flash="triggerFlash"
      @toggle="toggleTimer"
      @test-toast="handleTestToast"
      @simulate-sub="handleSimulateSub"
      @simulate-gift="handleSimulateGift"
      @simulate-resub="handleSimulateResub"
      @simulate-random-sub="handleSimulateRandomSub"
    />
  </div>
</template>

<script setup lang="ts">
// Meta
useSeoMeta({
  title: "Penta Subathon Timer",
  description: "Penta Subathon Timer Overlay",
});

// Composables
const {
  timerData,
  currentTimerStyle,
  latestSubscription,
  initialize,
  addTime,
  simulateSubscription,
  simulateGiftSubscription,
  simulateResubscription,
  simulateRandomSubscription,
} = useTimer();
const route = useRoute();

// Refs
const isFlashing = ref(false);
const debugMode = ref(false);
const toastQueue = ref<
  Array<{
    type: "added" | "removed" | "subscription";
    title: string;
    amount: string;
    subscriptionData: any;
  }>
>([]);
const currentToast = ref({
  visible: false,
  type: "added" as "added" | "removed" | "subscription",
  title: "",
  amount: "",
  subscriptionData: null as any,
});
const isProcessingQueue = ref(false);
const pendingGifts = ref<
  Map<
    string,
    {
      subscriptionData: any;
      totalTime: number;
      count: number;
      timeout: NodeJS.Timeout;
      firstGiftTime: number;
      lastGiftTime: number;
    }
  >
>(new Map());

// Computed
const isDebugMode = computed(() => {
  return route.query.debug === "true" || debugMode.value;
});

const formattedTime = computed(() => {
  const seconds = timerData.value.timeRemaining;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
});

const timerDisplayClass = computed(() => {
  const classes = ["timer-display"];
  const timeRemaining = timerData.value.timeRemaining;

  if (timeRemaining === 0) {
    classes.push("ended");
  } else if (timeRemaining < 60) {
    classes.push("critical"); // Less than 1 minute - red
  } else if (timeRemaining < 300) {
    classes.push("warning"); // Less than 5 minutes - yellow
  } else if (timerData.value.isActive) {
    classes.push("active");
  }

  if (isFlashing.value) {
    classes.push("flash");
  }

  return classes.join(" ");
});

const timerDisplayStyle = computed(() => {
  const style = currentTimerStyle.value;
  const shadowRgba = hexToRgba(style.shadowColor, style.shadowOpacity);
  const textShadow = `${style.shadowX}px ${style.shadowY}px ${style.shadowBlur}px ${shadowRgba}`;

  return {
    "--timer-color": style.color,
    "--timer-font-family": style.fontFamily,
    "--timer-shadow": textShadow,
  };
});

const toastStyle = computed(() => {
  const style = currentTimerStyle.value;
  return {
    backgroundColor: style.color,
  };
});

// Helper functions
function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function formatTimeAmount(seconds: number): string {
  const absSeconds = Math.abs(seconds);
  if (absSeconds < 60) {
    return `${absSeconds}s`;
  } else if (absSeconds < 3600) {
    const minutes = Math.floor(absSeconds / 60);
    const remainingSeconds = absSeconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  } else {
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const remainingSeconds = absSeconds % 60;
    let result = `${hours}h`;
    if (minutes > 0) result += ` ${minutes}m`;
    if (remainingSeconds > 0) result += ` ${remainingSeconds}s`;
    return result;
  }
}

function formatSubscriptionMessage(data: any): string {
  const { username, msgId, timeAdded, subCount } = data;
  const timeFormatted = formatTimeAmount(timeAdded);

  if (msgId === "resub") {
    return `${username} | resubscribed | +${timeFormatted}`;
  } else if (msgId === "sub") {
    return `${username} | subscribed | +${timeFormatted}`;
  } else if (msgId === "subgift") {
    // Better formatting for large gift counts
    const count = subCount || 1;
    if (count >= 100) {
      return `${username} | ${count} GIFTED SUBS! | +${timeFormatted}`;
    } else if (count >= 50) {
      return `${username} | ${count} gifted subs! | +${timeFormatted}`;
    } else if (count >= 10) {
      return `${username} | ${count} gifted subs | +${timeFormatted}`;
    } else if (count > 1) {
      return `${username} | ${count}x gifted | +${timeFormatted}`;
    } else {
      return `${username} | gifted sub | +${timeFormatted}`;
    }
  } else {
    return `${username} | ${msgId} | +${timeFormatted}`;
  }
}

function addToastToQueue(
  type: "added" | "removed" | "subscription",
  amount: number,
  subscriptionData?: any
): void {
  // Handle gifted subs grouping with improved batching for large gift counts
  if (type === "subscription" && subscriptionData?.msgId === "subgift") {
    const username = subscriptionData.username;
    const giftCount = subscriptionData.giftCount || 1;
    const now = Date.now();
    const existing = pendingGifts.value.get(username);

    if (existing) {
      // Clear existing timeout
      clearTimeout(existing.timeout);

      // Update the existing pending gift
      existing.count += giftCount;
      existing.totalTime += amount;
      existing.lastGiftTime = now;
      existing.subscriptionData.subCount = existing.count;
      existing.subscriptionData.timeAdded = existing.totalTime;
      existing.subscriptionData.giftCount = existing.count;
    } else {
      // Create new pending gift
      pendingGifts.value.set(username, {
        subscriptionData: {
          ...subscriptionData,
          subCount: giftCount,
          giftCount: giftCount,
        },
        totalTime: amount,
        count: giftCount,
        timeout: null as any, // Will be set below
        firstGiftTime: now,
        lastGiftTime: now,
      });
    }

    const pendingGift = pendingGifts.value.get(username)!;

    // Dynamic timeout based on gift count and time elapsed
    // For large batches, we need longer timeouts to catch all gifts
    let timeout = 1000; // Base timeout
    const timeSinceFirst = now - pendingGift.firstGiftTime;

    if (pendingGift.count >= 50) {
      // Very large batches need more time
      timeout = Math.min(2000, 500 + pendingGift.count * 10);
    } else if (pendingGift.count >= 20) {
      // Large batches need extra time
      timeout = Math.min(1500, 500 + pendingGift.count * 15);
    } else if (pendingGift.count >= 5) {
      // Medium batches get some extra time
      timeout = Math.min(1000, 500 + pendingGift.count * 20);
    }

    // If we've been batching for a while, reduce timeout to prevent infinite delays
    if (timeSinceFirst > 3000) {
      timeout = Math.min(timeout, 300);
    }

    // Set/reset timeout to group rapid gifts
    pendingGift.timeout = setTimeout(() => {
      // Add the grouped gift to toast queue
      const toastData = {
        type: "subscription" as const,
        title: "Subscription!",
        amount: "",
        subscriptionData: pendingGift.subscriptionData,
      };

      toastQueue.value.push(toastData);
      pendingGifts.value.delete(username);
      processToastQueue();
    }, timeout);

    return;
  }

  // Handle non-gifted subs and other toast types normally
  const toastData = {
    type,
    title:
      type === "added" ? "Time Added!" : type === "removed" ? "Time Removed!" : "Subscription!",
    amount: type === "subscription" ? "" : formatTimeAmount(amount),
    subscriptionData: subscriptionData || null,
  };

  toastQueue.value.push(toastData);
  processToastQueue();
}

function processToastQueue(): void {
  // If already processing or no toasts in queue, return
  if (isProcessingQueue.value || toastQueue.value.length === 0 || currentToast.value.visible) {
    return;
  }

  isProcessingQueue.value = true;
  const nextToast = toastQueue.value.shift();

  if (nextToast) {
    currentToast.value = {
      ...nextToast,
      visible: true,
    };

    // Calculate toast duration based on subscription type and count
    let duration = 3000; // Default for regular subs and resubs

    if (nextToast.type === "subscription" && nextToast.subscriptionData) {
      const { msgId, giftCount } = nextToast.subscriptionData;

      if (msgId === "subgift") {
        // Scale duration based on gift count for better visibility of large batches
        if (giftCount >= 100) {
          duration = 15000; // 15 seconds for huge batches (100+)
        } else if (giftCount >= 50) {
          duration = 12000; // 12 seconds for very large batches (50-99)
        } else if (giftCount >= 25) {
          duration = 10000; // 10 seconds for large batches (25-49)
        } else if (giftCount >= 10) {
          duration = 8000; // 8 seconds for medium batches (10-24)
        } else if (giftCount >= 5) {
          duration = 6000; // 6 seconds for small batches (5-9)
        } else if (giftCount > 1) {
          duration = 5000; // 5 seconds for mini batches (2-4)
        } else {
          duration = 3000; // 3 seconds for single gifts
        }
      } else if (msgId === "sub" || msgId === "resub") {
        // Regular subs and resubs: 3 seconds
        duration = 3000;
      }
    } else if (nextToast.type === "added" || nextToast.type === "removed") {
      // Non-subscription toasts: keep original 8 seconds
      duration = 8000;
    }

    // Hide toast after calculated duration and process next one
    setTimeout(() => {
      currentToast.value.visible = false;
      isProcessingQueue.value = false;

      // Process next toast in queue after a short delay
      setTimeout(() => {
        processToastQueue();
      }, 500); // Small delay between toasts
    }, duration);
  } else {
    isProcessingQueue.value = false;
  }
}

function showToast(type: "added" | "removed", amount: number): void;
function showToast(type: "subscription", amount: number, subscriptionData: any): void;
function showToast(
  type: "added" | "removed" | "subscription",
  amount: number,
  subscriptionData?: any
): void {
  addToastToQueue(type, amount, subscriptionData);
}

function flashTimer(): void {
  isFlashing.value = true;
  setTimeout(() => {
    isFlashing.value = false;
  }, 500);
}

// Watch for timer data changes to trigger flash effect and toast
let previousTimeRemaining = 0;
let lastSubscriptionTimestamp = 0;
watch(
  () => timerData.value.timeRemaining,
  (newTime, oldTime) => {
    if (previousTimeRemaining > 0 && newTime !== oldTime) {
      const timeDifference = newTime - oldTime;
      const absTimeDifference = Math.abs(timeDifference);

      if (absTimeDifference > 10) {
        const now = Date.now();
        const isFromSubscription = now - lastSubscriptionTimestamp < 1000;

        if (timeDifference > 0 && !isFromSubscription) {
          flashTimer();
        }
      }
    }
    previousTimeRemaining = newTime;
  }
);

// Watch for subscription events to trigger toast messages
watch(
  () => latestSubscription.value,
  (newSubscription) => {
    if (newSubscription) {
      // Update the timestamp to prevent duplicate "added" toasts
      lastSubscriptionTimestamp = Date.now();
      flashTimer();
      showToast("subscription", newSubscription.timeAdded, newSubscription);
    }
  },
  { deep: true }
);

// Debug functions
function addTestTime(seconds: number): void {
  if (typeof addTime === "function") {
    addTime(seconds);
  } else {
    // If addTime is not available, just trigger the flash effect for visual testing
    console.log(`Would add ${seconds} seconds to timer`);
    flashTimer();
    showToast(seconds > 0 ? "added" : "removed", Math.abs(seconds));
  }
}

function triggerFlash(): void {
  flashTimer();
}

function toggleTimer(): void {
  // For testing purposes, just show that the button was clicked with a flash effect
  console.log(
    `Timer toggle clicked - Current state: ${timerData.value.isActive ? "Active" : "Inactive"}`
  );
  flashTimer();
}

function handleTestToast(type: "added" | "removed", amount: number): void {
  showToast(type, amount);
}

// Subscription simulation handlers
async function handleSimulateSub(tier: string): Promise<void> {
  const result = await simulateSubscription(tier);
  console.log(`Simulate subscription result: ${result.message}`);
}

async function handleSimulateGift(tier: string, count: number): Promise<void> {
  const result = await simulateGiftSubscription(tier, count);
  console.log(`Simulate gift subscription result: ${result.message}`);
}

async function handleSimulateResub(tier: string, months: number): Promise<void> {
  const result = await simulateResubscription(tier, months);
  console.log(`Simulate resubscription result: ${result.message}`);
}

async function handleSimulateRandomSub(): Promise<void> {
  const result = await simulateRandomSubscription();
  console.log(`Simulate random subscription result: ${result.message}`);
}

// Keyboard event handler
function handleKeyDown(event: KeyboardEvent): void {
  if (event.altKey && event.key === "k") {
    event.preventDefault();
    debugMode.value = !debugMode.value;
    console.log(`Debug mode toggled: ${debugMode.value ? "ON" : "OFF"}`);
  }
}

// Lifecycle
let cleanupInterval: NodeJS.Timeout;

onMounted(() => {
  initialize();

  // Add keyboard event listener
  window.addEventListener("keydown", handleKeyDown);

  // Add periodic cleanup for stale pending gifts (safety measure)
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    const staleThreshold = 10000; // 10 seconds

    pendingGifts.value.forEach((pendingGift, username) => {
      if (now - pendingGift.lastGiftTime > staleThreshold) {
        console.warn(
          `Cleaning up stale pending gift for ${username} with ${pendingGift.count} gifts`
        );
        clearTimeout(pendingGift.timeout);

        // Force process the stale gift
        const toastData = {
          type: "subscription" as const,
          title: "Subscription!",
          amount: "",
          subscriptionData: pendingGift.subscriptionData,
        };

        toastQueue.value.push(toastData);
        pendingGifts.value.delete(username);
        processToastQueue();
      }
    });
  }, 5000); // Check every 5 seconds
});

onUnmounted(() => {
  // Clean up keyboard event listener
  window.removeEventListener("keydown", handleKeyDown);

  // Clean up cleanup interval
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }

  // Clean up pending gift timeouts
  pendingGifts.value.forEach((pendingGift) => {
    clearTimeout(pendingGift.timeout);
  });
  pendingGifts.value.clear();

  // Clear any remaining toasts in queue
  toastQueue.value.length = 0;
  currentToast.value.visible = false;
  isProcessingQueue.value = false;
});
</script>

<style scoped>
.overlay-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  overflow: hidden;
}

.timer-display {
  color: var(--timer-color, #60e9b9);
  font-family: var(--timer-font-family, "Nunito", sans-serif);
  font-weight: 700;
  text-shadow: var(--timer-shadow, 2px 2px 4px rgba(0, 0, 0, 0.3));
  text-align: center;
  line-height: 1;
  white-space: nowrap;
  user-select: none;
  transition: all 0.3s ease;

  /* Always be 80% of viewport width */
  width: 95vw;
  font-size: 20vw; /* Approximately scales to fill the width for HH:MM:SS format */

  /* Ensure it doesn't exceed viewport height */
  /* max-height: 90vh; */
}

.timer-display.active {
  color: var(--timer-color, #60e9b9);
}

.timer-display.warning {
  color: #ffc048; /* Yellow for less than 5 minutes */
}

.timer-display.critical {
  color: #ff4757; /* Red for less than 1 minute */
  animation: pulse 1s infinite;
}

.timer-display.ended {
  color: #ff4757;
  animation: pulse 1s infinite;
}

.timer-display.flash {
  animation: flashEffect 0.5s ease;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes flashEffect {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.9;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes toastSlideIn {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(calc(-50% + 50px)) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: translateX(-50%) translateY(-50%) scale(1);
  }
}

/* Toast animation styles */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Font size automatically scales with the 80vw width */
</style>
