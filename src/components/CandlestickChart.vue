<template>
  <div class="chart-container relative">
    <canvas
      ref="chartCanvas"
      :width="width"
      :height="height"
      @mousemove="handleMouseMove"
      @mouseout="handleMouseOut"
      @wheel.prevent="handleWheel"
      @mousedown="handleMouseDown"
      class="border border-gray-200 rounded"
    ></canvas>

    <div
      class="absolute top-0 right-0 h-full flex flex-col justify-between pr-2 text-xs text-gray-600"
      style="pointer-events: none"
    >
      <div v-for="price in priceLabels" :key="price">
        {{ formatPrice(price) }}
      </div>
    </div>

    <div
      v-if="hoveredCandle"
      class="absolute bg-gray-800 text-white p-2 rounded text-xs"
      :style="tooltipStyle"
    >
      <div>Date: {{ formatDate(hoveredCandle.timestamp) }}</div>
      <div>O: {{ formatPrice(hoveredCandle.open) }}</div>
      <div>H: {{ formatPrice(hoveredCandle.high) }}</div>
      <div>L: {{ formatPrice(hoveredCandle.low) }}</div>
      <div>C: {{ formatPrice(hoveredCandle.close) }}</div>
      <div>Vol: {{ formatVolume(hoveredCandle.volume) }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, reactive, onUnmounted } from "vue";
import {
  calculatePriceStep,
  formatPrice,
  formatVolume,
  formatDate,
} from "../utils/helper";

const props = defineProps({
  data: {
    type: Array,
    required: true,
  },
  width: {
    type: Number,
    default: 800,
  },
  height: {
    type: Number,
    default: 400,
  },
});

const COLORS = {
  GREEN: "#10b981",
  RED: "#ef4444",
};

const chartCanvas = ref(null);
const ctx = ref(null);
const hoveredCandle = ref(null);
const tooltipStyle = ref({ left: "0px", top: "0px", display: "none" });
const isDragging = ref(false);
const dragStartX = ref(0);
const scrollX = ref(0);
const startScrollX = ref(0);
const candleWidth = ref(30);
const verticalPadding = 0.4;

const margin = { top: 20, right: 60, bottom: 30, left: 10 };
const chartWidth = computed(() => props.width);
const chartHeight = computed(() => props.height);

// Visible data calculations
const visibleCandles = computed(() =>
  Math.ceil(chartWidth.value / candleWidth.value)
);
console.log(visibleCandles.value, candleWidth.value, chartWidth.value);
const startIndex = computed(() =>
  Math.max(0, Math.floor(scrollX.value / candleWidth.value))
);
const endIndex = computed(() =>
  Math.min(props.data.length, startIndex.value + visibleCandles.value)
);

// Price calculations
const dragStartY = ref(0);
const priceOffset = ref(0);
const startPriceRange = reactive({ min: 0, max: 0 });

const endScrollX = computed(() => {
  const paddingOffset = 0.7;
  return Math.max(
    0,
    props.data.length * candleWidth.value - chartWidth.value * paddingOffset
  );
});

const maxScrollX = computed(() => {
  return endScrollX.value + chartWidth.value * 0.5; // 50% overscroll allowance
});

const visiblePriceRange = reactive({
  min: 0,
  max: 0,
  baseMin: 0,
  baseMax: 0,
});

const calculateVisiblePriceRange = () => {
  const start = startIndex.value;
  const end = endIndex.value;
  console.log({ start, end });
  const visibleData = props.data.slice(start, end + 1);

  if (visibleData.length === 0) {
    visiblePriceRange.baseMin = 0;
    visiblePriceRange.baseMax = 0;
    visiblePriceRange.min = 0;
    visiblePriceRange.max = 0;
    return;
  }

  const min = Math.min(...visibleData.map((c) => c.low));
  const max = Math.max(...visibleData.map((c) => c.high));
  const padding = (max - min) * verticalPadding;

  visiblePriceRange.baseMin = min - padding;
  visiblePriceRange.baseMax = max + padding;
  visiblePriceRange.min = visiblePriceRange.baseMin;
  visiblePriceRange.max = visiblePriceRange.baseMax;
};

