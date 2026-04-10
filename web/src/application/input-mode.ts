import { countTextCharacters, countUtf8Bytes } from "./text-codec";

const PROGRAM_INPUT_BYTES_PER_READ = 1;
const ENABLED_INPUT_PLACEHOLDER = "Text consumed by the , instruction";
const DISABLED_INPUT_PLACEHOLDER = "This program does not read input";

export interface InputModeState {
  readonly enabled: boolean;
  readonly description: string;
  readonly placeholder: string;
}

const pluralize = (count: number, singular: string, plural: string): string =>
  count === 1 ? singular : plural;

const sourceUsesInputInstruction = (source: string): boolean =>
  source.includes(",");

export const resolveInputMode = (source: string, input: string): InputModeState => {
  if (!sourceUsesInputInstruction(source)) {
    return {
      enabled: false,
      description: "This program does not use the , command, so Program input is disabled.",
      placeholder: DISABLED_INPUT_PLACEHOLDER
    };
  }

  const prefix = `Each executed , command consumes ${PROGRAM_INPUT_BYTES_PER_READ} byte.`;
  if (input === "") {
    return {
      enabled: true,
      description:
        `${prefix} ` +
        "The browser turns text into UTF-8 bytes before execution. Most Latin letters use 1 byte; emoji and many non-Latin characters use several.",
      placeholder: ENABLED_INPUT_PLACEHOLDER
    };
  }

  const characterCount = countTextCharacters(input);
  const byteCount = countUtf8Bytes(input);

  return {
    enabled: true,
    description:
      `${prefix} Current input: ${characterCount} ` +
      `${pluralize(characterCount, "character", "characters")} and ${byteCount} ` +
      `${pluralize(byteCount, "byte", "bytes")}.`,
    placeholder: ENABLED_INPUT_PLACEHOLDER
  };
};
