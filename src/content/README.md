# Content (file-based CMS)

All site content lives here so you can add and edit it **without touching component
code**. Edit a file, commit, and the change deploys.

## Quick reference

| What you want to add | Edit this |
| --- | --- |
| Profile / hero / about / skills | `profile.json` |
| A project card | `projects.json` |
| A video | `videos.json` |
| A Canva design | `canva.json` |
| A presentation / deck | `presentations.json` |
| A startup idea | `startup-ideas.json` |
| A blog post | new `.md` file in `blog/` |
| A case study | new `.md` file in `case-studies/` |

## JSON files

Each is an array of items (or, for `profile.json`, a single object). Copy an existing
entry, change the values, and keep the JSON valid (commas between items, double quotes
around strings). To remove an item, delete its object.

**Icons** are referenced by name (e.g. `"icon": "Cpu"`). Allowed names are defined in
`index.js` (`ICONS`). Add a new icon there once if you need one that isn't listed —
names come from [lucide.dev/icons](https://lucide.dev/icons).

**Images/assets** are paths relative to `public/` (e.g.
`"assets/images/projects/foo.jpg"`). Drop the file in `public/assets/...` and reference
it. External `https://` URLs also work.

## Markdown files (blog & case studies)

Create a file like `blog/my-post.md`:

```markdown
---
title: "My Post Title"
slug: "my-post"            # optional; defaults to the filename
date: "2025-06-01"         # used for ordering (newest first)
summary: "One-line teaser shown in lists."
tags: ["engineering", "ai"]
cover: "assets/images/blog/my-post.jpg"
draft: false               # set true to hide from the live site
---

Write the post body in Markdown here.
```

Case studies support the same fields plus optional headline `metrics`:

```markdown
metrics:
  - label: "Latency"
    value: "-40%"
  - label: "Cost"
    value: "-3x"
```

The loader (`index.js`) reads these automatically — no code changes needed.
