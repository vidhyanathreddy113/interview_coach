import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Report() {
  const { id } = useParams();
  const navigate = useNavigate();

  const sessions = JSON.parse(localStorage.getItem("sessions") || "[]");
  const session = sessions.find((s:any) => s.id == id);

  if (!session) {
    return (
      <div className="p-10 text-center text-lg font-semibold">
        No Report Found
      </div>
    );
  }

  // performance label
  const getPerformance = () => {
    if (session.score >= 85) return { label: "Excellent 🔥", color: "text-green-600" };
    if (session.score >= 65) return { label: "Good 👍", color: "text-yellow-600" };
    return { label: "Needs Improvement", color: "text-red-600" };
  };

  const perf = getPerformance();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-xl shadow-2xl border">
        
        {/* HEADER */}
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            🤖 AI Interview Report
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 text-center">

          {/* overall score */}
          <div>
            <p className="text-muted-foreground">Overall Score</p>
            <h1 className="text-5xl font-bold text-primary">
              {session.score}%
            </h1>

            <p className={`mt-2 font-semibold ${perf.color}`}>
              {perf.label}
            </p>
          </div>

          {/* detailed scores */}
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="bg-muted p-3 rounded-lg">
              <p className="font-bold">🗣 Communication</p>
              <p className="text-lg">{session.communication || 0}%</p>
            </div>

            <div className="bg-muted p-3 rounded-lg">
              <p className="font-bold">🎯 Confidence</p>
              <p className="text-lg">{session.confidence || 0}%</p>
            </div>

            <div className="bg-muted p-3 rounded-lg">
              <p className="font-bold">💻 Technical</p>
              <p className="text-lg">{session.technical || 0}%</p>
            </div>
          </div>

          {/* analytics */}
          <div className="bg-muted/50 p-4 rounded-lg text-sm">
            <p>⏱ Duration: {session.duration || 0} minutes</p>
            <p>🗣 Words Spoken: {session.wordsSpoken || 0}</p>
          </div>

          {/* ai feedback */}
          <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg text-left">
            <p className="font-bold mb-2 text-center">📊 AI Feedback Summary</p>
            <p className="text-sm leading-relaxed">
              {session.feedback ||
                "Good attempt. Keep practicing to improve confidence and communication."}
            </p>
          </div>

          {/* suggestion */}
          <div className="bg-muted p-4 rounded-lg text-sm">
            <p className="font-semibold mb-1">💡 Improvement Tips</p>
            <p>
              • Speak clearly and confidently  
              • Give structured answers (Intro → Example → Conclusion)  
              • Maintain eye contact  
              • Practice daily mock interviews
            </p>
          </div>

          {/* button */}
          <Button
            onClick={() => navigate("/dashboard")}
            className="w-full text-lg"
          >
            Back to Dashboard
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}