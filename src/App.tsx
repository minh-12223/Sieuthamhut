import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, Droplets, Thermometer, Gauge, RefreshCw, History, BrainCircuit
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion'; // Đổi về framer-motion cho ổn định
import { SensorData, HealthInsight } from './types';
import { analyzeSensorData } from './services/gemini';
import { cn } from './lib/utils';

// --- KẾT NỐI FIREBASE (GIỮ NGUYÊN) ---
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
  const [sensorData, setSensorData] = useState<SensorData>({
    timestamp: '--:--',
    moisture: 0,
    ph: 6.5,
    temperature: 36.5,
    pressure: 80
  });
  
  const [history, setHistory] = useState<SensorData[]>([]);
  const [insight, setInsight] = useState<HealthInsight | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // LOGIC LẤY DỮ LIỆU TỪ FIREBASE
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
          ph: Number(data.ph ?? 6.5),
          temperature: Number(data.temperature ?? 36.5),
          pressure: Number(data.pressure ?? 80)
        };

        setSensorData(newData);
        setHistory(prev => [...prev.slice(-19), newData]);
      }
    });
    return () => unsubscribe();
  }, []);

  const runAnalysis = useCallback(async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeSensorData(sensorData);
      setInsight(result);
    } catch (error) {
      console.error("Lỗi phân tích:", error);
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
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SensorCard title="Độ ẩm vật liệu" value={`${sensorData.moisture}%`} icon={<Droplets />} color="blue" />
            <SensorCard title="Nhiệt độ" value={`${sensorData.temperature.toFixed(1)}°C`} icon={<Thermometer />} color="orange" />
            <SensorCard title="Chỉ số pH" value={sensorData.ph.toFixed(1)} icon={<Activity />} color="purple" />
            <SensorCard title="Áp suất tiếp xúc" value={`${sensorData.pressure} mmHg`} icon={<Gauge />} color="emerald" />
          </div>

          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-500" /> Xu hướng dữ liệu
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="timestamp" hide />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="moisture" stroke="#3b82f6" fillOpacity={0.1} fill="#3b82f6" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-blue-400" /> Chẩn đoán AI
              </h3>
              <button onClick={runAnalysis} className="p-2 hover:bg-slate-800 rounded-xl">
                <RefreshCw className={cn("w-5 h-5", isAnalyzing && "animate-spin")} />
              </button>
            </div>
            <AnimatePresence mode="wait">
              {insight ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                    <p className="text-sm">{insight.prediction}</p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-sm">Đang đợi dữ liệu phân tích...</p>
              )}
            </AnimatePresence>
          </section>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto mt-12 text-center text-slate-400 text-sm">
        <p>© 2026 Siêu Thấm Hút AI</p>
      </footer>
    </div>
  );
}

function SensorCard({ title, value, icon, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
      <div className={cn("p-4 rounded-2xl", colors[color])}>{icon}</div>
    </div>
  );
}
