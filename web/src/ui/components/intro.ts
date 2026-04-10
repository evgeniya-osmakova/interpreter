export const renderIntro = (): HTMLElement => {
  const intro = document.createElement("header");
  intro.className = "intro";

  const title = document.createElement("h1");
  title.textContent = "Brainfuck Mirror";

  const lead = document.createElement("p");
  lead.className = "intro__lead";
  lead.textContent =
    "Explore a validated Brainfuck program in a browser shell that mirrors the formal Lean model and keeps execution off the main thread.";

  const learnMore = document.createElement("p");
  learnMore.className = "intro__link";
  learnMore.append("New to Brainfuck? Start with the Wikipedia overview: ");

  const link = document.createElement("a");
  link.href = "https://en.wikipedia.org/wiki/Brainfuck";
  link.target = "_blank";
  link.rel = "noreferrer noopener";
  link.textContent = "Brainfuck on Wikipedia";

  learnMore.append(link);
  intro.append(title, lead, learnMore);
  return intro;
};
