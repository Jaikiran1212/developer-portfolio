// ==============================================================================
// PUBLIC SITE ENTRY POINT (src/main.js)
// The admin CMS is a separate page/bundle (admin.html -> src/admin-main.js).
// ==============================================================================
import './css/main.css';

import { initConstellationCanvas, initClickRipple } from './js/animations.js';
import { PortfolioApp } from './js/portfolio.js';

// Old bookmarks / links that used the hash route now go to the dedicated admin page
if (window.location.hash === '#admin') window.location.replace('/admin');

initConstellationCanvas('#bgCanvas');
initClickRipple();

const portfolio = new PortfolioApp();
portfolio.init();
