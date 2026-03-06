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
    if (session.score >= 85)
      return { label: "Excellent 🔥", color: "text-green-600" };

    if (session.score >= 65)
      return { label: "Good 👍", color: "text-yellow-600" };

    return { label: "Needs Improvement", color: "text-red-600" };
  };

  const perf = getPerformance();

  return (

<div className="min-h-screen bg-background p-3">

<Card className="max-w-5xl mx-auto shadow-lg">

<CardHeader>

<CardTitle className="text-center text-xl">
Interview Report
</CardTitle>

</CardHeader>

<CardContent className="space-y-4">

{/* SUMMARY */}

<div className="grid grid-cols-3 gap-3 text-center">

<div className="bg-muted p-3 rounded-lg">
<p className="text-xs">Communication</p>
<p className="text-lg font-bold">{session.communication}%</p>
</div>

<div className="bg-muted p-3 rounded-lg">
<p className="text-xs">Confidence</p>
<p className="text-lg font-bold">{session.confidence}%</p>
</div>

<div className="bg-muted p-3 rounded-lg">
<p className="text-xs">Technical</p>
<p className="text-lg font-bold">{session.technical}%</p>
</div>

</div>

{/* PERFORMANCE LABEL */}

<div className={`text-center font-semibold ${perf.color}`}>
Performance: {perf.label}
</div>

{/* AI SUMMARY */}

<div className="bg-muted p-3 rounded-lg text-sm">
<p className="font-semibold mb-1">AI Summary</p>
<p>{session.feedback}</p>
</div>

{/* QUESTION ANALYSIS */}

<div className="grid md:grid-cols-2 gap-3">

{session.answers?.map((a:any,i:number)=>(

<Card key={i} className="p-3 border">

<p className="text-xs font-semibold mb-1">
Question {i+1}
</p>

<p className="text-sm mb-1">
{a.question}
</p>

<div className="bg-muted p-2 rounded text-xs mb-1">
{a.answer || "No answer recorded"}
</div>

<p className="text-xs text-muted-foreground">
AI Analysis: {a.analysis || "No analysis available"}
</p>

</Card>

))}

</div>

<Button
onClick={()=>navigate("/dashboard")}
className="w-full"
>
Back to Dashboard
</Button>

</CardContent>

</Card>

</div>

);
}