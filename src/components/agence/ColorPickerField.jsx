import React, { useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

export default function ColorPickerField({ label, value, onChange, disabled }) {
  const colorInputRef = useRef(null);

  const handleHexChange = (e) => {
    let newVal = e.target.value;
    if (newVal.startsWith('#') && newVal.length <= 7) {
      onChange(newVal);
    } else if (!newVal.startsWith('#') && newVal.length <= 6) {
      onChange('#' + newVal);
    }
  };

  return (
    <div className={`flex items-center justify-between py-3 group ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
      <div className="flex items-center gap-3 flex-1">
        {/* Color Square Trigger */}
        <div 
          className={`relative w-10 h-10 rounded-lg shadow-sm border border-gray-200 overflow-hidden shrink-0 ${disabled ? '' : 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-gray-300 transition-all'}`}
          onClick={() => !disabled && colorInputRef.current?.click()}
          style={{ backgroundColor: value || '#000000' }}
        >
          {disabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <Lock className="w-3 h-3 text-white drop-shadow-md" />
            </div>
          )}
          <input
            ref={colorInputRef}
            type="color"
            value={value || '#000000'}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </div>
        
        {/* Label */}
        <Label className={`text-sm font-medium ${disabled ? 'text-gray-500' : 'text-gray-700'}`}>
          {label}
        </Label>
      </div>

      {/* Hex Input */}
      <div className="w-24 shrink-0">
        <Input 
          value={value || ""} 
          onChange={handleHexChange}
          disabled={disabled}
          className="font-mono text-xs uppercase h-9 text-center bg-gray-50/50 focus:bg-white transition-colors"
          maxLength={7}
          placeholder="#000000"
        />
      </div>
    </div>
  );
}