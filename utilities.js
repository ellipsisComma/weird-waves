/*jshint esversion: 11*/

/* =============
	ELEMENTS
============= */

/*
build an element from:
	* a tag (string, required),
	* attributes (object, optional),
	* children (array (strings and/or element references), optional)
can be recursive
*/
function make(element) {
	const output = document.createElement(element.tag);
	if (element.attrs) output.setAttributes(element.attrs);
	if (element.children) output.append(...element.children);
	return output;
}

// add an object of attributes to an Element
Element.prototype.setAttributes = function (attrs) {
	for (const [name, value] of Object.entries(attrs)) this.setAttribute(name, value);
};

// remove an array of attributes from an Element
Element.prototype.removeAttributes = function (attrs) {
	for (const attr of attrs) this.removeAttribute(attr);
};

// create an array of nodes cloned from the target
Element.prototype.cloneChildren = function () {
	return [...this.childNodes].map(node => node.cloneNode(true));
};

// set a string to be an element's innerHTML if it includes HTML entities or unescaped angle brackets, otherwise set it as textContent
HTMLElement.prototype.setContent = function (text) {
	const HTMLRegex = /<|>|&#?\w+;/;
	if (HTMLRegex.test(text)) this.innerHTML = text;
	else this.textContent = text;
};

// add text content to an element
Element.prototype.addText = function (string, after = true) {
	if (after) this.appendChild(document.createTextNode(string));
	else this.prepend(document.createTextNode(string));
};

// get computed value of a style property of an element
function getElementStyle(query, property) {
	return getComputedStyle(document.querySelector(query)).getPropertyValue(property);
}



/* ===========
	ARRAYS
=========== */

// shuffle array (mutates)
// uses Fisher Yates shuffle and returns "this" for flexibility (use on left or right side of expression)
Array.prototype.shuffle = function () {
	let i = this.length;
	while (i-- > 0) {
		const r = Math.floor(Math.random() * this.length);
		const t = this[r];
		this[r] = this[i];
		this[i] = t;
	}
	return this;
}

// return a shuffled copy of the array (doesn't mutate)
// uses Fisher Yates shuffle, must be used on the right hand
Array.prototype.toShuffled = function () {
	const arr = structuredClone(this);
	let i = arr.length;
	while (i-- > 0) {
		const r = Math.floor(Math.random() * arr.length);
		const t = arr[r];
		arr[r] = arr[i];
		arr[i] = t;
	}
	return arr;
}

// sum a numerical array
Array.prototype.sum = function () {
	return this.reduce((a, b) => a + b, 0);
};

// work down through a multi-level array of objects, where one value is an array of objects, etc., using keys
// example: arr.sumByKey(`author`, `book`, `wordcount`) would sum the wordcount across all of an author's books
Array.prototype.sumByKey = function (...args) {
	return this.reduce((a, b) => a + (
		args.length > 1
		? b[args[0]].sumByKey(...args.slice(1))
		: b[args[0]] instanceof Array
			? b[args[0]].sum()
			: b[args[0]]), 0);
};



/* ============
	OBJECTS
============ */

// check whether a variable is a standard associative-array/key-value-pair object (e.g. as created by an object literal)
function isObject(variable) {
	return variable instanceof Object && variable.constructor === Object;
}

// check whether an object has certain keys, and that the value of each key matches a given type
// keysToTypes is an object in which each key is a key that should be in the target
// and each value is a boolean of whether the target is required and the target's valid type as a string
// valid types:
	// null, NaN, undefined,
	// string, number, bigint, boolean, symbol,
	// array, object, function, class, regex
function validateObject(obj, keysToTypes) {
	return Object.entries(keysToTypes).every(([key, [validType, required]]) => {
		let valid = false;
		if (!Object.hasOwn(obj, key)) return !required;

		switch (validType) {
		case `null`:		valid = obj[key] === null; break;
		case `NaN`:			valid = isNaN(obj[key]); break;
		case `array`:		valid = Array.isArray(obj[key]); break;
		case `object`:		valid = isObject(obj[key]); break;
		case `function`:	valid = typeof obj[key] === `function` && !String(obj[key]).startsWith(`class`); break;
		case `class`:		valid = typeof obj[key] === `function` && String(obj[key]).startsWith(`class`); break;
		case `regex`:		valid = typeof obj[key] === `object` && String(obj[key]).startsWith(`/`); break;
		default:			valid = typeof obj[key] === validType;
		}

		return valid;
	});
};

