/*jshint esversion: 6*/

/* ===================
	INITIALISATION
=================== */

// initialise user-selected (or default) site display settings
const styles = JSON.parse(window.localStorage.getItem("styles")) ?? {
	"theme": "dark",
	"font": "serif",
	"position": "left"
};
document.body.removeAttribute("class");
for (const [style, option] of Object.entries(styles)) document.body.classList.add(style+"-"+option);

/* ============
	FAVICON
============ */

// store path to favicons and references for .svg and .ico favicon elements
const faviconPath = "./images/favicons/",
favicon = {
	"SVG": document.head.querySelector('[rel~="icon"][href$=".svg"]'),
	"ico": document.head.querySelector('[href$=".ico"]')
};

// switch favicon to match style
function switchFavicon(themeName) {
	favicon.SVG.href = faviconPath + themeName + ".svg";
	favicon.ico.href = faviconPath + themeName + ".ico";
}

// switch favicon on pageload
document.addEventListener("DOMContentLoaded", () => switchFavicon(styles.theme));

/* ===============
	NAVIGATION
=============== */

// add section name to page title (or reset page title to home) and mark nav-link for current page (remove marking from any other marked nav-links)
function changeDocumentTitle() {
	const title = document.querySelector("title");

	document.querySelector('[aria-current="page"]')?.removeAttribute('tabindex');
	document.querySelector('[aria-current="page"]')?.removeAttribute('aria-current');

	const navLink = document.querySelector('nav [href="' + window.location.hash + '"]');
	if (navLink) {
		document.title = navLink.innerText + " / " + title.dataset.original;

		navLink.setAttribute('aria-current', 'page');
		navLink.setAttribute('tabindex', '-1');
	} else document.title = title.dataset.original;
}

// if url contains hash on pageload, or hash changes after pageload, change location info to match 
document.addEventListener("DOMContentLoaded", () => {
	document.querySelector("title").setAttribute("data-original", document.title);
	changeDocumentTitle();
});
window.addEventListener("hashchange", () => changeDocumentTitle());
