# Astro Starter Kit: Minimal

```sh
npm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).


## Repository snapshots

`/repos/` renders local scans from `public/scans/*.json`. Builds never fetch or scan repositories. Each snapshot records the commit SHA, UTC scan date, engine version, counts, score, and complete diagnostics. Rows sort by score ascending, with the lowest score expanded initially. Expand a rule to see matched text, rewrite guidance, and commit-pinned source links for up to five occurrences; JSON downloads retain every finding. Claude-Humanizer contains intentional writing-pattern examples, which the page explicitly identifies as context for its lower score.

To refresh a snapshot, use a clean checkout and the site's installed, pinned-by-lockfile engine:

```sh
node scripts/scan-repo.mjs /path/to/hono honojs/hono
npm run build
```

The script scans supported tracked files using default rules and standard directory exclusions, without loading repository configuration. It includes changelogs and test fixtures. It never installs dependencies or runs repository code. Use the same engine version for all snapshots in a batch; update the pinned version in the Actions example when updating the scan engine. New repositories also need an import in `src/pages/repos.astro`.


## Search and sharing

The canonical origin lives in `astro.config.mjs` (`site`). `SeoHead.astro` generates unique page metadata, canonicals, social cards, and JSON-LD. Add new indexable routes to `src/lib/seo.ts` for the generated sitemap. Do not invent ratings or add the prose scores as review ratings.

Cloudflare Pages builds on a `CF_PAGES_BRANCH` other than the production branch (`master`, configured in `src/lib/seo.ts`) receive `noindex, nofollow`. Production pages remain indexable. Public JSON scan downloads receive `X-Robots-Tag: noindex` through `public/_headers`. The illustrative playground text uses `data-nosnippet` to keep it out of Google search snippets.

After deployment, verify `/robots.txt`, `/sitemap.xml`, both canonical URLs, social-card assets, and the scan download response headers. Verify the site in Google Search Console, submit the sitemap, and inspect both URLs. Search Console verification requires the property owner's account; this repository contains no verification token. Changes to the domain require updating the canonical origin and any hosting redirects.
