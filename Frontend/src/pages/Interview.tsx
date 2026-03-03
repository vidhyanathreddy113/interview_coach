import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Mic, Video, ArrowLeft } from "lucide-react";
import { FaceMesh } from "@mediapipe/face_mesh";

const TOTAL_QUESTIONS = 5;

// Question bank
const QUESTION_BANK = {
  hr: [
    "Tell me about yourself",
    "Why should we hire you?",
    "Describe a challenge you faced",
    "What motivates you?",
    "Where do you see yourself in 5 years?"
  ],
  technical: [
    "Explain OOP concepts",
    "Difference between SQL and NoSQL?",
    "What is React and how it works?",
    "Explain REST API",
    "What is JavaScript closure?"
  ]
};

function getUniqueQuestion(asked: string[]) {
  const all = [...QUESTION_BANK.hr, ...QUESTION_BANK.technical];
  const remaining = all.filter(q => !asked.includes(q));
  if (remaining.length === 0) return all[Math.floor(Math.random() * all.length)];
  return remaining[Math.floor(Math.random() * remaining.length)];
}

// 🔥 AI scoring
function generateAIScore(text: string, duration: number) {
  const words = text.trim().split(/\s+/).length;

  let communication = Math.min(100, words * 0.6);
  let confidence = Math.min(100, duration * 20);
  let technical = Math.min(100, words * 0.5);

  const overall = Math.round(
    communication * 0.3 +
    confidence * 0.3 +
    technical * 0.4
  );

  let feedback = "";
  if (overall >= 85)
    feedback = "Excellent performance. Strong confidence and communication.";
  else if (overall >= 70)
    feedback = "Good performance. Improve technical depth slightly.";
  else
    feedback = "Needs improvement. Practice structured answers and confidence.";

  return {
    overall,
    communication: Math.round(communication),
    confidence: Math.round(confidence),
    technical: Math.round(technical),
    feedback,
    words
  };
}

export default function Interview() {

  const navigate = useNavigate();
  const { id } = useParams();

  // ✅ ALL HOOKS INSIDE COMPONENT
  const [started, setStarted] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<number>(0);

  const recognitionRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // cleanup
  useEffect(() => {
    return () => {
      stopListening();
      if (streamRef.current)
        streamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []);

  // CAMERA + FACE DETECTION
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);

      const faceMesh = new FaceMesh({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults((results:any) => {
        if (results.multiFaceLandmarks.length > 0) {
          console.log("Face detected 😎");
        } else {
          console.log("No face 😢");
        }
      });

      setInterval(async () => {
        if (videoRef.current) {
          await faceMesh.send({ image: videoRef.current });
        }
      }, 2000);

    } catch {
      alert("Allow camera & mic");
    }
  };

  const speakQuestion = (text: string) => {
    speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.rate = 0.9;
    speechSynthesis.speak(speech);
  };

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Use Chrome browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event:any) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  // START
  const startInterview = async () => {
    await startCamera();
    setStarted(true);
    setStartTime(Date.now());

    const q = getUniqueQuestion([]);
    setCurrentQuestion(q);
    setAskedQuestions([q]);

    speakQuestion(q);
    setQuestionNumber(1);
    setTranscript("");
    startListening();
  };

  // NEXT
  const nextQuestion = () => {
    stopListening();
    setTranscript("");

    if (questionNumber < TOTAL_QUESTIONS) {
      const q = getUniqueQuestion(askedQuestions);
      setCurrentQuestion(q);
      setAskedQuestions(prev => [...prev, q]);

      speakQuestion(q);
      setQuestionNumber(prev => prev + 1);
      setTimeout(startListening, 700);
    } else {
      finishInterview();
    }
  };

  // FINISH
  const finishInterview = () => {
    stopListening();

    if (streamRef.current)
      streamRef.current.getTracks().forEach(track => track.stop());

    const duration = (Date.now() - startTime) / 1000 / 60;
    const result = generateAIScore(transcript, duration);

    let sessions = JSON.parse(localStorage.getItem("sessions") || "[]");

    const session = {
      id,
      role: "AI Mock Interview",
      date: new Date().toLocaleString(),
      score: result.overall,
      communication: result.communication,
      confidence: result.confidence,
      technical: result.technical,
      feedback: result.feedback,
      wordsSpoken: result.words,
      duration: duration.toFixed(2),
      status: "completed"
    };

    const index = sessions.findIndex((s:any)=>s.id==id);
    if(index!==-1) sessions[index] = session;
    else sessions.push(session);

    localStorage.setItem("sessions", JSON.stringify(sessions));

    navigate(`/report/${id}`);
  };

  // EXIT
  const exitInterview = () => {
    stopListening();

    if (streamRef.current)
      streamRef.current.getTracks().forEach(t => t.stop());

    let sessions = JSON.parse(localStorage.getItem("sessions") || "[]");

    sessions = sessions.filter((s:any)=>s.id!==id);

    sessions.push({
      id,
      role:"AI Mock Interview",
      date:new Date().toLocaleString(),
      status:"in-progress",
      questionNumber
    });

    localStorage.setItem("sessions", JSON.stringify(sessions));
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <Button variant="ghost" onClick={()=>navigate("/dashboard")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2"/> Back
      </Button>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* camera */}
        <Card>
          <CardContent className="p-4">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video ref={videoRef} autoPlay muted className="w-full h-full object-cover"/>
              {!cameraOn && <div className="text-white text-center mt-20">Camera will start when interview begins</div>}
            </div>
          </CardContent>
        </Card>

        {/* questions */}
        <Card>
          <CardHeader>
            <CardTitle>AI Mock Interview</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">

            {!started ? (
              <Button onClick={startInterview} className="w-full" size="lg">
                <Video className="h-4 w-4 mr-2"/> Start Interview
              </Button>
            ) : (
              <>
                <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                  <p className="text-sm text-muted-foreground">Question {questionNumber}/{TOTAL_QUESTIONS}</p>
                  <p className="text-lg font-semibold mt-2">{currentQuestion}</p>
                </motion.div>

                <div className="border rounded-lg p-3 bg-muted min-h-[80px]">
                  <p className="text-xs text-muted-foreground mb-1">
                    {isListening ? "🎙 Listening..." : "Stopped"}
                  </p>
                  <p className="text-sm">{transcript || "Start speaking..."}</p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={nextQuestion} className="flex-1 gap-2">
                    <Mic className="h-4 w-4"/> Next
                  </Button>

                  <Button variant="destructive" className="flex-1" onClick={exitInterview}>
                    Exit
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}