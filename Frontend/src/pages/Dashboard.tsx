import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Play, LogOut, History, Brain, Mic, Video, TrendingUp } from "lucide-react";


// 🔥 SESSION TYPE (IMPORTANT FOR TYPESCRIPT)
type Session = {
  id?: string;
  role: string;
  date: string;
  score: number;
  status: string;
  wordsSpoken?: number;
  duration?: string;
};

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [interviewType, setInterviewType] = useState("both");
  const [programmingLanguage, setProgrammingLanguage] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [starting, setStarting] = useState(false);

  // 🔥 sessions typed
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showAll, setShowAll] = useState(false);

  // 🔥 load sessions
  useEffect(() => {
    const loadSessions = () => {
      const stored = JSON.parse(localStorage.getItem("sessions") || "[]");
      setSessions(stored);
    };

    loadSessions();
    window.addEventListener("focus", loadSessions);
    return () => window.removeEventListener("focus", loadSessions);
  }, []);

  // 🔥 start interview
  const handleStartInterview = async () => {

  if (!targetRole.trim()) {
    toast({ variant: "destructive", title: "Enter target role" });
    return;
  }

  if (interviewType !== "hr" && !programmingLanguage) {
    toast({
      variant: "destructive",
      title: "Please select programming language",
    });
    return;
  }

  setStarting(true);

  setTimeout(() => {

    const sessionId = Date.now();

    navigate(`/interview/${sessionId}`, {
      state: {
        interviewType,
        programmingLanguage,
        difficulty,
        targetRole,
        targetCompany
      }
    });

    setStarting(false);

  }, 500);
};

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  // 🔥 stats
  const totalSessions = sessions.length;
  const completed = sessions.filter(s => s.status !== "in-progress").length;
  const inprogress = sessions.filter(s => s.status === "in-progress").length;

  const avgScore =
    completed > 0
      ? Math.round(
          sessions
            .filter(s => s.score)
            .reduce((a, s) => a + s.score, 0) / completed
        )
      : 0;

  return (
    <div className="min-h-screen bg-background">

      {/* HEADER */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex justify-between px-4 py-4">
          <h1 className="text-xl font-bold">InterviewAI Coach</h1>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">

        {/* 🔥 STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Brain, label: "Sessions", value: totalSessions, color: "text-primary" },
            { icon: TrendingUp, label: "Avg Score", value: completed ? avgScore + "%" : "—", color: "text-accent" },
            { icon: Video, label: "Completed", value: completed, color: "text-green-500" },
            { icon: Mic, label: "In Progress", value: inprogress, color: "text-yellow-500" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardContent className="flex items-center gap-4 p-5">
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">

          {/* START INTERVIEW */}
          <motion.div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Start New Interview</CardTitle>
                <CardDescription>Configure mock interview</CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Interview Type</Label>
                    <Select value={interviewType} onValueChange={setInterviewType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="hr">HR</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Difficulty</Label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full border rounded-md p-2"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Target Role *</Label>
                    <Input value={targetRole} onChange={(e)=>setTargetRole(e.target.value)} />
                    </div>

                    {interviewType !== "hr" && (

                    <div>
                      <Label>Programming Language</Label>

                      <Select
                        value={programmingLanguage}
                        onValueChange={setProgrammingLanguage}
                      >

                        <SelectTrigger>
                          <SelectValue placeholder="Select Language" />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="java">Java</SelectItem>
                          <SelectItem value="mern">MERN</SelectItem>
                        </SelectContent>

                      </Select>

                    </div>

                  )}
                </div>

                <div>
                  <Label>Target Company</Label>
                  <Input value={targetCompany} onChange={(e)=>setTargetCompany(e.target.value)} />
                </div>

                <Button onClick={handleStartInterview} disabled={starting} className="w-full">
                  <Play className="h-4 w-4 mr-2"/>
                  {starting ? "Starting..." : "Start Interview"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* 🔥 RECENT SESSIONS */}
          <motion.div>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex gap-2 items-center">
                  <History className="h-5 w-5"/> Recent Sessions
                </CardTitle>
              </CardHeader>

              <CardContent>
  {sessions.length === 0 ? (
    <p className="text-sm text-muted-foreground text-center py-4">
      No sessions yet
    </p>
  ) : (
    <>
      {/* scroll area */}
      <div className="max-h-64 overflow-y-auto pr-2">
        {(showAll ? sessions : sessions.slice(-5))
          .slice()
          .reverse()
          .map((s, i) => (
            <div
  key={i}
  className="border rounded-lg p-3 mb-2 hover:bg-muted relative"
>

  {/* 🔥 DELETE BUTTON */}
  <button
    onClick={(e) => {
      e.stopPropagation();
      const updated = sessions.filter((_, index) => index !== i);
      localStorage.setItem("sessions", JSON.stringify(updated));
      setSessions(updated);
    }}
    className="absolute top-2 right-2 text-red-500 text-xs"
  >
    Delete
  </button>

  {/* clickable area */}
  <div
    onClick={()=>{
      if(s.status==="in-progress"){
        navigate(`/interview/${s.id}`);
      }
    }}
    className="cursor-pointer"
  >
    <p className="font-medium">{s.role}</p>
    <p className="text-xs text-muted-foreground">{s.date}</p>

    {s.status === "in-progress" ? (
      <p className="text-xs text-yellow-600 font-bold">
        Resume Interview →
      </p>
    ) : (
      <>
        <p className="text-xs text-green-600">
          Score: {s.score}%
        </p>

        <p className="text-xs text-muted-foreground">
          ⏱ {s.duration || 0} min | 🗣 {s.wordsSpoken || 0} words
        </p>
      </>
    )}
  </div>
</div>
          ))}
      </div>

      {/* show more button */}
      {sessions.length > 5 && (
        <Button
          variant="outline"
          className="w-full mt-2"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? "Show Less" : "Show More"}
        </Button>
      )}
    </>
  )}
</CardContent>
            </Card>
          </motion.div>

        </div>
      </main>
    </div>
  );
}