const priceRange = computed(() => ({
  min: visiblePriceRange.min,
  max: visiblePriceRange.max,
}));

const priceLabels = computed(() => {
  const { min, max } = priceRange.value;
  const range = max - min;
  const step = calculatePriceStep(range);
  return Array.from(
    { length: Math.floor(range / step) + 1 },
    (_, i) => max - step * i
  );
});

// Drawing functions
const getY = (price) => {
  const { min, max } = priceRange.value;
  return ((max - price) / (max - min || 1)) * chartHeight.value;
};

const drawGrid = () => {
  ctx.value.strokeStyle = "#e5e7eb";
  ctx.value.lineWidth = 0.5;
  ctx.value.beginPath();

  // Horizontal grid lines
  priceLabels.value.forEach((price) => {
    const y = getY(price);
    ctx.value.moveTo(0, y);
    ctx.value.lineTo(props.width, y);
  });

  ctx.value.stroke();
};

const drawCandles = () => {
  ctx.value.lineWidth = 1;

  // Calculate first visible index with overscroll
  const firstVisibleIndex = Math.max(
    0,
    Math.floor(scrollX.value / candleWidth.value) - 1
  );

  // Calculate last index with buffer
  const lastVisibleIndex = Math.min(
    props.data.length - 1,
    firstVisibleIndex + Math.ceil(chartWidth.value / candleWidth.value) + 2
  );
  // console.log({
  //   firstVisibleIndex,
  //   lastVisibleIndex,
  //   scrollX: scrollX.value,
  //   lastINd:
  //     firstVisibleIndex + Math.ceil(chartWidth.value / candleWidth.value) + 2,
  // });

  for (let i = firstVisibleIndex; i <= lastVisibleIndex; i++) {
    if (i >= props.data.length) break; // Stop at actual data end

    const candle = props.data[i];
    const x = margin.left + i * candleWidth.value - scrollX.value;
    // console.log({
    //   i,
    //   x,
    // });
    // draw partially visible candles
    if (x + candleWidth.value < 0 || x > props.width) continue;

    // Draw wick
    ctx.value.strokeStyle = candle.close >= candle.open ? "#10b981" : "#ef4444";
    ctx.value.beginPath();
    ctx.value.moveTo(x + candleWidth.value / 2, getY(candle.high));
    ctx.value.lineTo(x + candleWidth.value / 2, getY(candle.low));
    ctx.value.stroke();

    // Draw body
    ctx.value.fillStyle = candle.close >= candle.open ? "#10b981" : "#ef4444";
    const openY = getY(candle.open);
    const closeY = getY(candle.close);
    const bodyWidth = candleWidth.value * 0.75;

    ctx.value.fillRect(
      x + (candleWidth.value - bodyWidth) / 2,
      Math.min(openY, closeY),
      bodyWidth,
      Math.max(Math.abs(openY - closeY), 1)
    );
  }
};

const drawChart = () => {
  if (!ctx.value) return;

  ctx.value.clearRect(0, 0, props.width, props.height);
  ctx.value.save();
  ctx.value.translate(0.5, 0.5);

  drawGrid();
  drawCandles();
  ctx.value.restore();

  requestAnimationFrame(() => {
    ctx.value.save();
    ctx.value.translate(0.5, 0.5);
    drawCandles();
    ctx.value.restore();
  });
};

const handleMouseDown = (e) => {
  isDragging.value = true;
  dragStartX.value = e.clientX;
  dragStartY.value = e.clientY;

  // Store current states
  startPriceRange.min = visiblePriceRange.min;
  startPriceRange.max = visiblePriceRange.max;
  startScrollX.value = scrollX.value;

  // Add window listeners for reliable mouseup
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);
};

