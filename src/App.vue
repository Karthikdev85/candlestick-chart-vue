<template>
  <div class="p-10">
    <CandlestickChart :data="candleData" :width="600" :height="500" />
  </div>
</template>

<script setup>
import { ref } from "vue";
import CandlestickChart from "./components/CandlestickChart.vue";

// Example data
const chartData = ref([
  {
    timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
    open: 100,
    high: 105,
    low: 98,
    close: 103,
    volume: 1000000,
  },
]);

function generateCandleData(count = 50) {
  const data = [];
  let basePrice = 100;
  // One day in milliseconds
  const oneDay = 24 * 60 * 60 * 1000;
  const endDate = new Date();

  for (let i = 0; i < count; i++) {
    // Generate random price movements 2% volatility
    const volatility = basePrice * 0.02;
    const open = basePrice + (Math.random() - 0.5) * volatility;
    const multiplier = 2;

    const high = Math.max(open + Math.random() * volatility * multiplier);
    const low = Math.min(open - Math.random() * volatility * multiplier);

    // Generate close price between high and low
    const close = low + Math.random() * (high - low);

    const volume = Math.floor(Math.random() * 1000000) + 500000;

    // Create timestamp for each day, moving backwards from current date
    const timestamp = endDate.getTime() - (count - i - 1) * oneDay;

    data.push({
      timestamp,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });

    // Use close as the next day's base price
    basePrice = close;
  }

  return data;
}

// Generate the data
const candleData = generateCandleData(100);
</script>
