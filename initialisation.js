/*jshint esversion: 11*/

// initialise user-selected (or default) site display settings
const styles = JSON.parse(window.localStorage.getItem(`styles`)) ?? {};
styles.theme ??= `dark`;
styles.font ??= `serif`;
for (const [style, option] of Object.entries(styles)) document.body.dataset[style] = option;
