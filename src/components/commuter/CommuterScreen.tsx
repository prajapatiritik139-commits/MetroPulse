import React, { useState } from 'react';
import { useMetroStore } from '../../store/metroStore';
import {
  Navigation,
  ArrowRight,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Bus,
  TrainFront,
  ShieldCheck,
  CreditCard,
  QrCode,
  Sparkles,
  Wifi,
  Battery,
  Signal,
  Search,
  Bell,
  User,
  Compass,
  Repeat,
  Plus,
  Zap,
} from 'lucide-react';
import { formatPercentage, formatFare } from '../../utils/formatters';
import { getStationName } from '../../data/stations';

type CommuterTab = 'plan' | 'alerts' | 'stations' | 'profile';

export const CommuterScreen: React.FC = () => {
  const stations = useMetroStore((state) => state.stations);
  const lines = useMetroStore((state) => state.lines);
  const incidents = useMetroStore((state) => state.incidents);
  const simulatedTime = useMetroStore((state) => state.simulatedTime);
  const feederBuses = useMetroStore((state) => state.feederBuses);
  const addToast = useMetroStore((state) => state.addToast);

  // Phone Internal Bottom Tab
  const [activeTab, setActiveTab] = useState<CommuterTab>('plan');

  // Journey Planner State
  const [originId, setOriginId] = useState<string>('ST-01'); // Mahatma Mandir
  const [destId, setDestId] = useState<string>('ST-08'); // Motera Stadium
  const [routeCalculated, setRouteCalculated] = useState<boolean>(true);
  const [userBalance, setUserBalance] = useState<number>(420);
  const [qrGenerated, setQrGenerated] = useState<boolean>(false);
  const [useBusAlternative, setUseBusAlternative] = useState<boolean>(false);
  const [stationFilter, setStationFilter] = useState<'all' | 'L1' | 'L2'>('all');
  const [stationSearch, setStationSearch] = useState<string>('');

  const originStation = stations.find((s) => s.id === originId) || stations[0];
  const destStation = stations.find((s) => s.id === destId) || stations[7] || stations[stations.length - 1];

  // Check if any station along route has active incident
  const routeAffectedIncident = incidents.find(
    (i) =>
      i.status !== 'resolved' &&
      (i.affectedStationIds.includes(originId) ||
        i.affectedStationIds.includes(destId) ||
        i.affectedStationIds.includes('ST-05')) // Interchange Old High Court
  );

  // Formatted clock for phone status bar
  const phoneClock = simulatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Calculate fare and duration based on station distance
  const isInterchangeNeeded = originStation.lines[0] !== destStation.lines[0];
  const estMinutes = isInterchangeNeeded ? 24 : 14;
  const fareInr = isInterchangeNeeded ? 25 : 15;

  const handleSwapStations = () => {
    setOriginId(destId);
    setDestId(originId);
  };

  const handleRecharge = (amount: number) => {
    setUserBalance((b) => b + amount);
    addToast('Card Recharged', `Successfully added ₹${amount} to MetroPulse Gujarat One Card.`, 'success');
  };

  // Filtered stations for Stations Tab
  const filteredStations = stations.filter((st) => {
    if (stationFilter !== 'all' && !st.lines.includes(stationFilter)) return false;
    if (stationSearch) {
      const q = stationSearch.toLowerCase();
      return st.name.toLowerCase().includes(q) || st.code.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] py-4 px-2 select-none">
      {/* Outer Phone Mockup Frame (390px wide on desktop, max-height 90vh with internal scroll) */}
      <div className="w-full max-w-[390px] mx-auto bg-slate-50 text-slate-800 rounded-[44px] shadow-2xl border-[10px] border-slate-900 overflow-hidden flex flex-col h-[90vh] max-h-[90vh] relative font-sans">
        {/* Phone Notch & Dynamic Island Header */}
        <div className="bg-slate-900 pt-2 pb-1.5 px-6 flex items-center justify-between text-white text-[11px] font-semibold shrink-0">
          <span className="tabular-nums font-mono">{phoneClock}</span>
          <div className="w-20 h-4 bg-slate-950 rounded-full mx-auto" />
          <div className="flex items-center gap-1.5">
            <Signal className="w-3 h-3 text-slate-300" />
            <Wifi className="w-3 h-3 text-slate-300" />
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>

        {/* App Friendly Header */}
        <div className="bg-white px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              M
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900 block leading-tight">Gujarat Metro</span>
              <span className="text-[10px] text-teal-600 font-medium">Gandhinagar–Ahmedabad</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
              Live ₹{userBalance}
            </span>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-slate-50">
          {/* TAB 1: PLAN (Smart Journey Planner) */}
          {activeTab === 'plan' && (
            <div className="space-y-3">
              {/* Origin / Destination Selector Card */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-teal-600" />
                    Journey Planner
                  </span>
                  <button
                    onClick={handleSwapStations}
                    className="p-1 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-slate-50 transition-colors"
                    title="Swap origin and destination"
                  >
                    <Repeat className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  {/* Origin Station */}
                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                    <div className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] text-slate-400 block font-semibold">FROM</span>
                      <select
                        value={originId}
                        onChange={(e) => setOriginId(e.target.value)}
                        className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
                      >
                        {stations.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name} ({st.crowdPercentage}%)
                          </option>
                        ))}
                      </select>
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        originStation.crowdPercentage > 85
                          ? 'bg-rose-100 text-rose-700'
                          : originStation.crowdPercentage > 65
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {formatPercentage(originStation.crowdPercentage)}
                    </span>
                  </div>

                  {/* Destination Station */}
                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] text-slate-400 block font-semibold">TO</span>
                      <select
                        value={destId}
                        onChange={(e) => setDestId(e.target.value)}
                        className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
                      >
                        {stations.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name} ({st.crowdPercentage}%)
                          </option>
                        ))}
                      </select>
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        destStation.crowdPercentage > 85
                          ? 'bg-rose-100 text-rose-700'
                          : destStation.crowdPercentage > 65
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {formatPercentage(destStation.crowdPercentage)}
                    </span>
                  </div>
                </div>

                {/* Calculate Route CTA Button */}
                <button
                  onClick={() => {
                    setRouteCalculated(true);
                    addToast('Route Calculated', `${originStation.name} ➔ ${destStation.name} (${estMinutes} min, ${formatFare(fareInr)})`, 'info');
                  }}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Calculate Route</span>
                </button>

                {/* Delay Warning & Bus Alternative Alert */}
                {routeAffectedIncident && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-[11px] block text-amber-900">
                          Delay Advisory: {routeAffectedIncident.title}
                        </span>
                        <p className="text-[10px] text-amber-800 leading-tight">
                          Transfer at Old High Court currently experience high platform density (+10m delay).
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-amber-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bus className="w-3.5 h-3.5 text-teal-600" />
                        <div>
                          <span className="font-bold text-[10px] text-slate-900 block">
                            Recommended: AMTS Feeder 42 Shuttler
                          </span>
                          <span className="text-[9px] text-slate-500">
                            Bypasses transfer surge · Bay 2 · 14 mins
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setUseBusAlternative(!useBusAlternative)}
                        className="px-2 py-1 rounded-md bg-teal-600 text-white font-bold text-[10px] shadow-2xs"
                      >
                        {useBusAlternative ? 'Metro View' : 'Use Bus'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Itinerary Summary Banner */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      {useBusAlternative ? 'Intermodal Feeder Trip' : 'Fastest Metro Itinerary'}
                    </span>
                    <span className="font-bold text-xs text-slate-800">
                      {useBusAlternative ? 'Metro Line 1 + AMTS Feeder 42' : isInterchangeNeeded ? 'Line 1 ➔ Line 2 Transfer' : 'Direct Metro Consist'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                      {formatFare(fareInr)} · {estMinutes} min
                    </span>
                  </div>
                </div>

                {/* Step-by-Step Cards */}
                <div className="space-y-2 text-xs">
                  {/* Step 1 */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      1
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-slate-800">
                          Board Teal Line at {originStation.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">0 min</span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Platform 1 · Direction Old High Court · Crowd: {formatPercentage(originStation.crowdPercentage)}
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Transfer */}
                  {isInterchangeNeeded && (
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px] text-slate-800">
                            {useBusAlternative ? 'Transfer to AMTS Feeder 42' : 'Cross-Platform at Old High Court'}
                          </span>
                          <span className="text-[10px] font-mono text-teal-600 font-bold">12 min mark</span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          {useBusAlternative
                            ? 'Exit Gate 2 to Bus Bay · Every 5 mins · Low crowd'
                            : 'Escalator to Mezzanine B · Follow Ruby Line signs'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Arrival */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {isInterchangeNeeded ? '3' : '2'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-slate-800">
                          Arrive at {destStation.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">+{estMinutes} min</span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Step-free elevators · Concourse Exit 1A open
                      </p>
                    </div>
                  </div>
                </div>

                {/* Instant Tap to Pay CTA */}
                <button
                  onClick={() => {
                    addToast('Trip Confirmed', `Ticket generated for ${originStation.name} to ${destStation.name} (${formatFare(fareInr)}).`, 'success');
                    setActiveTab('profile');
                  }}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Book QR Ticket · {formatFare(fareInr)}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ALERTS */}
          {activeTab === 'alerts' && (
            <div className="space-y-3">
              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold text-slate-800 block mb-2">Live Line Operational Status</span>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-teal-50 border border-teal-200/60">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                      <div>
                        <span className="font-bold text-[11px] text-slate-900 block">Line 1 (Teal Line)</span>
                        <span className="text-[10px] text-teal-800">Mahatma Mandir ↔ Sabarmati</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md">
                      Normal (3.2m)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50 border border-rose-200/60">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <div>
                        <span className="font-bold text-[11px] text-slate-900 block">Line 2 (Ruby Line)</span>
                        <span className="text-[10px] text-rose-800">Akshardham ↔ Gyaspur</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 bg-white px-2 py-0.5 rounded-md">
                      Advisory (+4m)
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Passenger Disruption Alerts */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                <span className="text-xs font-bold text-slate-800 block">Passenger Advisories</span>
                {incidents.filter((i) => i.status !== 'resolved').length === 0 ? (
                  <div className="text-center py-6 text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-slate-700">All Corridors Clear</p>
                    <p className="text-[10px]">No active disruptions reported.</p>
                  </div>
                ) : (
                  incidents
                    .filter((i) => i.status !== 'resolved')
                    .map((inc) => (
                      <div
                        key={inc.id}
                        className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px] text-amber-900">{inc.title}</span>
                          <span className="text-[9px] font-mono text-amber-700 font-bold uppercase">
                            {inc.severity}
                          </span>
                        </div>
                        <p className="text-[10px] text-amber-800 leading-tight">{inc.description}</p>
                        <div className="flex items-center gap-1.5 pt-1 text-[9px] text-amber-700 font-medium">
                          <Clock className="w-3 h-3" />
                          <span>Reported {inc.reportedAt} · Response units dispatched</span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: STATIONS */}
          {activeTab === 'stations' && (
            <div className="space-y-2.5">
              {/* Search & Filter */}
              <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search Gandhinagar or Ahmedabad station..."
                    value={stationSearch}
                    onChange={(e) => setStationSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div className="flex items-center gap-1">
                  {(['all', 'L1', 'L2'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setStationFilter(filter)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                        stationFilter === filter
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {filter === 'all' ? 'All (12)' : filter === 'L1' ? 'Teal Line' : 'Ruby Line'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Station List */}
              <div className="space-y-1.5">
                {filteredStations.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => {
                      setOriginId(st.id);
                      setActiveTab('plan');
                    }}
                    className="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-teal-400 cursor-pointer transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900">{st.name}</span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                          {st.code}
                        </span>
                        {st.isInterchange && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-100 text-teal-800">
                            Interchange
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {st.feederBusIds?.length ? `Feeders: ${st.feederBusIds.join(', ')}` : 'Main Corridor'} · Step-free {st.accessibilityScore || 92}%
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          st.crowdPercentage > 85
                            ? 'bg-rose-100 text-rose-700'
                            : st.crowdPercentage > 65
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {formatPercentage(st.crowdPercentage)}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5 capitalize">{st.crowdLevel}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-3">
              {/* Virtual Metro Card */}
              <div className="rounded-2xl p-4 bg-gradient-to-br from-[#0B1F3A] to-[#0A3A60] text-white shadow-md relative overflow-hidden space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-400" />
                    <span className="font-bold text-xs tracking-wider">GUJARAT ONE CARD</span>
                  </div>
                  <span className="text-[10px] font-mono bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full border border-teal-500/30">
                    NFC Active
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-300 block uppercase tracking-wider">Smart Balance</span>
                  <span className="text-2xl font-bold font-mono tracking-tight text-white">
                    ₹{userBalance.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-300 font-mono pt-1 border-t border-white/10">
                  <span>CARD: 4582 •••• 9210</span>
                  <span>EXP: 12/29</span>
                </div>
              </div>

              {/* Quick Top-Up Card */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                <span className="text-xs font-bold text-slate-800 block">Instant Top-Up (UPI / INR)</span>
                <div className="grid grid-cols-3 gap-2">
                  {[100, 200, 500].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => handleRecharge(amt)}
                      className="py-2 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 text-slate-800 hover:text-teal-700 font-bold text-xs font-mono transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>₹{amt}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Digital QR Ticket Generator */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Offline Single Journey QR</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Valid 60 min
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center">
                  <QrCode className="w-20 h-20 text-slate-800 mb-1" />
                  <span className="text-[10px] font-mono text-slate-500">
                    GMR-2026-QR-9812-OHC
                  </span>
                  <span className="text-[9px] text-slate-400">
                    Scan at turnstile optical reader · Step-free entry
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Phone Bottom Tab Bar (Plan, Alerts, Stations, Profile) */}
        <div className="bg-white border-t border-slate-200/80 px-2 py-2 flex items-center justify-around shrink-0 shadow-lg">
          <button
            onClick={() => setActiveTab('plan')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
              activeTab === 'plan' ? 'text-teal-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Plan</span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`relative flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
              activeTab === 'alerts' ? 'text-teal-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Bell className="w-4 h-4" />
            {incidents.filter((i) => i.status !== 'resolved').length > 0 && (
              <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-rose-500" />
            )}
            <span className="text-[10px] mt-0.5">Alerts</span>
          </button>

          <button
            onClick={() => setActiveTab('stations')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
              activeTab === 'stations' ? 'text-teal-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Stations</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
              activeTab === 'profile' ? 'text-teal-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};
