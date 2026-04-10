import "./ui/styles/app.css";
import { mountApp } from "./app";

const root = document.querySelector<HTMLElement>("#app");

if (root !== null) {
  mountApp(root);
}
