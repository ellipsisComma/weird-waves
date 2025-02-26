/*jshint esversion: 11*/

/*
SCRIPT CONTROLS: settings to control app behaviour (e.g. default user settings)
PARAMETERS: initialising internal parameters
FUNCTIONS
	UTILITY: general and misc. applications
	PLAYLIST: building and altering the playlist as a whole
	SHOWS:
		ADDING: adding single or multiple shows to playlist
		MANIPULATING: loading, moving, and removing shows already on playlist
	RADIO: audio interface
	PAGE CONSTRUCTION:
		ARCHIVE: building archive onto page and filtering data from it for later use
		SCHEDULE: fetching and building schedule
		NEWS: fetching and building news feed
EVENTS: event listeners
*/

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
} from "./modules/news.js";
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
