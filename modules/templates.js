/*jshint esversion: 11*/

/*
	template HTML module:
		* handles a collection of permanent template content doc fragments
		* allows modification of templates as well as cloning them
*/

// initialise templates object
const templates = {};

// add a template using the element's [id]
function setTemplate(key, id) {
	templates[key] ??= document.getElementById(`${id}-template`)?.content;
}

// return a template itself (for modifying template later)
function getTemplate(key) {
	return templates[key];
}

// deep clone a template, if it exists
function cloneTemplate(key) {
	return templates[key]?.cloneNode(true);
}

// set templates
setTemplate(`playlistItem`, `playlist-item`);
setTemplate(`importErrorItem`, `import-error-list-item`);
setTemplate(`archiveSeries`, `archive-series`);
setTemplate(`archiveShow`, `archive-show`);
setTemplate(`newsItem`, `news-item`);

export {
	getTemplate,
	cloneTemplate,
}