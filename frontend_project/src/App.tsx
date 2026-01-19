import React, { useEffect, useState } from 'react';
import { Users, RefreshCw, Activity, Map as MapIcon, RotateCcw, BarChart3, TrendingUp, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, Legend } from 'recharts';

import KPICard from './components/KPICard';
import IndiaMap from './components/IndiaMap';
import DistrictTable from './components/DistrictTable';
import { fetchKPIs, fetchTrends, fetchGeoData } from './services/api';
import type { KPIData, ChartData, GeoData, AgeBandData } from './types';

function App() {
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [trendData, setTrendData] = useState<ChartData[]>([]);
  const [ageData, setAgeData] = useState<AgeBandData[]>([]);
  
  // Data State
  const [mapData, setMapData] = useState<GeoData[]>([]); 
  const [tableData, setTableData] = useState<GeoData[]>([]);
  
  // Selection State
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initial Load (National View)
  useEffect(() => {
    loadNationalData();
  }, []);

  const loadNationalData = async () => {
    setLoading(true);
    try {
      const nationalGeo = await fetchGeoData(undefined);
      setMapData(nationalGeo);
      setTableData(nationalGeo); // Table shows States

      const [k, t] = await Promise.all([ fetchKPIs(undefined), fetchTrends(undefined) ]);
      setKpi(k);
      setTrendData(t.trends);
      setAgeData(t.ageData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 1. STATE CLICK HANDLER
  const handleStateClick = async (stateName: string) => {
    if (selectedState === stateName) {
      // Reset to National
      setSelectedState(null);
      setSelectedDistrict(null);
      loadNationalData();
      return;
    }

    setSelectedState(stateName);
    setSelectedDistrict(null); // Reset district when changing state
    setLoading(true);

    try {
      // Fetch State Level Data
      const [k, t, distData] = await Promise.all([
        fetchKPIs(stateName),
        fetchTrends(stateName),
        fetchGeoData(stateName)
      ]);

      setKpi(k);
      setTrendData(t.trends);
      setAgeData(t.ageData);
      setTableData(distData); // Update Table to show Districts
      // Note: Map stays as National view (mapData not updated) to keep context
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 2. DISTRICT CLICK HANDLER
  const handleDistrictClick = async (districtName: string) => {
    if (!selectedState) return;
    
    // Toggle off if clicking same district
    if (selectedDistrict === districtName) {
        setSelectedDistrict(null);
        handleStateClick(selectedState); // Go back to State view
        return;
    }

    setSelectedDistrict(districtName);
    setLoading(true);

    try {
        console.log(`Fetching data for District: ${districtName}`);
        
        // Fetch specific District Data
        const [k, t] = await Promise.all([
            fetchKPIs(selectedState, districtName),
            fetchTrends(selectedState, districtName)
        ]);

        setKpi(k);
        setTrendData(t.trends);
        setAgeData(t.ageData);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 h-14 flex items-center px-6 justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-700 p-1.5 rounded text-white"><MapIcon size={20} /></div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-none">UIDAI Operational Intelligence</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">
              {selectedState 
                ? (selectedDistrict ? `${selectedState} > ${selectedDistrict}` : `Regional View: ${selectedState}`) 
                : "National Overview"}
            </p>
          </div>
        </div>
        {selectedState && (
          <button onClick={() => { setSelectedState(null); setSelectedDistrict(null); loadNationalData(); }} 
            className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded border border-slate-300 flex items-center gap-2 transition-colors">
            <RotateCcw size={14} /> Reset View
          </button>
        )}
      </header>

      <main className="max-w-[1920px] mx-auto p-4 space-y-4">
        {/* Row 1: KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Total Enrolments" value={kpi?.total_enrolments?.toLocaleString() || "0"} icon={Users} color="bg-blue-600" />
          <KPICard title="Total Updates" value={kpi?.total_updates?.toLocaleString() || "0"} icon={RefreshCw} color="bg-indigo-600" />
          <KPICard title="Ops Ratio" value={kpi?.operational_ratio?.toFixed(2) || "0.00"} icon={TrendingUp} color="bg-emerald-600" />
          <KPICard title="Data Quality" value={`${kpi?.data_quality_index || 0}%`} icon={Activity} color="bg-amber-600" />
        </div>

        {/* Row 2: Map & Main Trend */}
        <div className="flex flex-col lg:flex-row gap-4 h-[550px]">
          {/* Map Section */}
          <div className="w-full lg:w-[40%] bg-white rounded border border-slate-200 flex flex-col relative">
            <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <span className="font-bold text-slate-700 text-sm">Geographic Intensity</span>
              {!selectedState && <span className="text-[10px] text-blue-600 flex items-center gap-1 animate-pulse"><AlertCircle size={12}/> Click map to drill-down</span>}
            </div>
            <div className="flex-1 w-full relative p-2 overflow-hidden">
              <IndiaMap data={mapData} onStateClick={handleStateClick} selectedState={selectedState} />
            </div>
          </div>

          {/* Trend Chart */}
          <div className="w-full lg:w-[60%] bg-white rounded border border-slate-200 p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2"><BarChart3 size={16} className="text-blue-500"/> Enrolment Trends</h3>
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">Live Data</span>
            </div>
            <div className="flex-1 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorEnrol" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                    <XAxis dataKey="date" tick={{fontSize:10}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize:10}} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{fontSize:'12px'}} />
                    <Area type="monotone" dataKey="enrolments" stroke="#3b82f6" strokeWidth={2} fill="url(#colorEnrol)" />
                  </AreaChart>
                </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Row 3: Table & Secondary Stats */}
        <div className="flex flex-col lg:flex-row gap-4 h-[320px]">
          {/* Table Section */}
          <div className="w-full lg:w-[40%] bg-white rounded border border-slate-200 flex flex-col">
            <div className="p-3 border-b border-slate-100 bg-slate-50 font-bold text-xs text-slate-700 uppercase">
              {selectedState ? `DISTRICTS OF ${selectedState}` : "TOP PERFORMING STATES"}
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <DistrictTable 
                  data={tableData} 
                  onRowClick={handleDistrictClick} 
              />
            </div>
          </div>

          {/* Secondary Charts */}
          <div className="w-full lg:w-[60%] grid grid-cols-2 gap-4">
             {/* Age Distribution */}
             <div className="bg-white rounded border border-slate-200 p-4">
                <h3 className="font-bold text-slate-700 text-sm mb-2">Age Distribution</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9"/>
                    <XAxis type="number" hide />
                    <YAxis dataKey="range" type="category" width={40} tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                    <Tooltip cursor={{fill:'transparent'}} />
                    <Bar dataKey="count" fill="#6366f1" radius={[0,4,4,0]} barSize={15} />
                  </BarChart>
                </ResponsiveContainer>
             </div>

             {/* Update Mix */}
             <div className="bg-white rounded border border-slate-200 p-4">
                <h3 className="font-bold text-slate-700 text-sm mb-2">Update Type Mix</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <XAxis dataKey="date" hide/>
                    <YAxis tick={{fontSize:10}} axisLine={false}/>
                    <Tooltip/>
                    <Line type="monotone" dataKey="biometric_updates" stroke="#10b981" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="demographic_updates" stroke="#f43f5e" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;