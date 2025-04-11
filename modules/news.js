/*jshint esversion: 11*/

/*
	news module:
		* loads news feed onto page
		* handles resetting the hash if hash points to a news item
*/

import {
	getElement,
} from "./page.js?type=module,v=2025-04-09";
import {
	cloneTemplate,
} from "./templates.js?type=module,v=2025-04-09";

// build HTML for news item
function buildNewsItem(item) {
	const newsItemProps = {
		"ID": item.querySelector(`link[rel="alternate"]`)?.getAttribute(`href`)?.split(`#`)[1],
		"title": item.querySelector(`title`)?.textContent,
		"published": item.querySelector(`published`)?.textContent,
		"content": item.querySelector(`content`)?.textContent,
	};

	if (!validateObject(newsItemProps, {
		"ID": [`string`, true],
		"title": [`string`, true],
		"published": [`string`, true],
		"content": [`string`, true],
	})) {
		console.warn(`Removed invalid news entry from feed.
Required props:
	ID (string, from link[rel="alternate"].href)
	title (string)
	published date (string)
	content (string)
`, newsItemProps);
		return ``;
	}

	const templatedNews = cloneTemplate(`newsItem`);

	templatedNews.querySelector(`li`)?.setAttribute(`id`, newsItemProps.ID);
	templatedNews.querySelector(`h3 > a`)?.setContent(newsItemProps.title);
	templatedNews.querySelector(`h3 > a`)?.setAttribute(`href`, `#${newsItemProps.ID}`);
	templatedNews.querySelector(`.news-item-published`)?.setContent(newsItemProps.published.split(`T`)[0]);
	templatedNews.querySelector(`.news-item-content`)?.setContent(newsItemProps.content);
	templatedNews.querySelector(`.item-return-link`)?.setAttribute(`href`, `#${newsItemProps.ID}`);

	return templatedNews;
}

// build news feed onto page
function buildNewsFeed(news) {
	const newsCount = 5;

	getElement(`newsList`).replaceChildren(...[...news.querySelectorAll(`entry:nth-of-type(-n + ${newsCount})`)].map(buildNewsItem));
	getElement(`newsList`).dataset.empty = `News feed is empty.`;

	// must reset hash so navigateToSection() will apply if the hash is for a news item
	// (as news items are loaded onto page asynchronously, the browser won't recognise that they exist when navigateToSection() is called on DOMContentLoaded)
	if (location.hash) {
		const storedHash = location.hash;
		location.hash = ``;
		location.hash = storedHash;
	}
}

// fetch news feed file and, if available and valid, build news list onto page
async function loadNews() {
	const file = await fetch(
		`./feed.xml`,
		{"cache": `no-cache`},
	);
	if (!file.ok) {
		getElement(`newsList`).dataset.empty = `Error: Couldn't load news feed.`;
		console.error(`Failed to fetch news feed file. Status: ${file.status}.`);
		return;
	}

	try {
		const XML = await file.text();
		const news = new DOMParser().parseFromString(XML, `text/xml`);
		buildNewsFeed(news);
	} catch {
		console.error(`News feed is not a text file.`);
	}
}

export {
	loadNews,
};
