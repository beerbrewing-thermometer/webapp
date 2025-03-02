<script lang="ts" setup>
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Button from "@/components/ui/button/Button.vue";
import { Calendar } from "@/components/ui/calendar";
import LineChart from "@/components/ui/chart-line/LineChart.vue";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { db } from "@/services/firebase";
import { Reading } from "@/types/reading.type";
import {
  DateFormatter,
  DateValue,
  fromDate,
  getLocalTimeZone,
} from "@internationalized/date";
import {
  DataSnapshot,
  ref as dbRef,
  endAt,
  get,
  orderByKey,
  query,
  startAt,
  update,
} from "firebase/database";
import {
  Beer,
  BeerOff,
  CalendarIcon,
  CalendarSearch,
  Download,
  Trash2,
} from "lucide-vue-next";
import { ref } from "vue";

const { toast } = useToast();

let loadedDocs: DataSnapshot[] = [];
const readings = ref<Reading[]>([]);
const chartReadings = ref<{ timestamp: string; Temperature: number }[]>([]);

const df = new DateFormatter("en-AT", {
  dateStyle: "long",
});

const datepickerValue = ref<DateValue>();
const isLoading = ref(false);

async function datepickerChanged(newValue: DateValue | undefined) {
  if (!newValue) return;
  isLoading.value = true;
  const date = newValue.toDate(getLocalTimeZone());
  date.setHours(0, 0, 0, 0);
  const startTimestamp = date.getTime();
  date.setHours(23, 59, 59, 999);
  const endTimestamp = date.getTime();
  await loadData(startTimestamp, endTimestamp);
  isLoading.value = false;
}

function updateChartReadings() {
  chartReadings.value = readings.value.map((reading) => {
    return {
      timestamp: reading.timestamp.toLocaleTimeString(),
      Temperature: reading.temperature,
    };
  });
}

async function loadData(startTimestamp: number, endTimestamp: number) {
  const startKey = (startTimestamp / 1000).toFixed(0);
  const endKey = (endTimestamp / 1000).toFixed(0);

  const readingsRef = dbRef(db, "readings");
  const q = query(readingsRef, orderByKey(), startAt(startKey), endAt(endKey));

  readings.value = [];
  chartReadings.value = [];
  loadedDocs = [];

  const snapshot = await get(q);
  if (snapshot.exists()) {
    snapshot.forEach((childSnapshot) => {
      const key = childSnapshot.key;
      const temperature = childSnapshot.val();

      if (key && temperature !== undefined) {
        const reading: Reading = {
          timestamp: new Date(Number(key) * 1000),
          temperature: Number(temperature),
        };
        readings.value.push(reading);
        loadedDocs.push(childSnapshot);
      }
    });
  }

  updateChartReadings();
}

async function deleteData() {
  toast({
    title: "Deleting brewing day...",
    duration: 99999999,
  });

  const batchSize = 500;
  let batchUpdates: { [key: string]: null } = {};
  let counter = 0;

  for (const doc of loadedDocs) {
    if (doc.key !== null) {
      batchUpdates[doc.key] = null;
    }
    counter++;

    if (counter === batchSize) {
      await update(dbRef(db, "readings"), batchUpdates);
      batchUpdates = {};
      counter = 0;
    }
  }

  if (counter > 0) {
    await update(dbRef(db, "readings"), batchUpdates);
  }

  loadedDocs = [];
  readings.value = [];
  chartReadings.value = [];
  datepickerValue.value = undefined;

  toast({
    title: "Brewing day deleted",
  });
}

function exportCSV() {
  if (datepickerValue.value === undefined) return;
  const csv = [
    ["timestamp", "temperature"],
    ...readings.value.map((reading) => [
      (reading.timestamp.getTime() / 1000).toFixed(0),
      reading.temperature.toString().replace(".", ","),
    ]),
  ]
    .map((row) => row.join(";"))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;

  const dlDf = new Intl.DateTimeFormat("en-AT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const formattedDate = dlDf.format(
    datepickerValue.value.toDate(getLocalTimeZone())
  );
  // Assuming it's in dd/mm/yyyy format
  const [day, month, year] = formattedDate.split("/");
  const customFormattedDate = `${year}_${month}_${day}`;

  a.download = `sud-${customFormattedDate}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <div class="px-4 py-2 sm:h-[calc(100vh-7rem)]">
    <div class="mb-4 flex items-center gap-3">
      <h2 class="text-nowrap text-md">Brewing Day</h2>
      <Popover>
        <PopoverTrigger as-child>
          <Button
            variant="outline"
            :class="
              cn(
                'justify-start text-left font-normal w-full',
                !datepickerValue && 'text-muted-foreground'
              )
            "
          >
            <CalendarIcon class="mr-2 h-4 w-4" />
            {{
              datepickerValue
                ? df.format(datepickerValue.toDate(getLocalTimeZone()))
                : "Pick a date"
            }}
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-auto p-0">
          <Calendar
            v-model="datepickerValue"
            initial-focus
            :max-value="fromDate(new Date(), getLocalTimeZone())"
            :week-starts-on="1"
            :disabled="isLoading"
            @update:model-value="datepickerChanged"
          />
        </PopoverContent>
      </Popover>
      <Button :disabled="isLoading || readings.length == 0" @click="exportCSV">
        <Download class="size-4" />
        CSV
      </Button>
      <AlertDialog>
        <AlertDialogTrigger as-child>
          <Button :disabled="isLoading || readings.length == 0" class="w-10">
            <Trash2 class="size-4" /> </Button
        ></AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This brewing day will be permanently
              from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction @click="deleteData()"
              >Continue</AlertDialogAction
            >
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>

    <div class="h-full">
      <div v-if="isLoading" class="flex h-full items-center justify-center">
        <div class="flex flex-col items-center gap-2 text-lg">
          <Beer class="h-40 w-40 animate-fade-in-scale-up" />
          <div class="text-center">
            Hold tight, brewing magic is happening...
          </div>
        </div>
      </div>
      <div
        v-else-if="datepickerValue == undefined"
        class="flex h-full items-center justify-center"
      >
        <div class="flex flex-col items-center gap-2 text-lg">
          <CalendarSearch class="h-40 w-40" />
          <div class="text-center">Pick a date to see your brewing history</div>
        </div>
      </div>
      <div
        v-else-if="chartReadings.length === 0"
        class="flex h-full items-center justify-center"
      >
        <div class="flex flex-col items-center gap-2 text-lg">
          <BeerOff class="h-40 w-40" />
          <div class="text-center">
            You haven't brewed this day - maybe it's time to start?
          </div>
        </div>
      </div>
      <LineChart
        v-else-if="chartReadings.length > 0"
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
</template>
