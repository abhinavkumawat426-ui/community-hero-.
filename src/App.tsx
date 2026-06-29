import React, { useState, useEffect, useRef } from "react";
import { 
  MapPin, 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  MessageSquare, 
  Send, 
  RefreshCw, 
  Plus, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  Map as MapIcon, 
  Eye, 
  Flag, 
  ThumbsUp, 
  ThumbsDown, 
  Check, 
  PlusCircle, 
  ArrowRight,
  Sliders,
  BadgeAlert,
  Loader2,
  Mic,
  Square,
  Play,
  Pause,
  Volume2,
  User,
  Wrench,
  Phone,
  Sparkle,
  Bell,
  ShieldAlert,
  Droplets,
  Trash2,
  Download,
  Users,
  Flame,
  Crown,
  Clock,
  KeyRound,
  Lock,
  EyeOff
} from "lucide-react";
import { usePasswordValidation } from "./hooks/usePasswordValidation";
import { motion, AnimatePresence } from "motion/react";
import { Issue, UserProfile, Comment } from "./types";
import MapContainer from "./components/MapContainer";
import { useI18n } from "./context/I18nContext";
import { runA11yAudit } from "./utils/a11yLogger";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

const PRESET_IMAGES = [
  {
    name: "Road Damage / Pothole",
    url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80",
    defaultTitle: "Deep Pothole",
    category: "Road Safety & Potholes"
  },
  {
    name: "Water Utility Leakage",
    url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80",
    defaultTitle: "Broken Water Pipe",
    category: "Water & Utilities"
  },
  {
    name: "Darkness / Dead Streetlight",
    url: "https://images.unsplash.com/photo-1508849789987-4e5333c12b78?auto=format&fit=crop&w=600&q=80",
    defaultTitle: "Damaged Alleyway Light",
    category: "Public Lights & Electrical"
  },
  {
    name: "Trash Pile / Illegal Dump",
    url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80",
    defaultTitle: "Illegal Greenway Dumping",
    category: "Waste & Sanitation"
  }
];

const ISSUE_TEMPLATES = [
  {
    id: "pothole",
    name: "Road Pothole",
    defaultTitle: "Severe Road Pothole Obstruction",
    category: "Road Safety & Potholes",
    tags: ["pothole", "road-hazard", "asphalt-damage", "traffic-safety"],
    description: "Deep asphalt pothole observed on the road. Poses a severe tire damage hazard and causes oncoming vehicles to swerve unpredictably.",
    urgency: "high"
  },
  {
    id: "streetlight",
    name: "Streetlight Out",
    defaultTitle: "Broken Streetlight & Dark Alleyway",
    category: "Public Lights & Electrical",
    tags: ["streetlight-out", "electrical", "darkness", "safety-risk"],
    description: "The street light in this area is completely non-functional. The walkway is pitch black at night, causing residents to feel unsafe.",
    urgency: "medium"
  },
  {
    id: "water_leak",
    name: "Water Leak",
    defaultTitle: "Sidewalk Water Main Overflow & Flooding",
    category: "Water & Utilities",
    tags: ["water-leak", "utility-burst", "flooding", "erosion"],
    description: "Freshwater is leaking continuously from the sidewalk, wasting significant clean water and creating extremely slick and hazardous pavement.",
    urgency: "medium"
  },
  {
    id: "illegal_dumping",
    name: "Illegal Dumping",
    defaultTitle: "Illegal Solid Trash Dumping & Waste Accrual",
    category: "Waste & Sanitation",
    tags: ["trash-dump", "sanitation", "toxic-hazard", "fly-tipping"],
    description: "A large pile of illegal waste, mattresses, and debris has been discarded here on public ground, attracting pests and degrading the environment.",
    urgency: "medium"
  }
];

const renderBadgeIcon = (iconName: string) => {
  switch (iconName) {
    case "Eye": return <Eye className="w-5 h-5 text-emerald-400 shrink-0" />;
    case "Award": return <Award className="w-5 h-5 text-amber-400 shrink-0" />;
    case "Flag": return <Flag className="w-5 h-5 text-blue-400 shrink-0" />;
    case "ShieldAlert": return <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />;
    case "Sparkles": return <Sparkles className="w-5 h-5 text-yellow-400 shrink-0" />;
    case "Droplets": return <Droplets className="w-5 h-5 text-sky-400 shrink-0" />;
    case "Trash2": return <Trash2 className="w-5 h-5 text-orange-400 shrink-0" />;
    case "Crown": return <Crown className="w-5 h-5 text-amber-400 shrink-0" />;
    case "Shield": return <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0" />;
    case "Cpu": return <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />;
    case "Smile": return <Award className="w-5 h-5 text-teal-400 shrink-0" />;
    case "Leaf": return <Award className="w-5 h-5 text-emerald-400 shrink-0" />;
    default: return <Award className="w-5 h-5 text-teal-400 shrink-0" />;
  }
};

interface TimelineCountdownProps {
  issue: Issue;
}

