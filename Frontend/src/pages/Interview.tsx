import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Mic, Video, ArrowLeft } from "lucide-react";
import { FaceMesh } from "@mediapipe/face_mesh";

const TOTAL_QUESTIONS = 5;

/* ---------------- QUESTIONS ---------------- */

const QUESTION_BANK = {

  hr: {
    beginner: [
      "Tell me about yourself",
      "Why should we hire you?",
      "Describe a challenge you faced"
    ],
    intermediate: [
      "What motivates you?",
      "Where do you see yourself in 5 years?"
    ],
    advanced: [
      "Describe a leadership experience",
      "How do you handle conflicts in a team?"
    ]
  },

  java: {

    beginner: [
      "What is Java? What are its main features?",
      "What is the difference between JDK, JRE, and JVM?",
      "What are primitive data types in Java?",
      "What is the difference between == and equals()?",
      "What is a class and object?",
      "What are constructors in Java?",
      "What is method overloading?",
      "What is the difference between Array and ArrayList?",
      "What is String class? Is it mutable or immutable?",
      "What is the main method in Java?"
    ],

    intermediate: [
      "What are the 4 pillars of OOP?",

      "What is inheritance in Java?",
      "What is the difference between interface and abstract class?",

      "What is method overriding?",

      "What are access modifiers in Java?",

      "What is exception handling?",

      "What is the difference between checked and unchecked exceptions?",

      "What is multithreading in Java?",

      "What is the difference between HashMap and HashTable?",

      "What is the difference between String, StringBuilder, and StringBuffer?",
    ],

    advanced: [
      "What is the Java Collections Framework?",

     " How does HashMap work internally?",

      "What is Garbage Collection in Java?",

      "What is the difference between Comparable and Comparator?",

      "What are Streams in Java 8?",

      "What are Lambda expressions?",

      "What is the difference between fail-fast and fail-safe iterators?",

      "What is synchronization in Java?",

      "What is the volatile keyword?",

      "What is JDBC and how does it work?"
    ]

  },

  mern: {

    beginner: [
      "What is the MERN stack?",

        "What is React?",

        "What is Node.js?",

        "What is Express.js?",

        "What is MongoDB?",

        "What is JSON?",

        "What is the difference between SQL and NoSQL?",

        "What is npm?",

        "What is component in React?",

        "What is state in React?"
    ],

    intermediate: [
      "Explain useEffect hook",
      "What is Node.js event loop?",
      "Explain REST API"
    ],

    advanced: [
      "Explain React lifecycle",
      "What is Redux and why is it used?",
      "Explain microservices architecture"
    ]

  }

};

/* ---------------- QUESTION SELECTOR ---------------- */

function getUniqueQuestion(
  asked: string[],
  language: string,
  type: string,
  difficulty: string
) {

  let questions: string[] = [];

  const lang = language?.toLowerCase();
  const diff = difficulty?.toLowerCase();

  if (type === "hr") {

    questions = QUESTION_BANK.hr[diff] || [];

  } else {

    questions =
      QUESTION_BANK[lang as keyof typeof QUESTION_BANK]?.[diff] || [];

  }

  const remaining = questions.filter(q => !asked.includes(q));

  if (remaining.length === 0) {

    return questions[Math.floor(Math.random() * questions.length)];

  }

  return remaining[Math.floor(Math.random() * remaining.length)];
}

function countFillerWords(text:string){

const fillers = ["um","uh","like","actually","basically"];

let count = 0;

fillers.forEach(word=>{
  const regex = new RegExp(`\\b${word}\\b`,"gi");
  const matches = text.match(regex);
  if(matches) count += matches.length;
});

return count;
}

function analyzeAnswer(answer: string) {

  const words = answer.trim().split(/\s+/).length;

  if (words === 0)
    return "No answer detected.";

  if (words < 10)
    return "Answer too short. Try explaining with an example.";

  if (words < 25)
    return "Decent answer but needs more explanation.";

  return "Good explanation. Clear and structured answer.";

}

/* ---------------- AI SCORE ---------------- */

function generateAIScore(text: string, duration: number) {
  const words = text.trim().split(/\s+/).length;
  const fillerWords = countFillerWords(text);

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
    feedback =
      "Excellent performance. Strong confidence and communication.";
  else if (overall >= 70)
    feedback =
      "Good performance. Improve technical depth slightly.";
  else
    feedback =
      "Needs improvement. Practice structured answers.";

  return {
    overall,
    communication: Math.round(communication),
    confidence: Math.round(confidence),
    technical: Math.round(technical),
    feedback,
    words,
    fillerWords
  };
}

/* ---------------- COMPONENT ---------------- */

