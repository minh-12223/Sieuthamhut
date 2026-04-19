import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Activity, Droplets, Thermometer, Gauge, AlertCircle, 
  CheckCircle2, AlertTriangle, RefreshCw, History, BrainCircuit,
  TrendingUp, TrendingDown
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { SensorData, HealthInsight } from './types';
import { analyzeSensorData } from './services/gemini';
import { cn } from './lib/utils';

// --- PHẦN THÊM MỚI: KẾT NỐI FIREBASE ---
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyD4bSpD6ibbn_XON9BHjxEZg1znDY6dnI4",
  authDomain: "sieuthamhut-f3189.firebaseapp.com",
  databaseURL: "https://sieuthamhut-f3189-default-rtdb.firebaseio.com",
  projectId: "sieuthamhut-f3189",
  storageBucket: "sieuthamhut-f3189.firebasestorage.app",
  messagingSenderId: "436800759160",
  appId: "1:436800759160:web:97062df39bc3030d44148d"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function App() {
  // 1. Giữ nguyên trạng thái ban đầu của file gốc
  const [sensorData, setSensorData] = useState<SensorData>({
    timestamp: new Date().toLocaleTimeString(),
    moisture: 0,
    ph: 7.0,
    temperature: 36.5,
    pressure: 80
  });
  
  const [history, setHistory] = useState<SensorData[]>([]);
  const [insight, setInsight] = useState<HealthInsight | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 2. PHẦN THAY ĐỔI DỮ LIỆU: Lấy từ Firebase thay cho MOCK_DATA
  useEffect(() => {
    const rootRef = ref(db, '/'); 
    const unsubscribe = onValue(rootRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const newData: SensorData = {
          timestamp: timeStr,
          moisture: Number(data.moisture ?? 0),
          ph: Number(data.ph ?? 7.0),
          temperature: Number(data.temperature ?? 36.5),
          pressure: Number(data.pressure ?? 80)
        };

        setSensorData(newData);
        setHistory(prev => [...prev.slice(-19), newData]);
      }
    });
    return () => unsubscribe();
  }, []);

  // 3. Giữ nguyên logic tính toán Trend (%) của file gốc
  const calculateTrend = (current: number, dataKey: keyof SensorData) => {
    if (history.length < 2) return 0;
    const previous = history[history.length - 2][dataKey] as number;
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const runAnalysis = useCallback(async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeSensorData(sensorData);
      setInsight(result);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [sensorData, isAnalyzing]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Siêu Thấm Hút AI</h1>
          </div>
          <p className="text-slate-500">Hệ thống giám sát sức khỏe thông minh</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Hệ thống trực tuyến
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <p className="text-sm text-slate-500 pr-2">{sensorData.timestamp}</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SensorCard 
              title="Độ ẩm vật liệu" 
              value={`${sensorData.moisture}%`} 
              icon={<Droplets />} 
              trend={calculateTrend(sensorData.moisture, 'moisture')}
              color="blue" 
            />
            <SensorCard 
              title="Nhiệt độ cơ thể" 
              value={`${sensorData.temperature.toFixed(1)}°C`} 
              icon={<Thermometer />} 
              trend={calculateTrend(sensorData.temperature, 'temperature')}
              color="orange" 
            />
            <SensorCard 
              title="Chỉ số pH" 
              value={sensorData.ph.toFixed(1)} 
              icon={<Activity />} 
              trend={calculateTrend(sensorData.ph, 'ph')}
              color="purple" 
            />
            <SensorCard 
              title="Áp suất tiếp xúc" 
              value={`${sensorData.pressure} mmHg`} 
              icon={<Gauge />} 
              trend={calculateTrend(sensorData.pressure, 'pressure')}
              color="emerald" 
            />
          </div>

          {/* Biểu đồ xu hướng từ file gốc */}
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <History className="w-5 h-5 text-blue-500" /> Xu hướng thời gian thực
              </h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="timestamp" hide />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="moisture" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorMoisture)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* Cột AI Insight từ file gốc */}
        <div className="space-y-6">
          <section className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-blue-400" /> Chẩn đoán AI
              </h3>
              <button 
                onClick={runAnalysis}
                disabled={isAnalyzing}
                className="p-2 hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn("w-5 h-5", isAnalyzing && "animate-spin")} />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {insight ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Kết luận</span>
                    </div>
                    <p className="text-sm leading-relaxed">{insight.prediction}</p>
                  </div>
                  
                  <div className="p-4 bg-slate-800 rounded-2xl">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">Khuyến nghị</p>
                    <p className="text-sm text-slate-300 italic">"{insight.recommendation}"</p>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BrainCircuit className="w-6 h-6 text-slate-600" />
                  </div>
                  <p className="text-slate-500 text-sm">Nhấn nút làm mới để AI phân tích trạng thái vật liệu.</p>
                </div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-200 text-center text-slate-400 text-sm">
        <p>© 2026 Siêu Thấm Hút AI - Công nghệ Y tế tương lai</p>
      </footer>
    </div>
  );
}

// Component SensorCard giữ nguyên từ file gốc
function SensorCard({ title, value, icon, trend, color }: any) {
  const colors: any = {
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
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <div className={cn(
          "flex items-center gap-1 text-xs font-medium",
          trend >= 0 ? "text-emerald-600" : "text-rose-600"
        )}>
          {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(trend).toFixed(1)}% so với trước
        </div>
      </div>
      <div className={cn("p-4 rounded-2xl", colors[color])}>
        {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6" })}
      </div>
    </motion.div>
  );
}
