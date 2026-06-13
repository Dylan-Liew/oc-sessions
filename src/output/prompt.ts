import * as readline from "node:readline";
import readlinePromises from "node:readline/promises";
import process from "node:process";
import { rankFuzzy } from "../lib/fuzzy.js";

export async function confirm(message: string): Promise<boolean> {
  const rl = readlinePromises.createInterface({ input: process.stdin, output: process.stderr });

  try {
    const reply = await rl.question(message);
    return /^(y|yes)$/i.test(reply.trim());
  } finally {
    rl.close();
  }
}

export async function selectIndex(message: string, count: number): Promise<number | null> {
  const rl = readlinePromises.createInterface({ input: process.stdin, output: process.stderr });

  try {
    while (true) {
      const reply = await rl.question(message);
      const trimmed = reply.trim();

      if (!trimmed) {
        return null;
      }

      const selectedIndex = Number.parseInt(trimmed, 10);

      if (Number.isInteger(selectedIndex) && selectedIndex >= 1 && selectedIndex <= count) {
        return selectedIndex - 1;
      }

      process.stderr.write(`Invalid selection: ${trimmed}\n`);
    }
  } finally {
    rl.close();
  }
}

export interface SearchChoice {
  label: string;
  detail?: string;
  searchText: string;
}

function renderChoices(choices: SearchChoice[]): string {
  return choices
    .map((choice, index) => {
      const suffix = choice.detail ? `  ${choice.detail}` : "";
      return `${String(index + 1).padStart(2, " ")}. ${choice.label}${suffix}`;
    })
    .join("\n");
}

function clearRenderedLines(lineCount: number): void {
  if (lineCount <= 0) {
    return;
  }

  readline.moveCursor(process.stdout, 0, -lineCount);
  readline.cursorTo(process.stdout, 0);
  readline.clearScreenDown(process.stdout);
}

function renderInteractiveSelector(
  query: string,
  matches: Array<{ item: { choice: SearchChoice; index: number } }>,
  selectedIndex: number,
): number {
  const lines = [
    "Select session (type to filter, ↑/↓ to move, Enter to select, Ctrl+C to cancel)",
    `Search: ${query}`,
  ];

  if (matches.length === 0) {
    lines.push("  No matches.");
  } else {
    for (let index = 0; index < matches.length; index += 1) {
      const match = matches[index];
      const marker = index === selectedIndex ? ">" : " ";
      const detail = match.item.choice.detail ? `  ${match.item.choice.detail}` : "";
      lines.push(`${marker} ${match.item.choice.label}${detail}`);
    }
  }

  process.stdout.write(`${lines.join("\n")}\n`);
  return lines.length;
}

async function selectWithSearchTty(
  choices: SearchChoice[],
  options: { maxVisible?: number } = {},
): Promise<number | null> {
  const { maxVisible = 12 } = options;
  const indexedChoices = choices.map((choice, index) => ({ choice, index }));

  return new Promise<number | null>((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    const wasRaw = stdin.isRaw === true;
    let query = "";
    let selectedIndex = 0;
    let renderedLines = 0;

    const getMatches = () =>
      rankFuzzy(indexedChoices, query, ({ choice }) => choice.searchText, maxVisible);

    const render = () => {
      const matches = getMatches();
      const maxIndex = Math.max(0, matches.length - 1);
      selectedIndex = Math.min(selectedIndex, maxIndex);
      clearRenderedLines(renderedLines);
      renderedLines = renderInteractiveSelector(query, matches, selectedIndex);
      return matches;
    };

    const finish = (value: number | null) => {
      stdin.off("keypress", onKeypress);
      clearRenderedLines(renderedLines);

      if (!wasRaw && stdin.isTTY) {
        stdin.setRawMode(false);
      }

      stdin.pause();
      resolve(value);
    };

    const onKeypress = (input: string, key: readline.Key) => {
      if (key.ctrl && key.name === "c") {
        finish(null);
        return;
      }

      if (key.name === "return") {
        const matches = getMatches();
        if (matches.length > 0) {
          finish(matches[selectedIndex].item.index);
        }
        return;
      }

      if (key.name === "up") {
        selectedIndex = Math.max(0, selectedIndex - 1);
        render();
        return;
      }

      if (key.name === "down") {
        selectedIndex += 1;
        render();
        return;
      }

      if (key.name === "backspace") {
        if (query.length > 0) {
          query = query.slice(0, -1);
          selectedIndex = 0;
          render();
        }
        return;
      }

      if (!key.ctrl && !key.meta && input >= " ") {
        query += input;
        selectedIndex = 0;
        render();
      }
    };

    readline.emitKeypressEvents(stdin);

    if (!wasRaw && stdin.isTTY) {
      stdin.setRawMode(true);
    }

    stdin.resume();
    stdin.on("keypress", onKeypress);
    render();
  });
}

