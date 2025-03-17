/*jshint esversion: 11*/

// initialise user-selected (or default) site display settings
for (const [style, option] of Object.entries(localStorageGet(`styles`) ?? {})) {
	document.documentElement.dataset[style] = option;
}
