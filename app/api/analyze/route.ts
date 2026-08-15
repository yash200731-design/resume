import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const EMPTY_RESUME_SHAPE = {
  name: "",
  title: "",
  email: "",
  phone: "",
  location: "",
  summary: "",
  linkedin: "",
  github: "",
  skills: [] as string[],
  projects: [] as Array<{
    name: string;
    description: string;
    technologies: string[];
    github: string;
    liveDemo: string;
  }>,
  education: [] as Array<{
    degree: string;
    institution: string;
    field: string;
    year: string;
    grade: string;
  }>,
  experience: [] as Array<{
    company: string;
    role: string;
    description: string;
    startDate: string;
    endDate: string;
  }>,
  certifications: [] as string[],
  achievements: [] as string[],
};

type ResumeData = typeof EMPTY_RESUME_SHAPE;

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function extractJsonBlock(raw: string): string {
  // Strip potential markdown fences if returned despite prompt rules
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();

  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return raw.slice(firstBrace, lastBrace + 1).trim();
  }
  return raw.trim();
}

function normalizeResume(parsed: Record<string, unknown>): ResumeData {
  const asStr = (v: unknown) => (typeof v === "string" ? v : "");
  const asStrArray = (v: unknown) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

  const asProjects = (v: unknown) =>
    Array.isArray(v)
      ? v.map((p) => {
          const proj = (p ?? {}) as Record<string, unknown>;
          return {
            name: asStr(proj.name),
            description: asStr(proj.description),
            technologies: asStrArray(proj.technologies),
            github: asStr(proj.github),
            liveDemo: asStr(proj.liveDemo),
          };
        })
      : [];

  const asEducation = (v: unknown) =>
    Array.isArray(v)
      ? v.map((e) => {
          const edu = (e ?? {}) as Record<string, unknown>;
          return {
            degree: asStr(edu.degree),
            institution: asStr(edu.institution),
            field: asStr(edu.field),
            year: asStr(edu.year),
            grade: asStr(edu.grade),
          };
        })
      : [];

  const asExperience = (v: unknown) =>
    Array.isArray(v)
      ? v.map((e) => {
          const exp = (e ?? {}) as Record<string, unknown>;
          return {
            company: asStr(exp.company),
            role: asStr(exp.role),
            description: asStr(exp.description),
            startDate: asStr(exp.startDate),
            endDate: asStr(exp.endDate),
          };
        })
      : [];

  return {
    name: asStr(parsed.name),
    title: asStr(parsed.title),
    email: asStr(parsed.email),
    phone: asStr(parsed.phone),
    location: asStr(parsed.location),
    summary: asStr(parsed.summary),
    linkedin: asStr(parsed.linkedin),
    github: asStr(parsed.github),
    skills: asStrArray(parsed.skills),
    projects: asProjects(parsed.projects),
    education: asEducation(parsed.education),
    experience: asExperience(parsed.experience),
    certifications: asStrArray(parsed.certifications),
    achievements: asStrArray(parsed.achievements),
  };
}

export async function POST(req: NextRequest) {
  try {
    // ---- 1. Check Environment Variables ----
    const geminiKey = process.env.GEMINI_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!geminiKey || !supabaseUrl || !supabaseKey) {
      return jsonError(
        "Server is missing required environment variables. Check GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
        500
      );
    }

    // ---- 2. Parse Multipart Form Data ----
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return jsonError("Could not read the uploaded file. Please try again.", 400);
    }

    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return jsonError("No PDF file was uploaded.", 400);
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return jsonError("Invalid file type. Please upload a PDF file.", 400);
    }

    // ---- 3. Read PDF into Buffer & base64 ----
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return jsonError("The uploaded PDF is empty.", 400);
    }

    const base64Pdf = buffer.toString("base64");

    // ---- 4. Build Gemini Prompt & Inline PDF Payload ----
    const prompt = `You are a precise resume parser. Extract information from the provided PDF resume document into ONLY valid JSON matching exactly this structure:

{
  "name": "",
  "title": "",
  "email": "",
  "phone": "",
  "location": "",
  "summary": "",
  "linkedin": "",
  "github": "",
  "skills": [],
  "projects": [
    {
      "name": "",
      "description": "",
      "technologies": [],
      "github": "",
      "liveDemo": ""
    }
  ],
  "education": [
    {
      "degree": "",
      "institution": "",
      "field": "",
      "year": "",
      "grade": ""
    }
  ],
  "experience": [
    {
      "company": "",
      "role": "",
      "description": "",
      "startDate": "",
      "endDate": ""
    }
  ],
  "certifications": [],
  "achievements": []
}

Rules:
- Extract information ONLY from the uploaded resume.
- Do not invent information.
- If information is missing, return an empty string "".
- If a section is missing, return an empty array [].
- Return ONLY valid JSON.
- Do not use Markdown code fences (no \`\`\` or \`\`\`json).
- Preserve project names and technologies accurately.
- Extract URLs such as GitHub and LinkedIn when present.`;

    // ---- 5. Send PDF directly to Gemini via inlineData ----
    let geminiRaw: string;
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      mimeType: "application/pdf",
                      data: base64Pdf,
                    },
                  },
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!geminiRes.ok) {
        const errBody = await geminiRes.text().catch(() => "");
        console.error("Gemini API error:", geminiRes.status, errBody);
        return jsonError(
          `Gemini AI request failed (status ${geminiRes.status}). Please check your GEMINI_API_KEY and try again.`,
          502
        );
      }

      const geminiJson = await geminiRes.json();
      geminiRaw = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      if (!geminiRaw) {
        console.error("Gemini returned no content:", JSON.stringify(geminiJson));
        return jsonError("Gemini AI did not return any content for this resume.", 502);
      }
    } catch (err) {
      console.error("Gemini request threw:", err);
      return jsonError("Could not reach the Gemini AI service. Please try again.", 502);
    }

    // ---- 6. Parse and Validate JSON ----
    let parsedResume: ResumeData;
    try {
      const jsonBlock = extractJsonBlock(geminiRaw);
      const rawParsed = JSON.parse(jsonBlock);
      parsedResume = normalizeResume(rawParsed);
    } catch (err) {
      console.error("Failed to parse Gemini JSON:", err, geminiRaw);
      return jsonError(
        "The AI response could not be parsed as valid resume data. Please try again.",
        502
      );
    }

    // ---- 7. Insert into Supabase ----
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: inserted, error: insertError } = await supabase
      .from("portfolios")
      .insert({
        name: parsedResume.name,
        title: parsedResume.title,
        email: parsedResume.email,
        phone: parsedResume.phone,
        location: parsedResume.location,
        summary: parsedResume.summary,
        linkedin: parsedResume.linkedin,
        github: parsedResume.github,
        skills: parsedResume.skills,
        projects: parsedResume.projects,
        education: parsedResume.education,
        experience: parsedResume.experience,
        certifications: parsedResume.certifications,
        achievements: parsedResume.achievements,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Supabase insert failed:", insertError);
      return jsonError(
        `Could not save portfolio to database: ${insertError.message}`,
        500
      );
    }

    // ---- 8. Return Success with portfolioId ----
    return NextResponse.json({
      success: true,
      portfolioId: inserted?.id,
    });
  } catch (err) {
    console.error("Unexpected error in /api/analyze:", err);
    return jsonError("An unexpected server error occurred. Please try again.", 500);
  }
}
