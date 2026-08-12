import { createApp } from "vue";
import App from "./App.vue";
import "./styles/app.css";
import "./styles/journey.css";

// The static markup in index.html is the site. Vue mounts into a child of it
// to enhance it, so the page reads correctly before this file runs — and still
// reads correctly if it never does.
const mount = document.querySelector<HTMLElement>("#journey");
if (mount) createApp(App).mount(mount);
