import React, { useState } from "react";
import { Issue } from "../types";
import { MapPin, Landmark, HelpCircle, ShieldAlert, CheckCircle2, Sparkles } from "lucide-react";
import { useI18n } from "../context/I18nContext";

interface MapContainerProps {
  issues: Issue[];
  selectedIssueId: string | null;
  onSelectIssue: (id: string) => void;
  reportMode: boolean;
  onSelectCoordinates: (lat: number, lng: number, address: string) => void;
  tempCoordinates: { latitude: number; longitude: number } | null;
  searchQuery?: string;
}

export default function MapContainer({
  issues,
  selectedIssueId,
  onSelectIssue,
  reportMode,
  onSelectCoordinates,
  tempCoordinates,
  searchQuery = "",
}: MapContainerProps) {
  const { t } = useI18n();
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Map dimensions for our visual coordinate system
  // We represent the map as a bounding box centered in San Francisco sector:
  // Lat: 37.7700 to 37.7910
  // Lng: -122.4250 to -122.4000
  const latMin = 37.7700;
  const latMax = 37.7910;
  const lngMin = -122.4250;
  const lngMax = -122.4000;

  // Convert GPS Coordinates to SVG percentages
  const getXY = (lat: number, lng: number) => {
    const x = ((lng - lngMin) / (lngMax - lngMin)) * 100;
    const y = (1 - (lat - latMin) / (latMax - latMin)) * 100; // Invert Y for SVG coords
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  const [hoveredLandmark, setHoveredLandmark] = useState<string | null>(null);

  // Landmark list on our virtual map
  const landmarks = [
    { name: "Oakwood Elementary School", lat: 37.7780, lng: -122.4160, type: "school" },
    { name: "Greenway Nature Reserve", lat: 37.7890, lng: -122.4100, type: "park" },
    { name: "Elm Street Transit Hub", lat: 37.7720, lng: -122.4220, type: "transit" },
    { name: "Cedar Shopping Center", lat: 37.7830, lng: -122.4050, type: "shop" },
  ];

  // Handle map click to set report location
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!reportMode) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    // Convert SVG percentages back to Lat/Lng
    const lng = lngMin + (clickX / 100) * (lngMax - lngMin);
    const lat = latMin + (1 - clickY / 100) * (latMax - latMin);

    // Approximate address based on nearest landmark or sector
    let nearestLandmark = landmarks[0];
    let minDist = Infinity;
    landmarks.forEach(lm => {
      const dist = Math.pow(lm.lat - lat, 2) + Math.pow(lm.lng - lng, 2);
      if (dist < minDist) {
        minDist = dist;
        nearestLandmark = lm;
      }
    });

    const streetNames = ["Oakwood Dr", "Cedar Blvd", "Cloverdale Ave", "Pine St", "Elm St", "Greenway Trail"];
    const randomStreet = streetNames[Math.floor((clickX + clickY) % streetNames.length)];
    const mockHouseNum = Math.floor(100 + (clickX * 5 + clickY * 3) % 800);
    const mockAddress = `${mockHouseNum} ${randomStreet} (Near ${nearestLandmark.name})`;

    onSelectCoordinates(lat, lng, mockAddress);
  };

  // Helper to color-code category pins
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Road Safety & Potholes": return "#ef4444"; // Red
      case "Waste & Sanitation": return "#b45309"; // Amber
      case "Water & Utilities": return "#3b82f6"; // Blue
      case "Public Lights & Electrical": return "#eab308"; // Yellow
      default: return "#8b5cf6"; // Purple
    }
  };

  return (
    <div className="relative w-full h-[500px] md:h-[600px] bg-[#070b19] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl" id="interactive-map-panel">
      {/* Map Header */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-800 shadow-xl">
        <h4 className="text-sm font-semibold text-slate-100 font-display">Oakridge Meadows Grid</h4>
        <p className="text-[10px] text-slate-400 font-mono">GPS bounds: 37.770°N, 122.425°W</p>
      </div>

      {/* Heatmap Layer Toggle */}
      <button
        onClick={() => setShowHeatmap(!showHeatmap)}
        className={`absolute top-4 right-4 z-10 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 shadow-xl ${
          showHeatmap 
            ? "bg-red-500/20 text-red-400 border-red-500/40 font-bold" 
            : "bg-slate-900/90 text-slate-300 border-slate-800 hover:text-white"
        }`}
        style={reportMode ? { marginRight: "340px" } : {}}
        title="Visualizes areas with the highest density of unresolved community issues to help prioritize city planning"
      >
        <span className="relative flex h-2.5 w-2.5">
          {showHeatmap && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${showHeatmap ? "bg-red-500" : "bg-slate-500"}`}></span>
        </span>
        <span>{t("toggleHeatmap")}</span>
      </button>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md p-3.5 rounded-xl border border-slate-800 shadow-xl hidden sm:block">
        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Legend</h5>
        <div className="space-y-1.5 text-xs text-slate-300 font-sans">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full block bg-red-400"></span>
            <span>Roads & Potholes</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full block bg-orange-400"></span>
            <span>Waste & Sanitation</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full block bg-sky-400"></span>
            <span>Water & Utilities</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full block bg-yellow-400"></span>
            <span>Lights & Power</span>
          </div>
        </div>
      </div>

      {/* Active instructions banner */}
      {reportMode && (
        <div className="absolute top-4 right-4 z-10 bg-[#0D47A1] border border-blue-600/50 backdrop-blur-md px-4 py-2 rounded-xl text-xs text-white shadow-lg font-medium flex items-center gap-2 animate-pulse">
          <MapPin className="w-4 h-4 text-amber-300" />
          <span>Click anywhere on the grid map to set the problem location</span>
        </div>
      )}

      {/* Map Landscaping Container */}
      <svg
        className={`w-full h-full select-none ${reportMode ? "cursor-crosshair" : "cursor-default"}`}
        onClick={handleMapClick}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        id="neighborhood-svg-canvas"
      >
        {/* Background Grid */}
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1e293b" strokeWidth="0.25" />
          </pattern>
          <radialGradient id="heatGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
            <stop offset="45%" stopColor="#f97316" stopOpacity="0.45" />
            <stop offset="85%" stopColor="#eab308" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill="#090d1a" />
        <rect width="100" height="100" fill="url(#grid)" />

        {/* River Waterways */}
        <path
          d="M -10,15 C 30,25 40,5 65,30 C 80,45 75,70 110,85"
          fill="none"
          stroke="#0f365c"
          strokeWidth="3.5"
          opacity="0.6"
        />
        <path
          d="M -10,15 C 30,25 40,5 65,30 C 80,45 75,70 110,85"
          fill="none"
          stroke="#00f2fe"
          strokeWidth="1.2"
          strokeOpacity="0.3"
          strokeDasharray="1 0.5"
        />

        {/* Major Roads Grid */}
        {/* Cedar Boulevard */}
        <line x1="0" y1="35" x2="100" y2="45" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="0" y1="35" x2="100" y2="45" stroke="#3b82f6" strokeWidth="0.4" strokeOpacity="0.4" strokeDasharray="3 1" />

        {/* Cloverdale Avenue */}
        <line x1="45" y1="0" x2="40" y2="100" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
        <line x1="45" y1="0" x2="40" y2="100" stroke="#06b6d4" strokeWidth="0.3" strokeOpacity="0.4" strokeDasharray="2 1" />

        {/* Oakwood Drive */}
        <line x1="0" y1="70" x2="100" y2="60" stroke="#1e293b" strokeWidth="1.8" />

        {/* Elm Street */}
        <line x1="15" y1="0" x2="25" y2="100" stroke="#1e293b" strokeWidth="1.5" />

        {/* Nature Park Boundaries */}
        <rect x="58" y="10" width="30" height="28" rx="3" fill="#064e3b" fillOpacity="0.25" stroke="#059669" strokeWidth="0.3" strokeDasharray="1 0.5" />
        
        {/* School Compound */}
        <rect x="22" y="65" width="20" height="15" rx="2" fill="#1e3a8a" fillOpacity="0.25" stroke="#3b82f6" strokeWidth="0.2" />

        {/* Render Landmark Pins */}
        {landmarks.map((lm, idx) => {
          const { x, y } = getXY(lm.lat, lm.lng);
          return (
            <g
              key={idx}
              className="cursor-help"
              onMouseEnter={() => setHoveredLandmark(lm.name)}
              onMouseLeave={() => setHoveredLandmark(null)}
            >
              <circle cx={x} cy={y} r="2.2" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="0.5" />
              <circle cx={x} cy={y} r="1.1" fill="#00796B" />
              <text x={x} y={y - 3} textAnchor="middle" fill="#64748B" fontSize="2" fontWeight="bold" fontFamily="monospace">
                [L]
              </text>
            </g>
          );
        })}

        {/* Heatmap density overlays for unresolved issues */}
        {showHeatmap && issues.filter(i => i.status !== "resolved").map(issue => {
          const { x, y } = getXY(issue.latitude, issue.longitude);
          const baseRadius = issue.urgency === "critical" ? 11 : issue.urgency === "high" ? 8 : 5;
          const radius = baseRadius + Math.min(8, (issue.upvotesCount || 0) * 0.45);
          return (
            <circle
              key={`heat-${issue.id}`}
              cx={x}
              cy={y}
              r={radius}
              fill="url(#heatGradient)"
              opacity="0.65"
              style={{ mixBlendMode: "screen" }}
            />
          );
        })}
      </svg>

      {/* Hovered Landmark Label */}
      {hoveredLandmark && (
        <div className="absolute top-18 left-4 bg-[#0D47A1] border border-blue-400/30 px-3 py-1.5 rounded-lg text-[11px] text-white font-mono shadow-md">
          📌 {hoveredLandmark}
        </div>
      )}

      {/* Render Issues Pins */}
      {issues.map(issue => {
        const { x, y } = getXY(issue.latitude, issue.longitude);
        const isSelected = selectedIssueId === issue.id;
        const color = getCategoryColor(issue.category);

        const isSearchActive = searchQuery && searchQuery.trim().length > 0;
        const isMatched = isSearchActive && (
          issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          issue.category.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return (
          <div
            key={issue.id}
            style={{ left: `${x}%`, top: `${y}%` }}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-20 group transition-all duration-300 ${
              isSearchActive 
                ? isMatched 
                  ? "opacity-100 scale-110 z-30" 
                  : "opacity-30 scale-90 saturate-50 pointer-events-none" 
                : "opacity-100"
            }`}
          >
            {/* Pulsing Highlight ring for search-matched items */}
            {isMatched && (
              <span className="absolute -inset-2.5 bg-teal-500/20 rounded-full animate-pulse border border-teal-400/40 shadow-[0_0_15px_rgba(20,184,166,0.6)]"></span>
            )}

            {/* Ping indicator for un-resolved issues */}
            {issue.status !== "resolved" && (
              <span
                style={{ backgroundColor: color }}
                className={`absolute inline-flex rounded-full opacity-75 animate-ping -left-1 -top-1 ${
                  isMatched ? "h-8 w-8 -left-2 -top-2" : "h-6 w-6"
                }`}
              ></span>
            )}

            <button
              id={`map-pin-btn-${issue.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectIssue(issue.id);
              }}
              style={{
                backgroundColor: isSelected ? "#00f2fe" : isMatched ? "#14b8a6" : "#0f172a",
                borderColor: isSelected ? "#00f2fe" : isMatched ? "#ffffff" : color,
                color: isSelected ? "#020617" : isMatched ? "#ffffff" : color,
              }}
              className={`relative p-1.5 rounded-full border-2 shadow-lg transition-all duration-200 hover:scale-125 hover:z-30 flex items-center justify-center ${
                isMatched ? "ring-2 ring-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.8)] scale-110" : ""
              }`}
            >
              {issue.status === "resolved" ? (
                <CheckCircle2 className={`w-3.5 h-3.5 ${isMatched ? "text-slate-950" : "text-emerald-500"}`} />
              ) : issue.urgency === "high" || issue.urgency === "critical" ? (
                <ShieldAlert className="w-3.5 h-3.5" style={{ color: isSelected ? "#ffffff" : isMatched ? "#ffffff" : color }} />
              ) : (
                <MapPin className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Quick tooltips on hover */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-[#0D47A1] border border-blue-900 text-white text-[11px] px-2.5 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 shadow-xl font-sans">
              <p className="font-bold">{issue.title}</p>
              <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-blue-200 font-mono">
                <span className="capitalize">{issue.category}</span>
                <span>•</span>
                <span className={`uppercase font-bold ${issue.status === "resolved" ? "text-emerald-300" : "text-amber-300"}`}>
                  {issue.status}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Temporary report pinpoint */}
      {reportMode && tempCoordinates && (
        <div
          style={{
            left: `${getXY(tempCoordinates.latitude, tempCoordinates.longitude).x}%`,
            top: `${getXY(tempCoordinates.latitude, tempCoordinates.longitude).y}%`,
          }}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30"
        >
          <span className="absolute inline-flex h-10 w-10 rounded-full bg-[#00796B] opacity-60 animate-ping -left-3 -top-3"></span>
          <div className="bg-[#00796B] text-white p-2 rounded-full shadow-2xl border-2 border-white flex items-center justify-center animate-bounce">
            <MapPin className="w-5 h-5 text-teal-100" />
          </div>
        </div>
      )}
    </div>
  );
}
