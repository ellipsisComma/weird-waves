/*jshint esversion: 11*/

// initialise user-selected (or default) site display settings
const styles = JSON.parse(window.localStorage.getItem(`styles`)) ?? {};
styles.theme ??= document.documentElement.dataset.theme;
styles.font ??= document.documentElement.dataset.font;
for (const [style, option] of Object.entries(styles)) document.documentElement.dataset[style] = option;
console.info(`initialised theme: ${styles.theme}`);
console.info(`initialised font: ${styles.font}`);

// update title and currently-marked nav-link depending on hash
function navigateToSection() {
	if (window.location.hash.length === 0) {
		document.querySelector(`[aria-current="page"]`)?.removeAttribute(`aria-current`);
		document.title = page.title.dataset.original;
		return;
	}

	// find section that hash target is or is inside
	const section = document.querySelector(window.location.hash)?.closest(`main > *`);

	// if the targeted section exists, switch aria-current to target's nav-link and update title accordingly, else return to default page title
	if (section) {
		const navLink = document.querySelector(`nav [href="#${section.id}"]`);
		document.querySelector(`[aria-current="page"]`)?.removeAttribute(`aria-current`);
		document.title = `${navLink.dataset.title ?? navLink.innerText} / ${page.title.dataset.original}`;
		navLink.setAttribute(`aria-current`, `page`);
	} else {
		window.location.hash = ``;
		navigateToSection();
		console.error(`attempted to navigate to non-existent page section: ${window.location.hash}`);
	}
}

window.addEventListener(`hashchange`, navigateToSection);
