// ==============================================================================
// BUILD-TIME PRERENDER (SEO + no-JS visitors)
// Injects the real About / Skills / Experience / Projects HTML into index.html using the SAME
// templates the app uses at runtime, so crawlers and social bots see your content immediately.
// ==============================================================================
import data from '../data/portfolio.json' with { type: 'json' };
import { ICONS } from '../src/js/data-default.js';
import { leadHtml, pillarsHtml, skillsHtml, timelineHtml, projectsHtml, marqueeHtml } from '../src/js/templates.js';

const slugIcon = (v, name) => {
  const k = String(v || name || '').toLowerCase().replace(/c\+\+/g, 'cpp').replace(/[^a-z0-9]/g, '');
  return ICONS[k] || '';
};

const INJECT = {
  mq: () => marqueeHtml(data.skills),
  ld: () => leadHtml(data.profile.lead_bio),
  pil: () => pillarsHtml(),
  sk: () => skillsHtml(data.skills, slugIcon),
  pj: () => projectsHtml(data.projects.filter((p) => p.published !== false)),
};

export default function prerender() {
  return {
    name: 'jk-prerender',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        for (const [id, make] of Object.entries(INJECT)) {
          html = html.replace(new RegExp(`(id="${id}"[^>]*>)(<!--SSR-->)`), (_, open) => `${open}${make()}`);
        }
        html = html.replace('<!--SSR:tl-->', timelineHtml(data.experience.filter((e) => e.published !== false)));
        return html;
      },
    },
  };
}
