import axios from 'axios';
import type { KPIData, ChartData, GeoData, AgeBandData } from '../types';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

// Helper to build URL parameters safely
const getParams = (state?: string | null, district?: string | null) => {
  const params: any = {};
  if (state) params.state = state;
  if (district) params.district = district;
  return params;
};

export const fetchKPIs = async (state?: string | null, district?: string | null): Promise<KPIData | null> => {
  try {
    const res = await axios.get(`${API_BASE}/stats/kpi/`, { params: getParams(state, district) });
    return res.data;
  } catch (e) {
    console.error("KPI API Error", e);
    return null;
  }
};

export const fetchGeoData = async (state?: string | null): Promise<GeoData[]> => {
  try {
    // Note: Geo data usually just needs State context to show children districts
    const res = await axios.get(`${API_BASE}/stats/geo/`, { params: getParams(state) });
    return res.data || [];
  } catch (e) {
    console.error("Geo API Error", e);
    return [];
  }
};

export const fetchTrends = async (state?: string | null, district?: string | null): Promise<{ trends: ChartData[], ageData: AgeBandData[] }> => {
  try {
    const res = await axios.get(`${API_BASE}/stats/trends/`, { params: getParams(state, district) });
    return {
      trends: res.data.trends || [],
      ageData: res.data.ageData || []
    };
  } catch (e) {
    console.error("Trends API Error", e);
    return { trends: [], ageData: [] };
  }
};