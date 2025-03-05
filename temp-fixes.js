/*jshint esversion: 11*/

// fixes for any changes to data on user's browser
// basically, changes to localStorage etc.
// can be removed within a few months of their application

// in localStorage, rename "playlist" to more general term "shows"
// applied 2025-03-05
if (localStorage.getItem(`playlist`) !== null) {
	localStorage.setItem(`shows`, localStorage.getItem(`playlist`));
	localStorage.removeItem(`playlist`);
}
