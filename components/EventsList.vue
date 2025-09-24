<template>
  <div
    class="events-section bg-slate-800/90 rounded-xl p-4 shadow-xl border border-white/10 flex flex-col"
  >
    <h3 class="text-white mb-3 text-lg">Logs</h3>

    <div
      class="events-list min-h-64 overflow-y-auto border-2 border-gray-600 rounded-lg p-2 bg-gray-900/60"
    >
      <div v-if="events.length === 0" class="text-center text-gray-400 py-5 text-sm">
        No recent events
      </div>

      <div
        v-for="event in shownEvents"
        :key="`${event.source}-${event.message}-${event.time}`"
        class="event-item p-1.5 mb-1.5 bg-slate-700/80 rounded border-l-3 border-blue-400 text-sm text-white"
      >
        <strong>{{ event.source }}:</strong> {{ event.message }}
        <div class="event-time text-gray-400 text-xs">
          {{ event.time }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Event {
  source: string;
  message: string;
  time: string;
}

interface Props {
  events: readonly Event[];
}

const props = defineProps<Props>();

const shownEvents = computed(() => {
  return props.events.slice(0, 5);
});
</script>

<style scoped>
.events-list::-webkit-scrollbar {
  width: 8px;
}

.events-list::-webkit-scrollbar-track {
  background: rgba(17, 24, 39, 0.8);
  border-radius: 4px;
}

.events-list::-webkit-scrollbar-thumb {
  background: rgba(75, 85, 99, 0.8);
  border-radius: 4px;
}

.events-list::-webkit-scrollbar-thumb:hover {
  background: rgba(107, 114, 128, 0.8);
}
</style>
