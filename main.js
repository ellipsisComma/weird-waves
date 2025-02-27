/*jshint esversion: 11*/

import {
	initialise as initialiseSettings,
} from "./modules/settings.js";
import {
	initialise as initialiseStyles,
	getStyle,
	setStyle,
} from "./modules/styles.js";
import {
	buildArchive,
	allShowIDs,
} from "./modules/archive.js";
import {
	initialise as initialisePlayer,
} from "./modules/player.js";
import {
	loadSchedule,
} from "./modules/schedule.js";
import {
	loadNews,
} from "./modules/news.js?v=2025-02-27";
import {
	initialise as initialiseNav,
} from "./modules/navigation.js";

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
