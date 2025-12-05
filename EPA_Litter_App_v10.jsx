import React, { useState, useEffect } from 'react';
import { Camera, MapPin, Send, AlertTriangle, Car, Trash2, Info, CheckCircle, Menu, X, ChevronRight, Upload, Image as ImageIcon, Download, Share2, Wifi, WifiOff, CloudUpload, Clock, Shield, Trophy, TrendingUp, Activity } from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [showMenu, setShowMenu] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  
  // Offline & Sync State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingReports, setPendingReports] = useState([]);
  
  // Gamification & History State
  const [userPoints, setUserPoints] = useState(0);
  const [userRank, setUserRank] = useState(124); // Mock rank
  const [submittedReports, setSubmittedReports] = useState([
    // Mock Data Updated for New Point System (20 + 10)
    {
      id: 991,
      type: 'vehicle_dumping',
      address: 'Sheriff St & Duncan St',
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
      status: 'Action Taken', // Final State
      pointsAwarded: 30, // 20 submission + 10 success
      licensePlate: 'PAD 4521',
      description: 'Truck dumping construction waste.'
    },
    {
      id: 992,
      type: 'littering',
      address: 'Seawall Road',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
      status: 'Investigation', // Middle State
      pointsAwarded: 20, // 20 submission only
      description: 'Pile of plastic bottles left after event.'
    }
  ]);
  
  const [isSyncing, setIsSyncing] = useState(false);

  // App State
  const [reportStep, setReportStep] = useState(0); 
  const [reportData, setReportData] = useState({
    id: null,
    image: null,
    imagePreview: null,
    location: null,
    address: '',
    type: 'vehicle_dumping',
    licensePlate: '',
    description: '',
    anonymous: false,
    timestamp: null
  });

  // --- Offline & History Engine ---
  
  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); syncReports(); };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load Data
    const savedPending = localStorage.getItem('epa_pending_reports');
    if (savedPending) setPendingReports(JSON.parse(savedPending));

    const savedHistory = localStorage.getItem('epa_history_reports');
    if (savedHistory) {
      // Merge saved history with our mock data for demo purposes
      const parsed = JSON.parse(savedHistory);
      if (parsed.length > 0) setSubmittedReports(parsed);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Recalculate Points whenever history changes
  useEffect(() => {
    const total = submittedReports.reduce((sum, report) => sum + (report.pointsAwarded || 0), 0);
    setUserPoints(total);
    // Mock rank improvement logic
    setUserRank(Math.max(1, 150 - Math.floor(total / 30))); 
  }, [submittedReports]);

  // Sync Logic (Optimized for Bandwidth)
  const syncReports = async () => {
    const saved = localStorage.getItem('epa_pending_reports');
    if (!saved) return;
    
    const reports = JSON.parse(saved);
    if (reports.length === 0) return;

    setIsSyncing(true);
    
    setTimeout(() => {
      // Move pending to submitted history with "Received" status
      const newHistory = [...reports.map(r => ({
        ...r, 
        status: 'Received', 
        pointsAwarded: 20, // UPDATED: 20 pts for successful upload
        syncTime: new Date().toISOString()
      })), ...submittedReports];
      
      setSubmittedReports(newHistory);
      localStorage.setItem('epa_history_reports', JSON.stringify(newHistory));

      setPendingReports([]);
      localStorage.removeItem('epa_pending_reports');
      setIsSyncing(false);
    }, 2000); 
  };

  const submitReport = () => {
    const newReport = {
      ...reportData,
      id: Date.now(),
      timestamp: new Date().toISOString(),
      status: isOnline ? 'Received' : 'Pending Upload',
      pointsAwarded: isOnline ? 20 : 0 // UPDATED: 20 pts immediate if online
    };

    if (isOnline) {
      const newHistory = [newReport, ...submittedReports];
      setSubmittedReports(newHistory);
      localStorage.setItem('epa_history_reports', JSON.stringify(newHistory));
      
      setTimeout(() => {
        setReportStep(5);
      }, 1500);
    } else {
      const updatedPending = [...pendingReports, newReport];
      setPendingReports(updatedPending);
      localStorage.setItem('epa_pending_reports', JSON.stringify(updatedPending));
      setReportStep(5); 
    }
  };

  // --- Helper Functions ---

  const handleGetLocation = () => {
    if (!isOnline && !navigator.geolocation) {
       setReportData(prev => ({ ...prev, address: 'GPS Unavailable (Offline)' }));
       return;
    }
    // Simulate Geolocation
    setReportData(prev => ({
      ...prev,
      location: { lat: 6.8013, lng: -58.1551 },
      address: 'Camp St & Church St, Georgetown'
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReportData(prev => ({
          ...prev,
          image: file,
          imagePreview: reader.result
        }));
        // Auto-trigger location when photo is taken for "Geotagging"
        handleGetLocation(); 
        setReportStep(2);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setReportData({
      id: null, image: null, imagePreview: null, location: null, address: '',
      type: 'vehicle_dumping', licensePlate: '', description: '', anonymous: false, timestamp: null
    });
    setReportStep(0);
    setActiveTab('home');
  };

  // --- Components ---

  const OfflineBanner = () => {
    if (isOnline && pendingReports.length === 0) return null;
    return (
      <div className={`px-4 py-2 text-xs font-bold flex justify-between items-center transition-colors ${!isOnline ? 'bg-gray-800 text-gray-200' : 'bg-blue-600 text-white'}`}>
        {!isOnline ? <div className="flex items-center"><WifiOff size={14} className="mr-2"/> You are offline</div> : <div className="flex items-center"><Wifi size={14} className="mr-2"/> Back online</div>}
        {pendingReports.length > 0 && (
          <div className="flex items-center bg-white/20 px-2 py-1 rounded">
             {isSyncing ? <span className="animate-pulse">Syncing...</span> : <><CloudUpload size={14} className="mr-2"/> {pendingReports.length} Pending</>}
          </div>
        )}
      </div>
    );
  };

  const Header = () => (
    <div className="bg-green-700 text-white shadow-md sticky top-0 z-50">
      <div className="flex justify-between items-center max-w-md mx-auto p-4">
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10">
             <img 
               src="/Picture1.jpg" 
               alt="EPA" 
               className="w-10 h-10 rounded-full border-2 border-white bg-white object-contain absolute top-0 left-0 z-10"
               onError={(e) => { e.target.style.opacity = 0; }} 
             />
             <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-green-700 font-bold border-2 border-green-100 absolute top-0 left-0">
               <Shield size={20} className="fill-green-100" />
             </div>
          </div>
          <h1 className="font-bold text-lg tracking-tight">Clean592</h1>
        </div>
        <button onClick={() => setShowMenu(!showMenu)}>
          {showMenu ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      <OfflineBanner />
      {showMenu && (
        <div className="absolute top-full left-0 right-0 bg-green-800 shadow-xl border-t border-green-600 animate-in slide-in-from-top-2 z-50">
          <div className="p-4 space-y-3">
             <div className="bg-green-900/50 p-3 rounded-lg border border-green-600 mb-4 flex justify-between items-center">
                <div>
                  <p className="text-xs text-green-300 uppercase font-bold mb-1">Your Rank</p>
                  <p className="text-xl font-black text-white">#{userRank}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-green-300 uppercase font-bold mb-1">Total Points</p>
                  <p className="text-xl font-black text-yellow-400">{userPoints}</p>
                </div>
             </div>
            <button onClick={() => { setShowMenu(false); setActiveTab('history'); }} className="block w-full text-left py-2 px-3 hover:bg-green-700 rounded text-green-50 font-medium">My Report History</button>
            <div className="border-t border-green-600 my-2"></div>
            <p className="text-xs text-green-200 px-3">Enforcement Hotline: 225-5467</p>
          </div>
        </div>
      )}
    </div>
  );

  const HistoryScreen = () => {
    const allReports = [...pendingReports.map(r => ({...r, status: 'Pending Upload'})), ...submittedReports];
    
    const getStatusColor = (status) => {
      if (status === 'Action Taken') return 'bg-green-100 text-green-700 border-green-200';
      if (status === 'Investigation') return 'bg-blue-100 text-blue-700 border-blue-200';
      if (status === 'Received') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      return 'bg-gray-100 text-gray-600 border-gray-200';
    };

    const getStatusStep = (status) => {
      if (status === 'Action Taken') return 3;
      if (status === 'Investigation') return 2;
      return 1;
    };
    
    return (
      <div className="flex flex-col h-full bg-gray-50 p-4 overflow-y-auto pb-24 animate-in slide-in-from-right-10">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-xl font-bold text-gray-800">My Reports</h2>
          <div className="text-right">
            <span className="text-xs text-gray-500 font-bold uppercase">Total Earned</span>
            <div className="flex items-center text-green-600 font-black">
              <Trophy size={14} className="mr-1" />
              <span>{userPoints} pts</span>
            </div>
          </div>
        </div>

        {allReports.length === 0 ? (
          <div className="text-center text-gray-400 mt-20">
            <Clock size={48} className="mx-auto mb-4 opacity-20" />
            <p>No reports found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allReports.map((report) => (
              <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-50 flex justify-between items-start">
                   <div className="flex space-x-3">
                      {report.imagePreview ? (
                        <img src={report.imagePreview} className="w-12 h-12 object-cover rounded-lg bg-gray-100" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300"><ImageIcon size={20}/></div>
                      )}
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm capitalize">{report.type.replace('_', ' ')}</h4>
                        <p className="text-xs text-gray-500">{new Date(report.timestamp).toLocaleDateString()}</p>
                      </div>
                   </div>
                   {report.pointsAwarded > 0 && (
                     <span className={`text-xs font-bold px-2 py-1 rounded-full border flex items-center ${report.pointsAwarded >= 30 ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
                       +{report.pointsAwarded} pts
                     </span>
                   )}
                </div>

                {/* Status Bar */}
                {report.status !== 'Pending Upload' && (
                  <div className="px-4 py-3 bg-gray-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase text-gray-400">Status Tracking</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusColor(report.status)}`}>
                        {report.status === 'Investigation' ? 'Investigation Ongoing' : report.status}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden flex">
                      <div className={`h-full ${getStatusStep(report.status) >= 1 ? 'bg-green-500' : 'bg-transparent'} w-1/3 border-r border-white/50`}></div>
                      <div className={`h-full ${getStatusStep(report.status) >= 2 ? 'bg-green-500' : 'bg-transparent'} w-1/3 border-r border-white/50`}></div>
                      <div className={`h-full ${getStatusStep(report.status) >= 3 ? 'bg-green-500' : 'bg-transparent'} w-1/3`}></div>
                    </div>
                    <div className="flex justify-between text-[8px] text-gray-400 mt-1 font-bold uppercase">
                      <span>Received</span>
                      <span>Investigating</span>
                      <span>Action Taken</span>
                    </div>
                    {report.status === 'Action Taken' && (
                       <p className="text-[10px] text-green-600 font-bold mt-2 flex items-center">
                         <CheckCircle size={10} className="mr-1" /> +10 Bonus Points Awarded!
                       </p>
                    )}
                  </div>
                )}
                
                {report.description && (
                  <div className="px-4 pb-4 pt-2">
                    <p className="text-xs text-gray-600 italic">"{report.description}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <button onClick={() => setActiveTab('home')} className="mt-8 text-center text-green-600 font-bold text-sm w-full">Back to Home</button>
      </div>
    );
  };

  const HomeScreen = () => (
    <div className="flex flex-col h-full bg-gray-50 pb-24">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-green-700 to-green-600 text-white p-6 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
           <Shield size={180} />
        </div>
        <h2 className="text-3xl font-black mb-1 leading-tight tracking-tight">STOP LITTERING.</h2>
        <h3 className="text-xl font-bold text-sky-300 mb-4">KEEP IT CLEAN.</h3>
        
        <p className="text-green-100 mb-6 max-w-xs text-sm opacity-90 font-medium">
          Official EPA Litter reporting tool. No account needed.
        </p>

        {/* REWARDS CARD */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 flex items-center justify-between mb-2">
           <div>
             <div className="flex items-center text-yellow-300 font-bold mb-1">
               <Trophy size={16} className="mr-1" />
               <span className="text-xs uppercase tracking-wide">EPA Rewards</span>
             </div>
             <p className="text-2xl font-black">{userPoints} <span className="text-sm font-medium text-green-100">pts</span></p>
           </div>
           <div className="text-right">
             <span className="text-[10px] text-green-100 block mb-1">Current Rank</span>
             <span className="bg-white text-green-800 font-bold px-3 py-1 rounded-full text-xs">#{userRank}</span>
           </div>
        </div>
        <p className="text-[10px] text-green-200 text-center">Make the Top 20 for annual incentives!</p>
      </div>

      <div className="p-6 -mt-4">
        <button 
          onClick={() => { setReportStep(1); setActiveTab('report'); }}
          className="w-full bg-sky-600 hover:bg-sky-500 active:scale-95 transition-all text-white font-black text-xl py-6 rounded-2xl shadow-xl flex items-center justify-center space-x-3 border-b-4 border-sky-800 relative z-10"
        >
          <Camera size={28} />
          <span>REPORT VIOLATION</span>
        </button>

        <div className="mt-8">
           <div className="flex justify-between items-center mb-4 px-1">
             <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Recent Activity</h3>
             <button onClick={() => setActiveTab('history')} className="text-green-600 text-xs font-bold">View All</button>
           </div>
           
           {submittedReports.length > 0 ? (
              <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100 flex items-center space-x-3">
                 <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <Activity size={20} />
                 </div>
                 <div>
                    <h4 className="font-bold text-gray-800 text-sm">{submittedReports[0].type === 'vehicle_dumping' ? 'Vehicle Report' : 'Litter Report'}</h4>
                    <p className="text-xs text-gray-500">Status: <span className="font-medium text-green-600">{submittedReports[0].status === 'Investigation' ? 'Investigation Ongoing' : submittedReports[0].status}</span></p>
                 </div>
              </div>
           ) : (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                 <p className="text-gray-400 text-sm mb-2">No reports yet.</p>
                 <p className="text-xs text-gray-300">Start reporting to earn points.</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );

  const ReportWizard = () => {
    // Step 1: Evidence (Camera)
    if (reportStep === 1) {
      return (
        <div className="flex flex-col h-full bg-black text-white p-6 justify-between animate-in fade-in">
          <div className="mt-4">
            <button onClick={resetForm} className="text-gray-400 flex items-center text-sm mb-6"><X size={16} className="mr-1"/> Cancel</button>
            <h2 className="text-2xl font-bold mb-2">Evidence</h2>
            <p className="text-gray-400 text-sm">Photos are required. <span className="text-yellow-400">Geotagging is enabled automatically.</span></p>
          </div>
          <div className="flex-1 flex flex-col justify-center space-y-4">
            <div className="relative w-full">
                <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="absolute inset-0 opacity-0 z-20 w-full h-full cursor-pointer"/>
                <div className="bg-gray-900 border-2 border-dashed border-gray-600 rounded-2xl p-8 flex flex-col items-center justify-center hover:bg-gray-800 transition-colors cursor-pointer group">
                    <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-green-900/50"><Camera size={32} className="text-white" /></div>
                    <span className="font-bold text-lg">Take Photo</span>
                    <span className="text-xs text-gray-500 mt-1">Auto-captures GPS Location</span>
                </div>
            </div>
            <div className="relative w-full">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 z-20 w-full h-full cursor-pointer"/>
                <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 flex items-center justify-center hover:bg-gray-800 transition-colors cursor-pointer">
                    <ImageIcon size={20} className="mr-3 text-gray-400" />
                    <span className="font-medium text-gray-300">Upload from Gallery</span>
                </div>
            </div>
          </div>
        </div>
      );
    }
    // Step 2: Location
    if (reportStep === 2) {
      return (
        <div className="flex flex-col h-full bg-gray-50 p-6 animate-in slide-in-from-right-10">
           <div className="mb-6">
             <div className="flex items-center justify-between mb-2">
                <button onClick={() => setReportStep(1)} className="text-gray-500 text-sm">Back</button>
                <span className="text-xs font-bold text-green-800">STEP 2 OF 4</span>
             </div>
             <h2 className="text-2xl font-bold text-gray-800">Location</h2>
           </div>
           <div className="bg-white rounded-xl shadow-sm p-1 border border-gray-200 h-64 relative mb-6 overflow-hidden">
              <div className="absolute inset-0 bg-green-50/50 flex items-center justify-center">
                 <div className="grid grid-cols-6 grid-rows-6 w-full h-full gap-1 opacity-10">
                    {[...Array(36)].map((_, i) => <div key={i} className="border border-green-900"></div>)}
                 </div>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                 {reportData.location ? (
                    <div className="flex flex-col items-center animate-in zoom-in">
                       <MapPin size={40} className="text-red-600 mb-2 drop-shadow-md" fill="currentColor" />
                       <div className="bg-white px-3 py-1 rounded-full shadow-lg text-xs font-bold text-gray-700 border border-gray-100 flex items-center">
                         <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                         Geotagged: {reportData.location.lat}, {reportData.location.lng}
                       </div>
                    </div>
                 ) : (
                    <button onClick={handleGetLocation} className="bg-green-700 text-white px-6 py-3 rounded-full shadow-lg font-bold flex items-center hover:bg-green-800 transition-colors">
                      <MapPin size={18} className="mr-2" />
                      Detect Location
                    </button>
                 )}
              </div>
           </div>
           {reportData.location && (
             <div className="space-y-4">
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address / Landmark</label>
                   <input type="text" value={reportData.address} onChange={(e) => setReportData({...reportData, address: e.target.value})} className="w-full p-4 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-green-500 outline-none" placeholder="e.g. Near the market..." />
                </div>
                <button onClick={() => setReportStep(3)} className="w-full bg-green-800 text-white font-bold py-4 rounded-xl mt-4 shadow-md flex justify-between items-center px-6">
                  <span>Confirm Location</span><ChevronRight size={20} />
                </button>
             </div>
           )}
        </div>
      );
    }
    // Step 3: Details
    if (reportStep === 3) {
      return (
        <div className="flex flex-col h-full bg-gray-50 p-6 animate-in slide-in-from-right-10 overflow-y-auto">
           <div className="mb-6">
             <div className="flex items-center justify-between mb-2">
                <button onClick={() => setReportStep(2)} className="text-gray-500 text-sm">Back</button>
                <span className="text-xs font-bold text-green-800">STEP 3 OF 4</span>
             </div>
             <h2 className="text-2xl font-bold text-gray-800">Details</h2>
           </div>
           <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => setReportData({...reportData, type: 'vehicle_dumping'})} className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center text-center space-y-2 transition-all ${reportData.type === 'vehicle_dumping' ? 'border-green-600 bg-green-50 text-green-800' : 'border-gray-200 bg-white text-gray-500'}`}>
                    <Car size={32} />
                    <span className="text-sm font-bold">Vehicle Dumping</span>
                 </button>
                 <button onClick={() => setReportData({...reportData, type: 'littering'})} className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center text-center space-y-2 transition-all ${reportData.type === 'littering' ? 'border-green-600 bg-green-50 text-green-800' : 'border-gray-200 bg-white text-gray-500'}`}>
                    <Trash2 size={32} />
                    <span className="text-sm font-bold">General Litter</span>
                 </button>
              </div>
              {reportData.type === 'vehicle_dumping' && (
                <div className="bg-sky-50 p-4 rounded-xl border border-sky-200 animate-in fade-in">
                   <label className="block text-xs font-bold text-sky-800 uppercase mb-2 flex items-center"><AlertTriangle size={14} className="mr-1" /> Vehicle License Plate</label>
                   <input type="text" placeholder="PAB 1234" className="w-full p-3 border-2 border-gray-300 rounded-lg bg-white font-mono text-xl uppercase tracking-widest placeholder-gray-300 focus:border-sky-400 focus:ring-0" value={reportData.licensePlate} onChange={(e) => setReportData({...reportData, licensePlate: e.target.value.toUpperCase()})}/>
                   <p className="text-[10px] text-gray-500 mt-2">Critical for issuing fines.</p>
                </div>
              )}
              
              {/* DESCRIPTION FIELD */}
              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-2">What is happening? (Description)</label>
                 <textarea 
                    rows="4" 
                    placeholder="Describe the situation here... (e.g., 'Truck dumping sand on roadside')" 
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 outline-none shadow-sm"
                    value={reportData.description} 
                    onChange={(e) => setReportData({...reportData, description: e.target.value})}
                 ></textarea>
              </div>

              <div className="flex items-center space-x-3 bg-white p-4 rounded-xl border border-gray-200">
                 <input type="checkbox" id="anon" className="w-5 h-5 text-green-600 rounded focus:ring-green-500" checked={reportData.anonymous} onChange={(e) => setReportData({...reportData, anonymous: e.target.checked})}/>
                 <label htmlFor="anon" className="text-sm text-gray-700 font-medium">Submit Anonymously</label>
              </div>
              <button onClick={() => setReportStep(4)} className="w-full bg-green-800 text-white font-bold py-4 rounded-xl shadow-md flex justify-between items-center px-6"><span>Review Report</span><ChevronRight size={20} /></button>
           </div>
        </div>
      );
    }
    // Step 4: Review
    if (reportStep === 4) {
      return (
         <div className="flex flex-col h-full bg-gray-50 p-6 animate-in slide-in-from-right-10 overflow-y-auto">
            <div className="mb-6">
             <div className="flex items-center justify-between mb-2">
                <button onClick={() => setReportStep(3)} className="text-gray-500 text-sm">Back</button>
                <span className="text-xs font-bold text-green-800">CONFIRM</span>
             </div>
             <h2 className="text-2xl font-bold text-gray-800">Review</h2>
           </div>
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
              <div className="h-48 bg-gray-200 w-full relative">
                 {reportData.imagePreview && <img src={reportData.imagePreview} className="w-full h-full object-cover" alt="Evidence" />}
                 <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <p className="text-white font-mono text-sm flex items-center"><MapPin size={14} className="mr-1" /> {reportData.address}</p>
                 </div>
              </div>
              <div className="p-4 space-y-4">
                 <div className="flex justify-between border-b border-gray-100 pb-2"><span className="text-gray-500 text-sm">Type</span><span className="font-bold text-gray-800 capitalize">{reportData.type.replace('_', ' ')}</span></div>
                 {reportData.licensePlate && <div className="flex justify-between border-b border-gray-100 pb-2"><span className="text-gray-500 text-sm">License Plate</span><span className="font-bold text-sky-600 bg-sky-50 px-2 rounded border border-sky-200">{reportData.licensePlate}</span></div>}
                 
                 {/* Review Description */}
                 <div className="border-b border-gray-100 pb-2">
                    <span className="text-gray-500 text-sm block mb-1">Description</span>
                    <p className="text-gray-800 text-sm italic">"{reportData.description || 'No description provided'}"</p>
                 </div>

                 <div className="flex justify-between items-center pt-1"><span className="text-gray-500 text-sm">Identity</span><span className={`text-xs font-bold px-2 py-1 rounded-full ${reportData.anonymous ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>{reportData.anonymous ? 'Anonymous' : 'Linked to Account'}</span></div>
              </div>
           </div>
           <button onClick={submitReport} className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-4 rounded-xl shadow-lg flex justify-center items-center space-x-2 transition-all active:scale-95">
              <Send size={20} />
              <span>{isOnline ? 'SUBMIT REPORT' : 'SAVE FOR LATER'}</span>
           </button>
           <p className="text-center text-xs text-gray-400 mt-4 px-4">{!isOnline && "No internet? No problem. We'll save it automatically."}</p>
         </div>
      );
    }
    // Step 5: Success
    if (reportStep === 5) {
      return (
         <div className="flex flex-col h-full bg-green-800 text-white p-8 items-center justify-center text-center animate-in zoom-in duration-300">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-xl ${isOnline ? 'bg-white text-green-800' : 'bg-gray-800 text-white'}`}>
               {isOnline ? <CheckCircle size={56} /> : <CloudUpload size={56} />}
            </div>
            <h2 className="text-3xl font-bold mb-2">{isOnline ? 'Received!' : 'Saved to Device'}</h2>
            <p className="text-green-100 mb-2 text-lg">
               {isOnline ? "Your report is now in the EPA enforcement queue." : "Your report will upload automatically when you have signal."}
            </p>
            <div className="bg-white/10 rounded-lg p-3 mb-8">
               <p className="text-yellow-300 font-bold text-xl">+20 pts</p>
               <p className="text-green-200 text-xs">Points added to your rank</p>
            </div>
            <button onClick={resetForm} className="bg-white text-green-900 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-gray-100 transition-colors">Return Home</button>
         </div>
      );
    }
    return null;
  };

  const InstallModal = () => {
    if (!showInstallModal) return null;
    return (
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center pointer-events-none">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={() => setShowInstallModal(false)}></div>
        <div className="bg-white w-full max-w-sm mx-4 mb-4 sm:mb-0 rounded-2xl p-6 shadow-2xl pointer-events-auto animate-in slide-in-from-bottom-10 relative">
          <button onClick={() => setShowInstallModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
          <div className="flex flex-col items-center text-center">
            <div className="relative w-20 h-20 mb-4">
               <img 
                  src="/Picture1.jpg" 
                  alt="App Icon" 
                  className="w-20 h-20 rounded-2xl shadow-md bg-white object-contain absolute top-0 left-0 z-10"
                  onError={(e) => { e.target.style.opacity = 0; }}
               />
               <div className="w-20 h-20 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center absolute top-0 left-0"><Shield size={40} /></div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Install Clean592</h3>
            <p className="text-gray-500 text-sm mb-6">Works offline! Add to your home screen.</p>
            <div className="w-full bg-gray-50 rounded-xl p-4 mb-3 text-left border border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase mb-2 block">iPhone / iPad</span>
              <ol className="text-sm text-gray-700 space-y-2"><li className="flex items-center"><Share2 size={16} className="mr-2 text-blue-500" /> 1. Tap <strong>Share</strong>.</li><li className="flex items-center"><div className="w-4 h-4 border border-gray-400 rounded-sm mr-2 flex items-center justify-center text-[10px] font-bold">+</div> 2. Select <strong>Add to Home Screen</strong>.</li></ol>
            </div>
            <div className="w-full bg-gray-50 rounded-xl p-4 text-left border border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase mb-2 block">Android</span>
              <ol className="text-sm text-gray-700 space-y-2"><li className="flex items-center"><div className="w-1 h-4 bg-gray-400 rounded-full mr-1 rotate-45"></div> 1. Tap browser menu.</li><li className="flex items-center"><Download size={16} className="mr-2 text-emerald-600" /> 2. Tap <strong>Install App</strong>.</li></ol>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans max-w-md mx-auto shadow-2xl overflow-hidden relative">
      <InstallModal />
      <Header />
      <div className="flex-1 overflow-hidden relative">{activeTab === 'home' ? <HomeScreen /> : activeTab === 'history' ? <HistoryScreen /> : <ReportWizard />}</div>
      {activeTab === 'home' && (
        <div className="bg-white border-t border-gray-200 p-2 flex justify-around items-center absolute bottom-0 w-full z-10 pb-6 pt-3">
          <button onClick={() => setActiveTab('home')} className="flex flex-col items-center text-green-800 space-y-1"><div className="p-1 rounded-full bg-green-50"><MapPin size={24} /></div><span className="text-[10px] font-bold">Home</span></button>
          <button onClick={() => {setReportStep(1); setActiveTab('report');}} className="flex flex-col items-center text-gray-400 hover:text-green-800 space-y-1 -mt-8"><div className="bg-sky-500 p-4 rounded-full shadow-lg border-4 border-gray-50 text-white"><Camera size={32} /></div></button>
          <button onClick={() => setActiveTab('history')} className="flex flex-col items-center text-gray-400 space-y-1 hover:text-green-800"><Clock size={24} /><span className="text-[10px] font-bold">History</span></button>
        </div>
      )}
    </div>
  );
};

export default App;
