<template>
  <canvas
    ref="canvas"
    width="70"
    :height="height"
    class="border border-gray-200 rounded row-span-1 col-start-2"
  ></canvas>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";

const props = defineProps({
  //   data: {
  //     type: Array,
  //     required: true,
  //   },
  //   width: {
  //     type: Number,
  //     default: 800,
  //   },
  height: {
    type: Number,
    default: 400,
  },
  priceLabels: {
    type: Array,
  },
  priceRange: {
    type: Object,
  },
});

const canvas = ref(null);
const ctx = ref(null);
const priceStep = ref(5);

const getY = (p) => {};

const drawPrice = () => {
  if (!ctx.value) return;

  ctx.value.clearRect(0, 0, 70, props.height);
  ctx.value.save();
  ctx.value.translate(0.5, 0.5);

  const priceLevels = generatePriceLevels();
  priceLevels.forEach((p) => {
    ctx.value.font = "12px serif";
    ctx.value.textBaseline = "middle";
    ctx.value.fillText(p.price, 2, p.position);
  });

  ctx.value.restore();
};

const tickSpacing = 30;

function calculatePriceInterval() {
  console.log(props.height);
  const availableHeight = props.height;
  const priceRange = props.priceRange.max - props.priceRange.min;

  // Approximate number of ticks based on available height and minimum spacing
  const maxTicks = Math.floor(availableHeight / tickSpacing);

  // Calculate raw interval
  let interval = priceRange / maxTicks;

  // Find nearest nice number
  const magnitude = Math.pow(10, Math.floor(Math.log10(interval)));
  const normalizedInterval = interval / magnitude;

  // Common nice numbers
  const niceNumbers = [1, 2, 2.5, 5, 10];
  console.log(`MaxTicks: ${maxTicks}`);
  console.log(`Interval: ${interval}`);
  console.log(`Magnitude: ${magnitude}`);
  console.log(`Normalized Interval: ${normalizedInterval}`);
  console.log("\nFinding closest nice number:");

  // Start with first number
  let closest = niceNumbers[0];

  for (let i = 1; i < niceNumbers.length; i++) {
    const current = niceNumbers[i];

    // Calculate distances
    const currentDistance = Math.abs(current - normalizedInterval);
    const closestDistance = Math.abs(closest - normalizedInterval);

    console.log(`\nComparing ${current} with current closest ${closest}:`);
    console.log(`Distance to ${current}: ${currentDistance}`);
    console.log(`Distance to ${closest}: ${closestDistance}`);

    // Update if current is closer
    if (currentDistance < closestDistance) {
      console.log(`${current} is closer! New closest.`);
      closest = current;
    } else {
      console.log(`Keeping ${closest} as closest.`);
    }
  }

  const finalInterval = closest * magnitude;
  console.log(`\nFinal Result: ${finalInterval}`);

  return finalInterval;
}

function generatePriceLevels() {
  const interval = calculatePriceInterval();
  const levels = [];

  // Start from the floor of minPrice
  let currentPrice = Math.floor(props.priceRange.max / interval) * interval;

  while (currentPrice >= props.priceRange.min - 10) {
    if (currentPrice <= props.priceRange.max) {
      const position = priceToPixel(currentPrice);
      levels.push({
        price: currentPrice,
        position,
      });
    }
    currentPrice -= interval;
  }

  console.log({
    levels,
  });

  return levels;
}

function priceToPixel(price) {
  const availableHeight = props.height;
  const priceRange = props.priceRange.max - props.priceRange.min;
  const pixelRatio = availableHeight / priceRange;

  return props.height - (price - props.priceRange.min) * pixelRatio;
}

onMounted(() => {
  ctx.value = canvas.value.getContext("2d");
  drawPrice();
});

watch(
  () => props.priceRange,
  (v) => {
    drawPrice();
    console.log(v);
  }
);
</script>
