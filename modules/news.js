/*jshint esversion: 11*/

/*
	news module:
		* loads news feed onto page
		* handles resetting the hash if hash points to a news item
*/

import {
	getElement,
} from "./page.js?type=module,v=2025-03-28";
import {
	cloneTemplate,
} from "./templates.js?type=module,v=2025-03-28";

// build HTML for news item
function buildNewsItem(item) {
	const templatedNews = cloneTemplate(`newsItem`);

	const newsID = item.querySelector(`link[rel="alternate"]`).getAttribute(`href`).split(`#`)[1];

	templatedNews.querySelector(`li`).id = newsID;
	templatedNews.querySelector(`h3 > a`).setContent(item.querySelector(`title`).textContent);
	templatedNews.querySelector(`h3 > a`).href = `#${newsID}`;
	templatedNews.querySelector(`.news-item-published`).textContent = item.querySelector(`published`).textContent.split(`T`)[0];
	templatedNews.querySelector(`.news-item-content`).setContent(item.querySelector(`content`).textContent);
	templatedNews.querySelector(`.item-return-link`).href = `#${newsID}`;

	return templatedNews;
}

// fetch news feed file and, if available and valid, build news list onto page
async function loadNews() {
	const file = await fetch(
		`./feed.xml`,
		{"cache": `no-cache`}
	);
	if (!file.ok) {
		console.error(`failed to fetch news feed file`);
		getElement(`newsList`).dataset.empty = `Error: Couldn't load news feed.`;
		return;
	}
	const XML = await file.text();
	const news = new DOMParser().parseFromString(XML, `text/xml`);

	getElement(`newsList`).replaceChildren(...[...news.querySelectorAll(`entry`)].map(buildNewsItem));

	// must reset hash so navigateToSection() will apply if the hash is for a news item
	// (as news items are loaded onto page asynchronously, the browser won't recognise that they exist when navigateToSection() is called on DOMContentLoaded)
	if (location.hash) {
		const storedHash = location.hash;
		location.hash = ``;
		location.hash = storedHash;
	}
}

export {
	loadNews,
};