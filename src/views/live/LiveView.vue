<script lang="ts" setup>
import { LineChart } from "@/components/ui/chart-line";
import { db } from "@/services/firebase";
import { HistoryOverview } from "@/types/history-overview";
import { Reading } from "@/types/reading.type";
import {
  ref as dbRef,
  get,
  off,
  onChildAdded,
  orderByKey,
  query,
  Query,
  startAt,
} from "firebase/database";
import { TimerOff } from "lucide-vue-next";
import { effect, onBeforeUnmount, ref } from "vue";

const readings = ref<Reading[]>([]);

const chartReadings = ref<{ timestamp: string; Temperature: number }[]>([]);
effect(() => {
  chartReadings.value = readings.value.map((reading) => {
    return {
      timestamp: reading.timestamp.toLocaleTimeString(),
      Temperature: reading.temperature,
    };
  });
});

const startAgo = 15 * 60 * 1000;

const lastValue = ref<Reading | null>(null);
const last1m = ref<HistoryOverview | null>(null);
const last5m = ref<HistoryOverview | null>(null);
const last15m = ref<HistoryOverview | null>(null);

function updateDisplayValues() {
  lastValue.value = readings.value[readings.value.length - 1];
  last1m.value = calculateHistoryOverview(60 * 1000);
  last5m.value = calculateHistoryOverview(5 * 60 * 1000);
  last15m.value = calculateHistoryOverview(15 * 60 * 1000);
  removeOldReadings();
}

function calculateHistoryOverview(timeBack: number): HistoryOverview {
  const now = Date.now();
  const timeBackAgo = now - timeBack;
  const readingsInTime = readings.value.filter(
    (reading) => reading.timestamp.getTime() > timeBackAgo
  );
  const temperatures = readingsInTime.map((reading) => reading.temperature);
  const avg = temperatures.reduce((a, b) => a + b, 0) / temperatures.length;
  const min = Math.min(...temperatures);
  const max = Math.max(...temperatures);
  if (isNaN(avg) || isNaN(min) || isNaN(max)) {
    return {
      avg: 0,
      min: 0,
      max: 0,
    };
  }
  return {
    avg,
    min,
    max,
  };
}

function removeOldReadings() {
  while (
    readings.value.length > 0 &&
    readings.value[0].timestamp.getTime() < Date.now() - startAgo
  ) {
    readings.value.shift();
  }
}

const minTimestamp = ((Date.now() - 15 * 60 * 1000) / 1000).toFixed(0);

const readingsRef = dbRef(db, "readings");
let liveQuery: Query | null = null;
let lastProcessedTimestamp = Number(minTimestamp);

// Step 1: Fetch Initial Data (Last 15 Minutes)
const readingsQuery = query(readingsRef, orderByKey(), startAt(minTimestamp));

get(readingsQuery).then((snapshot) => {
  const data = snapshot.val() as Record<string, number>;
  if (data) {
    Object.entries(data).forEach(([timestamp, temperature]) => {
      const numericTimestamp = Number(timestamp);
      if (temperature !== undefined) {
        readings.value.push({
          timestamp: new Date(numericTimestamp * 1000),
          temperature: Number(temperature),
        });
      }
      lastProcessedTimestamp = Math.max(
        lastProcessedTimestamp,
        numericTimestamp
      );
    });
  }

  updateDisplayValues();

  // Step 2: Listen for New Data (Only Newer Values)
  liveQuery = query(
    readingsRef,
    orderByKey(),
    startAt(String(lastProcessedTimestamp + 1))
  );

  onChildAdded(liveQuery, (snapshot) => {
    const timestamp = Number(snapshot.key);
    const temperature = snapshot.val();

    if (timestamp > lastProcessedTimestamp && temperature !== undefined) {
      readings.value.push({
        timestamp: new Date(timestamp * 1000),
        temperature: Number(temperature),
      });

      lastProcessedTimestamp = timestamp;
      updateDisplayValues();
    }
  });
});

onBeforeUnmount(() => {
  if (liveQuery) {
    off(liveQuery);
  }
});
</script>

<template>
  <div class="px-4 py-2 sm:h-[calc(100vh-4rem)]">
    <div
      class="flex h-full flex-col"
      v-if="lastValue && last1m && last5m && last15m"
    >
      <div
        class="mb-4 flex w-full flex-col items-center justify-between gap-4 sm:flex-row"
      >
        <div
          class="flex flex-1 gap-8 rounded-sm px-8 py-4 text-xs backdrop-blur-sm"
        >
          <div class="flex flex-col">
            <div class="text-muted-foreground">Latest value</div>
            <div>
              {{ lastValue.timestamp.toLocaleTimeString() }}
            </div>
          </div>
        </div>
        <div class="flex flex-1 items-center justify-center">
          <div
            class="rounded-sm bg-white/30 px-8 py-5 text-4xl font-semibold backdrop-blur-sm"
          >
            {{ Math.round(lastValue.temperature) }}°C
          </div>
        </div>
        <div class="flex flex-1 items-center justify-end">
          <div class="flex gap-8 rounded-sm px-8 py-4 text-xs backdrop-blur-sm">
            <div class="flex flex-col">
              <div class="text-muted-foreground">1 minute</div>
              <div>Avg: {{ Math.round(last1m.avg) }}°C</div>
              <div>Min: {{ Math.round(last1m.min) }}°C</div>
              <div>Max: {{ Math.round(last1m.max) }}°C</div>
            </div>
            <div class="flex flex-col">
              <div class="text-muted-foreground">5 minutes</div>
              <div>Avg: {{ Math.round(last5m.avg) }}°C</div>
              <div>Min: {{ Math.round(last5m.min) }}°C</div>
              <div>Max: {{ Math.round(last5m.max) }}°C</div>
            </div>
            <div class="flex flex-col">
              <div class="text-muted-foreground">15 minutes</div>
              <div>Avg: {{ Math.round(last15m.avg) }}°C</div>
              <div>Min: {{ Math.round(last15m.min) }}°C</div>
              <div>Max: {{ Math.round(last15m.max) }}°C</div>
            </div>
          </div>
        </div>
      </div>

      <div class="h-full">
        <LineChart
          v-if="chartReadings.length > 0"
          class="h-full"
          :data="chartReadings"
          index="timestamp"
          :categories="['Temperature']"
          :show-legend="false"
          :colors="['#13b982']"
          :y-formatter="(value) => value + '°C'"
        />
      </div>
    </div>
    <div class="flex h-full items-center justify-center" v-else>
      <div class="flex flex-col items-center gap-2 text-lg">
        <TimerOff class="h-40 w-40" />
        <div class="text-center">
          No live data available, please start a brew
        </div>
      </div>
    </div>
  </div>
</template>
