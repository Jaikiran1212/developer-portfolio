// ==============================================================================
// APPLICATION ENTRY POINT (src/main.js)
// ==============================================================================
import './css/main.css';
import './css/admin.css';

import { initConstellationCanvas, initClickRipple } from './js/animations.js';
import { PortfolioApp } from './js/portfolio.js';
import { AdminCMS } from './js/admin.js';

// Initialize core visual canvas and click ripples
initConstellationCanvas('#bgCanvas');
initClickRipple();

// Initialize public portfolio application
const portfolio = new PortfolioApp();
portfolio.init();

// Initialize Admin CMS router
const cms = new AdminCMS(portfolio);
cms.init();

// Export to window for debugging or manual testing if needed
window.__jk_portfolio = portfolio;
window.__jk_cms = cms;