function renderInteractiveMultiSelector(
  query: string,
  matches: Array<{ item: { choice: SearchChoice; index: number } }>,
  cursorIndex: number,
  selectedIndexes: Set<number>,
): number {
  const lines = [
    "Select sessions (type to filter, Space toggles, ↑/↓ moves, Enter confirms, Ctrl+C cancels)",
    `Search: ${query}`,
  ];

  if (matches.length === 0) {
    lines.push("  No matches.");
  } else {
    for (let index = 0; index < matches.length; index += 1) {
      const match = matches[index];
      const marker = index === cursorIndex ? ">" : " ";
      const checked = selectedIndexes.has(match.item.index) ? "x" : " ";
      const detail = match.item.choice.detail ? `  ${match.item.choice.detail}` : "";
      lines.push(`${marker} [${checked}] ${match.item.choice.label}${detail}`);
    }
  }

  lines.push(`${selectedIndexes.size} selected`);
  process.stdout.write(`${lines.join("\n")}\n`);
  return lines.length;
}

async function selectManyWithSearchTty(
  choices: SearchChoice[],
  options: { maxVisible?: number } = {},
): Promise<number[] | null> {
  const { maxVisible = 12 } = options;
  const indexedChoices = choices.map((choice, index) => ({ choice, index }));

  return new Promise<number[] | null>((resolve) => {
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw === true;
    let query = "";
    let cursorIndex = 0;
    let renderedLines = 0;
    const selectedIndexes = new Set<number>();

    const getMatches = () =>
      rankFuzzy(indexedChoices, query, ({ choice }) => choice.searchText, maxVisible);

    const render = () => {
      const matches = getMatches();
      const maxIndex = Math.max(0, matches.length - 1);
      cursorIndex = Math.min(cursorIndex, maxIndex);
      clearRenderedLines(renderedLines);
      renderedLines = renderInteractiveMultiSelector(query, matches, cursorIndex, selectedIndexes);
      return matches;
    };

    const finish = (value: number[] | null) => {
      stdin.off("keypress", onKeypress);
      clearRenderedLines(renderedLines);

      if (!wasRaw && stdin.isTTY) {
        stdin.setRawMode(false);
      }

      stdin.pause();
      resolve(value);
    };

    const onKeypress = (input: string, key: readline.Key) => {
      if (key.ctrl && key.name === "c") {
        finish(null);
        return;
      }

      if (key.name === "return") {
        finish([...selectedIndexes]);
        return;
      }

      if (key.name === "up") {
        cursorIndex = Math.max(0, cursorIndex - 1);
        render();
        return;
      }

      if (key.name === "down") {
        cursorIndex += 1;
        render();
        return;
      }

      if (key.name === "space") {
        const matches = getMatches();
        const selected = matches[cursorIndex]?.item.index;

        if (selected !== undefined) {
          if (selectedIndexes.has(selected)) {
            selectedIndexes.delete(selected);
          } else {
            selectedIndexes.add(selected);
          }
          render();
        }
        return;
      }

      if (key.name === "backspace") {
        if (query.length > 0) {
          query = query.slice(0, -1);
          cursorIndex = 0;
          render();
        }
        return;
      }

      if (!key.ctrl && !key.meta && input >= " ") {
        query += input;
        cursorIndex = 0;
        render();
      }
    };

    readline.emitKeypressEvents(stdin);

    if (!wasRaw && stdin.isTTY) {
      stdin.setRawMode(true);
    }

    stdin.resume();
    stdin.on("keypress", onKeypress);
    render();
  });
}

