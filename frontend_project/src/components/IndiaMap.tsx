import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { scaleQuantile } from 'd3-scale';
import { Tooltip } from 'react-tooltip';
import type { GeoData } from '../types';
import indiaTopo from '../services/india-topo.json'; 

// 🟢 1. STRICT GOVERNANCE MAPPING LAYER
const STATE_NAME_MAP: Record<string, string> = {
  // Map Source Name : Database/Backend Name
  "Andaman & Nicobar Island": "Andaman and Nicobar Islands",
  "Andaman & Nicobar Islands": "Andaman and Nicobar Islands",
  "Arunanchal Pradesh": "Arunachal Pradesh",
  "Dadra and Nagar Haveli": "Dadra and Nagar Haveli and Daman and Diu",
  "Daman and Diu": "Dadra and Nagar Haveli and Daman and Diu",
  "Dadra and Nagar Haveli and Daman and Diu": "Dadra and Nagar Haveli and Daman and Diu",
  "Jammu & Kashmir": "Jammu and Kashmir",
  "J&K": "Jammu and Kashmir",
  "Orissa": "Odisha",
  "Uttaranchal": "Uttarakhand",
  "Pondicherry": "Puducherry",
  "Laksheedweep": "Lakshadweep",
  "NCT of Delhi": "Delhi",
  "Telengana": "Telangana",
  "Chhattisgarh": "Chhattisgarh",
  "Chhatisgarh": "Chhattisgarh", 
  
  // Self-mapping for safety (Canonical Names)
  "Andhra Pradesh": "Andhra Pradesh", "Arunachal Pradesh": "Arunachal Pradesh", "Assam": "Assam",
  "Bihar": "Bihar", "Chandigarh": "Chandigarh", "Delhi": "Delhi", "Goa": "Goa", "Gujarat": "Gujarat",
  "Haryana": "Haryana", "Himachal Pradesh": "Himachal Pradesh", "Jammu and Kashmir": "Jammu and Kashmir",
  "Jharkhand": "Jharkhand", "Karnataka": "Karnataka", "Kerala": "Kerala", "Ladakh": "Ladakh",
  "Lakshadweep": "Lakshadweep", "Madhya Pradesh": "Madhya Pradesh", "Maharashtra": "Maharashtra",
  "Manipur": "Manipur", "Meghalaya": "Meghalaya", "Mizoram": "Mizoram", "Nagaland": "Nagaland",
  "Odisha": "Odisha", "Puducherry": "Puducherry", "Punjab": "Punjab", "Rajasthan": "Rajasthan",
  "Sikkim": "Sikkim", "Tamil Nadu": "Tamil Nadu", "Telangana": "Telangana", "Tripura": "Tripura",
  "Uttar Pradesh": "Uttar Pradesh", "Uttarakhand": "Uttarakhand", "West Bengal": "West Bengal"
};

interface IndiaMapProps {
  data: GeoData[];
  onStateClick: (stateName: string) => void;
  selectedState: string | null;
}

const IndiaMap: React.FC<IndiaMapProps> = ({ data, onStateClick, selectedState }) => {
  const [tooltipContent, setTooltipContent] = useState("");

  // 🟢 2. COLOR SCALE SAFETY (Filter out 0s so scale is accurate)
  const activeValues = data.map(d => d.value).filter(v => v > 0);
  
  const colorScale = scaleQuantile()
    .domain(activeValues.length > 0 ? activeValues : [0, 1]) // Fallback if no data
    .range([
      "#fef9c3", "#fde047", "#facc15", "#eab308", 
      "#ca8a04", "#ea580c", "#dc2626", "#991b1b", "#7f1d1d"
    ]);

  return (
    <div className="w-full h-full flex flex-col relative bg-white rounded overflow-hidden">
      <div className="flex-1 w-full h-full absolute inset-0" data-tooltip-id="my-tooltip">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 1100, center: [80.0, 22.5] }}
          className="w-full h-full"
        >
          <Geographies geography={indiaTopo}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => {
                // A. RESOLVE NAME
                const rawName = geo.properties.st_nm || geo.properties.ST_NM || geo.properties.NAME_1 || geo.properties.name;
                const backendName = STATE_NAME_MAP[rawName] || rawName;

                // B. RESOLVE VALUE (The "Normalization" Step)
                const record = data.find((s) => s.name === backendName);
                const value = record ? record.value : 0; // 🟢 Default to 0, not undefined

                const isSelected = selectedState === backendName;
                
                // C. DETERMINE COLOR
                // If Selected -> Dark Blue
                // If > 0 -> Heatmap Color
                // If 0 -> Lightest Yellow (Base)
                const fillColor = isSelected 
                  ? "#1e293b" 
                  : (value > 0 ? colorScale(value) : "#fffbeb"); // Very light yellow for 0

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fillColor}
                    stroke="#cbd5e1"
                    strokeWidth={0.5}
                    className="outline-none hover:opacity-80 transition-all cursor-pointer"
                    onClick={() => onStateClick(backendName)}
                    onMouseEnter={() => {
                      // 🟢 D. TOOLTIP GOVERNANCE FORMAT
                      setTooltipContent(`${backendName}: ${value.toLocaleString()} records`);
                    }}
                    onMouseLeave={() => setTooltipContent("")}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>
      
      {/* 🟢 E. FLOATING TOOLTIP */}
      <Tooltip 
        id="my-tooltip" 
        content={tooltipContent} 
        float={true} 
        className="z-50 !bg-slate-900 !text-white !px-3 !py-2 !rounded text-xs font-medium shadow-xl" 
      />
    </div>
  );
};

export default IndiaMap;