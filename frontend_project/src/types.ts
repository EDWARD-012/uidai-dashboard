export interface KPIData {
  total_enrolments: number;
  total_updates: number;
  operational_ratio: number;
  data_quality_index: number;
}

export interface ChartData {
  date: string;
  enrolments: number;
  updates: number;
  biometric_updates: number;
  demographic_updates: number;
}

export interface AgeBandData {
  range: string;
  count: number;
}

export interface GeoData {
  name: string;
  value: number;
  id?: string;
}