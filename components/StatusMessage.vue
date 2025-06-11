<template>
  <Transition name="fade">
    <div
      v-if="visible"
      :class="[
        'status-message p-2 rounded-lg mt-4 text-center font-semibold text-sm',
        isError
          ? 'bg-red-100 text-red-800 border border-red-200'
          : 'bg-green-100 text-green-800 border border-green-200',
      ]"
    >
      {{ message }}
    </div>
  </Transition>
</template>

<script setup lang="ts">
interface Props {
  message: string;
  isError: boolean;
  visible: boolean;
}

defineProps<Props>();
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
