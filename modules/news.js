/*jshint esversion: 11*/

/*
	news module:
		* loads news feed onto page
		* handles resetting the hash if hash points to a news item
*/

import {
	getElement,
} from "./page.js?type=module,v=2025-04-04";
import {
	cloneTemplate,
} from "./templates.js?type=module,v=2025-04-04";

// build HTML for news item
function buildNewsItem(item) {
	const newsItemProps = {
		"ID": item.querySelector(`link[rel="alternate"]`)?.getAttribute(`href`)?.split(`#`)[1],
		"title": item.querySelector(`title`)?.textContent,
		"published": item.querySelector(`published`)?.textContent,
		"content": item.querySelector(`content`)?.textContent,
	};

	if (!newsItemProps.validate({
		"ID": [`string`, true],
		"title": [`string`, true],
		"published": [`string`, true],
		"content": [`string`, true],
	})) {
		console.warn(`removed news entry "${newsItemProps.ID ?? newsItemProps.title ?? newsItemProps.published ?? `unknown`}" from feed: this news entry lacks required data (link, title, published-date, content)`);
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

// fetch news feed file and, if available and valid, build news list onto page
async function loadNews() {
	const file = await fetch(
		`./feed.xml`,
		{"cache": `no-cache`},
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
