/*jshint esversion: 11*/

// initialise user-selected (or default) site display settings
for (const [style, option] of Object.entries(localStorageGet(`styles`) ?? {})) {
	document.documentElement.dataset[style] = option;
}

/*
	for Safari: theme transition duration must start at 0 (in stylesheet)
	and be set to 1s later (in at least some older versions)
*/
document.addEventListener(`DOMContentLoaded`, () =>
	document.documentElement.style.setProperty(`transition-duration`, `1s`)
);
