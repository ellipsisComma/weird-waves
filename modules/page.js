/*jshint esversion: 11*/

// page module: handles a collection of stable on-page element references
/*
	features of this vs just using querySelector and getElementById:
		* provides a list of all elements relevant to script
		* allows flexibility of querySelector with limited set of getElementById
		* items can't be overwritten (this could be set on a per-element basis with a little more work)
*/

// list of elements
const elements = {};

// irreversibly set an element in list
function setElement(key, query) {
	elements[key] ??= document.querySelector(query);
}

// get element reference from list
function getElement(key) {
	return elements[key];
}

// head
setElement(`title`, `title`);
setElement(`SVGFavicon`, `[rel="icon"][type="image/svg+xml"]`);

// radio
setElement(`loadedShow`, `#loaded-show`);
setElement(`radioControls`, `#radio-controls`);
setElement(`resetButton`, `#reset-button`);
setElement(`playToggle`, `#play-toggle`);
setElement(`skipButton`, `#skip-button`);
setElement(`seekBar`, `#seek-bar`);
setElement(`showTimeElapsed`, `#show-time-elapsed`);
setElement(`showTimeTotal`, `#show-time-total`);
setElement(`muteToggle`, `#mute-toggle`);
setElement(`volumeControl`, `#volume-control`);
setElement(`audio`, `#show-audio`);

// booth
setElement(`playlist`, `#playlist`);
setElement(`playlistControls`, `#playlist-controls`);
setElement(`clearButton`, `#clear-button`);
setElement(`clearPlaylistControls`, `#clear-playlist-controls`);
setElement(`importExport`, `#import-export-data`);
setElement(`importErrorMessage`, `#import-error-message`);
setElement(`importErrorList`, `#import-error-list`);

// archive
setElement(`seriesLinks`, `#archive-series-links`);
setElement(`seriesList`, `#series-list`);

// news
setElement(`newsList`, `#news-list`);

// settings
setElement(`themeButtons`, `#theme-buttons`);
setElement(`fontButtons`, `#font-buttons`);

// schedule
setElement(`schedule`, `#schedule-container`);
setElement(`scheduleDate`, `#schedule-date`);

export {
	getElement,
};