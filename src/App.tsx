/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Droplets, 
  Thermometer, 
  Gauge, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  History,
  BrainCircuit
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { SensorData, HealthInsight } from './types';
import { analyzeSensorData } from './services/gemini';
import { cn } from './lib/utils';

// Mock sensor data generator
const generateMockData = (prev?: SensorData): SensorData => {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  if (!prev) {
    return {
      timestamp: timeStr,
      moisture: 15,
      ph: 6.5,
      temperature: 36.5,
      pressure: 80
    };
  }

  // Simulate realistic fluctuations
  return {
    timestamp: timeStr,
    moisture: Math.min(100, Math.max(0, prev.moisture + (Math.random() * 4 - 1.5))),
    ph: Math.min(14, Math.max(0, prev.ph + (Math.random() * 0.2 - 0.1))),
    temperature: Math.min(42, Math.max(34, prev.temperature + (Math.random() * 0.4 - 0.2))),
    pressure: Math.min(200, Math.max(0, prev.pressure + (Math.random() * 5 - 2)))
  };
};

export default function App() {
  const [dataHistory, setDataHistory] = useState<SensorData[]>([]);
  const [insight, setInsight] = useState<HealthInsight | null>(null);
  const [insightHistory, setInsightHistory] = useState<HealthInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(true);

  // Initialize data
  useEffect(() => {
    const initialData = Array.from({ length: 10 }).reduce((acc: SensorData[]) => {
      const last = acc[acc.length - 1];
      return [...acc, generateMockData(last)];
    }, []);
    setDataHistory(initialData);
  }, []);

  // Auto-update sensors
  useEffect(() => {
    if (!isAutoMode) return;
    
    const interval = setInterval(() => {
      setDataHistory(prev => {
        const next = generateMockData(prev[prev.length - 1]);
        const newHistory = [...prev.slice(-19), next];
        return newHistory;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isAutoMode]);

  const handleAnalysis = useCallback(async () => {
    if (dataHistory.length === 0) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeSensorData(dataHistory);
      setInsight(result);
      setInsightHistory(prev => [result, ...prev].slice(0, 50)); // Keep last 50 insights
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [dataHistory]);

  // Auto-trigger AI analysis every 15 seconds if in auto mode
  useEffect(() => {
    if (!isAutoMode) return;
    const interval = setInterval(handleAnalysis, 15000);
    return () => clearInterval(interval);
  }, [isAutoMode, handleAnalysis]);

  const latest = dataHistory[dataHistory.length - 1] || generateMockData();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-indigo-900 flex items-center gap-2">
            <Activity className="w-8 h-8 text-indigo-600" />
            Visionary Health Monitor
          </h1>
          <p className="text-slate-500 mt-1">Hệ thống phân tích vật liệu siêu thấm hút tích hợp AI</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAutoMode(!isAutoMode)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
              isAutoMode ? "bg-green-100 text-green-700 border border-green-200" : "bg-slate-200 text-slate-600 border border-slate-300"
            )}
          >
            <RefreshCw className={cn("w-4 h-4", isAutoMode && "animate-spin")} />
            {isAutoMode ? "Chế độ Tự động" : "Chế độ Thủ công"}
          </button>
          
          <button 
            onClick={handleAnalysis}
            disabled={isAnalyzing}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-full text-sm font-medium shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <BrainCircuit className={cn("w-4 h-4", isAnalyzing && "animate-pulse")} />
            {isAnalyzing ? "Đang phân tích..." : "Phân tích AI ngay"}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sensor Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <SensorCard 
            title="Độ ẩm" 
            value={`${latest.moisture.toFixed(1)}%`} 
            icon={<Droplets className="text-blue-500" />} 
            color="blue"
            trend={dataHistory.length > 1 ? latest.moisture - dataHistory[dataHistory.length-2].moisture : 0}
          />
          <SensorCard 
            title="Độ pH" 
            value={latest.ph.toFixed(2)} 
            icon={<Activity className="text-purple-500" />} 
            color="purple"
            trend={dataHistory.length > 1 ? latest.ph - dataHistory[dataHistory.length-2].ph : 0}
          />
          <SensorCard 
            title="Nhiệt độ" 
            value={`${latest.temperature.toFixed(1)}°C`} 
            icon={<Thermometer className="text-orange-500" />} 
            color="orange"
            trend={dataHistory.length > 1 ? latest.temperature - dataHistory[dataHistory.length-2].temperature : 0}
          />
          <SensorCard 
            title="Áp lực" 
            value={`${latest.pressure.toFixed(1)} mmHg`} 
            icon={<Gauge className="text-emerald-500" />} 
            color="emerald"
            trend={dataHistory.length > 1 ? latest.pressure - dataHistory[dataHistory.length-2].pressure : 0}
          />

          {/* Charts */}
          <div className="md:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-500" />
                Biểu đồ xu hướng thời gian thực
              </h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataHistory}>
                  <defs>
                    <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="timestamp" hide />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="moisture" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorMoisture)" 
                    animationDuration={1000}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="pressure" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={0}
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* AI Analysis Panel */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-full">
            <h3 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-indigo-500" />
              Phân tích & Dự đoán AI
            </h3>

            <AnimatePresence mode="wait">
              {insight ? (
                <motion.div 
                  key="insight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className={cn(
                    "p-4 rounded-2xl flex items-start gap-4",
                    insight.status === 'normal' ? "bg-green-50 text-green-800" :
                    insight.status === 'warning' ? "bg-amber-50 text-amber-800" :
                    "bg-red-50 text-red-800"
                  )}>
                    <div className="mt-1">
                      {insight.status === 'normal' ? <CheckCircle2 className="w-6 h-6" /> :
                       insight.status === 'warning' ? <AlertTriangle className="w-6 h-6" /> :
                       <AlertCircle className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="font-bold text-lg capitalize">Trạng thái: {insight.status}</p>
                      <p className="text-sm opacity-90">Cập nhật lúc {new Date().toLocaleTimeString()}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dự đoán tình trạng</h4>
                      <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        {insight.prediction}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hành động gợi ý</h4>
                      <p className="text-indigo-900 font-medium leading-relaxed bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                        {insight.recommendation}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center">
                  <Activity className="w-12 h-12 mb-4 opacity-20 animate-pulse" />
                  <p>Chưa có dữ liệu phân tích.</p>
                  <p className="text-sm">Nhấn nút "Phân tích AI" để bắt đầu.</p>
                </div>
              )}
            </AnimatePresence>
          </section>

          {/* History Section */}
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-500" />
              Lịch sử phân tích
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {insightHistory.length > 0 ? (
                insightHistory.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 rounded-xl border border-slate-50 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                        item.status === 'normal' ? "bg-green-100 text-green-700" :
                        item.status === 'warning' ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      )}>
                        {item.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{item.prediction}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-400 text-sm py-8">Chưa có lịch sử.</p>
              )}
            </div>
          </section>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-200 text-center text-slate-400 text-sm">
        <p>© 2026 Visionary Health Monitor - Giải pháp Y tế Thông minh</p>
      </footer>
    </div>
  );
}

function SensorCard({ title, value, icon, color, trend }: { title: string, value: string, icon: React.ReactNode, color: string, trend: number }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between"
    >
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <div className="flex items-center gap-1">
          {trend !== 0 && (
            <span className={cn(
              "text-xs font-medium px-1.5 py-0.5 rounded-full",
              trend > 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
            )}>
              {trend > 0 ? "+" : ""}{trend.toFixed(2)}
            </span>
          )}
        </div>
      </div>
      <div className={cn("p-4 rounded-2xl", colors[color])}>
        {icon}
      </div>
    </motion.div>
  );
}