/*
// test with this
x = {
  "string": "abc",
  "number": 123,
  "bool": true,
  "function": () => {},
  "undefined": undefined,
  "null": null,
  "NaN": NaN,
  "array": [],
  "object": {},
  "classy": class testClass {},
  "regex": /regex/,
};

validateObject(x, {
  "string": [`string`, true],
  "number": [`number`, true],
  "bool": [`boolean`, true],
  "function": [`function`, true],
  "undefined": [`undefined`, true],
  "null": [`null`, true],
  "NaN": [`NaN`, true],
  "array": [`array`, true],
  "object": [`object`, true],
  "classy": [`class`, true],
  "regex": [`regex`, true],
})
*/



/* ============
	STRINGS
============ */

String.prototype.camelToKebab = function () {
	return this.replaceAll(/([A-Z])/g, (match) => `-${match.toLowerCase()}`);
};

String.prototype.kebabToCamel = function () {
	return this.replaceAll(/-([a-z])/g, (match) => match.slice(1).toUpperCase());
};

// calculate the Jaro similarity of two strings (0 = totally unalike, 1 = identical)
function getJaroSimilarity(str1, str2) {
	const matched1 = Array(str1.length).fill(false);
	const matched2 = Array(str2.length).fill(false);
	const range = Math.floor(Math.max(str1.length, str2.length) / 2 - 1);

	for (let i = 0; i < str1.length; i++) {
		for (let j = Math.max(0, i - range); j < Math.min(str2.length, i + range); j++) {
			// if the two characters match and the second hasn't been matched yet, mark both as matched and break the loop (no need to continue checking for matches)
			if (str1[i] === str2[j] && matched2[j] !== true) {
				matched1[i] = true;
				matched2[j] = true;
				break;
			}
		}
	}

	// where "matched" is true get character from string and push to "shared"
	const shared1 = [];
	const shared2 = [];
	for (let i = 0; i < matched1.length; i++) if (matched1[i]) shared1.push(str1[i]);
	for (let i = 0; i < matched2.length; i++) if (matched2[i]) shared2.push(str2[i]);

	// get transposition count
	let transPos = 0;
	for (let i = 0; i < shared1.length; i++) {
		if (shared1[i] !== shared2[i]) transPos++;
	}

	const matches = shared1.length;
	const similarity = (
		matches / str1.length
		+ matches / str2.length
		+ (matches - transPos / 2) / matches
		) / 3;

	return similarity;
}

// fast, modern string hash
// cyrb53 (c) 2018 bryc (github.com/bryc)
String.prototype.toHash = function (seed = 0) {
	let h1 = 0xdeadbeef ^ seed;
	let h2 = 0x41c6ce57 ^ seed;

	for (let i = 0, ch; i < this.length; i++) {
		ch = this.charCodeAt(i);
		h1 = Math.imul(h1 ^ ch, 2654435761);
		h2 = Math.imul(h2 ^ ch, 1597334677);
	}

	h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
	h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
	h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
	h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

	return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};



/* =========
	SETS
========= */

// toggle an item in a set
Set.prototype.toggle = function (item) {
	if (this.has(item)) this.delete(item);
	else this.add(item);
};



/* ============
	STORAGE
============ */

// get something from localStorage
// use default value if: stored value doesn't exist, stored value is invalid JSON, or stored value is valid JSON null or undefined
function localStorageGet(key, defaultValue) {
	let value;
	try {
		value = JSON.parse(localStorage.getItem(key));
	} catch {
		console.warn(`Failed to retrieve locally-stored value for key "${key}" (either nothing was stored for that key or stored value was invalid JSON), so returned default value "${defaultValue}" instead.`);
	} finally {
		return value ?? defaultValue;
	}
}

// set something in localStorage
function localStorageSet(key, value) {
	localStorage.setItem(key, JSON.stringify(value));
}



/* ==================
	INTERACTIVITY
================== */

HTMLButtonElement.prototype.success = function(successMessage) {
	const buttonInnerHTML = this.innerHTML;
	this.innerHTML = successMessage;
	this.disabled = true;
	setTimeout(() => {
		this.innerHTML = buttonInnerHTML;
		this.disabled = false;
	}, 3000);
}
