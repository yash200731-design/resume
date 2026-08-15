import { createClient } from "@supabase/supabase-js";
import {
  Mail,
  Linkedin,
  Github,
  MapPin,
  Phone,
  ExternalLink,
  GraduationCap,
  Award,
  Trophy,
  Briefcase,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Project = {
  name: string;
  description: string;
  technologies: string[];
  github: string;
  liveDemo: string;
};

type Education = {
  degree: string;
  institution: string;
  field: string;
  year: string;
  grade: string;
};

type Experience = {
  company: string;
  role: string;
  description: string;
  startDate: string;
  endDate: string;
};

type Portfolio = {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  linkedin: string;
  github: string;
  skills: string[];
  projects: Project[];
  education: Education[];
  experience: Experience[];
  certifications: string[];
  achievements: string[];
  created_at: string;
};

async function getPortfolio(id?: string): Promise<Portfolio | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  const supabase = createClient(supabaseUrl, supabaseKey);

  if (id) {
    const { data: byId } = await supabase
      .from("portfolios")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (byId) return byId as Portfolio;
  }

  const { data, error } = await supabase
    .from("portfolios")
    .select("*")
    .neq("name", "")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch portfolio:", error);
    return null;
  }

  return data as Portfolio | null;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-8 flex items-center gap-3">
      <span className="font-mono text-xs text-signal-teal">{"{"}</span>
      <h2 className="font-display text-2xl font-semibold tracking-tight">{children}</h2>
      <span className="font-mono text-xs text-signal-teal">{"}"}</span>
      <span className="ml-2 h-px flex-1 bg-surface-line" />
    </div>
  );
}

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams?: Promise<{ id?: string }> | { id?: string };
}) {
  const params = searchParams ? await searchParams : undefined;
  const portfolio = await getPortfolio(params?.id);

  if (!portfolio) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink px-6 text-center text-paper">
        <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface text-signal-amber">
          <Sparkles size={24} />
        </span>
        <h1 className="font-display text-2xl font-semibold">No portfolio yet</h1>
        <p className="max-w-sm text-paper-muted">
          Upload a resume from the home page to generate your first portfolio.
        </p>
        <a
          href="/"
          className="mt-2 rounded-lg bg-signal-amber px-5 py-2.5 font-medium text-ink hover:bg-signal-amber/90"
        >
          Go to upload
        </a>
      </main>
    );
  }

  const hasSkills = portfolio.skills?.length > 0;
  const hasProjects = portfolio.projects?.length > 0;
  const hasEducation = portfolio.education?.length > 0;
  const hasExperience = portfolio.experience?.length > 0;
  const hasCertifications = portfolio.certifications?.length > 0;
  const hasAchievements = portfolio.achievements?.length > 0;

  return (
    <main className="min-h-screen bg-ink text-paper">
      {/* nav */}
      <nav className="sticky top-0 z-10 border-b border-surface-line/70 bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-signal-amber/15 text-signal-amber">
              <Sparkles size={14} />
            </span>
            <span className="font-display text-base font-semibold">
              Resume<span className="text-signal-amber">AI</span>
            </span>
          </a>
          <a
            href="/"
            className="font-mono text-xs text-paper-muted transition-colors hover:text-signal-teal"
          >
            new upload →
          </a>
        </div>
      </nav>

      {/* hero */}
      <section className="grid-texture border-b border-surface-line/70">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <p className="mb-3 font-mono text-xs text-signal-teal">{"{ profile }"}</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            {portfolio.name || "Your Name"}
          </h1>
          {portfolio.title && (
            <p className="mt-2 text-xl text-signal-amber">{portfolio.title}</p>
          )}
          {portfolio.summary && (
            <p className="mt-5 max-w-2xl text-paper-muted">{portfolio.summary}</p>
          )}

          <div className="mt-6 flex flex-wrap gap-3 text-sm text-paper-muted">
            {portfolio.location && (
              <span className="flex items-center gap-1.5">
                <MapPin size={14} /> {portfolio.location}
              </span>
            )}
            {portfolio.email && (
              <span className="flex items-center gap-1.5">
                <Mail size={14} /> {portfolio.email}
              </span>
            )}
            {portfolio.phone && (
              <span className="flex items-center gap-1.5">
                <Phone size={14} /> {portfolio.phone}
              </span>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {portfolio.linkedin && (
              <a
                href={portfolio.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-surface-line bg-surface/60 px-4 py-2.5 text-sm font-medium transition-colors hover:border-signal-teal hover:text-signal-teal"
              >
                <Linkedin size={16} /> LinkedIn
              </a>
            )}
            {portfolio.github && (
              <a
                href={portfolio.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-surface-line bg-surface/60 px-4 py-2.5 text-sm font-medium transition-colors hover:border-signal-teal hover:text-signal-teal"
              >
                <Github size={16} /> GitHub
              </a>
            )}
            {portfolio.email && (
              <a
                href={`mailto:${portfolio.email}`}
                className="flex items-center gap-2 rounded-lg bg-signal-amber px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-signal-amber/90"
              >
                <Mail size={16} /> Contact
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-16 space-y-20">
        {/* skills */}
        {hasSkills && (
          <section id="skills">
            <SectionLabel>Skills</SectionLabel>
            <div className="flex flex-wrap gap-2.5">
              {portfolio.skills.map((skill, i) => (
                <span
                  key={`${skill}-${i}`}
                  className="rounded-full border border-surface-line bg-surface/50 px-4 py-2 text-sm text-paper transition-colors hover:border-signal-teal/60"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* projects */}
        {hasProjects && (
          <section id="projects">
            <SectionLabel>Projects</SectionLabel>
            <div className="grid gap-6 sm:grid-cols-2">
              {portfolio.projects.map((project, i) => (
                <div
                  key={`${project.name}-${i}`}
                  className="flex flex-col rounded-2xl border border-surface-line bg-surface/40 p-6 transition-colors hover:border-signal-amber/40"
                >
                  <h3 className="font-display text-lg font-semibold">{project.name}</h3>
                  {project.description && (
                    <p className="mt-2 text-sm text-paper-muted">{project.description}</p>
                  )}
                  {project.technologies?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.technologies.map((tech, ti) => (
                        <span
                          key={`${tech}-${ti}`}
                          className="rounded-md bg-surface-raised px-2.5 py-1 font-mono text-xs text-signal-teal"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-5 flex gap-3">
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-paper-muted transition-colors hover:text-signal-teal"
                      >
                        <Github size={15} /> Code
                      </a>
                    )}
                    {project.liveDemo && (
                      <a
                        href={project.liveDemo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-paper-muted transition-colors hover:text-signal-amber"
                      >
                        <ExternalLink size={15} /> Live demo
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* experience */}
        {hasExperience && (
          <section id="experience">
            <SectionLabel>Experience</SectionLabel>
            <div className="relative space-y-10 border-l border-surface-line pl-8">
              {portfolio.experience.map((exp, i) => (
                <div key={`${exp.company}-${i}`} className="relative">
                  <span className="absolute -left-[37px] top-1.5 h-3 w-3 rounded-full border-2 border-ink bg-signal-amber" />
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="font-display text-lg font-semibold">{exp.role}</h3>
                    <span className="font-mono text-xs text-paper-muted">
                      {exp.startDate}
                      {exp.startDate && (exp.endDate || " – Present")}
                      {exp.endDate ? ` – ${exp.endDate}` : ""}
                    </span>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-signal-teal">
                    <Briefcase size={14} /> {exp.company}
                  </p>
                  {exp.description && (
                    <p className="mt-2 text-sm text-paper-muted">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* education */}
        {hasEducation && (
          <section id="education">
            <SectionLabel>Education</SectionLabel>
            <div className="grid gap-4 sm:grid-cols-2">
              {portfolio.education.map((edu, i) => (
                <div
                  key={`${edu.institution}-${i}`}
                  className="flex gap-4 rounded-2xl border border-surface-line bg-surface/40 p-6"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-signal-teal/15 text-signal-teal">
                    <GraduationCap size={18} />
                  </span>
                  <div>
                    <h3 className="font-display font-semibold">{edu.degree}</h3>
                    {edu.field && <p className="text-sm text-paper-muted">{edu.field}</p>}
                    <p className="mt-1 text-sm text-paper">{edu.institution}</p>
                    <p className="mt-1 font-mono text-xs text-paper-muted">
                      {[edu.year, edu.grade].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* certifications */}
        {hasCertifications && (
          <section id="certifications">
            <SectionLabel>Certifications</SectionLabel>
            <div className="grid gap-4 sm:grid-cols-2">
              {portfolio.certifications.map((cert, i) => (
                <div
                  key={`${cert}-${i}`}
                  className="flex items-center gap-3 rounded-xl border border-surface-line bg-surface/40 p-4"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-signal-amber/15 text-signal-amber">
                    <Award size={16} />
                  </span>
                  <span className="text-sm">{cert}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* achievements */}
        {hasAchievements && (
          <section id="achievements">
            <SectionLabel>Achievements</SectionLabel>
            <ul className="space-y-3">
              {portfolio.achievements.map((achievement, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-paper-muted">
                  <Trophy size={16} className="mt-0.5 shrink-0 text-signal-amber" />
                  {achievement}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <footer className="border-t border-surface-line/70 py-8 text-center font-mono text-xs text-paper-muted">
        generated by ResumeAI
      </footer>
    </main>
  );
}
