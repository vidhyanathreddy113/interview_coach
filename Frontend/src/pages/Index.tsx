import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Brain, Mic, Video, BarChart3, ArrowRight } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();

  const features = [
    { icon: Brain, title: "AI-Powered Questions", desc: "Tailored questions based on your role, company, and difficulty level" },
    { icon: Mic, title: "Voice Analysis", desc: "Detect filler words, pace, hesitation, and vocabulary quality" },
    { icon: Video, title: "Emotion Detection", desc: "Real-time facial expression and confidence analysis via webcam" },
    { icon: BarChart3, title: "Detailed Reports", desc: "Performance dashboard with charts, scores, and PDF export" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          InterviewAI Coach
        </h2>
        <Button variant="outline" onClick={() => navigate("/auth")}>
          Sign In
        </Button>
      </header>

      <main>
        <section className="container mx-auto px-4 py-20 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Ace Your Next Interview<br />
              <span className="text-primary">with AI Coaching</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Practice mock interviews with real-time emotion analysis, voice feedback, and confidence scoring. Get personalized tips to level up.
            </p>
            <Button size="lg" className="gap-2 text-base px-8" onClick={() => navigate("/auth")}>
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-primary/10 p-3">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        AI Interview Coach © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