const TimelineCountdown: React.FC<TimelineCountdownProps> = ({ issue }) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!issue.deadlineAt) return;

    const calculateTime = () => {
      const diff = new Date(issue.deadlineAt!).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft(0);
        setIsExpired(true);
      } else {
        setTimeLeft(Math.floor(diff / 1000));
        setIsExpired(false);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [issue.deadlineAt, issue.status]);

  if (!issue.deadlineAt) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className={`p-4 rounded-2xl border flex flex-col gap-2 transition-all ${
      issue.status === "resolved" 
        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
        : isExpired
        ? "bg-rose-50 text-rose-800 border-rose-200 animate-pulse"
        : "bg-amber-50 text-amber-900 border-amber-200"
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          {issue.status === "resolved" ? "Resolution Report" : "Active Safety Timeline"}
        </span>
        <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${
          issue.status === "resolved"
            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
            : isExpired
            ? "bg-rose-100 text-rose-800 border-rose-300"
            : "bg-amber-100 text-amber-800 border-amber-300"
        }`}>
          {issue.status === "resolved" ? "Certified Completed" : isExpired ? "Expired" : "In Flight"}
        </span>
      </div>

      {issue.status === "resolved" ? (
        <div className="text-xs space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-slate-800">
            <span>🎉 Completion Status:</span>
            <span className={issue.pointsEarned === 100 ? "text-emerald-600 font-black" : "text-amber-600 font-bold"}>
              {issue.pointsEarned === 100 ? "Beat the Timeline (+100 XP Bonus)" : "Overtime Low Loss Margin (+35 XP)"}
            </span>
          </p>
          <p className="text-[10px] text-slate-500 font-mono">
            Accepted: {issue.acceptedAt ? new Date(issue.acceptedAt).toLocaleTimeString() : "N/A"} | 
            Resolved: {issue.resolvedAt ? new Date(issue.resolvedAt).toLocaleTimeString() : "N/A"}
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-700">
              {isExpired 
                ? "The timeline has expired! Resolving now will award low loss margin points (+35 XP)."
                : "Resolve this issue before the timer expires to secure the full +100 XP bonus."}
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              Deadline Target: {new Date(issue.deadlineAt).toLocaleTimeString()}
            </p>
          </div>
          <div className={`text-2xl font-black font-mono px-3.5 py-2 rounded-xl border shrink-0 text-center shadow-sm ${
            isExpired 
              ? "bg-rose-100 text-rose-700 border-rose-300"
              : "bg-amber-100 text-amber-700 border-amber-300"
          }`}>
            {timeLeft !== null ? formatTime(timeLeft) : "0:00"}
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const { language, setLanguage, t } = useI18n();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  const [activeTab, setActiveTab] = useState<"map" | "dashboard" | "verify" | "leaderboard" | "architect" | "prioritize">("map");
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // New multi-image state
  const [newImageUrls, setNewImageUrls] = useState<string[]>([]);

  // Registration states

  // AI prioritizer states
  const [prioritizedIssues, setPrioritizedIssues] = useState<Array<{
    id: string;
    rank: number;
    title: string;
    priorityScore: number;
    priorityLevel: "Critical" | "High" | "Medium" | "Low";
    rationale: string;
    suggestedResourceAllocation: string;
  }>>([]);
  const [loadingPrioritized, setLoadingPrioritized] = useState(false);
  const [severityWeight, setSeverityWeight] = useState(25);
  const [urgencyWeight, setUrgencyWeight] = useState(25);
  const [dangerWeight, setDangerWeight] = useState(25);
  const [affectedUsersWeight, setAffectedUsersWeight] = useState(25);

  // Elite Architect Filter States
  const [selectedAnchorStation, setSelectedAnchorStation] = useState("city_hall");
  const [maxProximityDistance, setMaxProximityDistance] = useState<number>(5); // default max 5km
  const [selectedGuild, setSelectedGuild] = useState<string>("all"); // "all", "plumbing", "carpentry", "electrical", "roads", "security"
  const [architectSearch, setArchitectSearch] = useState("");

  // In-App Notifications State
  const [notifications, setNotifications] = useState<Array<{id: string, text: string, type: 'success' | 'info' | 'alert', read: boolean}>>([
    { id: "welcome", text: "Welcome Elite Architect! Telemetry streams initialized successfully.", type: "info", read: false },
    { id: "audit", text: "Audit complete: 🚰 Water pressure anomalies identified near Cloverdale Ave.", type: "alert", read: false }
  ]);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);

  // Anchor Stations Definition
  const ANCHOR_STATIONS = [
    { id: "city_hall", name: "City Hall HQ", lat: 37.7790, lng: -122.4160 },
    { id: "presidio", name: "Presidio Base", lat: 37.7980, lng: -122.4660 },
    { id: "mission", name: "Mission Station", lat: 37.7600, lng: -122.4190 },
    { id: "sunset", name: "Sunset Sector", lat: 37.7500, lng: -122.4800 },
    { id: "financial", name: "Financial Hub", lat: 37.7940, lng: -122.4010 }
  ];

  // GPS Distance Calculator (SF spherical approximation)
  const getDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // earth radius
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  
  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");

  // Loading and Progress indicators
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshingIssues, setRefreshingIssues] = useState(false);

  // New issue report form state
  const [reportMode, setReportMode] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newLatitude, setNewLatitude] = useState(37.7800);
  const [newLongitude, setNewLongitude] = useState(-122.4100);
  const [newImageUrl, setNewImageUrl] = useState(PRESET_IMAGES[0].url);
  const [imageUploadPreview, setImageUploadPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Audio notes & Reporter customization
  const [newAudioUrl, setNewAudioUrl] = useState<string>("");
  const [reporterContact, setReporterContact] = useState("");
  const [customReporterName, setCustomReporterName] = useState("");
  const [autoRecognized, setAutoRecognized] = useState(true);
  
  // State variables for authority responses and prioritize search
  const [officialResponseTexts, setOfficialResponseTexts] = useState<Record<string, string>>({});
  const [prioritizeSearch, setPrioritizeSearch] = useState("");
  const [prioritizeLevelFilter, setPrioritizeLevelFilter] = useState("all");
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [customCategory, setCustomCategory] = useState("Other");
  const [customUrgency, setCustomUrgency] = useState("medium");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);
  const [activityDateFilter, setActivityDateFilter] = useState<"all" | "month" | "year" | "30days">("all");

  // Helper to filter user's activity
  const getUserActivityIssues = () => {
    if (!userProfile) return [];

    // First filter by participation
    const userIssues = issues.filter(i => 
      i.reporterName === userProfile.name ||
      i.upvotedBy.includes(userProfile.id) ||
      i.downvotedBy.includes(userProfile.id)
    );

    // Then filter by date
    const now = new Date();
    return userIssues.filter(i => {
      if (activityDateFilter === "all") return true;

      const createdDate = new Date(i.createdAt);
      if (isNaN(createdDate.getTime())) return true; // fallback for non-date strings

      if (activityDateFilter === "month") {
        return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
      }

      if (activityDateFilter === "year") {
        return createdDate.getFullYear() === now.getFullYear();
      }

      if (activityDateFilter === "30days") {
        const diffTime = Math.abs(now.getTime() - createdDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
      }

      return true;
    });
  };

  // CSV Export Action
  const handleExportCSV = () => {
    const userLogs = getUserActivityIssues();
    if (userLogs.length === 0) return;

    // Build CSV header & rows
    const headers = ["Issue ID", "Title", "Category", "Status", "Urgency", "Address", "Latitude", "Longitude", "Created At"];
    const rows = userLogs.map(i => [
      i.id,
      `"${i.title.replace(/"/g, '""')}"`,
      `"${i.category}"`,
      i.status,
      i.urgency,
      `"${i.address.replace(/"/g, '""')}"`,
      i.latitude,
      i.longitude,
      i.createdAt
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `citizen_activity_${userProfile?.name.replace(/\s+/g, "_") || "export"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Registration & Sign-In Screen state
  const [showAuthScreen, setShowAuthScreen] = useState(true);
  const [authName, setAuthName] = useState("");
  const [authContact, setAuthContact] = useState("");
  const [authSector, setAuthSector] = useState("Oakridge Meadows");
  const [authAvatar, setAuthAvatar] = useState("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authRole, setAuthRole] = useState<"citizen" | "architect">("citizen");
  const [authSpecialty, setAuthSpecialty] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");

  const passwordResult = usePasswordValidation(authPassword);
  
  // Refs for audio recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Comments and Official response state
  const [commentText, setCommentText] = useState("");
  const [simulatingStatus, setSimulatingStatus] = useState<string>("");
  const [officialResponseText, setOfficialResponseText] = useState("");
  const [showStatusPanel, setShowStatusPanel] = useState(false);
  const [inlineNotes, setInlineNotes] = useState<Record<string, string>>({});



  // Load all initial data
  const loadData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const storedUserId = localStorage.getItem("elite_user_id") || "user-test";
      const [resIssues, resLeaderboard, resProfile] = await Promise.all([
        fetch("/api/issues").then(r => r.json()),
        fetch("/api/leaderboard").then(r => r.json()),
        fetch(`/api/user-profile/${storedUserId}`).then(r => r.json())
      ]);

      setIssues(resIssues);
      setLeaderboard(resLeaderboard);
      setUserProfile(resProfile);

      if (resProfile) {
        setAuthName(resProfile.name || "");
        setAuthAvatar(resProfile.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80");
        if (localStorage.getItem("elite_user_id")) {
          setShowAuthScreen(false);
          if (resProfile.role === "architect") {
            setActiveTab("architect");
          }
        }
      }

      // Load initial prioritized issues so that ranks and scores are populated at startup
      try {
        const pRes = await fetch("/api/ai/prioritize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            severityWeight: 25,
            urgencyWeight: 25,
            dangerWeight: 25,
            affectedUsersWeight: 25
          })
        });
        const pData = await pRes.json();
        setPrioritizedIssues(pData);
      } catch (err) {
        console.error("Startup prioritize failed:", err);
      }

      // Auto-select first issue if none is selected and we have issues
      if (resIssues.length > 0 && !selectedIssueId) {
        setSelectedIssueId(resIssues[0].id);
      }
    } catch (e) {
      console.error("Error loading Community Hero database state:", e);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Run automated WCAG accessibility testing scans on screen changes
  useEffect(() => {
    const timer = setTimeout(() => {
      runA11yAudit();
    }, 700);
    return () => clearTimeout(timer);
  }, [activeTab, showAuthScreen]);

  // Load prioritized issues for public planning
  const loadPrioritizedIssues = async (
    sW = severityWeight,
    uW = urgencyWeight,
    dW = dangerWeight,
    aW = affectedUsersWeight
  ) => {
    setLoadingPrioritized(true);
    try {
      const res = await fetch("/api/ai/prioritize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          severityWeight: sW,
          urgencyWeight: uW,
          dangerWeight: dW,
          affectedUsersWeight: aW
        })
      });
      const data = await res.json();
      setPrioritizedIssues(data);
    } catch (e) {
      console.error("Failed to load prioritized list:", e);
    } finally {
      setLoadingPrioritized(false);
    }
  };

  useEffect(() => {
    if (activeTab === "prioritize") {
      loadPrioritizedIssues();
    }
  }, [activeTab]);

  // Sync up issues periodically or on demand
  const handleRefreshIssues = async () => {
    setRefreshingIssues(true);
    try {
      const res = await fetch("/api/issues");
      const data = await res.json();
      setIssues(data);
    } catch (e) {
      console.error("Failed to sync issues:", e);
    } finally {
      setRefreshingIssues(false);
    }
  };



  // Upvote / Verify
  const handleUpvote = async (issueId: string) => {
    if (!userProfile) return;
    try {
      const response = await fetch(`/api/issues/${issueId}/upvote`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userProfile.id })
      });
      if (response.ok) {
        const updatedIssue = await response.json();
        // Update issues local state
        setIssues(prev => prev.map(i => i.id === issueId ? updatedIssue : i));
        // Reload profiles to reflect points/badges earned
        const updatedProf = await fetch(`/api/user-profile/${userProfile.id}`).then(r => r.json());
        setUserProfile(updatedProf);
        // Refresh leaderboards
        const updatedLeaderboard = await fetch("/api/leaderboard").then(r => r.json());
        setLeaderboard(updatedLeaderboard);
      }
    } catch (e) {
      console.error("Upvote failed:", e);
    }
  };

  // Downvote / Flag
  const handleDownvote = async (issueId: string) => {
    if (!userProfile) return;
    try {
      const response = await fetch(`/api/issues/${issueId}/downvote`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userProfile.id })
      });
      if (response.ok) {
        const updatedIssue = await response.json();
        setIssues(prev => prev.map(i => i.id === issueId ? updatedIssue : i));
      }
    } catch (e) {
      console.error("Downvote failed:", e);
    }
  };

  // Join Interest Support
  const handleJoinInterest = async (issueId: string) => {
    if (!userProfile) return;
    try {
      const response = await fetch(`/api/issues/${issueId}/join-interest`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: userProfile.id,
          userName: userProfile.name,
          userAvatar: userProfile.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
        })
      });
      if (response.ok) {
        const updatedIssue = await response.json();
        // Update issues local state
        setIssues(prev => prev.map(i => i.id === issueId ? updatedIssue : i));
        
        // Reload user profile for point gains
        const updatedProf = await fetch(`/api/user-profile/${userProfile.id}`).then(r => r.json());
        setUserProfile(updatedProf);
        
        // Refresh leaderboards
        const updatedLeaderboard = await fetch("/api/leaderboard").then(r => r.json());
        setLeaderboard(updatedLeaderboard);

        // Instantly recalculate priority scores & ranks
        loadPrioritizedIssues();
      }
    } catch (e) {
      console.error("Join interest failed:", e);
    }
  };

  // Status simulation by City Coordinator
  const handleStatusChange = async (issueId: string) => {
    if (!simulatingStatus) return;
    try {
      const response = await fetch(`/api/issues/${issueId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: simulatingStatus,
          officialComment: officialResponseText || `Status updated to ${simulatingStatus.replace('_', ' ')} by our dispatch division.`
        })
      });
      if (response.ok) {
        const updated = await response.json();
        setIssues(prev => prev.map(i => i.id === issueId ? updated : i));
        setOfficialResponseText("");
        setSimulatingStatus("");
        setShowStatusPanel(false);
      }
    } catch (e) {
      console.error("Status update simulation failed:", e);
    }
  };

  // Elite Architect: Accept Issue Dispatch Job
  const handleAcceptIssue = async (issueId: string) => {
    if (!userProfile) return;
    try {
      const response = await fetch(`/api/issues/${issueId}/accept`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userProfile.id,
          userName: userProfile.name,
          userAvatar: userProfile.avatar
        })
      });
      if (response.ok) {
        const updated = await response.json();
        setIssues(prev => prev.map(i => i.id === issueId ? updated : i));
        
        // Award XP and sync
        const updatedProfile = await fetch(`/api/user-profile/${userProfile.id}`).then(r => r.json());
        setUserProfile(updatedProfile);

        // Add to Notifications stream
        const newNotification = {
          id: Date.now().toString(),
          title: "🛠️ Task Accepted",
          message: `You successfully accepted task #${issueId}. Action plan diagnostics started.`,
          time: "Just Now",
          type: "verification"
        };
        setNotifications(prev => [newNotification, ...prev]);
      }
    } catch (e) {
      console.error("Accepting issue failed:", e);
    }
  };

  // Elite Architect: Resolve Issue (Closeout Ticket)
  const handleResolveIssue = async (issueId: string, notes: string) => {
    if (!userProfile) return;
    try {
      const response = await fetch(`/api/issues/${issueId}/resolve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userProfile.id,
          userName: userProfile.name,
          userAvatar: userProfile.avatar,
          resolutionNotes: notes
        })
      });
      if (response.ok) {
        const updated = await response.json();
        setIssues(prev => prev.map(i => i.id === issueId ? updated : i));
        
        // Award XP and sync
        const updatedProfile = await fetch(`/api/user-profile/${userProfile.id}`).then(r => r.json());
        setUserProfile(updatedProfile);

        const pts = updated.pointsEarned || 50;

        // Add to Notifications stream
        const newNotification = {
          id: Date.now().toString(),
          title: pts === 100 ? "🏆 Timeline Success!" : "⏱️ Timeline Expired",
          message: pts === 100 
            ? `Task resolved on-time! Secure full +100 XP bonus!` 
            : `Task resolved after deadline. +35 XP awarded (low loss margin rule).`,
          time: "Just Now",
          type: "badge" as any
        };
        setNotifications(prev => [newNotification, ...prev]);
      }
    } catch (e) {
      console.error("Resolving issue failed:", e);
    }
  };

  // Elite Architect Guild Dispatch Handler
  const handleDispatchGuildUnit = async (issueId: string, guildName: string) => {
    try {
      const response = await fetch(`/api/issues/${issueId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "assigned",
          officialComment: `[Elite Trade Guild Dispatched] Specialized ${guildName} Unit has been dispatched to coordinates by direct order of the Elite Architect.`
        })
      });
      if (response.ok) {
        const updated = await response.json();
        setIssues(prev => prev.map(i => i.id === issueId ? updated : i));
        
        // Award XP points (+50 XP)
        if (userProfile) {
          const updatedProfile = { ...userProfile, points: userProfile.points + 50 };
          setUserProfile(updatedProfile);
        }

        // Add to Notifications stream
        const newNotification = {
          id: Date.now().toString(),
          text: `SUCCESS: Specialized ${guildName} unit dispatched to "${updated.title}"! +50 XP awarded.`,
          type: "success" as const,
          read: false
        };
        setNotifications(prev => [newNotification, ...prev]);
      }
    } catch (e) {
      console.error("Guild dispatch failed:", e);
    }
  };

  // Post a comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssueId || !commentText.trim() || !userProfile) return;

    try {
      const response = await fetch(`/api/issues/${selectedIssueId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userProfile.id,
          userName: userProfile.name,
          userAvatar: userProfile.avatar,
          content: commentText.trim(),
          isOfficialResponse: false
        })
      });
      if (response.ok) {
        const updatedIssue = await response.json();
        setIssues(prev => prev.map(i => i.id === selectedIssueId ? updatedIssue : i));
        setCommentText("");
        
        // Award user points for dynamic citizen discussion!
        const updatedProf = await fetch(`/api/user-profile/${userProfile.id}`).then(r => r.json());
        setUserProfile(updatedProf);
      }
    } catch (e) {
      console.error("Comment submission failed:", e);
    }
  };

  // Authority Dispatch & Action Handler
  const handleAuthorityAction = async (issueId: string, status: string, commentText: string) => {
    try {
      const response = await fetch(`/api/issues/${issueId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status,
          officialComment: commentText || `Status updated to "${status.replace('_', ' ').toUpperCase()}" by Municipal Dispatch Authority.`
        })
      });
      if (response.ok) {
        const updated = await response.json();
        setIssues(prev => prev.map(i => i.id === issueId ? updated : i));
        
        // Clear input text for this issue
        setOfficialResponseTexts(prev => ({ ...prev, [issueId]: "" }));
        
        // Push a success notification
        const newNotification = {
          id: "dispatch-" + Date.now(),
          text: `✓ Dispatch Active: "${updated.title}" set to status "${status.toUpperCase()}"`,
          type: "success" as const,
          read: false
        };
        setNotifications(prev => [newNotification, ...prev]);
        
        // Refresh prioritization weights in background
        loadPrioritizedIssues();
      }
    } catch (e) {
      console.error("Authority status transition failed:", e);
    }
  };

  // Handle Drag & Drop simulated upload
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFiles = (files: FileList) => {
    const loadedUrls: string[] = [];
    let processed = 0;
    const targetLength = files.length;
    
    for (let i = 0; i < targetLength; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          loadedUrls.push(reader.result);
        }
        processed++;
        if (processed === targetLength) {
          setNewImageUrls(prev => [...prev, ...loadedUrls]);
          setImageUploadPreview(loadedUrls[0]);
          setNewImageUrl(loadedUrls[0]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  // Select Preset Photo
  const handlePresetSelect = (preset: typeof PRESET_IMAGES[0]) => {
    setImageUploadPreview(null);
    setNewImageUrl(preset.url);
    setNewImageUrls([preset.url]);
    if (!newTitle) setNewTitle(preset.defaultTitle);
  };

  // Select Preset Issue Template
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = ISSUE_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setNewTitle(template.defaultTitle);
      setCustomCategory(template.category);
      setNewDescription(template.description);
      setCustomUrgency(template.urgency);
      setNewTags(template.tags);

      // Match preset image if we have one
      const matchedImage = PRESET_IMAGES.find(p => p.category === template.category);
      if (matchedImage) {
        setImageUploadPreview(null);
        setNewImageUrl(matchedImage.url);
      }
    } else {
      setSelectedTemplate("");
      setNewTags([]);
    }
  };

  // Handle reporting location choice from map click
  const handleSelectMapCoordinates = (lat: number, lng: number, address: string) => {
    setNewLatitude(lat);
    setNewLongitude(lng);
    setNewAddress(address);
  };

  // Start recording voice memo
  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      setRecordingTime(0);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: "audio/webm" };
      
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const previewUrl = URL.createObjectURL(audioBlob);
        setAudioPreviewUrl(previewUrl);

        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          setNewAudioUrl(base64Audio);

          if (autoRecognized) {
            await runAutoRecognize(base64Audio, null);
          }
        };
        reader.readAsDataURL(audioBlob);

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Microphone access failed:", err);
      alert("Could not access microphone. Please check permissions in your browser or iframe.");
    }
  };

  // Stop recording voice memo
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Call the AI auto-recognize endpoint
  const runAutoRecognize = async (audioData: string | null, textData: string | null) => {
    setIsRecognizing(true);
    try {
      const response = await fetch("/api/auto-recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio: audioData,
          text: textData,
          mimeType: "audio/webm"
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.title) setNewTitle(result.title);
        if (result.description) setNewDescription(result.description);
        if (result.category) setCustomCategory(result.category);
        if (result.urgency) setCustomUrgency(result.urgency);
      }
    } catch (e) {
      console.error("Failed to auto recognize details:", e);
    } finally {
      setIsRecognizing(false);
    }
  };

  // Trigger auto-recognize manually
  const handleManualAutoRecognize = async () => {
    if (newAudioUrl) {
      await runAutoRecognize(newAudioUrl, null);
    } else if (newDescription) {
      await runAutoRecognize(null, newDescription);
    }
  };

  // Sync state for report mode cleanup/initialization
  useEffect(() => {
    if (reportMode) {
      setNewTitle("");
      setNewDescription("");
      setNewAudioUrl("");
      setAudioPreviewUrl(null);
      setCustomReporterName(userProfile?.name || "");
      setReporterContact("");
      setCustomCategory("Other");
      setCustomUrgency("medium");
    } else {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [reportMode]);

  // Submit Issue
  const handleSubmitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim() || !newAddress.trim() || !userProfile) return;

    setSubmitting(true);
    try {
      const formattedDescription = newDescription.trim() + (newTags.length > 0 ? `\n\nTags: ${newTags.map(t => `#${t}`).join(" ")}` : "");
      
      // Use the first uploaded image as primary imageUrl, otherwise fallback
      const primaryUrl = newImageUrls.length > 0 ? newImageUrls[0] : newImageUrl;

      const response = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: formattedDescription,
          address: newAddress.trim(),
          latitude: newLatitude,
          longitude: newLongitude,
          imageUrl: primaryUrl,
          imageUrls: newImageUrls.length > 0 ? newImageUrls : [primaryUrl],
          audioUrl: newAudioUrl,
          reporterId: userProfile.id,
          reporterName: customReporterName.trim() || userProfile.name,
          reporterContact: reporterContact.trim(),
          category: customCategory,
          urgency: customUrgency,
          autoRecognized: autoRecognized
        })
      });

      if (response.ok) {
        const created = await response.json();
        setIssues(prev => [created, ...prev]);
        setSelectedIssueId(created.id);
        
        // Reset state & exit report mode
        setNewTitle("");
        setNewDescription("");
        setNewAddress("");
        setImageUploadPreview(null);
        setNewImageUrls([]);
        setSelectedTemplate("");
        setNewTags([]);
        setReportMode(false);
        setActiveTab("map");

        // Reload user info to get the points & First Reporter Badge
        const updatedProf = await fetch(`/api/user-profile/${userProfile.id}`).then(r => r.json());
        setUserProfile(updatedProf);
      }
    } catch (e) {
      console.error("Create issue failed:", e);
    } finally {
      setSubmitting(false);
    }
  };

  // Reset System Handler
  const handleSystemReset = async () => {
    if (!window.confirm("This will clear customized reports and restore the initial mock database. Proceed?")) return;
    setLoading(true);
    try {
      const response = await fetch("/api/system/reset", { method: "POST" });
      if (response.ok) {
        const data = await response.json();
        setIssues(data.issues);
        setUserProfile(data.userProfiles["user-test"]);
        setSelectedIssueId(data.issues[0]?.id || null);
        setActiveTab("map");
        setReportMode(false);
      }
    } catch (e) {
      console.error("Reset failed:", e);
    } finally {
      setLoading(false);
    }
  };

  // Citizen Authentication & Profile Registration Handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (!authName.trim()) return;

    // Validate password strength
    if (!authPassword) {
      setAuthError("Password is required to register ID credentials.");
      return;
    }
    if (passwordResult.score < 2) {
      setAuthError(`Password is too weak (${passwordResult.feedback}). Please meet at least 2 security criteria.`);
      return;
    }

    setAuthSubmitting(true);
    try {
      const generatedId = `user-${Math.random().toString(36).substring(2, 11)}`;
      const response = await fetch("/api/user-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: generatedId,
          name: authName.trim(),
          avatar: authAvatar,
          role: authRole,
          specialty: authRole === "architect" ? authSpecialty : "",
          contact: authContact
        })
      });
      if (response.ok) {
        const updated = await response.json();
        setUserProfile(updated);
        localStorage.setItem("elite_user_id", updated.id);
        if (updated.token) {
          localStorage.setItem("elite_token", updated.token);
        }
        setShowAuthScreen(false);
      } else {
        const errData = await response.json().catch(() => ({}));
        setAuthError(errData.error || "Failed to register profile.");
      }
    } catch (err) {
      console.error("Auth submit failed:", err);
      setAuthError("Failed to register ID credentials. Please try again.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Stats derivation
  const totalReported = issues.length;
  const totalResolved = issues.filter(i => i.status === "resolved").length;
  const totalInProgress = issues.filter(i => i.status === "in_progress" || i.status === "assigned").length;

  const categoryStats = [
    { name: "Roads & Safety", count: issues.filter(i => i.category === "Road Safety & Potholes").length, color: "bg-red-500" },
    { name: "Water & Utilities", count: issues.filter(i => i.category === "Water & Utilities").length, color: "bg-blue-500" },
    { name: "Waste & Sanitation", count: issues.filter(i => i.category === "Waste & Sanitation").length, color: "bg-amber-600" },
    { name: "Lights & Power", count: issues.filter(i => i.category === "Public Lights & Electrical").length, color: "bg-yellow-500" },
    { name: "Other / General", count: issues.filter(i => i.category === "Other").length, color: "bg-purple-500" }
  ].sort((a, b) => b.count - a.count);

  const monthlyImpactData = [
    { name: "Jan", Reported: 12, Resolved: 8 },
    { name: "Feb", Reported: 18, Resolved: 14 },
    { name: "Mar", Reported: 15, Resolved: 12 },
    { name: "Apr", Reported: 24, Resolved: 19 },
    { name: "May", Reported: 32, Resolved: 25 },
    { name: "Jun", Reported: 28 + issues.length, Resolved: 22 + issues.filter(i => i.status === "resolved").length },
  ];

  const userXPData = leaderboard.map(user => ({
    name: user.name.split(" ")[0],
    XP: user.points,
    Reports: user.reportsCount,
    Votes: user.verificationsCount
  })).slice(0, 5);

  const selectedIssue = issues.find(i => i.id === selectedIssueId);

  // Filter issues list
  const filteredIssues = issues.filter(i => {
    const matchesSearch = i.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          i.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          i.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === "all" || i.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col font-sans overflow-x-hidden text-slate-100 relative" id="app-root-container">
      
      {/* Global Header styled with Cosmic Dark Premium */}
      <header className="relative z-30 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md text-white shadow-xl shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Brand using Glowing Cyan */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00796B] rounded-xl flex items-center justify-center shadow-lg border border-teal-500/30">
              <span className="text-xl font-bold text-white font-display">CH</span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight uppercase text-teal-400 font-display">
                Community Hero
              </h1>
              <p className="text-[9px] text-teal-300/70 tracking-wider font-mono uppercase hidden sm:block">Oakridge Meadows Dispatch Grid</p>
            </div>
          </div>

          {/* Navigation Tabs using Space-saving Cyber-Dark Accents with 8px gaps */}
          <nav className="hidden md:flex gap-2.5 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
            <button 
              onClick={() => { setActiveTab("map"); setReportMode(false); setShowAuthScreen(false); }}
              className={`text-xs font-semibold px-4 py-2.5 rounded-lg transition-all ${activeTab === "map" && !reportMode && !showAuthScreen ? "bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-md font-bold" : "text-slate-400 hover:text-slate-100"}`}
            >
              Live Grid Map
            </button>
            <button 
              onClick={() => { setActiveTab("map"); setReportMode(true); setShowAuthScreen(false); }}
              className={`text-xs font-bold px-4 py-2.5 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === "map" && reportMode && !showAuthScreen ? "bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-md font-bold" : "text-slate-400 hover:text-slate-100"}`}
            >
              <PlusCircle className="w-3.5 h-3.5 text-teal-400" />
              <span>Report Issue</span>
            </button>
            <button 
              onClick={() => { setActiveTab("dashboard"); setShowAuthScreen(false); }}
              className={`text-xs font-semibold px-4 py-2.5 rounded-lg transition-all ${activeTab === "dashboard" && !showAuthScreen ? "bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-md font-bold" : "text-slate-400 hover:text-slate-100"}`}
            >
              Impact Dashboard
            </button>
            <button 
              onClick={() => { setActiveTab("verify"); setShowAuthScreen(false); }}
              className={`text-xs font-semibold px-4 py-2.5 rounded-lg transition-all ${activeTab === "verify" && !showAuthScreen ? "bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-md font-bold" : "text-slate-400 hover:text-slate-100"}`}
            >
              Verify Queue
            </button>
            <button 
              onClick={() => { setActiveTab("leaderboard"); setShowAuthScreen(false); }}
              className={`text-xs font-semibold px-4 py-2.5 rounded-lg transition-all ${activeTab === "leaderboard" && !showAuthScreen ? "bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-md font-bold" : "text-slate-400 hover:text-slate-100"}`}
            >
              Leaderboard
            </button>
            <button 
              onClick={() => { setActiveTab("prioritize"); setShowAuthScreen(false); }}
              className={`text-xs font-bold px-4 py-2.5 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === "prioritize" && !showAuthScreen ? "bg-rose-500/25 text-rose-300 border border-rose-500/35 shadow-md" : "text-slate-400 hover:text-rose-300"}`}
            >
              <BadgeAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>AI Priority Hub</span>
            </button>
            <button 
              onClick={() => { setActiveTab("architect"); setShowAuthScreen(false); }}
              className={`text-xs font-bold px-4 py-2.5 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === "architect" && !showAuthScreen ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shadow-md" : "text-slate-400 hover:text-yellow-400"}`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Elite Architect Portal</span>
            </button>

          </nav>

          {/* User Scorebox Profile & Registration toggle with real-time notifications */}
          <div className="flex items-center gap-4">
            
            {/* In-App Notifications Bell Icon */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationsMenu(prev => !prev)}
                className="relative p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-100 hover:border-slate-700 transition-all"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-slate-900 rounded-full animate-bounce"></span>
                )}
              </button>

              {showNotificationsMenu && (
                <div className="absolute right-0 mt-3 w-80 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-2xl z-50 text-xs text-slate-300 animate-fade-in backdrop-blur-md">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-2">
                    <span className="font-bold text-slate-100 font-display">Notifications</span>
                    <button
                      onClick={() => {
                        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                        setShowNotificationsMenu(false);
                      }}
                      className="text-[10px] text-teal-400 hover:underline font-bold"
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-slate-500 text-center py-4">No active notifications</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-2 rounded-lg border text-[11px] leading-relaxed ${n.read ? 'bg-slate-950/30 border-slate-900/80' : 'bg-slate-850 border-slate-800 text-slate-100'}`}>
                          <p>{n.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowAuthScreen(prev => !prev)}
              className="text-[11px] font-bold uppercase bg-teal-600/20 text-teal-300 hover:bg-teal-600/30 px-3.5 py-2.5 rounded-xl border border-teal-500/20 shadow-md transition-all flex items-center gap-1"
            >
              <User className="w-3.5 h-3.5" />
              <span>{showAuthScreen ? "Back to Map" : "Citizen Register"}</span>
            </button>

            <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800/80 rounded-2xl px-4 py-2">
              {userProfile ? (
                <>
                  <div className="text-right">
                    <p className="text-[9px] text-teal-400 font-mono font-bold tracking-widest uppercase">
                      HERO • LEVEL {Math.floor(userProfile.points / 100) + 1}
                    </p>
                    <p className="text-xs font-bold text-slate-100">{userProfile.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono font-bold">{userProfile.points} XP</p>
                  </div>
                  <img 
                    src={userProfile.avatar} 
                    alt={userProfile.name} 
                    className="w-9 h-9 rounded-full border-2 border-teal-500/30 object-cover shadow-inner"
                  />
                  <button
                    onClick={() => {
                      localStorage.removeItem("elite_user_id");
                      localStorage.removeItem("elite_token");
                      setShowAuthScreen(true);
                    }}
                    className="ml-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[9px] font-mono border border-slate-700/60 font-bold uppercase transition-all shrink-0 cursor-pointer"
                    title="Logout or Switch Portal Accounts"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse"></div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-800 bg-slate-950/95 backdrop-blur-md py-3.5 flex-wrap gap-2">
          <button 
            onClick={() => { setActiveTab("map"); setReportMode(false); }}
            className={`flex flex-col items-center gap-1 text-[10px] font-medium ${activeTab === "map" && !reportMode ? "text-teal-400" : "text-slate-400"}`}
          >
            <MapIcon className="w-4 h-4" />
            <span>Map</span>
          </button>
          <button 
            onClick={() => { setActiveTab("map"); setReportMode(true); }}
            className={`flex flex-col items-center gap-1 text-[10px] font-medium ${activeTab === "map" && reportMode ? "text-teal-400" : "text-slate-400"}`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report</span>
          </button>
          <button 
            onClick={() => { setActiveTab("dashboard"); }}
            className={`flex flex-col items-center gap-1 text-[10px] font-medium ${activeTab === "dashboard" ? "text-teal-400" : "text-slate-400"}`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <button 
            onClick={() => { setActiveTab("verify"); }}
            className={`flex flex-col items-center gap-1 text-[10px] font-medium ${activeTab === "verify" ? "text-teal-400" : "text-slate-400"}`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verify</span>
          </button>
          <button 
            onClick={() => { setActiveTab("leaderboard"); }}
            className={`flex flex-col items-center gap-1 text-[10px] font-medium ${activeTab === "leaderboard" ? "text-teal-400" : "text-slate-400"}`}
          >
            <Award className="w-4 h-4" />
            <span>Heroes</span>
          </button>
          <button 
            onClick={() => { setActiveTab("prioritize"); }}
            className={`flex flex-col items-center gap-1 text-[10px] font-medium ${activeTab === "prioritize" ? "text-rose-400" : "text-slate-400"}`}
          >
            <BadgeAlert className="w-4 h-4 text-rose-400" />
            <span>AI Priority</span>
          </button>
          <button 
            onClick={() => { setActiveTab("architect"); }}
            className={`flex flex-col items-center gap-1 text-[10px] font-medium ${activeTab === "architect" ? "text-yellow-400" : "text-slate-400"}`}
          >
            <Sliders className="w-4 h-4" />
            <span>Architect</span>
          </button>

        </div>
      </header>

      {/* Main Core Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col overflow-y-auto">
        
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20" id="loading-fallback">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <h3 className="text-lg font-bold text-slate-800 font-display">Initializing Community Database</h3>
            <p className="text-xs text-slate-500 mt-1 font-mono">Synchronizing state with city telemetry...</p>
          </div>
        ) : showAuthScreen ? (
          /* REGISTRATION SCREEN WITH THEME, PASSWORD STRENGTH METER, AND 28.DP SPACING */
          <div className="flex-1 flex items-center justify-center py-6 sm:py-12 animate-fade-in" id="auth-registration-screen">
            <div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 md:p-10 max-w-2xl w-full text-slate-800">
              
              {/* Heading with Increased Heading Gap (mb-8) */}
              <div className="mb-6 text-center space-y-3">
                <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto border border-teal-100 shadow-sm">
                  <Award className="w-8 h-8 text-[#00796B]" />
                </div>
                <h2 className="text-2xl font-black tracking-tight text-[#0D47A1] font-display">
                  Citizen Hero Hub Registry
                </h2>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Create a localized community profile to report issues, verify active problems, and earn high-contrast reputation badges.
                </p>
              </div>

              {/* Direct Portal Login Options */}
              <div className="mb-8 p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-teal-600" /> Direct Login Portals
                  </span>
                  <span className="text-[9px] font-mono bg-teal-100/60 text-teal-800 font-bold px-2 py-0.5 rounded uppercase">
                    One-Tap Entry
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Option 1: Citizen Login */}
                  <button
                    type="button"
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const res = await fetch("/api/user-profile/user-test").then(r => r.json());
                        setUserProfile(res);
                        localStorage.setItem("elite_user_id", "user-test");
                        setShowAuthScreen(false);
                        setActiveTab("map");
                      } catch (err) {
                        console.error("Direct citizen login failed", err);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-[#00796B] hover:bg-teal-50/10 hover:shadow-sm transition-all text-left cursor-pointer"
                  >
                    <div className="p-2 rounded-lg bg-teal-100/80 text-teal-800">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-800">Citizen Portal</h4>
                      <p className="text-[9px] text-slate-500 font-mono">Sign in as Alex Carter</p>
                    </div>
                  </button>

                  {/* Option 2: Elite Architect Login */}
                  <button
                    type="button"
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const res = await fetch("/api/user-profile/architect-test").then(r => r.json());
                        setUserProfile(res);
                        localStorage.setItem("elite_user_id", "architect-test");
                        setShowAuthScreen(false);
                        setActiveTab("architect");
                      } catch (err) {
                        console.error("Direct architect login failed", err);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-purple-500 hover:bg-purple-50/10 hover:shadow-sm transition-all text-left cursor-pointer"
                  >
                    <div className="p-2 rounded-lg bg-purple-100 text-purple-800">
                      <Crown className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-800">Elite Architect Portal</h4>
                      <p className="text-[9px] text-slate-500 font-mono">Sign in as Diana Sterling</p>
                    </div>
                  </button>


                </div>
              </div>

              <div className="relative flex py-3 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-[10px] uppercase tracking-widest font-bold font-mono">Or Register New Class</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Form with elegant 28.dp spacing (space-y-7) */}
              <form onSubmit={handleAuthSubmit} className="space-y-6">
                <div className="space-y-3">
                  <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                    Select Your Registry Class
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Citizen Advocate (Local) */}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthRole("citizen");
                        setAuthAvatar("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80");
                      }}
                      className={`relative flex flex-col items-start p-4 rounded-2xl border text-left transition-all overflow-hidden cursor-pointer ${
                        authRole === "citizen"
                          ? "border-emerald-500 bg-emerald-50/40 shadow-md shadow-emerald-50/30"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-xl ${authRole === "citizen" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-600"}`}>
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">Citizen Advocate</h4>
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider font-mono">Local Reporter</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Focus on reporting neighborhood concerns and validating peer tickets. Begins with Level 1, 25 points, & specialized badges.
                      </p>
                      {authRole === "citizen" && (
                        <div className="absolute top-3 right-3 w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        </div>
                      )}
                    </button>

                    {/* Elite Architect (Problem Solver) */}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthRole("architect");
                        setAuthAvatar("https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80");
                        if (!authSpecialty || authSpecialty.includes("General")) setAuthSpecialty("🧱 Structural Repairs");
                      }}
                      className={`relative flex flex-col items-start p-4 rounded-2xl border text-left transition-all overflow-hidden cursor-pointer ${
                        authRole === "architect"
                          ? "border-amber-500 bg-gradient-to-br from-purple-50/60 to-amber-50/20 shadow-md shadow-amber-50/30"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-xl ${authRole === "architect" ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-600"}`}>
                          <Crown className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1">
                            Elite Architect
                          </h4>
                          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider font-mono">Solver Guild</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Manage active dispatch tasks, communicate directly, and mark resolutions. Begins with Level 2, 100 points, & solver badges.
                      </p>
                      {authRole === "architect" && (
                        <div className="absolute top-3 right-3 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center animate-pulse">
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Specialty Disciplines Selector for Elite Architect */}
                {authRole === "architect" && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-gradient-to-r from-purple-50/50 to-amber-50/20 border border-purple-100 rounded-2xl space-y-3"
                  >
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-purple-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: "3s" }} /> Specialty Discipline
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Choose an active guild specialty to dynamically highlight optimized matching alerts.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        required={authRole === "architect"}
                        placeholder="e.g. 🧱 Structural Repairs"
                        value={authSpecialty}
                        onChange={(e) => setAuthSpecialty(e.target.value)}
                        className="w-full bg-white border border-purple-200 text-purple-950 px-4 py-2.5 rounded-xl text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {[
                        { label: "Structural Repairs", icon: "🧱" },
                        { label: "Hydrology & Drainage", icon: "💧" },
                        { label: "Grid & Electrics", icon: "⚡" },
                        { label: "Waste & Sanitation", icon: "♻️" }
                      ].map((chip) => {
                        const val = `${chip.icon} ${chip.label}`;
                        const isSelected = authSpecialty === val;
                        return (
                          <button
                            key={chip.label}
                            type="button"
                            onClick={() => setAuthSpecialty(val)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                              isSelected
                                ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                                : "bg-white text-slate-600 border-slate-200 hover:border-purple-300 hover:text-purple-700"
                            }`}
                          >
                            {chip.icon} {chip.label}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}


                
                {/* Name Input */}
                <div className="space-y-2">
                  <label htmlFor="reg-name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      id="reg-name"
                      type="text"
                      required
                      placeholder="Marc Henderson"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-800 px-12 py-3 rounded-xl text-sm focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Contact and Sector Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* Contact Number */}
                  <div className="space-y-2">
                    <label htmlFor="reg-contact" className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                      Contact Details (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                      <input
                        id="reg-contact"
                        type="text"
                        placeholder="e.g. +1 555-0199"
                        value={authContact}
                        onChange={(e) => setAuthContact(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-800 px-12 py-3.5 rounded-xl text-sm focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Preferred Reporting Sector */}
                  <div className="space-y-2">
                    <label htmlFor="reg-sector" className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                      Reporting Sector
                    </label>
                    <select
                      id="reg-sector"
                      value={authSector}
                      onChange={(e) => setAuthSector(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-800 px-4 py-3.5 rounded-xl text-sm focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] outline-none transition-all"
                    >
                      <option value="Oakridge Meadows">Oakridge Meadows</option>
                      <option value="Cedar Boulevard">Cedar Boulevard</option>
                      <option value="Elm Street Hub">Elm Street Hub</option>
                      <option value="District 4 Core">District 4 Core</option>
                    </select>
                  </div>

                </div>

                {/* Security Credentials & Password */}
                <div className="space-y-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#0D47A1]" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                      Security Credentials & Access Passkey
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Establish a secure login passkey to protect your reputation points, earned badges, and authorized dispatch logs.
                  </p>
                  
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Enter a secure passkey..."
                      value={authPassword}
                      onChange={(e) => {
                        setAuthPassword(e.target.value);
                        setAuthError("");
                      }}
                      className="w-full bg-white border border-slate-300 text-slate-800 px-12 py-3.5 rounded-xl text-sm focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] outline-none transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Password Strength Meter & Interactive Checklist */}
                  {authPassword && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-3 pt-1"
                    >
                      {/* Strength label and score visualizer */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-mono">Strength Indicator:</span>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] font-mono tracking-wider ${
                          passwordResult.score === 4 ? "bg-teal-50 text-teal-700 border border-teal-200" :
                          passwordResult.score === 3 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          passwordResult.score === 2 ? "bg-amber-50 text-amber-700 border border-amber-200" :
                          "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                          {passwordResult.feedback}
                        </span>
                      </div>

                      {/* 4-segmented bar indicator */}
                      <div className="grid grid-cols-4 gap-1.5 h-1.5">
                        {[1, 2, 3, 4].map((index) => {
                          const isActive = passwordResult.score >= index;
                          let barColor = "bg-slate-200";
                          if (isActive) {
                            if (passwordResult.score === 1) barColor = "bg-red-500";
                            else if (passwordResult.score === 2) barColor = "bg-amber-500";
                            else if (passwordResult.score === 3) barColor = "bg-emerald-500";
                            else if (passwordResult.score === 4) barColor = "bg-teal-500";
                          }
                          return (
                            <div
                              key={index}
                              className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                            />
                          );
                        })}
                      </div>

                      {/* Checkbox checklist */}
                      <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                        <div className="flex items-center gap-2">
                          {passwordResult.hasMinLength ? (
                            <CheckCircle2 className="w-4 h-4 text-teal-600" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-slate-300 text-[10px] font-bold">✓</div>
                          )}
                          <span className={passwordResult.hasMinLength ? "text-slate-800 font-medium" : "text-slate-400"}>
                            Min 8 characters
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordResult.hasMixedCase ? (
                            <CheckCircle2 className="w-4 h-4 text-teal-600" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-slate-300 text-[10px] font-bold">✓</div>
                          )}
                          <span className={passwordResult.hasMixedCase ? "text-slate-800 font-medium" : "text-slate-400"}>
                            Mixed case (aA)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordResult.hasNumber ? (
                            <CheckCircle2 className="w-4 h-4 text-teal-600" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-slate-300 text-[10px] font-bold">✓</div>
                          )}
                          <span className={passwordResult.hasNumber ? "text-slate-800 font-medium" : "text-slate-400"}>
                            Contains a number
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordResult.hasSpecialChar ? (
                            <CheckCircle2 className="w-4 h-4 text-teal-600" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-slate-300 text-[10px] font-bold">✓</div>
                          )}
                          <span className={passwordResult.hasSpecialChar ? "text-slate-800 font-medium" : "text-slate-400"}>
                            Special character
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Avatar Selection area */}
                <div className="space-y-3">
                  <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                    Select Your Citizen Avatar Badge
                  </span>
                  
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80", label: "Advocate" },
                      { url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80", label: "Engineer" },
                      { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80", label: "Monitor" },
                      { url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80", label: "Lead" }
                    ].map((av, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAuthAvatar(av.url)}
                        className={`p-1.5 rounded-xl border-2 transition-all flex flex-col items-center gap-1 bg-slate-50 hover:bg-slate-100 cursor-pointer ${
                          authAvatar === av.url ? "border-[#00796B] bg-teal-50" : "border-transparent"
                        }`}
                      >
                        <img src={av.url} alt={av.label} className="w-12 h-12 rounded-full object-cover shadow-sm" />
                        <span className={`text-[10px] font-semibold ${authAvatar === av.url ? "text-[#00796B]" : "text-slate-500"}`}>
                          {av.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error Alert Display */}
                {authError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-start gap-3 text-xs"
                  >
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold">Credential Registry Warning</p>
                      <p className="text-red-600 font-medium">{authError}</p>
                    </div>
                  </motion.div>
                )}

                {/* Submit Action Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={authSubmitting}
                    className="w-full bg-[#0D47A1] hover:bg-[#0b3c8a] disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-xl text-xs sm:text-sm tracking-wide uppercase transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {authSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                    <span>Register ID Credentials</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAuthScreen(false)}
                    className="w-full bg-[#00796B] hover:bg-[#005c51] text-white font-bold py-3.5 px-6 rounded-xl text-xs sm:text-sm tracking-wide uppercase transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <span>Proceed To Dispatch Map</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </form>

            </div>
          </div>
        ) : (
          <>
            {/* Live Map Tab */}
            {activeTab === "map" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="live-map-tab-container">
                
                {/* Left Side: Map Visual Representation */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                  
                  {/* Top Bar on Map View */}
                  <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-slate-800">
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:block">
                        <p className="text-[10px] font-mono text-slate-400 font-bold uppercase">Sector Active Grid</p>
                        <h2 className="text-sm font-bold text-slate-800 font-display">Oakridge & Cloverdale Boundary</h2>
                      </div>
                      <div className="flex items-center gap-2 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full text-[10px] font-bold text-[#00796B] font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00796B] animate-pulse"></span>
                        <span>{issues.length} CITIZEN LOGS LIVE</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={handleRefreshIssues}
                        disabled={refreshingIssues}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600 transition-all disabled:opacity-50"
                        title="Force sync map markers"
                      >
                        <RefreshCw className={`w-4 h-4 ${refreshingIssues ? "animate-spin" : ""}`} />
                      </button>

                      {!reportMode ? (
                        <button
                          onClick={() => {
                            setReportMode(true);
                            // Initial placement inside Oakridge central coordinates
                            setNewLatitude(37.7800);
                            setNewLongitude(-122.4100);
                            setNewAddress("Central Grid Sector (Select on map)");
                          }}
                          className="bg-[#00796B] hover:bg-[#005c51] text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow border border-teal-600/30 transition-all flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Report New Issue</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setReportMode(false)}
                          className="bg-slate-100 border border-slate-200 text-slate-700 text-xs px-4 py-2.5 rounded-xl hover:bg-slate-200 transition-all font-semibold"
                        >
                          Cancel Report
                        </button>
                      )}
                    </div>
                  </div>

                  {/* SVG Coordinates Sandbox Map */}
                  <MapContainer 
                    issues={filteredIssues}
                    selectedIssueId={selectedIssueId}
                    onSelectIssue={(id) => {
                      setSelectedIssueId(id);
                      setReportMode(false);
                    }}
                    reportMode={reportMode}
                    onSelectCoordinates={handleSelectMapCoordinates}
                    tempCoordinates={reportMode ? { latitude: newLatitude, longitude: newLongitude } : null}
                    searchQuery={searchQuery}
                  />

                  {/* Horizontal Quick Issue Finder */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-slate-800">
                    <div className="flex flex-col sm:flex-row gap-3">
                      
                      {/* Search Bar */}
                      <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="Search potholes, trash, water leakages..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2 rounded-xl text-xs text-slate-800 outline-none focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] placeholder-slate-400 font-sans"
                        />
                      </div>

                      {/* Filter Badges */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                        <span className="text-[10px] font-mono text-slate-500 uppercase font-bold mr-1 hidden lg:inline">Filters:</span>
                        {[
                          { key: "all", name: "All Logs" },
                          { key: "Road Safety & Potholes", name: "Roads" },
                          { key: "Water & Utilities", name: "Water" },
                          { key: "Public Lights & Electrical", name: "Lighting" },
                          { key: "Waste & Sanitation", name: "Sanitation" }
                        ].map(f => (
                          <button
                            key={f.key}
                            onClick={() => setSelectedCategoryFilter(f.key)}
                            className={`text-[10px] font-medium px-3 py-1.5 rounded-lg whitespace-nowrap border transition-all ${
                              selectedCategoryFilter === f.key 
                                ? "bg-teal-50 text-[#00796B] border-teal-200 font-bold" 
                                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800"
                            }`}
                          >
                            {f.name}
                          </button>
                        ))}
                      </div>

                    </div>
                  </div>

                </div>

                {/* Unified Dispatch & Report Terminal */}
                <div className="lg:col-span-4">
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md flex flex-col gap-4 text-slate-800 animate-fade-in" id="unified-report-issue-terminal">
                    
                    {/* Unified Sidebar Header and Tab Controls */}
                    <div className="flex border-b border-slate-100 pb-2 mb-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setReportMode(true);
                          // Central Oakridge coordinates
                          setNewLatitude(37.7800);
                          setNewLongitude(-122.4100);
                          setNewAddress("Central Grid Sector (Select on map)");
                        }}
                        className={`flex-1 pb-2.5 text-xs font-bold font-mono uppercase tracking-wider transition-all text-center border-b-2 flex items-center justify-center gap-1.5 ${
                          reportMode 
                            ? "border-[#00796B] text-[#00796B] font-bold" 
                            : "border-transparent text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-[#00796B]" />
                        <span>File Report</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReportMode(false);
                        }}
                        className={`flex-1 pb-2.5 text-xs font-bold font-mono uppercase tracking-wider transition-all text-center border-b-2 flex items-center justify-center gap-1.5 ${
                          !reportMode 
                            ? "border-[#00796B] text-[#00796B] font-bold" 
                            : "border-transparent text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#00796B]" />
                        <span>Issue Inspector</span>
                      </button>
                    </div>

                    {reportMode ? (
                      /* REPORT FORM CONTENT */
                      <div className="animate-fade-in flex flex-col gap-3">
                        
                        <div>
                          <h3 className="text-sm font-bold text-[#0D47A1] font-display flex items-center gap-1.5">
                            <PlusCircle className="w-4 h-4 text-[#00796B]" />
                            <span>File Community Report</span>
                          </h3>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Choose an issue template or define custom details below. Tap on the Live Grid Map on the left to pin the location!
                          </p>
                        </div>

                      <form onSubmit={handleSubmitIssue} className="space-y-4 text-xs">
                        
                        {/* Preset Issue Template Selector */}
                        <div className="bg-teal-50/60 border border-teal-200/50 p-3.5 rounded-2xl space-y-3.5 shadow-sm">
                          <div>
                            <label className="block text-[10px] text-[#00796B] font-mono uppercase font-bold mb-1.5">
                              Choose an Issue Template
                            </label>
                            
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {ISSUE_TEMPLATES.map(t => {
                                const isSelected = selectedTemplate === t.id;
                                // Determine icon matching the template type
                                let icon = <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
                                if (t.id === "streetlight") icon = <Sparkles className="w-4 h-4 text-yellow-500 shrink-0" />;
                                if (t.id === "water_leak") icon = <Droplets className="w-4 h-4 text-sky-500 shrink-0" />;
                                if (t.id === "illegal_dumping") icon = <Trash2 className="w-4 h-4 text-red-500 shrink-0" />;
                                
                                return (
                                  <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => handleTemplateSelect(t.id)}
                                    className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between h-20 ${
                                      isSelected 
                                        ? "bg-white border-[#00796B] ring-2 ring-teal-600/20 text-[#00796B]" 
                                        : "bg-white/80 hover:bg-white border-slate-200 text-slate-700"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      {icon}
                                      {isSelected && <Check className="w-3.5 h-3.5 text-[#00796B] font-bold" />}
                                    </div>
                                    <div className="text-[10px] font-bold mt-1.5 leading-tight truncate">{t.name}</div>
                                    <div className="text-[8px] text-slate-400 truncate">{t.category}</div>
                                  </button>
                                );
                              })}

                              <button
                                type="button"
                                onClick={() => handleTemplateSelect("")}
                                className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between h-20 ${
                                  selectedTemplate === "" 
                                    ? "bg-white border-[#00796B] ring-2 ring-teal-600/20 text-[#00796B]" 
                                    : "bg-white/80 hover:bg-white border-slate-200 text-slate-700"
                                }`}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <PlusCircle className="w-4 h-4 text-[#00796B]" />
                                  {selectedTemplate === "" && <Check className="w-3.5 h-3.5 text-[#00796B] font-bold" />}
                                </div>
                                <div className="text-[10px] font-bold mt-1.5 leading-tight truncate">Custom Hazard</div>
                                <div className="text-[8px] text-slate-400 truncate">Define your own issue</div>
                              </button>
                            </div>
                          </div>

                          {/* Quick Map Pointer Helper */}
                          <div className="bg-white/90 border border-teal-100/80 text-[#00796B] p-2.5 rounded-xl text-[10px] leading-relaxed flex items-center gap-2">
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                            </span>
                            <span>
                              <strong>Interactive Map Pinning:</strong> Once you choose a template above, tap anywhere on the <strong>Live Grid Map</strong> (on the left) to pinpoint the exact hazard location!
                            </span>
                          </div>

                          {/* Common Tags display */}
                          {newTags.length > 0 && (
                            <div className="space-y-1">
                              <span className="block text-[9px] font-mono font-bold text-slate-500 uppercase">Auto-Populated Tags:</span>
                              <div className="flex flex-wrap gap-1.5">
                                {newTags.map((tag, tIdx) => (
                                  <span 
                                    key={tIdx} 
                                    className="text-[9px] bg-teal-100/60 text-[#00796B] border border-teal-200/40 px-2 py-0.5 rounded-md font-mono font-bold"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Title */}
                        <div>
                          <label className="block text-slate-600 font-medium mb-1.5">Problem Headline</label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. Broken streetlight in alleyway" 
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-slate-800 outline-none focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] font-sans text-xs"
                          />
                        </div>

                        {/* Presets Selection helper */}
                        <div>
                          <span className="block text-[10px] text-slate-500 font-mono uppercase font-bold mb-1.5">Quick Presets (Includes sample images)</span>
                          <div className="grid grid-cols-2 gap-2">
                            {PRESET_IMAGES.map((preset, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handlePresetSelect(preset)}
                                className={`p-2 border rounded-lg text-left transition-all ${
                                  newImageUrl === preset.url 
                                    ? "border-[#00796B] bg-teal-50 text-[#00796B] font-bold" 
                                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                <p className="font-bold text-[10px] leading-tight truncate">{preset.name}</p>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Drag & Drop File Upload Area */}
                        <div 
                          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                            dragActive 
                              ? "border-[#0D47A1] bg-blue-50/50" 
                              : "border-slate-300 bg-slate-50 hover:border-slate-400"
                          }`}
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                        >
                          <input 
                            type="file" 
                            id="file-upload" 
                            multiple={false} 
                            accept="image/*"
                            className="hidden" 
                            onChange={handleFileSelect}
                          />
                          <label htmlFor="file-upload" className="cursor-pointer">
                            {imageUploadPreview ? (
                              <div className="relative">
                                <img src={imageUploadPreview} alt="Preview" className="h-24 w-full object-cover rounded-lg" />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-[10px] text-white font-medium rounded-lg">
                                  Drag/Click to Replace
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <MapPin className="w-5 h-5 text-slate-400 mx-auto" />
                                <p className="text-[10px] text-slate-600 font-medium">Drag & Drop Image or Click to Browse</p>
                                <p className="text-[9px] text-slate-400">Supports standard photos of site hazards</p>
                              </div>
                            )}
                          </label>
                        </div>

                        {/* Audio Note Report Facility */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="block font-medium text-slate-700 flex items-center gap-1.5">
                              <Mic className="w-4 h-4 text-[#00796B]" />
                              <span>Audio Report (Voice Memo)</span>
                            </span>
                            {audioPreviewUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  setNewAudioUrl("");
                                  setAudioPreviewUrl(null);
                                }}
                                className="text-[10px] text-red-600 hover:underline font-bold"
                              >
                                Delete Memo
                              </button>
                            )}
                          </div>

                          {!audioPreviewUrl ? (
                            <div className="flex items-center gap-3">
                              {isRecording ? (
                                <button
                                  type="button"
                                  onClick={stopRecording}
                                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 border border-red-300 hover:bg-red-100 text-red-700 font-bold rounded-xl animate-pulse transition-all"
                                >
                                  <Square className="w-3.5 h-3.5 text-red-600 fill-red-600" />
                                  <span>Stop ({recordingTime}s)</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={startRecording}
                                  className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 hover:bg-teal-100 text-[#00796B] font-bold rounded-xl transition-all"
                                >
                                  <Mic className="w-3.5 h-3.5 text-[#00796B]" />
                                  <span>Record Voice Report</span>
                                </button>
                              )}
                              <span className="text-[10px] text-slate-500">
                                {isRecording ? "Listening to your voice..." : "Record a voice explanation of the problem"}
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200">
                                <Volume2 className="w-4 h-4 text-slate-400" />
                                <audio src={audioPreviewUrl} controls className="h-8 flex-1 outline-none text-xs" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* AI Auto-Recognize Toggle */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="block font-medium text-slate-700 flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-amber-600" />
                                <span>AI Auto-Recognize Mode</span>
                              </span>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                Gemini AI will transcribe audio & extract title, category, description automatically.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setAutoRecognized(prev => !prev)}
                              className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${autoRecognized ? 'bg-[#0D47A1]' : 'bg-slate-300'}`}
                            >
                              <span
                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${autoRecognized ? 'translate-x-5' : 'translate-x-1'}`}
                              />
                            </button>
                          </div>

                          {/* Manual trigger for refinement */}
                          {(newAudioUrl || newDescription) && (
                            <button
                              type="button"
                              disabled={isRecognizing}
                              onClick={handleManualAutoRecognize}
                              className="w-full flex items-center justify-center gap-2 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#0D47A1] rounded-xl transition-all font-bold text-[11px]"
                            >
                              {isRecognizing ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0D47A1]" />
                                  <span>Gemini AI Analyzing Report...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkle className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Run Gemini Auto-Recognition Now</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Custom Reporter Section */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                          <span className="block font-medium text-slate-700 flex items-center gap-1.5">
                            <User className="w-4 h-4 text-[#0D47A1]" />
                            <span>Reporter Information</span>
                          </span>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] text-slate-600 font-medium mb-1">Reporter Name</label>
                              <input 
                                type="text" 
                                required
                                placeholder="Your Name" 
                                value={customReporterName}
                                onChange={(e) => setCustomReporterName(e.target.value)}
                                className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-slate-800 outline-none focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] font-sans text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-600 font-medium mb-1">Contact Info (Phone/Email)</label>
                              <input 
                                type="text" 
                                placeholder="e.g. +1 555-0199" 
                                value={reporterContact}
                                onChange={(e) => setReporterContact(e.target.value)}
                                className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-slate-800 outline-none focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] font-sans text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Address / GPS */}
                        <div>
                          <label className="block text-slate-600 font-medium mb-1.5">Selected Location (Grid Pin)</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00796B]" />
                            <input 
                              type="text" 
                              required
                              placeholder="Click on live grid map or type" 
                              value={newAddress}
                              onChange={(e) => setNewAddress(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2.5 rounded-xl text-slate-800 outline-none focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] font-sans text-xs"
                            />
                          </div>
                          <p className="text-[9px] text-[#00796B] mt-1 font-mono font-bold">
                            Coordinates: {newLatitude.toFixed(4)}°N, {newLongitude.toFixed(4)}°W
                          </p>
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-slate-600 font-medium mb-1.5">Describe Hazard Details</label>
                          <textarea 
                            required
                            rows={3}
                            placeholder="Describe how the problem impacts traffic, safety, or water flow. Be specific so Gemini AI can categorize properly." 
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-slate-800 outline-none focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] font-sans resize-none text-xs"
                          />
                        </div>

                        {/* Category & Urgency Fine-Tuning */}
                        <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                          <div>
                            <label className="block text-slate-600 font-medium mb-1">Assigned Category</label>
                            <select
                              value={customCategory}
                              onChange={(e) => setCustomCategory(e.target.value)}
                              className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-slate-800 outline-none focus:border-[#0D47A1] text-xs"
                            >
                              <option value="Road Safety & Potholes">Road Safety & Potholes</option>
                              <option value="Water & Utilities">Water & Utilities</option>
                              <option value="Public Lights & Electrical">Public Lights & Electrical</option>
                              <option value="Waste & Sanitation">Waste & Sanitation</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-600 font-medium mb-1">Urgency Priority</label>
                            <select
                              value={customUrgency}
                              onChange={(e) => setCustomUrgency(e.target.value)}
                              className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-slate-800 outline-none focus:border-[#0D47A1] text-xs"
                            >
                              <option value="low">Low Priority</option>
                              <option value="medium">Medium Priority</option>
                              <option value="high">High Priority</option>
                              <option value="critical">Critical Priority</option>
                            </select>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-2 flex gap-3">
                          <button
                            type="button"
                            onClick={() => setReportMode(false)}
                            className="flex-1 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-200 transition-all text-center"
                          >
                            Cancel
                          </button>
                          
                          <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 py-3 bg-[#0D47A1] hover:bg-[#0b3c8a] text-white font-bold rounded-xl shadow disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                          >
                            {submitting ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>AI Routing...</span>
                              </>
                            ) : (
                               <>
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Verify & Submit</span>
                              </>
                            )}
                          </button>
                        </div>

                      </form>
                    </div>
                  ) : selectedIssue ? (
                    /* ISSUE DETAILS VIEW */
                    <div className="animate-fade-in flex flex-col gap-4 text-slate-800" id="issue-details-panel">
                      
                      {/* Photo Header */}
                      <div className="relative h-44 rounded-2xl overflow-hidden border border-slate-200">
                        <img 
                          src={selectedIssue.imageUrl || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80"} 
                          alt={selectedIssue.title} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 flex gap-1.5">
                          {/* Urgency Badge */}
                          <span className={`text-[9px] font-bold font-mono px-2.5 py-1 rounded-md uppercase tracking-wider ${
                            selectedIssue.urgency === "critical" ? "bg-red-600 text-white shadow" :
                            selectedIssue.urgency === "high" ? "bg-orange-600 text-white" :
                            selectedIssue.urgency === "medium" ? "bg-[#0D47A1] text-white" : "bg-slate-600 text-white"
                          }`}>
                            {selectedIssue.urgency} priority
                          </span>

                          {/* Status Badge */}
                          <span className={`text-[9px] font-bold font-mono px-2.5 py-1 rounded-md uppercase tracking-wider ${
                            selectedIssue.status === "resolved" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
                            selectedIssue.status === "in_progress" ? "bg-blue-50 text-blue-800 border border-blue-200" :
                            selectedIssue.status === "assigned" ? "bg-indigo-50 text-indigo-800 border border-indigo-200" :
                            selectedIssue.status === "verified" ? "bg-yellow-50 text-yellow-800 border border-yellow-200" :
                            "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}>
                            {selectedIssue.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>

                      {/* Main Title & Description */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            {(() => {
                              const isDetailSpecialtyMatch = userProfile?.role === "architect" && (
                                (userProfile.specialty && (
                                  userProfile.specialty.toLowerCase().includes(selectedIssue.category.toLowerCase()) ||
                                  (selectedIssue.category.toLowerCase().includes("structural") && userProfile.specialty.toLowerCase().includes("structural")) ||
                                  (selectedIssue.category.toLowerCase().includes("hydrology") && userProfile.specialty.toLowerCase().includes("hydrology")) ||
                                  (selectedIssue.category.toLowerCase().includes("drainage") && userProfile.specialty.toLowerCase().includes("hydrology")) ||
                                  (selectedIssue.category.toLowerCase().includes("grid") && userProfile.specialty.toLowerCase().includes("grid")) ||
                                  (selectedIssue.category.toLowerCase().includes("electrics") && userProfile.specialty.toLowerCase().includes("grid")) ||
                                  (selectedIssue.category.toLowerCase().includes("waste") && userProfile.specialty.toLowerCase().includes("waste")) ||
                                  (selectedIssue.category.toLowerCase().includes("sanitation") && userProfile.specialty.toLowerCase().includes("waste"))
                                ))
                              );
                              return (
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] font-mono text-[#0D47A1] font-bold uppercase">{selectedIssue.category}</span>
                                    {isDetailSpecialtyMatch && (
                                      <span className="text-[9px] font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-0.5 animate-pulse">
                                        ✨ ELITE MATCH
                                      </span>
                                    )}
                                  </div>
                                  <h3 className="text-base font-bold text-slate-800 font-display mt-0.5">{selectedIssue.title}</h3>
                                  
                                  {/* AI Blueprint Badge */}
                                  <div className="pt-1">
                                    <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wider flex items-center gap-1 shadow-sm w-fit">
                                      <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-spin" style={{ animationDuration: "3s" }} /> 
                                      {selectedIssue.blueprintRequirement || `${selectedIssue.category.toUpperCase()} GUILD BLUEPRINT REQUIRED`}
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Reporter details and Audio Playback */}
                        <div className="space-y-3 pt-1">
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 text-xs text-slate-700">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 font-medium">Reporter Contact:</span>
                              {selectedIssue.autoRecognized && (
                                <span className="text-[9px] font-bold font-mono text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <Sparkle className="w-2.5 h-2.5 text-amber-600" />
                                  <span>AI Auto-Recognized</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[11px] text-[#0D47A1] font-bold font-mono">
                                {selectedIssue.reporterName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800 text-xs">{selectedIssue.reporterName}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[9px] text-slate-400">{new Date(selectedIssue.createdAt).toLocaleDateString()}</span>
                                  {selectedIssue.reporterContact && (
                                    <>
                                      <span className="text-slate-400 text-[10px]">•</span>
                                      <p className="text-[10px] text-[#0D47A1] flex items-center gap-1 font-semibold">
                                        <Phone className="w-2.5 h-2.5 text-[#00796B]" />
                                        <span>{selectedIssue.reporterContact}</span>
                                      </p>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Audio Memo Playback Player */}
                          {selectedIssue.audioUrl && (
                            <div className="bg-teal-50/50 border border-teal-200 p-3 rounded-xl space-y-2">
                              <div className="flex items-center gap-1.5 text-[10px] text-[#00796B] font-mono font-bold uppercase">
                                <Mic className="w-3.5 h-3.5 text-[#00796B]" />
                                <span>Recorded Audio Report</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <audio 
                                  src={selectedIssue.audioUrl} 
                                  controls 
                                  className="w-full h-8 outline-none text-xs rounded-lg" 
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 p-3 rounded-xl">
                          {selectedIssue.description}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200">
                          <MapPin className="w-3.5 h-3.5 text-[#00796B] shrink-0" />
                          <span className="truncate">{selectedIssue.address}</span>
                        </div>
                      </div>

                      {/* Dynamic Timeline Countdown block for accepted tasks */}
                      {selectedIssue.deadlineAt && (
                        <div className="px-1 pt-1">
                          <TimelineCountdown issue={selectedIssue} />
                        </div>
                      )}

                      {/* Citizen Verification Block */}
                      <div className="bg-gradient-to-r from-blue-50 to-teal-50/30 border border-blue-100 p-4 rounded-2xl">
                        <div className="flex justify-between items-center mb-2.5">
                          <div>
                            <h4 className="text-[11px] font-bold text-[#0D47A1] font-display flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-[#00796B]" />
                              <span>Citizen Verification Panel</span>
                            </h4>
                            <p className="text-[10px] text-slate-500">
                              Earn +10 XP by upvoting valid local issues. Need 3 votes to unlock official assignment.
                            </p>
                          </div>
                          <span className="text-xs font-mono font-bold text-[#0D47A1] bg-blue-100/60 px-2.5 py-1 rounded-lg">
                            {selectedIssue.upvotesCount} Supporting
                          </span>
                        </div>

                        {/* Upvote & Downvote Controls */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpvote(selectedIssue.id)}
                            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                              selectedIssue.upvotedBy.includes(userProfile?.id || "")
                                ? "bg-[#0D47A1] text-white shadow-md shadow-blue-600/20"
                                : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>{selectedIssue.upvotedBy.includes(userProfile?.id || "") ? "Upvoted" : "Upvote (Verify)"}</span>
                          </button>

                          <button
                            onClick={() => handleDownvote(selectedIssue.id)}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center transition-all ${
                              selectedIssue.downvotedBy.includes(userProfile?.id || "")
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-slate-50 border border-slate-200 text-slate-400 hover:bg-slate-100"
                            }`}
                            title="Flag as invalid or duplicate"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Joint Interest / Squad Goals Escalation Panel */}
                      <div className="bg-[#E0F2F1]/60 border border-teal-200/60 p-4 rounded-2xl space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-[11px] font-bold text-[#00796B] font-display flex items-center gap-1.5 uppercase tracking-wider">
                              <Users className="w-4 h-4 text-[#00796B]" />
                              <span>Squad Escalation Portal</span>
                            </h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Combine forces with neighboring citizens. More support triggers faster municipal dispatch and a boosted priority rank!
                            </p>
                          </div>
                          <span className="text-xs font-mono font-bold text-teal-800 bg-teal-100 px-2.5 py-1 rounded-lg">
                            {selectedIssue.interestCount || 0} Interested
                          </span>
                        </div>

                        {/* Join Interest Button */}
                        <button
                          onClick={() => handleJoinInterest(selectedIssue.id)}
                          disabled={!userProfile}
                          className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                            !userProfile 
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                              : selectedIssue.supporters?.some(s => s.userId === userProfile.id)
                              ? "bg-teal-700 text-white hover:bg-teal-850 shadow-md shadow-teal-700/20"
                              : "bg-white border-2 border-[#00796B] text-[#00796B] hover:bg-teal-50 shadow-sm"
                          }`}
                        >
                          <Flame className={`w-4 h-4 ${selectedIssue.supporters?.some(s => s.userId === userProfile?.id) ? "animate-pulse fill-amber-400 text-amber-400" : ""}`} />
                          <span>
                            {selectedIssue.supporters?.some(s => s.userId === userProfile?.id) 
                              ? "You Joined Interest Group (Leave)" 
                              : "Join Interest Group (+15 Boost)"}
                          </span>
                        </button>

                        {/* Visual Rank & Score Increase Comparison Indicator */}
                        <div className="bg-white/80 border border-teal-100 p-3 rounded-xl space-y-2 text-[11px] text-slate-700 shadow-sm">
                          {(() => {
                            const prioritizedItem = prioritizedIssues.find(p => p.id === selectedIssue.id);
                            const currentScore = prioritizedItem ? prioritizedItem.priorityScore : 45;
                            const isSupporter = selectedIssue.supporters?.some(s => s.userId === userProfile?.id);
                            
                            // Each interest adds 15 points to Affected Users score.
                            // Weighted impact = 15 * (affectedUsersWeight / 100)
                            const boostVal = 15 * (affectedUsersWeight / 100);
                            const preScore = isSupporter ? Math.max(0, currentScore - boostVal) : currentScore;
                            const postScore = isSupporter ? currentScore : Math.min(100, currentScore + boostVal);
                            
                            return (
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-medium text-slate-600">Priority Score Lift:</span>
                                  <span className="font-mono font-bold text-[#00796B] flex items-center gap-0.5">
                                    <span>{preScore.toFixed(1)}</span>
                                    <span className="text-slate-400">→</span>
                                    <span className="text-teal-700 font-extrabold">{postScore.toFixed(1)}</span>
                                    <span className="text-[10px] bg-teal-100 text-teal-800 px-1 py-0.5 rounded font-bold ml-1">
                                      +{boostVal.toFixed(2)} Points
                                    </span>
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    style={{ width: `${postScore}%` }}
                                    className="h-full bg-gradient-to-r from-teal-400 to-[#00796B] transition-all duration-500 rounded-full"
                                  ></div>
                                </div>
                                <p className="text-[9px] text-slate-500 leading-normal">
                                  {isSupporter 
                                    ? "🎉 Your support is active! You successfully increased this problem's priority index." 
                                    : "👉 Join interest to bump this hazard by +15 on Affected Citizens metrics."
                                  }
                                </p>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Recent Supporters List */}
                        <div className="space-y-2 pt-1">
                          <span className="block text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wide">
                            Recent Supporters ({selectedIssue.supporters?.length || 0})
                          </span>
                          {!selectedIssue.supporters || selectedIssue.supporters.length === 0 ? (
                            <p className="text-[10px] text-slate-400 italic">No one has joined this interest group yet. Escalated issues get resolved 3x quicker!</p>
                          ) : (
                            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto pr-1">
                              {selectedIssue.supporters.slice().reverse().map((sup, sIdx) => (
                                <div key={sIdx} className="flex items-center gap-2 bg-white/70 p-1.5 rounded-lg border border-teal-100/60 text-[10px] text-slate-700 animate-fade-in">
                                  <img 
                                    src={sup.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"} 
                                    alt={sup.userName} 
                                    className="w-5 h-5 rounded-full object-cover border border-teal-200"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800 truncate">{sup.userName}</p>
                                    <p className="text-[8px] text-slate-400 font-mono">Joined {new Date(sup.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                  </div>
                                  <span className="text-[8px] font-mono bg-teal-50 text-teal-800 font-bold px-1.5 py-0.5 rounded-md uppercase">Supporter</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Gemini AI Dispatch Copilot Insights */}
                      {selectedIssue.aiAnalysis && (
                        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex flex-col gap-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-[#0D47A1]" />
                              <h4 className="text-[11px] font-bold text-[#0D47A1] uppercase tracking-wide font-mono">Gemini Routing Engine</h4>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-500 font-mono">Risk Index:</span>
                              <span className="text-[10px] font-mono font-bold text-[#0D47A1]">{selectedIssue.aiAnalysis.riskScore}/100</span>
                            </div>
                          </div>

                          <div className="space-y-1.5 text-xs text-slate-700">
                            <p className="font-bold font-display text-[#0D47A1]">Category Logic:</p>
                            <p className="text-slate-600 italic leading-snug">{selectedIssue.aiAnalysis.categoryExplanation}</p>
                            
                            <p className="font-bold font-display text-[#0D47A1] mt-2">Predicted Repair Sequence:</p>
                            <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1 text-[11px]">
                              {selectedIssue.aiAnalysis.suggestedResolutionSteps.map((step, idx) => (
                                <li key={idx}>{step}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* ELITE ARCHITECT REAL RESOLUTION PORTAL */}
                      {userProfile?.role === "architect" && (
                        <div className="border border-purple-200 bg-gradient-to-br from-purple-50/50 to-amber-50/30 rounded-2xl p-4 space-y-3 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-purple-900 font-mono flex items-center gap-1.5">
                              <Crown className="w-4 h-4 text-amber-500 animate-pulse" /> Elite Solver Guild Terminal
                            </span>
                            <span className="text-[9px] font-mono bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full uppercase">
                              Active Task Management
                            </span>
                          </div>

                          <p className="text-[10px] text-slate-500 leading-relaxed">
                            As an Elite Architect, you have authority to self-assign dispatch tasks and certify safety resolution sign-offs.
                          </p>

                          <div className="space-y-2 pt-1">
                            {/* Accept Button (if not already accepted or resolved) */}
                            {selectedIssue.status !== "assigned" && selectedIssue.status !== "in_progress" && selectedIssue.status !== "resolved" ? (
                              <button
                                type="button"
                                onClick={() => handleAcceptIssue(selectedIssue.id)}
                                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold font-mono rounded-xl shadow-md transition-all uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: "3s" }} />
                                <span>Accept Task & Dispatch Crews</span>
                              </button>
                            ) : selectedIssue.status === "assigned" || selectedIssue.status === "in_progress" ? (
                              <div className="space-y-3 p-3 bg-white/80 rounded-xl border border-purple-100">
                                <div className="space-y-1">
                                  <label className="block text-[10px] font-bold text-purple-950 uppercase font-mono">
                                    Issue Resolution Sign-off Report
                                  </label>
                                  <p className="text-[9px] text-slate-400">Provide final engineering details and safety checks to close out the ticket.</p>
                                </div>
                                <textarea
                                  placeholder="e.g. Conducted localized subgrade concrete injection. Structural load tests passed 120% threshold. Clearance approved."
                                  rows={3}
                                  id="resolution-notes-input"
                                  className="w-full bg-white border border-purple-200 p-2.5 rounded-xl text-xs text-slate-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-sans"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const el = document.getElementById("resolution-notes-input") as HTMLTextAreaElement;
                                    handleResolveIssue(selectedIssue.id, el?.value || "");
                                  }}
                                  className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold font-mono rounded-xl shadow transition-all uppercase cursor-pointer"
                                >
                                  Certify & Resolve Issue (+50 XP)
                                </button>
                              </div>
                            ) : (
                              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-[11px] font-medium leading-snug">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                <div>
                                  <p className="font-bold">Task Officially Certified Resolved</p>
                                  <p className="text-[9px] text-emerald-600">This hazard has been closed out from active dispatch lists.</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* SIMULATOR CORNER: PROGRESS THE DISPATCH STAGES */}
                      <div className="border border-slate-200 bg-slate-50 rounded-2xl p-4">
                        <button
                          onClick={() => setShowStatusPanel(!showStatusPanel)}
                          className="w-full flex justify-between items-center text-xs font-semibold text-slate-600 hover:text-slate-800"
                        >
                          <span>🛠️ Simulation Control Corner</span>
                          <span className="text-[10px] px-2 py-0.5 bg-white rounded border border-slate-200 font-mono text-slate-600">
                            {showStatusPanel ? "Hide Panel" : "Open Status Panel"}
                          </span>
                        </button>

                        {showStatusPanel && (
                          <div className="mt-3 space-y-3 pt-3 border-t border-slate-200 text-xs text-slate-700">
                            <p className="text-[10px] text-slate-500">
                              Simulate municipal action or dispatch coordination directly to test stages:
                            </p>
                            
                            <div className="grid grid-cols-2 gap-1.5">
                              {[
                                { key: "verified", name: "Set Verified" },
                                { key: "assigned", name: "Assign Team" },
                                { key: "in_progress", name: "Set In Progress" },
                                { key: "resolved", name: "Mark Resolved" }
                              ].map(st => (
                                <button
                                  key={st.key}
                                  type="button"
                                  onClick={() => setSimulatingStatus(st.key)}
                                  className={`p-1.5 rounded-lg border text-[10px] font-medium text-center transition-all ${
                                    simulatingStatus === st.key 
                                      ? "border-[#00796B] bg-teal-50 text-[#00796B] font-bold" 
                                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                  }`}
                                >
                                  {st.name}
                                </button>
                              ))}
                            </div>

                            {simulatingStatus && (
                              <div className="space-y-2 pt-2 animate-fade-in">
                                <label className="block text-[10px] text-slate-500 font-medium">Add Official Coordination Update</label>
                                <textarea
                                  placeholder="e.g. Crews dispatched with hot-mix asphalt."
                                  rows={2}
                                  value={officialResponseText}
                                  onChange={(e) => setOfficialResponseText(e.target.value)}
                                  className="w-full bg-white border border-slate-200 p-2 rounded-lg text-[11px] text-slate-800 outline-none focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1]"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(selectedIssue.id)}
                                  className="w-full py-1.5 bg-[#00796B] text-white font-bold text-[10px] rounded-lg shadow hover:bg-[#005c51]"
                                >
                                  Dispatch Update
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Discussion Section */}
                      <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-bold text-[#0D47A1] uppercase tracking-widest font-mono flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-[#00796B]" />
                          <span>Discussion Thread ({selectedIssue.comments.length})</span>
                        </h4>

                        {/* Write Comment */}
                        <form onSubmit={handlePostComment} className="flex gap-2">
                          <input 
                            type="text" 
                            required
                            placeholder="Add coordinate note or verify status..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="flex-1 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs text-slate-800 outline-none focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1]"
                          />
                          <button
                            type="submit"
                            className="p-2 bg-[#0D47A1] hover:bg-[#0b3c8a] text-white rounded-xl transition-all shadow flex items-center justify-center"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </form>

                        {/* Comments List */}
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {selectedIssue.comments.length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic py-2 text-center">No citizen notes yet. Be the first to start coordination!</p>
                          ) : (
                            selectedIssue.comments.map(comment => (
                              <div 
                                key={comment.id} 
                                className={`p-3 rounded-xl border text-[11px] leading-relaxed flex items-start gap-2.5 ${
                                  comment.isOfficialResponse 
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-950" 
                                    : "bg-slate-50 border-slate-100 text-slate-800"
                                }`}
                              >
                                <img src={comment.userAvatar} alt="" className="w-6 h-6 rounded-full shrink-0 object-cover" />
                                <div className="flex-1 space-y-0.5">
                                  <div className="flex items-center justify-between">
                                    <span className={`font-bold ${comment.isOfficialResponse ? "text-emerald-800" : "text-slate-800"}`}>
                                      {comment.userName}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-mono">
                                      {new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                  </div>
                                  <p>{comment.content}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="animate-fade-in py-12 text-center text-slate-500">
                      <MapPin className="w-10 h-10 text-slate-400 mx-auto mb-2 animate-bounce" />
                      <p className="text-sm font-bold text-slate-800">No active markers selected</p>
                      <p className="text-xs mt-1">Select any colored pinpoint indicator on the grid map to explore active neighborhood issues, or switch to the <strong className="text-[#00796B]">File Report</strong> tab to report a new hazard.</p>
                    </div>
                  )}

                  </div>
                </div>
              </div>
            )}



            {/* Impact Dashboard Tab */}
            {activeTab === "dashboard" && (
              <div className="space-y-10 animate-fade-in" id="impact-dashboard-tab-container">
                
                {/* Dashboard Header / Banner */}
                <div className="bg-slate-950 border border-slate-800 p-8 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-teal-400 font-display">Oakridge Dispatch Command</h2>
                    <p className="text-xs text-slate-400 mt-1 font-mono">Real-time analytical insights and individual civic contributions.</p>
                  </div>
                  <div className="text-xs bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl font-mono text-slate-400">
                    System Telemetry Frequency: <span className="text-teal-400 font-bold">142.8 MHz</span>
                  </div>
                </div>

                {/* Dashboard Stats Panel */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl hover:border-slate-700 transition-all">
                    <p className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Total Reports Registered</p>
                    <p className="text-4xl font-extrabold font-display mt-2 text-teal-400">{totalReported}</p>
                    <p className="text-[10px] text-slate-400 mt-3 font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                      <span>Verified & managed collectively</span>
                    </p>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl hover:border-slate-700 transition-all">
                    <p className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Resolved Conflicts</p>
                    <p className="text-4xl font-extrabold font-display mt-2 text-emerald-400">{totalResolved}</p>
                    <p className="text-[10px] text-emerald-400 mt-3 font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                      <span>{totalReported ? Math.floor((totalResolved / totalReported) * 100) : 0}% success rate</span>
                    </p>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl hover:border-slate-700 transition-all">
                    <p className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Active Municipal Works</p>
                    <p className="text-4xl font-extrabold font-display mt-2 text-amber-400">{totalInProgress}</p>
                    <p className="text-[10px] text-amber-400 mt-3 font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                      <span>Teams currently on scene</span>
                    </p>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl hover:border-slate-700 transition-all">
                    <p className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Pending Approvals</p>
                    <p className="text-4xl font-extrabold font-display mt-2 text-rose-400">
                      {issues.filter(i => i.status === "reported").length}
                    </p>
                    <p className="text-[10px] text-rose-400 mt-3 font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                      <span>Awaiting community support</span>
                    </p>
                  </div>
                </div>

                {/* Recharts Analytics Dashboard */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="recharts-analytics-dashboard">
                  {/* Community Impact Trend */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-teal-400 font-mono mb-1">Community Impact Timeline</h3>
                      <p className="text-xs text-slate-400">Monthly breakdown of citizen reports versus successful municipal resolutions.</p>
                    </div>
                    <div className="h-64 mt-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={monthlyImpactData}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorReported" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                          <XAxis 
                            dataKey="name" 
                            stroke="#64748b" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                          />
                          <YAxis 
                            stroke="#64748b" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "#0b1528", 
                              borderColor: "#1e293b", 
                              borderRadius: "12px",
                              color: "#f8fafc",
                              fontSize: "12px"
                            }} 
                          />
                          <Legend 
                            verticalAlign="top" 
                            height={36} 
                            iconType="circle" 
                            iconSize={8}
                            wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="Reported" 
                            stroke="#38bdf8" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorReported)" 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="Resolved" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorResolved)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Citizen XP Distribution Bar Chart */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-teal-400 font-mono mb-1">Citizen Points (XP) Distribution</h3>
                      <p className="text-xs text-slate-400">Total earned points by top community contributors to date.</p>
                    </div>
                    <div className="h-64 mt-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={userXPData}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                          <XAxis 
                            dataKey="name" 
                            stroke="#64748b" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                          />
                          <YAxis 
                            stroke="#64748b" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "#0b1528", 
                              borderColor: "#1e293b", 
                              borderRadius: "12px",
                              color: "#f8fafc",
                              fontSize: "12px"
                            }}
                          />
                          <Legend 
                            verticalAlign="top" 
                            height={36} 
                            iconType="circle" 
                            iconSize={8}
                            wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }}
                          />
                          <Bar 
                            dataKey="XP" 
                            fill="#14b8a6" 
                            radius={[6, 6, 0, 0]} 
                            maxBarSize={32}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Main Content: Category Distribution */}
                <div className="grid grid-cols-1 gap-8">
                  
                  {/* Category Distribution Bar Chart */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-xl flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-teal-400 font-mono mb-1">Issue Distribution by Domain</h3>
                      <p className="text-xs text-slate-400">Comparing active and resolved issues flagged by local citizens.</p>
                    </div>

                    <div className="space-y-5 my-6">
                      {categoryStats.map((cat, idx) => {
                        const percent = totalReported ? Math.floor((cat.count / totalReported) * 100) : 0;
                        return (
                          <div key={idx} className="space-y-1.5 text-xs">
                            <div className="flex justify-between text-slate-200 font-medium">
                              <span>{cat.name}</span>
                              <span className="font-mono font-bold text-slate-400">{cat.count} cases ({percent}%)</span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                              <div 
                                style={{ width: `${percent}%` }}
                                className={`h-full ${cat.color} rounded-full transition-all duration-500`}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl text-[11px] text-slate-400 leading-relaxed">
                      💡 <strong>Distribution Note:</strong> Road potholes and water utilities constitute the major share of reports. Solving these reduces secondary neighborhood decay by up to 40%.
                    </div>
                  </div>

                </div>

                {/* MY CITIZEN ACTIVITY LOG VIEW WITH PROGRESS BAR INDICATOR */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-xl">
                  <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-teal-400 font-display flex items-center gap-2">
                        <User className="w-5 h-5 text-teal-400" />
                        <span>My Citizen Activity Log</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Real-time progression of community issues you reported or validated peer complaints.
                      </p>
                    </div>

                    {/* Date-range filters & Export as CSV */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="flex items-center bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                        {[
                          { key: "all", label: "All Time" },
                          { key: "30days", label: "30 Days" },
                          { key: "month", label: "This Month" },
                          { key: "year", label: "This Year" }
                        ].map((f) => (
                          <button
                            key={f.key}
                            onClick={() => setActivityDateFilter(f.key as any)}
                            className={`text-[10px] px-3 py-1.5 rounded-lg font-mono uppercase font-bold transition-all ${
                              activityDateFilter === f.key
                                ? "bg-teal-500 text-slate-950 shadow"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>

                      {userProfile && getUserActivityIssues().length > 0 && (
                        <button
                          onClick={handleExportCSV}
                          className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs text-teal-400 transition-all font-mono font-bold shadow-md"
                          title="Export Activity History to CSV"
                        >
                          <Download className="w-3.5 h-3.5 text-teal-400" />
                          <span>Export CSV</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {userProfile ? (
                    <div className="space-y-6">
                      {getUserActivityIssues().length === 0 ? (
                        <div className="bg-slate-950 border border-slate-800 p-8 rounded-2xl text-center text-xs text-slate-400">
                          {activityDateFilter === "all" 
                            ? "No personal activity logged yet. Report an issue on the Map or upvote pending items in the Verify Queue!"
                            : "No personal activity found matching the selected date filter."}
                        </div>
                      ) : (
                        getUserActivityIssues().map(issue => {
                          // Calculate status progression steps
                          const steps = [
                            { key: "reported", label: "Reported" },
                            { key: "verified", label: "Peer Verified" },
                            { key: "assigned", label: "Trade Assigned" },
                            { key: "in_progress", label: "In Progress" },
                            { key: "resolved", label: "Resolved" }
                          ];
                          
                          // Determine index
                          const statusIndex = steps.findIndex(s => s.key === issue.status);
                          const activeIndex = statusIndex >= 0 ? statusIndex : 0;

                          return (
                            <div key={issue.id} className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-5 hover:border-slate-700 transition-all">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div>
                                  <span className="text-[10px] text-teal-400 font-mono font-bold bg-teal-950 border border-teal-800/60 px-2 py-0.5 rounded-md uppercase">
                                    {issue.category}
                                  </span>
                                  <h4 className="text-sm font-bold text-slate-200 font-display mt-1">{issue.title}</h4>
                                  <p className="text-[10px] text-slate-400 mt-0.5">{issue.address}</p>
                                </div>
                                <span className={`text-[10px] font-bold font-mono px-2.5 py-1 rounded-md uppercase tracking-wider ${
                                  issue.urgency === "critical" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-teal-500/20 text-teal-300"
                                }`}>
                                  {issue.urgency} priority
                                </span>
                              </div>

                              {/* Progress bar visualizer */}
                              <div className="pt-2">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-[10px] font-mono text-slate-400">Resolution Progress:</span>
                                  <span className="text-[10px] font-mono font-bold text-teal-400 uppercase">
                                    Current State: {issue.status.replace("_", " ")}
                                  </span>
                                </div>
                                
                                {/* Step nodes */}
                                <div className="grid grid-cols-5 gap-1 text-center relative pt-2">
                                  {steps.map((st, sidx) => {
                                    const isCompleted = sidx <= activeIndex;
                                    const isCurrent = sidx === activeIndex;
                                    return (
                                      <div key={st.key} className="flex flex-col items-center">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border-2 transition-all ${
                                          isCurrent ? "bg-teal-400 border-teal-300 text-slate-950 scale-125 shadow-lg shadow-teal-500/20" :
                                          isCompleted ? "bg-teal-950 border-teal-500 text-teal-300" :
                                          "bg-slate-900 border-slate-800 text-slate-600"
                                        }`}>
                                          {isCompleted ? "✓" : sidx + 1}
                                        </div>
                                        <span className={`text-[9px] mt-1.5 font-medium hidden sm:block ${
                                          isCurrent ? "text-teal-300 font-bold" :
                                          isCompleted ? "text-slate-300" : "text-slate-500"
                                        }`}>
                                          {st.label}
                                        </span>
                                      </div>
                                    );
                                  })}
                                  {/* Line Background */}
                                  <div className="absolute top-[18px] left-[10%] right-[10%] h-[2px] bg-slate-800 -z-10"></div>
                                  <div 
                                    className="absolute top-[18px] left-[10%] h-[2px] bg-teal-500 -z-10 transition-all duration-500"
                                    style={{ width: `${(activeIndex / 4) * 80}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-4">Register user to view activity logs.</p>
                  )}
                </div>

              </div>
            )}

            {/* Verify Queue Tab */}
            {activeTab === "verify" && (
              <div className="space-y-7 animate-fade-in" id="verify-queue-tab-container">
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-xl">
                  <h3 className="text-lg font-bold text-teal-400 font-display">Citizen Peer-Verification Queue</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Help your neighbors! Review reported neighborhood problems, upvote them if you can confirm their existence, or flag duplicate issues.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {issues.filter(i => i.status === "reported").length === 0 ? (
                    <div className="col-span-full bg-slate-900/90 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 shadow-xl">
                      <CheckCircle2 className="w-12 h-12 text-teal-400 mx-auto mb-3 animate-pulse" />
                      <h4 className="text-base font-bold text-slate-200 font-display">Verification queue is clean!</h4>
                      <p className="text-xs mt-1">Every currently logged neighborhood problem has successfully been peer-verified by citizens.</p>
                    </div>
                  ) : (
                    issues.filter(i => i.status === "reported").map(issue => (
                      <div key={issue.id} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between h-[380px] text-slate-100 hover:border-slate-700 transition-all">
                        <div className="space-y-3">
                          <div className="relative h-32 rounded-xl overflow-hidden border border-slate-800/60">
                            <img src={issue.imageUrl} alt={issue.title} className="w-full h-full object-cover" />
                            <span className="absolute top-2.5 right-2.5 text-[9px] font-bold font-mono uppercase bg-slate-950/90 shadow text-teal-300 border border-slate-800 px-2.5 py-1 rounded-md">
                              {issue.category}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-slate-100 truncate font-display">{issue.title}</h4>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-1 font-sans">
                              <span>By {issue.reporterName}</span>
                              <span>•</span>
                              <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                            </p>
                            <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                              {issue.description}
                            </p>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-800/80 space-y-3">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-slate-400">Current Votes:</span>
                            <span className="font-bold text-teal-400">{issue.upvotesCount} / 3 needed</span>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                handleUpvote(issue.id);
                                loadData(true);
                              }}
                              className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                                issue.upvotedBy.includes(userProfile?.id || "")
                                  ? "bg-teal-500/10 text-teal-300 border-teal-500/30 font-bold"
                                  : "bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-850"
                              }`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>{issue.upvotedBy.includes(userProfile?.id || "") ? "Verified" : "Verify Issue"}</span>
                            </button>

                            <button
                              onClick={() => {
                                handleDownvote(issue.id);
                                loadData(true);
                              }}
                              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center transition-all border ${
                                issue.downvotedBy.includes(userProfile?.id || "")
                                  ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:bg-slate-850"
                              }`}
                              title="Flag issue"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Leaderboard Tab */}
            {activeTab === "leaderboard" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in" id="leaderboard-tab-container">
                
                {/* Hero Profile Left Pane */}
                <div className="lg:col-span-5 bg-slate-900/90 border border-slate-850 rounded-3xl p-6 shadow-xl flex flex-col justify-between min-h-[500px] text-slate-100">
                  
                  <div className="space-y-5">
                    <div className="flex items-center gap-4">
                      {userProfile ? (
                        <>
                          <img 
                            src={userProfile.avatar} 
                            alt="" 
                            className={`w-16 h-16 rounded-full border-4 object-cover shadow-lg ${
                              userProfile.role === "architect" ? "border-amber-500 ring-2 ring-purple-600/30" : "border-slate-800"
                            }`} 
                          />
                          <div>
                            <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded border uppercase tracking-widest flex items-center gap-1.5 w-fit ${
                              userProfile.role === "architect" 
                                ? "bg-purple-550/10 text-amber-400 border-amber-500/20" 
                                : "bg-teal-500/10 text-teal-400 border-teal-500/20"
                            }`}>
                              {userProfile.role === "architect" ? (
                                <>
                                  <Crown className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> Elite Architect
                                </>
                              ) : "Platinum Citizen Hero"}
                            </span>
                            <h3 className={`text-lg font-bold font-display mt-1.5 ${
                              userProfile.role === "architect" ? "text-amber-100" : "text-slate-100"
                            }`}>{userProfile.name}</h3>
                            <p className="text-xs text-slate-400">
                              {userProfile.role === "architect" 
                                ? `Specialty: ${userProfile.specialty || "Structural Solver Guild"}` 
                                : "Oakridge Central District Coordination"}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-slate-800 animate-pulse"></div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className={`bg-slate-950 p-4 rounded-2xl border ${userProfile?.role === "architect" ? "border-purple-950" : "border-slate-800/80"}`}>
                        <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block">Points Contributed</span>
                        <span className={`text-xl font-bold font-display mt-1 block ${userProfile?.role === "architect" ? "text-amber-400" : "text-teal-400"}`}>{userProfile?.points} XP</span>
                      </div>
                      <div className={`bg-slate-950 p-4 rounded-2xl border ${userProfile?.role === "architect" ? "border-purple-950" : "border-slate-800/80"}`}>
                        <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block">Confirmations Given</span>
                        <span className={`text-xl font-bold font-display mt-1 block ${userProfile?.role === "architect" ? "text-purple-400" : "text-teal-400"}`}>{userProfile?.verificationsCount} cases</span>
                      </div>
                    </div>

                    {/* Badge Shelf */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block">Unlocked Badges ({userProfile?.badges.length || 0})</span>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {userProfile?.badges.map(badge => (
                          <div key={badge.id} className="bg-slate-950 border border-slate-850 p-3.5 rounded-2xl flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                              {renderBadgeIcon(badge.icon)}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-200">{badge.name}</p>
                              <p className="text-[10px] text-slate-400">{badge.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Reset Sandbox Database Button for developers */}
                  <div className="pt-4 border-t border-slate-800/80 mt-4">
                    <button
                      onClick={handleSystemReset}
                      className="w-full py-2.5 bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-850 hover:text-red-400 transition-all text-xs font-semibold text-center text-slate-400"
                    >
                      Reset Sandbox Telemetry Database
                    </button>
                  </div>

                </div>

                {/* Global Citizens Leaderboard Right Pane */}
                <div className="lg:col-span-7 bg-slate-900/90 border border-slate-850 rounded-3xl p-6 shadow-xl flex flex-col h-[500px] text-slate-100">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-teal-400 font-mono flex items-center gap-2">
                      <Award className="w-4 h-4 text-teal-400 animate-pulse" />
                      <span>Top Contributors Leaderboard</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Oakridge Meadows high performers ranked by total contribution points.</p>
                  </div>

                  <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1">
                    {leaderboard.map((user, idx) => {
                      const rank = idx + 1;
                      const isTop3 = rank <= 3;
                      const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
                      const rankColor = rank === 1 ? "text-yellow-400 font-bold" : rank === 2 ? "text-slate-300 font-bold" : rank === 3 ? "text-amber-600 font-bold" : "text-slate-400 font-medium";
                      
                      return (
                        <div 
                          key={user.id} 
                          className={`p-4 rounded-2xl flex items-center justify-between transition-all border ${
                            user.id === userProfile?.id 
                              ? "bg-teal-500/10 border-teal-500/30 text-slate-100 shadow-[0_0_15px_rgba(20,184,166,0.15)]" 
                              : isTop3 
                                ? "bg-slate-950/80 border-slate-800/80 hover:border-slate-700"
                                : "bg-slate-950 border-slate-900 hover:bg-slate-850"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-mono w-6 text-center shrink-0 ${rankColor}`}>
                              {medal || `#${rank}`}
                            </span>
                            <div className="relative">
                              <img src={user.avatar} alt="" className="w-10 h-10 rounded-full border border-slate-800 object-cover" />
                              {isTop3 && (
                                <span className="absolute -top-1 -right-1 text-[8px] bg-slate-900 border border-slate-700 px-1 rounded-full font-bold">
                                  {rank === 1 ? "TOP" : rank}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-bold text-slate-100">{user.name}</p>
                                {user.id === userProfile?.id && (
                                  <span className="text-[8px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-1.5 py-0.5 rounded font-mono font-bold">YOU</span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <span>Level {Math.floor(user.points / 100) + 1}</span>
                                <span>•</span>
                                <span>{user.reportsCount} reports</span>
                                <span>•</span>
                                <span>{user.verificationsCount} votes</span>
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold font-mono text-teal-400 bg-teal-950/40 border border-teal-900/60 px-2 py-1 rounded-lg">{user.points} XP</span>
                            <div className="flex gap-1.5 justify-end mt-2">
                              {user.badges.slice(0, 3).map((badge, bidx) => (
                                <span 
                                  key={bidx} 
                                  className="w-4 h-4 rounded bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0" 
                                  title={`${badge.name}: ${badge.description}`}
                                >
                                  {badge.icon === "Eye" ? <Eye className="w-2.5 h-2.5 text-emerald-400" /> : 
                                   badge.icon === "Award" ? <Award className="w-2.5 h-2.5 text-amber-400" /> : 
                                   badge.icon === "Flag" ? <Flag className="w-2.5 h-2.5 text-blue-400" /> : 
                                   badge.icon === "ShieldAlert" ? <ShieldAlert className="w-2.5 h-2.5 text-red-400" /> :
                                   badge.icon === "Sparkles" ? <Sparkles className="w-2.5 h-2.5 text-yellow-400" /> :
                                   badge.icon === "Droplets" ? <Droplets className="w-2.5 h-2.5 text-sky-400" /> :
                                   badge.icon === "Trash2" ? <Trash2 className="w-2.5 h-2.5 text-orange-400" /> :
                                   <Award className="w-2.5 h-2.5 text-teal-400" />}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>

              </div>
            )}

            {/* AI Priority Coordination Hub & Dispatch Center Tab */}
            {activeTab === "prioritize" && (
              <div className="space-y-10 animate-fade-in" id="ai-priority-hub-tab">
                
                {/* Title Banner with Pulse and Refresh */}
                <div className="bg-slate-950 border border-slate-800 p-8 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none"></div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </span>
                      <span className="text-[10px] font-bold font-mono tracking-widest text-rose-400 uppercase">AI Dispatch Status: Optimized & Active</span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-white font-display flex items-center gap-2">
                      <BadgeAlert className="w-6 h-6 text-rose-400" />
                      <span>AI Priority Dispatch Hub</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Multi-factor dispatch telemetry & predictive risk-weighting coordination for city administration.
                    </p>
                  </div>
                  <button 
                    onClick={() => loadPrioritizedIssues()}
                    disabled={loadingPrioritized}
                    className="flex items-center gap-2 text-xs bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-slate-300 px-4 py-2.5 rounded-xl font-mono transition-all disabled:opacity-50"
                  >
                    {loadingPrioritized ? (
                      <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                    ) : (
                      <RefreshCw className="w-4 h-4 text-rose-400" />
                    )}
                    <span>Force AI Re-Prioritize</span>
                  </button>
                </div>

                {/* Dashboard Metrics Bar */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Total Unresolved</p>
                    <p className="text-2xl font-bold text-white mt-1 font-display">{issues.filter(i => i.status !== "resolved").length}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Issues awaiting action</p>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-rose-400">Critical Priority</p>
                    <p className="text-2xl font-bold text-rose-400 mt-1 font-display">{prioritizedIssues.filter(item => item.priorityLevel === "Critical").length}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Urgent public hazard</p>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-orange-400">High Priority</p>
                    <p className="text-2xl font-bold text-orange-400 mt-1 font-display">{prioritizedIssues.filter(item => item.priorityLevel === "High").length}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">High disruption risks</p>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Affected Citizens</p>
                    <p className="text-2xl font-bold text-teal-400 mt-1 font-display">{issues.filter(i => i.status !== "resolved").reduce((acc, curr) => acc + (curr.upvotesCount || 0), 0)}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Immediate upvote density</p>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl col-span-2 lg:col-span-1">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Avg Priority Index</p>
                    <p className="text-2xl font-bold text-white mt-1 font-display">{prioritizedIssues.length > 0 ? Math.round(prioritizedIssues.reduce((acc, curr) => acc + curr.priorityScore, 0) / prioritizedIssues.length) : 0}<span className="text-xs text-slate-500">/100</span></p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Calculated model mean</p>
                  </div>
                </div>

                {/* Left Column (Sliders & Charts) & Right Column (Ranked Queue) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left Column (5 Grid Span) */}
                  <div className="lg:col-span-5 flex flex-col gap-8">
                    
                    {/* Weights Adjuster Card */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-rose-400 font-mono">Dynamic AI Priority Weights</h3>
                        <p className="text-xs text-slate-400 mt-1">Calibrate the multi-criteria risk model. Adjust sliders to set direct dispatch focus.</p>
                      </div>

                      <div className="space-y-5">
                        {/* Severity weight */}
                        <div>
                          <div className="flex justify-between text-xs font-mono mb-1">
                            <span className="text-slate-300">Severity Bias</span>
                            <span className="text-rose-400 font-bold">{(severityWeight / (severityWeight + urgencyWeight + dangerWeight + affectedUsersWeight || 1) * 100).toFixed(0)}% <span className="text-slate-500 text-[10px]">({severityWeight})</span></span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={severityWeight} 
                            onChange={(e) => setSeverityWeight(Number(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                          />
                        </div>

                        {/* Urgency weight */}
                        <div>
                          <div className="flex justify-between text-xs font-mono mb-1">
                            <span className="text-slate-300">Urgency Bias</span>
                            <span className="text-rose-400 font-bold">{(urgencyWeight / (severityWeight + urgencyWeight + dangerWeight + affectedUsersWeight || 1) * 100).toFixed(0)}% <span className="text-slate-500 text-[10px]">({urgencyWeight})</span></span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={urgencyWeight} 
                            onChange={(e) => setUrgencyWeight(Number(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                          />
                        </div>

                        {/* Danger weight */}
                        <div>
                          <div className="flex justify-between text-xs font-mono mb-1">
                            <span className="text-slate-300">Potential Danger Bias</span>
                            <span className="text-rose-400 font-bold">{(dangerWeight / (severityWeight + urgencyWeight + dangerWeight + affectedUsersWeight || 1) * 100).toFixed(0)}% <span className="text-slate-500 text-[10px]">({dangerWeight})</span></span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={dangerWeight} 
                            onChange={(e) => setDangerWeight(Number(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                          />
                        </div>

                        {/* Affected Citizens weight */}
                        <div>
                          <div className="flex justify-between text-xs font-mono mb-1">
                            <span className="text-slate-300">Affected Citizens Bias</span>
                            <span className="text-rose-400 font-bold">{(affectedUsersWeight / (severityWeight + urgencyWeight + dangerWeight + affectedUsersWeight || 1) * 100).toFixed(0)}% <span className="text-slate-500 text-[10px]">({affectedUsersWeight})</span></span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={affectedUsersWeight} 
                            onChange={(e) => setAffectedUsersWeight(Number(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => loadPrioritizedIssues()}
                        disabled={loadingPrioritized}
                        className="w-full py-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-mono text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loadingPrioritized ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        <span>Recalculate AI Priority Matrix</span>
                      </button>
                    </div>

                    {/* Analytics Recharts Card */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">Critical Priority Scores</h3>
                        <p className="text-xs text-slate-400 mt-1">Comparison metrics of top 5 prioritized issues.</p>
                      </div>

                      {prioritizedIssues.length > 0 ? (
                        <div className="h-56 mt-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={prioritizedIssues.slice(0, 5).map(p => ({
                                name: p.title.length > 14 ? p.title.substring(0, 12) + "..." : p.title,
                                "Score": p.priorityScore
                              }))}
                              margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                              <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                              <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 100]} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                                itemStyle={{ color: '#fda4af' }}
                              />
                              <Bar dataKey="Score" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center py-10 text-slate-500 text-xs font-mono">
                          No analytical data available.
                        </div>
                      )}
                    </div>
                    
                  </div>

                  {/* Right Column (7 Grid Span) */}
                  <div className="lg:col-span-7 flex flex-col gap-6">
                    
                    {/* Filter and Search Panel */}
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
                      <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Search prioritize parameters..."
                          value={prioritizeSearch}
                          onChange={(e) => setPrioritizeSearch(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50 font-mono transition-all"
                        />
                      </div>

                      <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
                        {["all", "critical", "high", "medium"].map(level => (
                          <button
                            key={level}
                            onClick={() => setPrioritizeLevelFilter(level)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all ${
                              prioritizeLevelFilter === level 
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" 
                                : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-100"
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Ranked Issues Queue */}
                    <div className="space-y-4">
                      {loadingPrioritized ? (
                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4">
                          <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
                          <p className="text-xs font-mono text-slate-400">Urban Dispatch AI is currently evaluating severity vectors...</p>
                        </div>
                      ) : (prioritizedIssues.filter(item => {
                        if (prioritizeLevelFilter !== "all" && item.priorityLevel.toLowerCase() !== prioritizeLevelFilter.toLowerCase()) {
                          return false;
                        }
                        if (prioritizeSearch.trim()) {
                          const q = prioritizeSearch.toLowerCase();
                          return item.title.toLowerCase().includes(q) || item.rationale.toLowerCase().includes(q);
                        }
                        return true;
                      })).length === 0 ? (
                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center">
                          <AlertTriangle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                          <p className="text-xs font-mono text-slate-400">No active unresolved issues fit the chosen priority criteria.</p>
                        </div>
                      ) : (
                        (prioritizedIssues.filter(item => {
                          if (prioritizeLevelFilter !== "all" && item.priorityLevel.toLowerCase() !== prioritizeLevelFilter.toLowerCase()) {
                            return false;
                          }
                          if (prioritizeSearch.trim()) {
                            const q = prioritizeSearch.toLowerCase();
                            return item.title.toLowerCase().includes(q) || item.rationale.toLowerCase().includes(q);
                          }
                          return true;
                        })).map((item) => {
                          const originalIssue = issues.find(i => i.id === item.id);
                          const upvotes = originalIssue?.upvotesCount || 0;
                          const currentStatus = originalIssue?.status || "open";

                          return (
                            <div 
                              key={item.id} 
                              className={`bg-slate-900/90 border rounded-3xl p-6 transition-all hover:border-slate-700/80 flex flex-col gap-4 relative overflow-hidden ${
                                item.priorityLevel === "Critical" 
                                  ? "border-rose-500/20 shadow-lg shadow-rose-950/5" 
                                  : item.priorityLevel === "High"
                                  ? "border-orange-500/20"
                                  : "border-slate-800"
                              }`}
                            >
                              {/* Glowing Left Stripe */}
                              <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                                item.priorityLevel === "Critical" 
                                  ? "bg-rose-500" 
                                  : item.priorityLevel === "High"
                                  ? "bg-orange-500"
                                  : "bg-teal-500"
                              }`}></div>

                              {/* Top Bar (Ranks & Status) */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono tracking-wider ${
                                    item.priorityLevel === "Critical"
                                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                      : item.priorityLevel === "High"
                                      ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                      : "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                                  }`}>
                                    Rank #{item.rank}
                                  </span>
                                  <span className="text-xs font-bold text-slate-300 font-mono">Score: {item.priorityScore}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono text-slate-400">Status:</span>
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                    currentStatus === "open"
                                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                      : currentStatus === "assigned"
                                      ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                      : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                  }`}>
                                    {currentStatus}
                                  </span>
                                </div>
                              </div>

                              {/* Title and Civic Support stats */}
                              <div>
                                <h4 className="text-base font-bold text-white tracking-tight">{item.title}</h4>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] text-slate-400 font-mono">
                                  <span>Category: <strong className="text-slate-300">{originalIssue?.category}</strong></span>
                                  <span>•</span>
                                  <span>Address: <strong className="text-slate-300">{originalIssue?.address?.split('(')[0] || "Unknown Coordinates"}</strong></span>
                                  <span>•</span>
                                  <span className="text-teal-400 font-bold">{upvotes} Citizen Verifications</span>
                                </div>
                              </div>

                              {/* AI Rationale block */}
                              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex flex-col gap-1.5 relative">
                                <div className="flex items-center gap-1.5 text-rose-400 text-[10px] font-bold uppercase tracking-wider font-mono">
                                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                                  <span>AI Risk Rationale</span>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed font-sans">{item.rationale}</p>
                              </div>

                              {/* Resource recommendation block */}
                              <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col gap-1">
                                <div className="text-amber-400 text-[10px] font-bold uppercase tracking-wider font-mono">
                                  Suggested Action Plan
                                </div>
                                <p className="text-xs text-slate-400 font-mono">{item.suggestedResourceAllocation}</p>
                              </div>

                              {/* Authority Action Form Panel */}
                              <div className="border-t border-slate-800 pt-4 flex flex-col gap-3">
                                <div className="text-[10px] font-bold font-mono tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                                  <Sliders className="w-3 h-3" />
                                  <span>Administrative Dispatch Directive</span>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <input 
                                    type="text"
                                    placeholder="Enter official coordinate response / broadcast directive..."
                                    value={officialResponseTexts[item.id] || ""}
                                    onChange={(e) => setOfficialResponseTexts(prev => ({ ...prev, [item.id]: e.target.value }))}
                                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-rose-500"
                                  />
                                  
                                  <div className="flex gap-2 shrink-0">
                                    <button
                                      onClick={() => handleAuthorityAction(item.id, "assigned", officialResponseTexts[item.id] || "")}
                                      className="px-3 py-2 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1"
                                      title="Mark Assigned / Dispatch unit"
                                    >
                                      <Send className="w-3 h-3" />
                                      <span>Dispatch</span>
                                    </button>
                                    <button
                                      onClick={() => handleAuthorityAction(item.id, "resolved", officialResponseTexts[item.id] || "")}
                                      className="px-3 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1"
                                      title="Mark Resolved"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Resolve</span>
                                    </button>
                                  </div>
                                </div>
                              </div>

                            </div>
                          );
                        })
                      )}
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* Elite Architect Portal Tab */}
            {activeTab === "architect" && (
              <div className="space-y-10 animate-fade-in" id="elite-architect-portal-tab">
                
                {/* Title and Intro Banner with generous spacing */}
                <div className="bg-slate-950 border border-slate-800 p-8 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-yellow-400 font-display flex items-center gap-2">
                      <Sliders className="w-6 h-6 text-yellow-400" />
                      <span>Elite Architect Arrangement Portfolio</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Direct command center for Oakridge base telemetry, trade guild deployments, and micro-precision filters.
                    </p>
                  </div>
                  <div className="text-xs bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl font-mono text-slate-400">
                    Authority Class: <span className="text-yellow-400 font-bold">Elite Architect</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  
                  {/* Left Column: Precision Search & Proximity Filters Panel (5 cols) */}
                  <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-xl flex flex-col gap-6">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-teal-400 font-mono">Precision Filters</h3>
                      <p className="text-xs text-slate-400 mt-1">Isolate issues by text query, anchor base, and maximum proximity.</p>
                    </div>

                    {/* Area-Based Search */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-300 font-mono">Area-Based Search</label>
                      <input
                        type="text"
                        placeholder="Search street (e.g. Pine, Oak) or landmark..."
                        value={architectSearch}
                        onChange={(e) => setArchitectSearch(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl text-slate-100 outline-none focus:border-yellow-500 text-xs transition-all"
                      />
                    </div>

                    {/* Anchor Base Station Selector */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-300 font-mono">Anchor Base Station</label>
                      <select
                        value={selectedAnchorStation}
                        onChange={(e) => setSelectedAnchorStation(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl text-slate-100 outline-none focus:border-yellow-500 text-xs transition-all"
                      >
                        {ANCHOR_STATIONS.map(station => (
                          <option key={station.id} value={station.id}>
                            {station.name} ({station.lat.toFixed(4)}°, {station.lng.toFixed(4)}°)
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-500 italic mt-1 leading-normal">
                        Proximity distances will be dynamically calculated relative to the selected anchor station coordinates.
                      </p>
                    </div>

                    {/* Hyperlocal Proximity Filtering */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-300 font-mono">
                        <span>Max Proximity Radius</span>
                        <span className="text-yellow-400">{maxProximityDistance} km</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="25"
                        value={maxProximityDistance}
                        onChange={(e) => setMaxProximityDistance(Number(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>1 km</span>
                        <span>5 km</span>
                        <span>10 km</span>
                        <span>25 km</span>
                      </div>
                    </div>

                    {/* Trade and Guild Filter Row */}
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-slate-300 font-mono">Trade Guild Categories</label>
                      <div className="flex flex-wrap gap-2.5">
                        {[
                          { id: "all", name: "All Guilds", icon: "🛠️" },
                          { id: "plumbing", name: "Plumbing", icon: "🚰" },
                          { id: "carpentry", name: "Carpentry", icon: "🪚" },
                          { id: "electrical", name: "Electrical", icon: "⚡" },
                          { id: "roads", name: "Roads & Masonry", icon: "🛣️" },
                          { id: "security", name: "Security & Safety", icon: "🚨" }
                        ].map(guild => (
                          <button
                            key={guild.id}
                            onClick={() => setSelectedGuild(guild.id)}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                              selectedGuild === guild.id
                                ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/40 font-bold"
                                : "bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            <span>{guild.icon}</span>
                            <span>{guild.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Active Telemetry & Arrangement Stream (7 cols) */}
                  <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-xl flex flex-col gap-6">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-yellow-400 font-mono">Active Arrangement Stream</h3>
                      <p className="text-xs text-slate-400 mt-1">Deploy specialized trade divisions to address hyperlocal hazards.</p>
                    </div>

                    <div className="space-y-6 overflow-y-auto max-h-[600px] pr-2">
                      {(() => {
                        // Dynamically compute matching issues
                        const currentStationObj = ANCHOR_STATIONS.find(s => s.id === selectedAnchorStation);
                        if (!currentStationObj) return null;

                        const matchingIssues = issues.filter(issue => {
                          // Search query match
                          const matchesSearch = !architectSearch || 
                            issue.title.toLowerCase().includes(architectSearch.toLowerCase()) ||
                            issue.description.toLowerCase().includes(architectSearch.toLowerCase()) ||
                            issue.address.toLowerCase().includes(architectSearch.toLowerCase());

                          // Proximity match
                          const distance = getDistanceInKm(currentStationObj.lat, currentStationObj.lng, issue.latitude, issue.longitude);
                          const matchesProximity = distance <= maxProximityDistance;

                          // Guild match
                          let matchesGuild = true;
                          if (selectedGuild === "plumbing") {
                            matchesGuild = issue.category === "Water & Utilities";
                          } else if (selectedGuild === "electrical") {
                            matchesGuild = issue.category === "Public Lights & Electrical";
                          } else if (selectedGuild === "roads") {
                            matchesGuild = issue.category === "Road Safety & Potholes";
                          } else if (selectedGuild === "carpentry") {
                            const isSanitation = issue.category === "Waste & Sanitation";
                            const hasWoodKeywords = issue.title.toLowerCase().match(/(wood|tree|park|fence|timber|board|sign|bench)/) || 
                                                    issue.description.toLowerCase().match(/(wood|tree|park|fence|timber|board|sign|bench)/);
                            matchesGuild = isSanitation || hasWoodKeywords;
                          } else if (selectedGuild === "security") {
                            matchesGuild = issue.urgency === "critical" || issue.urgency === "high";
                          }

                          return matchesSearch && matchesProximity && matchesGuild;
                        });

                        if (matchingIssues.length === 0) {
                          return (
                            <div className="bg-slate-950 border border-slate-800 p-12 rounded-2xl text-center text-xs text-slate-400">
                              No active issues correspond to selected filters. Broaden search criteria or select another Anchor Base Station.
                            </div>
                          );
                        }

                        return matchingIssues.map(issue => {
                          const distance = getDistanceInKm(currentStationObj.lat, currentStationObj.lng, issue.latitude, issue.longitude);
                          
                          // Guild name & color tag determination
                          let displayGuild = "General Maintenance";
                          if (issue.category === "Water & Utilities") displayGuild = "Plumbing Division";
                          else if (issue.category === "Public Lights & Electrical") displayGuild = "Electrical Division";
                          else if (issue.category === "Road Safety & Potholes") displayGuild = "Roads & Masonry Division";
                          else if (issue.category === "Waste & Sanitation") displayGuild = "Carpentry Division";
                          else if (issue.urgency === "critical") displayGuild = "Security & Safety";

                          // Calculate progress values
                          const stages = ["reported", "verified", "assigned", "in_progress", "resolved"];
                          const activeIndex = stages.indexOf(issue.status);

                          return (
                            <div key={issue.id} className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between">
                              <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                                <div>
                                  <span className="text-[10px] font-bold font-mono uppercase bg-slate-900 text-yellow-400 px-2.5 py-1 rounded border border-slate-800">
                                    {displayGuild}
                                  </span>
                                  <h4 className="text-sm font-bold text-slate-100 font-display mt-2">{issue.title}</h4>
                                  <p className="text-[10px] text-slate-400 mt-1">{issue.address}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-mono font-bold text-teal-400">{distance.toFixed(2)} km</p>
                                  <p className="text-[9px] text-slate-500 font-mono font-bold uppercase mt-0.5">from anchor</p>
                                </div>
                              </div>

                              <p className="text-xs text-slate-400 italic line-clamp-2 leading-relaxed bg-slate-900/40 p-2.5 rounded-lg border border-slate-900">
                                {issue.description}
                              </p>

                              {/* Progress bar visualizer */}
                              <div className="space-y-1.5 pt-1.5">
                                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                                  <span>Resolution Progress Tracker</span>
                                  <span className="text-teal-400 font-bold uppercase">{issue.status.replace("_", " ")}</span>
                                </div>
                                <div className="grid grid-cols-5 gap-1.5 pt-1 text-center">
                                  {stages.map((stg, sidx) => {
                                    const isDone = sidx <= activeIndex;
                                    return (
                                      <div key={stg} className="flex flex-col items-center">
                                        <div className={`h-1 w-full rounded-full transition-all ${isDone ? "bg-teal-400 shadow-md shadow-teal-500/30" : "bg-slate-800"}`}></div>
                                        <span className={`text-[8px] font-mono mt-1 ${isDone ? "text-slate-300 font-bold" : "text-slate-600"}`}>
                                          {stg.replace("_", " ")}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Timeline Countdown on Card (if deadline is active) */}
                              {issue.deadlineAt && (
                                <div className="p-1.5 rounded-xl border border-slate-800 bg-slate-900/60">
                                  <TimelineCountdown issue={issue} />
                                </div>
                              )}

                              {/* Inline Resolution Notes Input (only if assigned to current architect and not yet resolved) */}
                              {(issue.status === "assigned" || issue.status === "in_progress") && issue.providerId === userProfile?.id && (
                                <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl space-y-2">
                                  <label className="block text-[9px] font-bold text-slate-300 uppercase tracking-wide font-mono">
                                    Certification Closeout Statement
                                  </label>
                                  <textarea
                                    placeholder="Provide detailed repair statement to sign-off..."
                                    rows={2}
                                    value={inlineNotes[issue.id] || ""}
                                    onChange={(e) => setInlineNotes(prev => ({ ...prev, [issue.id]: e.target.value }))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-yellow-500 transition-all font-sans"
                                  />
                                </div>
                              )}

                              {/* Action controls */}
                              <div className="pt-2.5 flex flex-col gap-2.5 border-t border-slate-900">
                                <div className="flex justify-between items-center text-[10px] text-slate-500">
                                  <span>Priority: <strong className={`font-bold uppercase ${issue.urgency === "critical" ? "text-rose-400" : "text-slate-300"}`}>{issue.urgency}</strong></span>
                                  <span>ID: <strong className="font-mono text-slate-400">#{issue.id}</strong></span>
                                </div>
                                
                                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
                                  {/* Left side detail inspector */}
                                  <button
                                    onClick={() => {
                                      setSelectedIssueId(issue.id);
                                      setActiveTab("map");
                                    }}
                                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-[11px] font-bold transition-all uppercase flex items-center gap-1 cursor-pointer"
                                  >
                                    <Search className="w-3.5 h-3.5" />
                                    <span>Inspect Details</span>
                                  </button>

                                  {/* Right side state modifiers */}
                                  {issue.status === "reported" || issue.status === "verified" ? (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleDispatchGuildUnit(issue.id, displayGuild)}
                                        className="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:border-yellow-500/50 text-[11px] font-bold rounded-xl transition-all uppercase tracking-wide cursor-pointer"
                                        title="Dispatch Specialist Unit"
                                      >
                                        Dispatch Crew
                                      </button>
                                      <button
                                        onClick={() => handleAcceptIssue(issue.id)}
                                        className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-[11px] font-bold font-mono rounded-xl shadow-md transition-all uppercase flex items-center gap-1 cursor-pointer"
                                      >
                                        <Crown className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                                        <span>Accept Work</span>
                                      </button>
                                    </div>
                                  ) : (issue.status === "assigned" || issue.status === "in_progress") ? (
                                    issue.providerId === userProfile?.id ? (
                                      <button
                                        onClick={() => handleResolveIssue(issue.id, inlineNotes[issue.id] || "")}
                                        className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[11px] font-bold font-mono rounded-xl shadow transition-all uppercase cursor-pointer"
                                      >
                                        Certify & Closeout Resolution
                                      </button>
                                    ) : (
                                      <span className="text-[11px] font-mono font-bold text-slate-500 flex items-center gap-1">
                                        ✓ Specialist En Route (Other Elite Analyst)
                                      </span>
                                    )
                                  ) : (
                                    <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                                      ✓ Resolved & Certified (+{issue.pointsEarned || 100} XP)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>

                  </div>

                </div>

              </div>
            )}
          </>
        )}

      </main>

      {/* Gamification Footer */}
      <footer className="relative z-10 border-t border-slate-800 bg-slate-950 text-slate-300 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          
          <div className="flex flex-col sm:flex-row gap-4 items-center flex-1 w-full">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Season Goal</span>
              <div className="w-32 sm:w-48 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div 
                  style={{ width: `${Math.min(100, ((userProfile?.points || 0) / 1000) * 100)}%` }}
                  className="h-full bg-gradient-to-r from-teal-500 to-teal-300 transition-all duration-500"
                ></div>
              </div>
              <span className="text-[10px] font-mono font-bold text-teal-400">
                {userProfile ? `${userProfile.points} / 1000 XP` : "Loading..."}
              </span>
            </div>
            
            <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>
            
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Active Medals:</span>
              <div className="flex -space-x-1.5">
                <span className="w-4.5 h-4.5 rounded-full bg-yellow-500 border border-slate-950 block shadow-md" title="Citizen Medal"></span>
                <span className="w-4.5 h-4.5 rounded-full bg-teal-500 border border-slate-950 block shadow-md" title="Eagle Eye"></span>
                <span className="w-4.5 h-4.5 rounded-full bg-emerald-500 border border-slate-950 block shadow-md" title="Community Pillar"></span>
              </div>
            </div>
          </div>

          <div className="text-[9px] font-mono font-bold text-teal-400 tracking-wide uppercase">
            Connected to Oakridge City telemetry hub • System Status: Active
          </div>

        </div>
      </footer>

    </div>
  );
}
