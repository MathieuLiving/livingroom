import React from "react";

const StatCard = ({ icon: Icon, label, total }) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg shadow-md hover:shadow-lg p-6 bg-white border border-slate-100 transition-shadow duration-200 text-center">
      {Icon && (
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-600 mb-4">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <span className="text-sm font-medium text-slate-500 mb-1">{label}</span>
      <span className="text-2xl font-bold text-slate-900">{total}</span>
    </div>
  );
};

export default StatCard;