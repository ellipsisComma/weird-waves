/*jshint esversion: 11*/

import {
	initialise as initialiseSettings,
} from "./modules/settings.js?v=2025-03-05";
import {
	initialise as initialiseStyles,
	getStyle,
	setStyle,
} from "./modules/styles.js?v=2025-02-26";
import {
	buildArchive,
	allShowIDs,
} from "./modules/archive.js?v=2025-03-04";
import {
	initialise as initialisePlayer,
} from "./modules/player.js?v=2025-03-05c";
import {
	loadSchedule,
} from "./modules/schedule.js?v=2025-02-26";
import {
	loadNews,
} from "./modules/news.js?v=2025-02-27b";
import {
	initialise as initialiseNav,
} from "./modules/navigation.js?v=2025-02-26";

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
