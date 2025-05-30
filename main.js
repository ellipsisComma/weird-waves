/*jshint esversion: 11*/

import {
	initialise as initialiseSettings,
} from "./modules/settings.js?type=module,v=2025-05-13";
import {
	initialise as initialiseStyles,
} from "./modules/styles.js?type=module,v=2025-05-13";
import {
	buildArchive,
} from "./modules/archive.js?type=module,v=2025-05-13";
import {
	initialise as initialisePlayer,
} from "./modules/player.js?type=module,v=2025-05-13";
import {
	loadSchedule,
} from "./modules/schedule.js?type=module,v=2025-05-13";
import {
	loadNews,
} from "./modules/news.js?type=module,v=2025-05-13";
import {
	initialise as initialiseNav,
} from "./modules/navigation.js?type=module,v=2025-05-13";

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
