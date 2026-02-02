import { getSupabaseAdmin } from "./supabase";

/** Statistics for a given honest/deceptive pair of stimuli from the same set */
export interface PairStat {
  /** Unique set id */
  set_id: string;
  /** Admin-specified set name */
  set_name: string;

  /** Admin-specified honest stimulus name */
  honest_name: string;
  /** Honest stimulus URL */
  honest_url: string;

  /** Admin-specified deceptive stimulus name */
  deceptive_name: string;
  /** Deceptive stimulus URL */
  deceptive_url: string;

  /** Total number of data points for this pair */
  total_responses: number;
  /** Total number of correct responses for this pair */
  correct_count: number;
  /** Rounded percentage of correct responses */
  accuracy_percent: number;
}

/** Statistics for every pair of stumuli in a given set */
export interface SetStats {
  set_id: string;
  set_name: string;
  rows: PairStat[];
}

/**
 * Gets the latest overall stats for all pairs from Supabase
 * @returns Promise<SetStats[]> - An array containing SetStats for each stimuli set
 */
export const fetchStats = async (): Promise<SetStats[]> => {
  const supabase = getSupabaseAdmin();

  const { data: stats, error } = await supabase.from("pair_stats").select("*");

  if (error) {
    throw new Error(error.message);
  }

  if (!stats || stats.length === 0) {
    return [];
  }

  if (stats) {
    // Group data into SetStat and then put into array
    const grouped = stats.reduce<Record<string, SetStats>>((acc, row) => {
      if (!acc[row.set_id]) {
        acc[row.set_id] = {
          set_id: row.set_id,
          set_name: row.set_name,
          rows: [],
        };
      }
      acc[row.set_id].rows.push(row);

      return acc;
    }, {});

    return Object.values(grouped) as SetStats[];
  }

  return [];
};

/** Fetches all pair stats and triggers a csv download  */
export const downloadStatsCsv = async () => {
  const stats = await fetchStats();

  if (!stats || stats.length === 0) {
    return;
  }

  // Flatten SetStats[] into PairStat[] rows for CSV export
  const flattenedData: PairStat[] = stats.flatMap((set) => set.rows);

  if (flattenedData.length === 0) {
    return;
  }

  // Convert to CSV
  const headers: (keyof PairStat)[] = [
    "set_id",
    "set_name",
    "honest_name",
    "honest_url",
    "deceptive_name",
    "deceptive_url",
    "total_responses",
    "correct_count",
    "accuracy_percent",
  ];

  const csvRows = [
    headers.join(","),
    ...flattenedData.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Escape values with commas or quotes
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? "";
        })
        .join(","),
    ),
  ];
  const csvString = csvRows.join("\n");

  const blob = new Blob([csvString], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "pair_stats_" + Date.now() + ".csv";
  a.click();
  URL.revokeObjectURL(url);
};
