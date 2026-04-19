import React, { useState, useEffect } from 'react';
import { Activity, Droplets, Thermometer, Gauge, RefreshCw, BrainCircuit } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// --- KẾT NỐI FIREBASE ---
// Lưu ý: Chúng ta dùng bản 'compat' để đảm bảo chạy được trên mọi môi trường GitHub
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
  const [sensorData, setSensorData] = useState({
    timestamp: '--:--',
    moisture: 0,
    ph: 6.5,
    temperature: 36.5,
    pressure: 80
  });
  
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const rootRef = ref(db, '/'); 
    const unsubscribe = onValue(rootRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newData = {
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

  return (
    <div style={{ minHeight: '100-vh', backgroundColor: '#f8fafc', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Siêu Thấm Hút AI</h1>
        <p style={{ color: '#64748b', margin: '5px 0' }}>Hệ thống giám sát sức khỏe thông minh</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <Card title="Độ ẩm" value={`${sensorData.moisture}%`} icon={<Droplets color="#3b82f6"/>} />
        <Card title="Nhiệt độ" value={`${sensorData.temperature.toFixed(1)}°C`} icon={<Thermometer color="#f97316"/>} />
        <Card title="Chỉ số pH" value={sensorData.ph.toFixed(1)} icon={<Activity color="#a855f7"/>} />
        <Card title="Áp suất" value={`${sensorData.pressure} mmHg`} icon={<Gauge color="#10b981"/>} />
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginBottom: '20px', fontSize: '18px' }}>Biểu đồ độ ẩm thực tế</h3>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="timestamp" />
              <YAxis hide domain={[0, 100]} />
              <Tooltip />
              <Area type="monotone" dataKey="moisture" stroke="#3b82f6" fill="#dbeafe" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <footer style={{ marginTop: '50px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
        <p>© 2026 Siêu Thấm Hút AI</p>
      </footer>
    </div>
  );
}

function Card({ title, value, icon }: any) {
  return (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>{title}</p>
        <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0' }}>{value}</p>
      </div>
      {icon}
    </div>
  );
}