const handleMouseMove = (e) => {
  const rect = chartCanvas.value.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // Update tooltip
  const candleIndex = Math.floor((mouseX + scrollX.value) / candleWidth.value);
  hoveredCandle.value = props.data[candleIndex] || null;

  if (hoveredCandle.value) {
    tooltipStyle.value = {
      left: `${e.clientX - rect.left + 10}px`,
      top: `${e.clientY - rect.top + 10}px`,
      display: "block",
    };
  }

  // Handle dragging
  if (isDragging.value) {
    if (animationFrameId.value) {
      cancelAnimationFrame(animationFrameId.value);
    }
    // Horizontal pan
    const deltaX = e.clientX - dragStartX.value;
    const newScrollX = startScrollX.value - deltaX;
    console.log({ deltaX, newScrollX, maxScrollX: maxScrollX.value });
    scrollX.value = Math.max(0, Math.min(maxScrollX.value, newScrollX));

    // Vertical pan
    const deltaY = e.clientY - dragStartY.value;
    const priceDelta =
      (deltaY / chartHeight.value) *
      (startPriceRange.max - startPriceRange.min);

    visiblePriceRange.min = startPriceRange.min + priceDelta;
    visiblePriceRange.max = startPriceRange.max + priceDelta;

    // drawChart();
    animationFrameId.value = requestAnimationFrame(() => {
      drawChart();
      animationFrameId.value = null;
    });
  }
};

const handleMouseUp = () => {
  if (isDragging.value) {
    isDragging.value = false;
    // Remove window listeners
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }
};

const handleWheel = (e) => {
  if (e.ctrlKey || e.metaKey) {
    // Horizontal zoom
    const zoomFactor = e.deltaY < 0 ? 0.9 : 1.1;
    const oldCandleWidth = candleWidth.value;
    const newCandleWidth = Math.max(
      5,
      Math.min(100, candleWidth.value * zoomFactor)
    );

    const rect = chartCanvas.value.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const dataIndexAtMouse = Math.floor(
      (mouseX + scrollX.value) / oldCandleWidth
    );

    // Update candle width and scroll position
    candleWidth.value = newCandleWidth;
    scrollX.value = Math.max(
      0,
      Math.min(dataIndexAtMouse * newCandleWidth - mouseX, maxScrollX.value)
    );
  } else {
    // Vertical zoom
    const rect = chartCanvas.value.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    const mousePrice =
      visiblePriceRange.max -
      (mouseY / chartHeight.value) *
        (visiblePriceRange.max - visiblePriceRange.min);

    const zoomFactor = e.deltaY < 0 ? 0.9 : 1.1;

    // Update visible price range
    visiblePriceRange.min =
      mousePrice - (mousePrice - visiblePriceRange.min) * zoomFactor;
    visiblePriceRange.max =
      mousePrice + (visiblePriceRange.max - mousePrice) * zoomFactor;
  }

  // drawChart();
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value);
  }
  animationFrameId.value = requestAnimationFrame(() => {
    drawChart();
    animationFrameId.value = null;
  });
};

const handleMouseOut = () => {
  hoveredCandle.value = null;
};

// Initialization
onMounted(() => {
  ctx.value = chartCanvas.value.getContext("2d");
  console.log("endScrollX:", endScrollX.value);
  scrollX.value = endScrollX.value;
  calculateVisiblePriceRange();
  drawChart();
});

const animationFrameId = ref(null);

// Cancel pending animation
onUnmounted(() => {
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value);
  }
});

watch(
  () => props.data,
  () => {
    scrollX.value = endScrollX.value;
    calculateVisiblePriceRange();
    drawChart();
  }
);
</script>

<style scoped>
.chart-container {
  width: v-bind(width + "px");
  height: v-bind(height + "px");
  cursor: grab;
}

.chart-container:active {
  cursor: grabbing;
}
</style>
