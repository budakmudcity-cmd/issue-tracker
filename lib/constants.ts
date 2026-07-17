export const ISSUE_STATUSES = ["Open", "In Progress", "Pending", "Testing", "Closed"] as const;
export const ISSUE_PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;
export const ISSUE_TYPES = ["Bug", "Enhancement", "Feature Request", "Task"] as const;

export const STATUS_COLORS: Record<string, string> = {
  Open: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "In Progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Pending: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  Testing: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Closed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  Medium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  High: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  Critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};