export function parseNumberSelection(input: string, count: number): number[] | null {
  const trimmed = input.trim();

  if (!trimmed) {
    return null;
  }

  const indexes = new Set<number>();

  for (const part of trimmed.split(",")) {
    const range = part.trim();
    const match = /^(\d+)(?:-(\d+))?$/.exec(range);

    if (!match) {
      return null;
    }

    const start = Number.parseInt(match[1], 10);
    const end = match[2] ? Number.parseInt(match[2], 10) : start;

    if (start < 1 || end < start || end > count) {
      return null;
    }

    for (let value = start; value <= end; value += 1) {
      indexes.add(value - 1);
    }
  }

  return [...indexes].sort((a, b) => a - b);
}

export async function selectManyWithSearch(
  choices: SearchChoice[],
  options: { initialPrompt?: string; maxVisible?: number } = {},
): Promise<number[] | null> {
  if (process.stdout.isTTY && process.stdin.isTTY) {
    return selectManyWithSearchTty(choices, { maxVisible: options.maxVisible });
  }

  const { initialPrompt = "Search (or pick numbers/ranges, Enter cancels): ", maxVisible = 12 } =
    options;
  const rl = readlinePromises.createInterface({ input: process.stdin, output: process.stderr });
  const indexedChoices = choices.map((choice, index) => ({ choice, index }));
  let query = "";

  try {
    while (true) {
      const matches = rankFuzzy(
        indexedChoices,
        query,
        ({ choice }) => choice.searchText,
        maxVisible,
      );

      if (matches.length === 0) {
        process.stdout.write(`No matches for "${query}".\n`);
      } else {
        process.stdout.write(`${renderChoices(matches.map((match) => match.item.choice))}\n`);
      }

      const reply = await rl.question(
        query ? `Search "${query}" (text/#,#-#/Enter): ` : initialPrompt,
      );
      const trimmed = reply.trim();

      if (!trimmed) {
        return null;
      }

      const selectedIndexes = parseNumberSelection(trimmed, matches.length);

      if (selectedIndexes) {
        return selectedIndexes.map((index) => matches[index].item.index);
      }

      query = trimmed;
    }
  } finally {
    rl.close();
  }
}

export async function confirmDeletePhrase(message: string): Promise<boolean> {
  const rl = readlinePromises.createInterface({ input: process.stdin, output: process.stderr });

  try {
    const reply = await rl.question(message);
    return reply.trim() === "DELETE";
  } finally {
    rl.close();
  }
}

export async function selectWithSearch(
  choices: SearchChoice[],
  options: { initialPrompt?: string; maxVisible?: number } = {},
): Promise<number | null> {
  if (process.stdout.isTTY && process.stdin.isTTY) {
    return selectWithSearchTty(choices, { maxVisible: options.maxVisible });
  }

  const { initialPrompt = "Search (or pick number, Enter cancels): ", maxVisible = 12 } = options;
  const rl = readlinePromises.createInterface({ input: process.stdin, output: process.stderr });
  const indexedChoices = choices.map((choice, index) => ({ choice, index }));
  let query = "";

  try {
    while (true) {
      const matches = rankFuzzy(
        indexedChoices,
        query,
        ({ choice }) => choice.searchText,
        maxVisible,
      );

      if (matches.length === 0) {
        process.stdout.write(`No matches for "${query}".\n`);
      } else {
        process.stdout.write(`${renderChoices(matches.map((match) => match.item.choice))}\n`);
      }

      const reply = await rl.question(query ? `Search "${query}" (text/#/Enter): ` : initialPrompt);
      const trimmed = reply.trim();

      if (!trimmed) {
        return null;
      }

      const selectedIndex = Number.parseInt(trimmed, 10);

      if (Number.isInteger(selectedIndex)) {
        if (selectedIndex < 1 || selectedIndex > matches.length) {
          process.stderr.write(`Invalid selection: ${trimmed}\n`);
          continue;
        }

        return matches[selectedIndex - 1].item.index;
      }

      query = trimmed;
    }
  } finally {
    rl.close();
  }
}
