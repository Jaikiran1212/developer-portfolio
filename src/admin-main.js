// ==============================================================================
// ADMIN CMS ENTRY POINT (admin.html) - loaded only on /admin, never on the public page
// ==============================================================================
import './css/main.css';
import './css/admin.css';

import { PortfolioApp } from './js/portfolio.js';
import { AdminCMS } from './js/admin.js';

(async () => {
  const app = new PortfolioApp({ admin: true });
  await app.init(); // loads current published data for previews
  app.applyFont(app.data?.profile?.font_preset);
  new AdminCMS(app).init();
})();
