<template>
  <canvas
    :width="width"
    height="50"
    class="border border-gray-200 rounded col-span-2 row-start-2"
  ></canvas>
</template>

<script setup>
const props = defineProps({
  width: {
    type: Number,
    default: 800,
  },
});
</script>
