/*jshint esversion: 11*/

// initialise user-selected (or default) site display settings
Object.entries(retrieve(`styles`, {})).forEach(([style, option]) => document.documentElement.dataset[style] = option);

// update title and currently-marked nav-link depending on hash
function navigateToSection() {
	document.querySelector(`[aria-current="page"]`)?.removeAttribute(`aria-current`);
	const section = document.querySelector(location.hash.length > 0 ? location.hash : null)?.closest(`main > *`); 

	// if targeted section exists, switch aria-current to its nav-link and update document title
	if (section) {
		const navLink = document.querySelector(`nav a[href="#${section.id}"]`);
		document.title = `${navLink.innerText} / ${page.getElement(`title`).dataset.original}`;
		navLink.setAttribute(`aria-current`, `page`);
	}
}

window.addEventListener(`hashchange`, navigateToSection);
