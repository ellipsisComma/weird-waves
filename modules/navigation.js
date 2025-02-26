/*jshint esversion: 11*/

import {
	getElement,
} from "./page.js";

// update title and currently-marked nav-link depending on hash
function navigateToSection() {
	document.querySelector(`[aria-current="page"]`)?.removeAttribute(`aria-current`);
	const section = document.querySelector(location.hash.length > 0 ? location.hash : null)?.closest(`main > *`);

	// if targeted section exists, switch aria-current to its nav-link and update document title
	if (section) {
		const navLink = document.querySelector(`nav a[href="#${section.id}"]`);
		document.title = `${navLink.innerText} / ${getElement(`title`).dataset.original}`;
		navLink.setAttribute(`aria-current`, `page`);
	} else document.title = getElement(`title`).dataset.original;
}

// navigation events
window.addEventListener(`hashchange`, navigateToSection);


function initialise() {
	// update page head data
	getElement(`title`).dataset.original = document.title;

	//
	if (location.hash) navigateToSection();
}

export {
	initialise,
};
