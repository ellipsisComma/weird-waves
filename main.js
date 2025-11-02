/*jshint esversion: 11*/

import {
	initialise as initialiseSettings,
} from "settings";
import {
	initialise as initialiseStyles,
} from "styles";
import {
	buildArchive,
} from "archive";
import {
	initialise as initialisePlayer,
} from "player";
import {
	loadSchedule,
} from "schedule";
import {
	loadNews,
} from "news";
import {
	initialise as initialiseNav,
} from "navigation";

// on pageload, execute various tasks
// sync tasks
document.addEventListener(`DOMContentLoaded`, () => {
	// initialise support
	initialiseSettings();
	initialiseStyles();

	// build various page sections
	buildArchive();

	// initialise app
	initialisePlayer();

	// initialise navigation
	initialiseNav();
});

// async tasks
document.addEventListener(`DOMContentLoaded`, loadNews);
document.addEventListener(`DOMContentLoaded`, loadSchedule);
