/*jshint esversion: 11*/

// initialise user-selected (or default) site display settings
Object.entries(localStorageGet(`styles`) ?? {})
	.forEach(([style, option]) => document.documentElement.dataset[style] = option);
