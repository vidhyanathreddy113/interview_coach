import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { session_id } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Fetch responses
    const { data: responses } = await sb.from("question_responses").select("*").eq("session_id", session_id).order("question_number");
    if (!responses?.length) {
      return new Response(JSON.stringify({ error: "No responses found" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Calculate averages
    const avg = (field: string) => {
      const vals = responses.map((r: any) => r[field]).filter((v: any) => v != null);
      return vals.length ? Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length) : null;
    };

    const technical_score = avg("technical_score");
    const communication_score = avg("communication_score");
    const confidence_score = avg("confidence_score");
    const overall_score = Math.round(((technical_score || 0) + (communication_score || 0) + (confidence_score || 0)) / 3);

    // Generate summary
    const qaText = responses.map((r: any) => `Q${r.question_number}: ${r.question_text}\nAnswer: ${r.transcribed_answer || "(no answer)"}\nScores: Tech=${r.technical_score}, Comm=${r.communication_score}, Conf=${r.confidence_score}`).join("\n\n");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an interview coach. Write a brief 3-4 sentence performance summary with strengths, weaknesses, and top tip." },
          { role: "user", content: qaText },
        ],
      }),
    });

    let feedback_summary = "Interview completed. Review your scores above.";
    if (aiResp.ok) {
      const aiResult = await aiResp.json();
      feedback_summary = aiResult.choices?.[0]?.message?.content?.trim() || feedback_summary;
    }

    // Update session
    await sb.from("interview_sessions").update({
      status: "completed",
      completed_at: new Date().toISOString(),
      overall_score,
      technical_score,
      communication_score,
      confidence_score,
      feedback_summary,
    }).eq("id", session_id);

    return new Response(JSON.stringify({ overall_score, technical_score, communication_score, confidence_score, feedback_summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-summary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
