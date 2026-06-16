// Central content loader for the file-based CMS.
//
// HOW TO ADD CONTENT (no component code required):
//   • Projects / videos / Canva / presentations / startup ideas:
//       edit the matching JSON file in this folder.
//   • Blog posts / case studies:
//       add a Markdown file in ./blog or ./case-studies with frontmatter.
// See ./README.md for the full guide.

import {
  Code, Rocket, Users, Zap, Cpu, Lightbulb, TrendingUp, Dumbbell,
  GraduationCap, ShoppingCart, Star, Sparkles, FileText, Video, Presentation,
} from "lucide-react";

import profile from "./profile.json";
import projects from "./projects.json";
import videos from "./videos.json";
import canva from "./canva.json";
import presentations from "./presentations.json";
import startupIdeas from "./startup-ideas.json";

// Whitelisted icons content files may reference by name (keeps JSON serializable).
const ICONS = {
  Code, Rocket, Users, Zap, Cpu, Lightbulb, TrendingUp, Dumbbell,
  GraduationCap, ShoppingCart, Star, Sparkles, FileText, Video, Presentation,
};

/** Resolve an icon name from content into a lucide-react component (falls back to Star). */
export function getIcon(name) {
  return ICONS[name] || Star;
}

/** Resolve a content-relative asset path against Vite's base URL. */
export function asset(path) {
  if (!path) return path;
  if (/^https?:\/\//.test(path)) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}

export { profile, projects, videos, canva, presentations, startupIdeas };

// ---------------------------------------------------------------------------
// Markdown content (blog + case studies)
// ---------------------------------------------------------------------------

// Minimal YAML-frontmatter parser covering the subset used by our content:
// scalars, inline arrays [a, b], block string arrays, and one level of
// block object arrays (e.g. metrics: - label: .. \n value: ..).
function coerce(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null" || value === "") return null;
  const unquoted = value.replace(/^["']|["']$/g, "");
  return unquoted;
}

function parseFrontmatter(raw) {
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw);
  if (!match) return { data: {}, body: raw.trim() };

  const [, fm, body] = match;
  const lines = fm.split("\n");
  const data = {};
  let key = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const indented = /^\s+/.test(line);
    const listItem = line.trim().startsWith("- ");

    if (!indented && !listItem) {
      const m = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
      if (!m) continue;
      key = m[1];
      const val = m[2].trim();
      if (val === "") {
        data[key] = []; // block array follows
      } else if (val.startsWith("[")) {
        data[key] = val.replace(/^\[|\]$/g, "").split(",").map((s) => coerce(s.trim())).filter((s) => s !== null);
      } else {
        data[key] = coerce(val);
      }
      continue;
    }

    if (listItem && key) {
      const item = line.trim().slice(2).trim();
      const kv = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(item);
      if (kv) {
        // array of objects (e.g. metrics)
        const obj = { [kv[1]]: coerce(kv[2].trim()) };
        // subsequent indented "key: value" lines belong to this object
        while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1]) && !lines[i + 1].trim().startsWith("- ")) {
          const sub = /^\s*([A-Za-z0-9_]+):\s*(.*)$/.exec(lines[++i]);
          if (sub) obj[sub[1]] = coerce(sub[2].trim());
        }
        if (!Array.isArray(data[key])) data[key] = [];
        data[key].push(obj);
      } else {
        if (!Array.isArray(data[key])) data[key] = [];
        data[key].push(coerce(item));
      }
    }
  }
  return { data, body: body.trim() };
}

function loadMarkdown(globResult) {
  return Object.entries(globResult)
    .map(([path, raw]) => {
      const { data, body } = parseFrontmatter(raw);
      const slug = data.slug || path.split("/").pop().replace(/\.md$/, "");
      return { ...data, slug, body, _path: path };
    })
    .filter((entry) => !entry.draft)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

const blogModules = import.meta.glob("./blog/*.md", { query: "?raw", import: "default", eager: true });
const caseStudyModules = import.meta.glob("./case-studies/*.md", { query: "?raw", import: "default", eager: true });

export const blogPosts = loadMarkdown(blogModules);
export const caseStudies = loadMarkdown(caseStudyModules);
