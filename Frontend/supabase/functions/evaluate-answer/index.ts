import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { question, answer, interview_type, target_role, difficulty } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert interview evaluator. Evaluate the candidate's answer to an interview question.
The candidate is interviewing for: ${target_role} (${difficulty} level, ${interview_type} interview).

You MUST respond using the evaluate_answer tool.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Question: "${question}"\n\nCandidate's Answer: "${answer || "(no answer provided)"}"` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "evaluate_answer",
            description: "Evaluate interview answer with scores and feedback",
            parameters: {
              type: "object",
              properties: {
                technical_score: { type: "number", description: "Technical accuracy 0-100" },
                communication_score: { type: "number", description: "Communication quality 0-100" },
                confidence_score: { type: "number", description: "Confidence level 0-100" },
                emotion_detected: { type: "string", enum: ["confident", "nervous", "calm", "anxious", "neutral"] },
                ideal_answer: { type: "string", description: "A concise ideal answer (2-3 sentences)" },
                feedback: { type: "string", description: "Brief constructive feedback (1-2 sentences)" },
              },
              required: ["technical_score", "communication_score", "confidence_score", "emotion_detected", "ideal_answer", "feedback"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "evaluate_answer" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    let evaluation;
    if (toolCall) {
      evaluation = JSON.parse(toolCall.function.arguments);
    } else {
      evaluation = { technical_score: 50, communication_score: 50, confidence_score: 50, emotion_detected: "neutral", ideal_answer: "N/A", feedback: "Could not evaluate." };
    }

    return new Response(JSON.stringify(evaluation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("evaluate-answer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