export default function Interview() {

  const navigate = useNavigate();
  const { id } = useParams();

  const location = useLocation();
  const session: any = location.state || {};

  const [started, setStarted] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [answers, setAnswers] = useState<any[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [time, setTime] = useState(0);

  const recognitionRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopListening();
      if (streamRef.current)
        streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  useEffect(() => {

  let timer:any;

  if (started) {
    timer = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);
  }

  return () => clearInterval(timer);

}, [started]);

  /* ---------------- CAMERA ---------------- */

  const startCamera = async () => {

    try {

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

      streamRef.current = stream;

      if (videoRef.current)
        videoRef.current.srcObject = stream;

      setCameraOn(true);

      const faceMesh = new FaceMesh({
        locateFile: file =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      faceMesh.onResults((results:any) => {

if(results.multiFaceLandmarks.length === 0){

alert("Please look at the camera");

}

});

      faceMesh.onResults((results:any) => {

        if(results.multiFaceLandmarks.length === 0){

        alert("Please look at the camera");

        }

      });

      setInterval(async () => {

      if(videoRef.current)
      await faceMesh.send({ image: videoRef.current });

      },2000);

    } catch {

      alert("Allow camera & microphone");

    }
  };

  /* ---------------- SPEECH ---------------- */

  const speakQuestion = (text: string) => {

    speechSynthesis.cancel();

    const speech =
      new SpeechSynthesisUtterance(text);

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

    recognition.onresult = (event: any) => {

      let text = "";

      for (let i = 0; i < event.results.length; i++)
        text += event.results[i][0].transcript;

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

  /* ---------------- START ---------------- */

  const startInterview = async () => {

    await startCamera();

    setStarted(true);

    setStartTime(Date.now());

    const q = getUniqueQuestion(
      [],
      session.programmingLanguage,
      session.interviewType,
      session.difficulty
    );

    setCurrentQuestion(q);

    setAskedQuestions([q]);

    speakQuestion(q);

    setQuestionNumber(1);

    setTranscript("");

    startListening();
    
    console.log(session);

  };

  /* ---------------- NEXT ---------------- */

  const nextQuestion = () => {

    setAnswers(prev => [
      ...prev,
      {
        question: currentQuestion,
        answer: transcript,
        analysis: analyzeAnswer(transcript)
      }
    ]);

    stopListening();

    setTranscript("");

    if (questionNumber < TOTAL_QUESTIONS) {

      const q = getUniqueQuestion(
        askedQuestions,
        session.programmingLanguage,
        session.interviewType,
        session.difficulty
      );

      setCurrentQuestion(q);

      setAskedQuestions(prev => [...prev, q]);

      speakQuestion(q);

      setQuestionNumber(prev => prev + 1);

      setTimeout(startListening, 700);

    }

    else {

      finishInterview();

    }

  };

  /* ---------------- FINISH ---------------- */

  const finishInterview = async () => {

  const lastAnswer = {
    question: currentQuestion,
    answer: transcript,
    analysis: analyzeAnswer(transcript)
  };

  const allAnswers = [...answers, lastAnswer];

  stopListening();

  if (streamRef.current)
    streamRef.current.getTracks().forEach(t => t.stop());

  const duration =
    (Date.now() - startTime) / 1000 / 60;

  const result =
    generateAIScore(transcript, duration);

  const sessionData = {

    id,

    role: "AI Mock Interview",

    date: new Date().toLocaleString(),

    score: result.overall,

    communication: result.communication,

    confidence: result.confidence,

    technical: result.technical,

    feedback: result.feedback,

    wordsSpoken: result.words,

    fillerWords: result.fillerWords,

    duration: duration.toFixed(2),

    answers: allAnswers,

    status: "completed"
  };

  let sessions =
    JSON.parse(localStorage.getItem("sessions") || "[]");

  sessions.push(sessionData);

  localStorage.setItem("sessions", JSON.stringify(sessions));

  navigate(`/report/${id}`);
};

  /* ---------------- EXIT ---------------- */

  const exitInterview = () => {

    stopListening();

    if (streamRef.current)
      streamRef.current.getTracks().forEach(t => t.stop());

    navigate("/dashboard");

  };

  /* ---------------- UI ---------------- */

  return (

    <div className="min-h-screen bg-background p-6">

      <Button
        variant="ghost"
        onClick={() => navigate("/dashboard")}
        className="mb-4"
      >

        <ArrowLeft className="h-4 w-4 mr-2" />

        Back

      </Button>

      <div className="grid lg:grid-cols-2 gap-6">

        <Card>

          <CardContent className="p-4">

            <div className="aspect-video bg-black rounded-lg overflow-hidden">

              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full h-full object-cover"
              />

              {!cameraOn && (

                <div className="text-white text-center mt-20">

                  Camera will start when interview begins

                </div>

              )}

            </div>

          </CardContent>

        </Card>

        <Card>

  <CardHeader>
    <CardTitle>AI Mock Interview</CardTitle>
  </CardHeader>

  <CardContent className="space-y-4">

    {!started ? (

      <Button
        onClick={startInterview}
        className="w-full"
        size="lg"
      >
        <Video className="h-4 w-4 mr-2" />
        Start Interview
      </Button>

    ) : (

      <>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >

          <div className="flex justify-between text-sm text-muted-foreground">

            <p>
              Question {questionNumber}/{TOTAL_QUESTIONS}
            </p>

            <p>
              ⏱ {Math.floor(time/60)}:{String(time%60).padStart(2,"0")}
            </p>

          </div>

          <p className="text-lg font-semibold mt-2">
            {currentQuestion || "Loading question..."}
          </p>

        </motion.div>

        {/* PROGRESS BAR */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2 mb-2">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all"
            style={{
              width: `${(questionNumber / TOTAL_QUESTIONS) * 100}%`
            }}
          />
        </div>

        <div className="border rounded-lg p-3 bg-muted min-h-[80px]">

          <p className="text-xs text-muted-foreground mb-1">
            {isListening ? "🎙 Listening..." : "Stopped"}
          </p>

          <p className="text-sm">
            {transcript || "Start speaking..."}
          </p>

        </div>

        <div className="flex gap-2">

          <Button
            onClick={nextQuestion}
            className="flex-1 gap-2"
          >
            <Mic className="h-4 w-4" />
            Next
          </Button>

          <Button
            variant="destructive"
            className="flex-1"
            onClick={exitInterview}
          >
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