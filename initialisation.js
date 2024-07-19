/*jshint esversion: 11*/

// initialise user-selected (or default) site display settings
const styles = retrieve(`styles`, {});
styles.theme ??= document.documentElement.dataset.theme;
styles.font ??= document.documentElement.dataset.font;
for (const [style, option] of Object.entries(styles)) document.documentElement.dataset[style] = option;
console.info(`initialised theme: ${styles.theme}`);
console.info(`initialised font: ${styles.font}`);

// update title and currently-marked nav-link depending on hash
function navigateToSection() {
	document.querySelector(`[aria-current="page"]`)?.removeAttribute(`aria-current`);
	const section = document.querySelector(window.location.hash.length > 0 ? window.location.hash : null)?.closest(`main > *`); 

	// if targeted section exists, switch aria-current to its nav-link and update document title
	if (section) {
		const navLink = document.querySelector(`nav a[href="#${section.id}"]`);
		document.title = `${navLink.innerText} / ${page.title.dataset.original}`;
		navLink.setAttribute(`aria-current`, `page`);
	}
}

window.addEventListener(`hashchange`, navigateToSection);
