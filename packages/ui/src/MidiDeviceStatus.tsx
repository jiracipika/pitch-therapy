"use client";

import React from "react";

// ─── MIDI Device Status Indicator ────────────────────────────────────────────

export interface MidiDeviceStatusProps {
  isConnected: boolean;
  deviceName?: string;
  className?: string;
}

export const MidiDeviceStatus: React.FC<MidiDeviceStatusProps> = ({
  isConnected,
  deviceName,
  className = "",
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`w-2.5 h-2.5 rounded-full ${
          isConnected
            ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]"
            : "bg-slate-300"
        }`}
      />
      <span className="text-xs text-slate-500">
        {isConnected
          ? deviceName
            ? `MIDI: ${deviceName}`
            : "MIDI Connected"
          : "No MIDI Device"}
      </span>
    </div>
  );
};

export default MidiDeviceStatus;
