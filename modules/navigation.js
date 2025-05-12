/*jshint esversion: 11*/

/*
	navigation module:
		* modifies metadata and nav links according to site navigation
*/

// update title and currently-marked nav-link depending on hash
function navigateToSection() {
	document.querySelector(`[aria-current="page"]`)?.removeAttribute(`aria-current`);
	const section = document.querySelector(location.hash.length > 0 ? location.hash : null)?.closest(`main > *`);

	// if targeted section exists...
	if (section) {
		const navLink = document.querySelector(`nav a[href="#${section.id}"]`);

		// if it's a proper site section, update doc title to match and mark its nav-link as the current one
		// else, return doc title to original
		if (navLink) {
			document.title = `${navLink.innerText} / ${document.head.querySelector(`title`).dataset.original}`;
			navLink.setAttribute(`aria-current`, `page`);
		} else document.title = document.head.querySelector(`title`).dataset.original;
	} else document.title = document.head.querySelector(`title`).dataset.original;
}

// initialise navigation
function initialise() {
	// update page head data
	document.head.querySelector(`title`).dataset.original = document.title;

	// update metadata for initial hash
	if (location.hash) navigateToSection();
}

// navigation events
window.addEventListener(`hashchange`, navigateToSection);

export {
	initialise,
};
