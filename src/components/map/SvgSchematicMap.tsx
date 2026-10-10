import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useMetroStore } from '../../store/metroStore';
import { Station, Train, CrowdLevel } from '../../types/metro';
import { getStationName } from '../../data/stations';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  Activity,
  AlertTriangle,
  AlertOctagon,
  Layers,
  ArrowRight,
  Info,
  Maximize2,
} from 'lucide-react';
import { formatPassengers } from '../../utils/formatters';

interface SvgSchematicMapProps {
  heightClass?: string;
  interactive?: boolean;
  lineFilter?: 'ALL' | 'L1' | 'L2';
  onLineFilterChange?: (filter: 'ALL' | 'L1' | 'L2') => void;
  onStationSelect?: (stationId: string) => void;
}

export const SvgSchematicMap: React.FC<SvgSchematicMapProps> = ({
  heightClass = 'h-[500px]',
  interactive = true,
  lineFilter: externalLineFilter,
  onLineFilterChange,
  onStationSelect,
}) => {
  const stations = useMetroStore((state) => state.stations);
  const lines = useMetroStore((state) => state.lines);
  const trains = useMetroStore((state) => state.trains);
  const incidents = useMetroStore((state) => state.incidents);
  const selectedStationId = useMetroStore((state) => state.selectedStationId);
  const selectStation = useMetroStore((state) => state.selectStation);
  const theme = useMetroStore((state) => state.theme);

  // Line Filter State: 'ALL' | 'L1' | 'L2'
  const [internalLineFilter, setInternalLineFilter] = useState<'ALL' | 'L1' | 'L2'>('ALL');
  const selectedLineFilter = externalLineFilter || internalLineFilter;

  const handleFilterSelect = (filter: 'ALL' | 'L1' | 'L2') => {
    if (onLineFilterChange) {
      onLineFilterChange(filter);
    } else {
      setInternalLineFilter(filter);
    }
  };

  // Zoom & Pan State
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Hover States
  const [hoveredStationId, setHoveredStationId] = useState<string | null>(null);
  const [hoveredTrainId, setHoveredTrainId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Dynamic ViewBox State
  const [viewBox, setViewBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 60,
    y: 20,
    width: 880,
    height: 580,
  });

  // Requirement 2: Compute viewBox from stations' bounding box plus 60px padding
  // applied on load, on resize, and when the filter changes.
  const updateAutoFitViewBox = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth === 0 || clientHeight === 0) return;

    // Filter stations based on selected line filter
    const activeStations = stations.filter((st) => {
      if (selectedLineFilter === 'ALL') return true;
      return st.lines.includes(selectedLineFilter);
    });

    const targetList = activeStations.length > 0 ? activeStations : stations;

    // Bounding box from target stations
    const minX = Math.min(...targetList.map((s) => s.x));
    const maxX = Math.max(...targetList.map((s) => s.x));
    const minY = Math.min(...targetList.map((s) => s.y));
    const maxY = Math.max(...targetList.map((s) => s.y));

    // 60px padding around bounding box
    const PADDING = 60;
    const bboxW = (maxX - minX) + 2 * PADDING;
    const bboxH = (maxY - minY) + 2 * PADDING;
    const bboxCenterX = (minX + maxX) / 2;
    const bboxCenterY = (minY + maxY) / 2;

    const containerAspect = clientWidth / clientHeight;
    const contentAspect = bboxW / bboxH;

    let vbW = bboxW;
    let vbH = bboxH;

    if (containerAspect > contentAspect) {
      vbW = bboxH * containerAspect;
      vbH = bboxH;
    } else {
      vbW = bboxW;
      vbH = bboxW / containerAspect;
    }

    const vbX = bboxCenterX - vbW / 2;
    const vbY = bboxCenterY - vbH / 2;

    setViewBox({
      x: Math.round(vbX),
      y: Math.round(vbY),
      width: Math.round(vbW),
      height: Math.round(vbH),
    });
  }, [stations, selectedLineFilter]);

  // Listen to load, resize, and filter change
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    updateAutoFitViewBox();

    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      updateAutoFitViewBox();
    });
    ro.observe(container);

    window.addEventListener('resize', updateAutoFitViewBox);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateAutoFitViewBox);
    };
  }, [selectedLineFilter, updateAutoFitViewBox]);

  // Station Lookups
  const stationMap = useMemo(() => new Map(stations.map((s) => [s.id, s])), [stations]);

  // Active Critical Incidents per station
  const criticalIncidentStations = useMemo(() => {
    const set = new Set<string>();
    incidents.forEach((inc) => {
      if (inc.status !== 'resolved' && inc.severity === 'critical') {
        inc.affectedStationIds.forEach((id) => set.add(id));
      }
    });
    return set;
  }, [incidents]);

  // Color Mapping for Crowd Levels
  const getCrowdColor = (level: CrowdLevel): string => {
    switch (level) {
      case 'low':
        return '#22C55E'; // Green
      case 'moderate':
        return '#EAB308'; // Yellow
      case 'busy':
        return '#F59E0B'; // Amber
      case 'crowded':
        return '#F97316'; // Red-Orange
      case 'critical':
        return '#EF4444'; // Red
      default:
        return '#22C55E';
    }
  };

  // Zoom handlers
  const handleZoomIn = () => setZoom((z) => Math.min(2.4, Number((z + 0.2).toFixed(1))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.7, Number((z - 0.2).toFixed(1))));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    updateAutoFitViewBox();
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleStationClick = (stId: string) => {
    if (onStationSelect) {
      onStationSelect(stId);
    } else {
      selectStation(stId);
    }
  };

  // Schematic Tracks:
  // Line 1 (Teal): Mahatma Mandir (140,90) -> Sector 16 (280,90) -> Infocity (390,200) -> Old High Court (500,310) -> Sabarmati (390,420) -> Kalupur (280,530) -> Gyaspur (140,530)
  const line1Path = 'M 140,90 L 280,90 L 500,310 L 280,530 L 140,530';

  // Line 2 (Ruby): GIFT City (860,90) -> Akshardham (610,200) -> Old High Court (500,310) -> Sachivalaya (610,420) -> Motera Stadium (720,530) -> Sector 1 (860,530)
  const line2Path = 'M 860,90 L 720,90 L 500,310 L 720,530 L 860,530';

  const isL1Dimmed = selectedLineFilter === 'L2';
  const isL2Dimmed = selectedLineFilter === 'L1';

  return (
    <div className="flex flex-col w-full gap-2.5">
      {/* Requirement 2: Toolbar OUTSIDE the map canvas so it never covers stations */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-white dark:bg-[#0C182A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Line Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
          <button
            onClick={() => handleFilterSelect('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              selectedLineFilter === 'ALL'
                ? 'bg-teal-500 text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Lines (12)
          </button>
          <button
            onClick={() => handleFilterSelect('L1')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              selectedLineFilter === 'L1'
                ? 'bg-teal-500 text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-teal-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#14B8A6]" />
            <span>Line 1 (Teal)</span>
          </button>
          <button
            onClick={() => handleFilterSelect('L2')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              selectedLineFilter === 'L2'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-rose-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#E11D48]" />
            <span>Line 2 (Ruby)</span>
          </button>
        </div>

        {/* Map View Zoom, Auto-Fit & Pan Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors"
            title="Zoom In"
            aria-label="Zoom in on schematic map"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors"
            title="Zoom Out"
            aria-label="Zoom out on schematic map"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors"
            title="Reset Map Fit & ViewBox"
            aria-label="Reset map view"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Fit (100%)</span>
          </button>
        </div>
      </div>

      {/* Map Canvas Container */}
      <div
        ref={containerRef}
        className={`relative w-full ${heightClass} rounded-2xl overflow-hidden select-none border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#07111E] transition-colors`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        role="region"
        aria-label="Interactive Gujarat Metro SVG Schematic Transit Network Map"
      >
        {/* SVG Schematic Canvas */}
        <svg
          className="w-full h-full block"
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
          preserveAspectRatio="xMidYMid meet"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          <defs>
            {/* Subtle Grid Pattern for Technical OCC Canvas Feel */}
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke={theme === 'dark' ? '#1E293B' : '#E2E8F0'}
                strokeWidth="0.5"
                strokeOpacity="0.4"
              />
            </pattern>

            {/* Sabarmati River Diagonal Flow */}
            <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0EA5E9" stopOpacity={theme === 'dark' ? '0.12' : '0.18'} />
              <stop offset="50%" stopColor="#38BDF8" stopOpacity={theme === 'dark' ? '0.18' : '0.24'} />
              <stop offset="100%" stopColor="#0284C7" stopOpacity={theme === 'dark' ? '0.12' : '0.18'} />
            </linearGradient>

            {/* Glowing filter for high-density & critical stations */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* OCC Grid Background */}
          <rect
            x={viewBox.x - 200}
            y={viewBox.y - 200}
            width={viewBox.width + 400}
            height={viewBox.height + 400}
            fill="url(#grid-pattern)"
          />

          {/* Sabarmati River Natural Geographic Corridor Ribbon */}
          <path
            d="M 460,0 C 470,160 480,240 470,360 C 460,460 450,540 440,620 L 520,620 C 530,540 540,460 530,360 C 520,240 510,160 500,0 Z"
            fill="url(#riverGrad)"
          />
          <text
            x="485"
            y="70"
            fill={theme === 'dark' ? '#38BDF8' : '#0284C7'}
            fillOpacity="0.5"
            fontSize="10"
            fontWeight="600"
            letterSpacing="3"
            transform="rotate(82 485 70)"
          >
            SABARMATI RIVER
          </text>

          {/* Main Transformed World Group */}
          <g>
            {/* 1. Track Underglow & Shadows */}
            <g className="track-glow">
              <path
                d={line1Path}
                fill="none"
                stroke="#14B8A6"
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={isL1Dimmed ? 0.08 : 0.22}
              />
              <path
                d={line2Path}
                fill="none"
                stroke="#E11D48"
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={isL2Dimmed ? 0.08 : 0.22}
              />
            </g>

            {/* 2. Track Lines */}
            <g className="track-lines">
              {/* Line 1 - Teal Line */}
              <path
                d={line1Path}
                fill="none"
                stroke="#14B8A6"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={isL1Dimmed ? 0.25 : 1}
              />

              {/* Line 2 - Ruby Line */}
              <path
                d={line2Path}
                fill="none"
                stroke="#E11D48"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={isL2Dimmed ? 0.25 : 1}
              />
            </g>

            {/* 3. Trains Layer */}
            <g className="trains-layer">
              {trains.map((tr) => {
                const isFiltered =
                  (selectedLineFilter === 'L1' && tr.lineId !== 'L1') ||
                  (selectedLineFilter === 'L2' && tr.lineId !== 'L2');
                const isDelayed = tr.status === 'delayed';
                const trainColor = tr.lineId === 'L1' ? '#14B8A6' : '#E11D48';

                return (
                  <g
                    key={tr.id}
                    className="cursor-pointer transition-opacity duration-300"
                    opacity={isFiltered ? 0.2 : 1}
                    onMouseEnter={() => setHoveredTrainId(tr.id)}
                    onMouseLeave={() => setHoveredTrainId(null)}
                  >
                    {/* Delayed Pulsing Beacon */}
                    {isDelayed && (
                      <circle
                        cx={tr.x}
                        cy={tr.y}
                        r="18"
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth="2"
                        className="animate-ping"
                        opacity="0.75"
                      />
                    )}

                    {/* Train Carriage Icon */}
                    <rect
                      x={tr.x - 11}
                      y={tr.y - 7}
                      width="22"
                      height="14"
                      rx="4"
                      fill={theme === 'dark' ? '#0F172A' : '#ffffff'}
                      stroke={trainColor}
                      strokeWidth="2.5"
                    />

                    {/* Train Center Direction Indicator */}
                    <circle
                      cx={tr.x}
                      cy={tr.y}
                      r="3"
                      fill={isDelayed ? '#EF4444' : trainColor}
                    />

                    {/* Train Label ID & Speed */}
                    <g
                      transform={`translate(${tr.x}, ${tr.y - 12})`}
                      className="pointer-events-none"
                    >
                      <rect
                        x="-24"
                        y="-8"
                        width="48"
                        height="13"
                        rx="3.5"
                        fill={theme === 'dark' ? '#07111E' : '#ffffff'}
                        fillOpacity="0.9"
                        stroke={trainColor}
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="1.5"
                        textAnchor="middle"
                        fill={theme === 'dark' ? '#F8FAFC' : '#0F172A'}
                        fontSize="8"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {tr.id.replace('TR-', 'T-')} {tr.speedKmh}k
                      </text>
                    </g>

                    {/* Hover Card for Train Telemetry */}
                    {hoveredTrainId === tr.id && (
                      <g
                        transform={`translate(${tr.x}, ${tr.y + 26})`}
                        className="pointer-events-none"
                      >
                        <rect
                          x="-65"
                          y="-20"
                          width="130"
                          height="28"
                          rx="6"
                          fill="#0F172A"
                          fillOpacity="0.95"
                          stroke={trainColor}
                          strokeWidth="1.5"
                        />
                        <text
                          x="0"
                          y="-8"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="9.5"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {tr.name} · {tr.speedKmh} km/h
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>

            {/* 4. Stations Layer */}
            <g className="stations-layer">
              {stations.map((st) => {
                const isFiltered =
                  (selectedLineFilter === 'L1' && !st.lines.includes('L1')) ||
                  (selectedLineFilter === 'L2' && !st.lines.includes('L2'));
                const isSelected = selectedStationId === st.id;
                const isHovered = hoveredStationId === st.id;
                const hasCriticalIncident = criticalIncidentStations.has(st.id);
                const crowdColor = getCrowdColor(st.crowdLevel);
                const stationName = getStationName(st.id, st.name);

                const stationRadius = st.isInterchange ? 16 : st.isTerminal ? 12 : 10;
                const opacity = isFiltered ? 0.25 : 1;

                // Placement of Badge & Label
                let badgeOffset = { x: 0, y: -26 };
                let labelOffset = { x: 0, y: -44 };
                let textAnchor: 'start' | 'middle' | 'end' = 'middle';

                if (st.id === 'ST-04') {
                  // Old High Court (Interchange)
                  badgeOffset = { x: 0, y: -34 };
                  labelOffset = { x: 0, y: 38 };
                } else if (['ST-06', 'ST-07', 'ST-11', 'ST-12'].includes(st.id)) {
                  // Bottom row stations
                  badgeOffset = { x: 0, y: 26 };
                  labelOffset = { x: 0, y: 46 };
                } else if (['ST-03', 'ST-05'].includes(st.id)) {
                  // Left diagonal
                  badgeOffset = { x: -38, y: 0 };
                  labelOffset = { x: -38, y: -16 };
                  textAnchor = 'end';
                } else if (['ST-09', 'ST-10'].includes(st.id)) {
                  // Right diagonal
                  badgeOffset = { x: 38, y: 0 };
                  labelOffset = { x: 38, y: -16 };
                  textAnchor = 'start';
                }

                // Status Icon Glyph based on Crowd Level (never color alone)
                const statusGlyph =
                  st.crowdLevel === 'critical'
                    ? '!'
                    : st.crowdLevel === 'crowded'
                    ? '▲'
                    : st.crowdLevel === 'busy'
                    ? '■'
                    : '●';

                return (
                  <g
                    key={st.id}
                    className="cursor-pointer transition-opacity duration-300"
                    opacity={opacity}
                    onClick={() => handleStationClick(st.id)}
                    onMouseEnter={() => setHoveredStationId(st.id)}
                    onMouseLeave={() => setHoveredStationId(null)}
                  >
                    {/* Critical Incident Pulsing Ring */}
                    {hasCriticalIncident && (
                      <circle
                        cx={st.x}
                        cy={st.y}
                        r="28"
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth="2.5"
                        className="animate-ping"
                        opacity="0.8"
                      />
                    )}

                    {/* Selected Station Outer Highlight Ring */}
                    {isSelected && (
                      <circle
                        cx={st.x}
                        cy={st.y}
                        r={stationRadius + 9}
                        fill="none"
                        stroke="#14B8A6"
                        strokeWidth="3"
                        strokeDasharray="4,2"
                        className="animate-spin"
                        style={{ transformOrigin: `${st.x}px ${st.y}px` }}
                      />
                    )}

                    {/* Station Marker */}
                    {st.isInterchange ? (
                      // Interchange Double Ring
                      <g>
                        <circle
                          cx={st.x}
                          cy={st.y}
                          r={stationRadius + 4}
                          fill={theme === 'dark' ? '#081220' : '#ffffff'}
                          stroke={crowdColor}
                          strokeWidth="3"
                        />
                        <circle
                          cx={st.x}
                          cy={st.y}
                          r={stationRadius - 2}
                          fill={theme === 'dark' ? '#0B1F3A' : '#f1f5f9'}
                          stroke={crowdColor}
                          strokeWidth="2"
                        />
                        <circle cx={st.x} cy={st.y} r="6" fill={crowdColor} />
                      </g>
                    ) : st.isTerminal ? (
                      // Terminal Station Marker
                      <g>
                        <circle
                          cx={st.x}
                          cy={st.y}
                          r={stationRadius + 3}
                          fill={theme === 'dark' ? '#081220' : '#ffffff'}
                          stroke={crowdColor}
                          strokeWidth="2.5"
                        />
                        <circle cx={st.x} cy={st.y} r={stationRadius - 3} fill={crowdColor} />
                      </g>
                    ) : (
                      // Standard Station Marker
                      <circle
                        cx={st.x}
                        cy={st.y}
                        r={stationRadius}
                        fill={theme === 'dark' ? '#081220' : '#ffffff'}
                        stroke={crowdColor}
                        strokeWidth="3.5"
                      />
                    )}

                    {/* Always Visible Crowd % Badge + Status Icon (never color alone) */}
                    <g
                      transform={`translate(${st.x + badgeOffset.x}, ${st.y + badgeOffset.y})`}
                      className="pointer-events-none"
                    >
                      <rect
                        x="-25"
                        y="-9"
                        width="50"
                        height="18"
                        rx="9"
                        fill={theme === 'dark' ? '#0B1F3A' : '#ffffff'}
                        stroke={crowdColor}
                        strokeWidth="1.5"
                      />
                      <text
                        x="-14"
                        y="3.5"
                        textAnchor="middle"
                        fill={crowdColor}
                        fontSize="9"
                        fontWeight="bold"
                      >
                        {statusGlyph}
                      </text>
                      <text
                        x="7"
                        y="3.5"
                        textAnchor="middle"
                        fill={theme === 'dark' ? '#F1F5F9' : '#0F172A'}
                        fontSize="9.5"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {st.crowdPercentage}%
                      </text>
                    </g>

                    {/* Station Name Label: Read from stations.ts */}
                    <g
                      transform={`translate(${st.x + labelOffset.x}, ${st.y + labelOffset.y})`}
                      className="pointer-events-none"
                    >
                      <rect
                        x={textAnchor === 'middle' ? '-64' : textAnchor === 'end' ? '-128' : '0'}
                        y="-10"
                        width="128"
                        height="20"
                        rx="5"
                        fill={theme === 'dark' ? '#081220' : '#ffffff'}
                        fillOpacity="0.92"
                        stroke={isSelected ? '#14B8A6' : theme === 'dark' ? '#1E293B' : '#E2E8F0'}
                        strokeWidth="1"
                      />
                      <text
                        x={textAnchor === 'middle' ? '0' : textAnchor === 'end' ? '-6' : '6'}
                        y="3.5"
                        textAnchor={textAnchor}
                        fill={theme === 'dark' ? '#F1F5F9' : '#0F172A'}
                        fontSize={st.isInterchange ? '11.5' : '10'}
                        fontWeight={st.isInterchange ? 'bold' : '600'}
                      >
                        {stationName}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          </g>
        </svg>

        {/* Floating Station Quick Info */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
          <div className="p-2 rounded-xl bg-white/90 dark:bg-[#0B1F3A]/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 pointer-events-auto flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>Click any station circle for asset telemetry & platform surge controls</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 p-1.5 rounded-xl bg-white/90 dark:bg-[#0B1F3A]/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 font-mono pointer-events-auto">
            <span>Scroll/drag to pan</span>
            <span>·</span>
            <span>Zoom {Math.round(zoom * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
