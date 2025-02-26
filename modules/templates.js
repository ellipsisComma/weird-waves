/*jshint esversion: 11*/

// template HTML module: handles a collection of permanent template content doc fragments

const templates = {};

function setTemplate(key, id) {
	templates[key] ??= document.getElementById(`${id}-template`)?.content;
}

function getTemplate(key) {
	return templates[key];
}

function cloneTemplate(key) {
	return templates[key]?.cloneNode(true);
}

setTemplate(`playlistItem`, `playlist-item`);
setTemplate(`importErrorItem`, `import-error-list-item`);
setTemplate(`archiveSeries`, `archive-series`);
setTemplate(`archiveShow`, `archive-show`);
setTemplate(`newsItem`, `news-item`);

export {
	getTemplate,
	cloneTemplate,
}