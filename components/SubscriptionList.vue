<template>
  <div
    class="subscription-section bg-slate-800/90 rounded-xl p-4 shadow-xl border border-white/10 flex flex-col"
  >
    <h3 class="text-white mb-3 text-lg flex items-center gap-2">💜 Recent Subscriptions</h3>

    <div
      class="subscription-list h-[300px] overflow-y-auto border-2 border-gray-600 rounded-lg p-2 bg-gray-900/60"
    >
      <div
        v-if="subscriptions.length === 0"
        class="no-subscriptions text-center text-gray-400 italic py-5 text-sm"
      >
        No subscriptions yet...
      </div>

      <div
        v-for="sub in subscriptions"
        :key="`${sub.username}-${sub.timestamp}`"
        class="subscription-item mb-2 p-2 rounded-md bg-slate-700/80 shadow-sm border-l-3 border-purple-500"
      >
        <div class="sub-username font-bold text-purple-400 text-sm">
          {{ sub.username }}
        </div>
        <div class="sub-details text-gray-300 text-xs my-1">
          {{ getSubTypeDisplay(sub) }}
        </div>
        <span
          class="sub-time-added bg-green-100 text-green-800 px-1 py-0.5 rounded text-xs font-bold inline-block"
        >
          +{{ sub.timeAdded }}s
        </span>
        <span class="sub-timestamp text-gray-400 text-xs float-right">
          {{ sub.timestamp }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Subscription {
  username: string;
  msgId: string;
  subPlan?: string;
  tierName?: string;
  timeAdded: number;
  timestamp: string;
}

interface Props {
  subscriptions: readonly Subscription[];
}

defineProps<Props>();

function getSubTypeDisplay(sub: Subscription): string {
  const tierDisplay = sub.tierName || (sub.subPlan === "Prime" ? "Prime" : "Unknown");
  const actionDisplay =
    sub.msgId === "subgift" ? "Gift Sub" : sub.msgId === "resub" ? "Resub" : "New Sub";
  return `${actionDisplay} (${tierDisplay})`;
}
</script>

<style scoped>
.subscription-list::-webkit-scrollbar {
  width: 8px;
}

.subscription-list::-webkit-scrollbar-track {
  background: rgba(17, 24, 39, 0.8);
  border-radius: 4px;
}

.subscription-list::-webkit-scrollbar-thumb {
  background: rgba(75, 85, 99, 0.8);
  border-radius: 4px;
}

.subscription-list::-webkit-scrollbar-thumb:hover {
  background: rgba(107, 114, 128, 0.8);
}
</style>
