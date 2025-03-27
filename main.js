/*jshint esversion: 11*/

import {
	initialise as initialiseSettings,
} from "./modules/settings.js?type=module,v=2025-03-27";
import {
	initialise as initialiseStyles,
	getStyle,
	setStyle,
} from "./modules/styles.js?type=module,v=2025-03-27";
import {
	buildArchive,
	allShowIDs,
} from "./modules/archive.js?type=module,v=2025-03-27";
import {
	initialise as initialisePlayer,
} from "./modules/player.js?type=module,v=2025-03-27b";
import {
	loadSchedule,
} from "./modules/schedule.js?type=module,v=2025-03-27";
import {
	loadNews,
} from "./modules/news.js?type=module,v=2025-03-27b";
import {
	initialise as initialiseNav,
} from "./modules/navigation.js?type=module,v=2025-03-27";

// on pageload, execute various tasks
document.addEventListener(`DOMContentLoaded`, () => {
	// initialise support
	initialiseSettings();
	initialiseStyles();

	// build various page sections
	buildArchive();
	loadNews();
	loadSchedule();

	// initialise app
	initialisePlayer();

	// initialise navigation
	initialiseNav();
});
