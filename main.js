/*jshint esversion: 11*/

import {
	initialise as initialiseSettings,
} from "./modules/settings.js?v=2025-03-07";
import {
	initialise as initialiseStyles,
	getStyle,
	setStyle,
} from "./modules/styles.js?v=2025-03-07";
import {
	buildArchive,
	allShowIDs,
} from "./modules/archive.js?v=2025-03-07";
import {
	initialise as initialisePlayer,
} from "./modules/player.js?v=2025-03-07b";
import {
	loadSchedule,
} from "./modules/schedule.js?v=2025-03-07";
import {
	loadNews,
} from "./modules/news.js?v=2025-03-07b";
import {
	initialise as initialiseNav,
} from "./modules/navigation.js?v=2025-03-07";

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
