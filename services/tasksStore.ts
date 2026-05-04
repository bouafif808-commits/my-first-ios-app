import AsyncStorage from "@react-native-async-storage/async-storage";

export type MissionTask = {
  id: string;
  date: string;
  title: string;
  repeated: boolean;
  createdAt: string;
};

export type TaskCompletion = {
  taskId: string;
  date: string;
  done: boolean;
};

export type TaskSettings = {
  repeatTasks: boolean;
};

const TASKS_KEY = "missionday_tasks_v3";
const COMPLETION_KEY = "missionday_task_completion_v3";
const SETTINGS_KEY = "missionday_task_settings_v3";

export const defaultTaskSettings: TaskSettings = {
  repeatTasks: true,
};

export function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

/* ------------------ STORAGE ------------------ */

async function readTasks(): Promise<MissionTask[]> {
  const raw = await AsyncStorage.getItem(TASKS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeTasks(tasks: MissionTask[]) {
  await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

async function readCompletion(): Promise<TaskCompletion[]> {
  const raw = await AsyncStorage.getItem(COMPLETION_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeCompletion(data: TaskCompletion[]) {
  await AsyncStorage.setItem(COMPLETION_KEY, JSON.stringify(data));
}

/* ------------------ SETTINGS ------------------ */

export async function getTaskSettings(): Promise<TaskSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return defaultTaskSettings;

  try {
    return { ...defaultTaskSettings, ...JSON.parse(raw) };
  } catch {
    return defaultTaskSettings;
  }
}

export async function saveTaskSettings(settings: TaskSettings) {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/* ------------------ TASK LOGIC ------------------ */

export async function getTasksForDate(dateKey: string) {
  const tasks = await readTasks();
  const completion = await readCompletion();

  return tasks
    .filter((task) => {
      if (task.date === dateKey) return true;
      if (task.repeated && task.date < dateKey) return true;
      return false;
    })
    .map((task) => {
      const found = completion.find(
        (c) => c.taskId === task.id && c.date === dateKey
      );

      return {
        ...task,
        done: found?.done || false,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addTaskToDate(dateKey: string, title: string) {
  const tasks = await readTasks();
  const settings = await getTaskSettings();

  const task: MissionTask = {
    id: String(Date.now()),
    date: dateKey,
    title,
    repeated: settings.repeatTasks,
    createdAt: new Date().toISOString(),
  };

  await writeTasks([task, ...tasks]);
}

export async function toggleTaskDone(taskId: string, dateKey: string) {
  const completion = await readCompletion();

  const existing = completion.find(
    (c) => c.taskId === taskId && c.date === dateKey
  );

  if (existing) {
    existing.done = !existing.done;
  } else {
    completion.push({
      taskId,
      date: dateKey,
      done: true,
    });
  }

  await writeCompletion(completion);
}

export async function deleteTask(taskId: string) {
  const tasks = await readTasks();
  const completion = await readCompletion();

  await writeTasks(tasks.filter((t) => t.id !== taskId));
  await writeCompletion(completion.filter((c) => c.taskId !== taskId));
}

export function getTaskStats(tasks: any[]) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;

  return {
    total,
    done,
    progress: total === 0 ? 0 : done / total,
  };
}

/* ------------------ 🔥 STREAK SYSTEM ------------------ */

export async function getTaskStreak(): Promise<number> {
  const tasks = await readTasks();
  const completion = await readCompletion();

  const grouped: Record<string, string[]> = {};

  tasks.forEach((task) => {
    const startDate = new Date(task.date);
    const today = new Date();

    for (
      let d = new Date(startDate);
      d <= today;
      d.setDate(d.getDate() + 1)
    ) {
      const key = d.toISOString().slice(0, 10);

      if (!grouped[key]) grouped[key] = [];

      if (task.repeated || key === task.date) {
        grouped[key].push(task.id);
      }
    }
  });

  const dates = Object.keys(grouped).sort().reverse();

  let streak = 0;

  for (const date of dates) {
    const taskIds = grouped[date];

    if (taskIds.length === 0) continue;

    const allDone = taskIds.every((id) =>
      completion.some((c) => c.taskId === id && c.date === date && c.done)
    );

    if (allDone) streak++;
    else break;
  }

  return streak;
}