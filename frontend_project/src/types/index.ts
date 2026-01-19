export interface KPICardData {
  id: string;
  title: string;
  value: number | string;
  unit?: string;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
}
