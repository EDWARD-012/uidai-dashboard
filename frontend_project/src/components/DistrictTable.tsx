import React from 'react';
import type { GeoData } from '../types';

interface DistrictTableProps {
  data: GeoData[];
  onRowClick?: (name: string) => void;
}

const DistrictTable: React.FC<DistrictTableProps> = ({ data, onRowClick }) => {
  return (
    <table className="w-full text-left border-collapse">
      <thead className="bg-slate-50 sticky top-0 z-10">
        <tr>
          <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Region Name</th>
          <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Volume</th>
          <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {data.length > 0 ? (
          data.map((item, index) => (
            <tr 
              key={index} 
              onClick={() => onRowClick && onRowClick(item.name)}
              className="hover:bg-blue-50 cursor-pointer transition-colors group"
            >
              <td className="px-4 py-2.5 text-xs font-medium text-slate-700 group-hover:text-blue-700">
                {item.name}
              </td>
              <td className="px-4 py-2.5 text-xs text-slate-600 text-right font-mono">
                {item.value.toLocaleString()}
              </td>
              <td className="px-4 py-2.5 text-right">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700 border border-green-200">
                  Active
                </span>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={3} className="px-4 py-8 text-center text-xs text-slate-400 italic">
              No data available
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default DistrictTable;