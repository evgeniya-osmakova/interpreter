import "./ui/styles/app.css";
import { createWorkerRuntimeClient } from "./runtime/client/runtime-client";
import { mountApp } from "./app";

const root = document.querySelector<HTMLElement>("#app");

if (root !== null) {
  mountApp(root, createWorkerRuntimeClient());
}
