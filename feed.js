// setup for navigateToSection()
const page = {
	"title": document.querySelector(`title`),
	"nav": document.querySelector(`nav`)
};
page.title.dataset.original = document.title;
if (window.location.hash) navigateToSection();

// update favicons according to theme
document.querySelector(`[rel~="icon"][href$=".svg"]`).href = `./images/favicons/${styles.theme}.svg`;
document.querySelector(`[href$=".ico"]`).href = `./images/favicons/${styles.theme}.ico`;

// re-parse elements from the parsed file that contain HTML (or SVG)
const HTMLRegex = /&#?\w+;|<;[a-z]|\/>|<\/|<!--/;
for (const content of document.querySelectorAll(`.contains-html`)) if (HTMLRegex.test(content.innerText)) content.innerHTML = content.innerText;
