import process from "node:process";
import { Box, render, renderToString, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { useMemo, useState } from "react";
import type { ReactElement } from "react";
import { rankFuzzy } from "../lib/fuzzy.js";
import type {
  RecentTextPart,
  RootSession,
  SessionCounts,
  SessionDetails,
} from "../services/sessions.js";
import { sanitizeInline, truncateInline } from "./format.js";

export interface SearchChoice {
  label: string;
  detail?: string;
  searchText: string;
}

function sectionTitle(title: string): ReactElement {
  return (
    <Box marginTop={1}>
      <Text bold color="cyan">
        {title}
      </Text>
    </Box>
  );
}

function line(label: string, value: string): ReactElement {
  return (
    <Text>
      <Text dimColor>{label}: </Text>
      {value}
    </Text>
  );
}

export function renderListInk(rows: RootSession[]): string {
  return renderToString(
    <Box flexDirection="column">
      <Text bold color="cyan">
        OpenCode Sessions
      </Text>
      <Text dimColor>{rows.length} root session(s)</Text>
      {rows.length === 0 ? (
        <Box marginTop={1}>
          <Text dimColor>No sessions found.</Text>
        </Box>
      ) : (
        rows.map((row, index) => (
          <Box flexDirection="column" marginTop={1} key={row.sessionId}>
            <Text bold>
              {index + 1}. {sanitizeInline(row.title)}
            </Text>
            {line("id", row.sessionId.slice(0, 20))}
            {line("updated", row.updated)}
            {line("directory", row.directory)}
          </Box>
        ))
      )}
    </Box>,
  );
}

function recentLine(part: RecentTextPart): ReactElement {
  return (
    <Box key={`${part.created}-${part.role}`} flexDirection="column" marginTop={1}>
      {line("created", part.created)}
      {line("role", part.role)}
      {line("text", truncateInline(part.text, Math.max(32, (process.stdout.columns || 120) - 28)))}
    </Box>
  );
}

export function renderViewInk(
  session: SessionDetails,
  counts: SessionCounts,
  recentParts: RecentTextPart[],
): string {
  return renderToString(
    <Box flexDirection="column">
      <Text bold color="cyan">
        Session Details
      </Text>
      <Box marginTop={1} flexDirection="column">
        {line("id", session.sessionId)}
        {line("directory", session.directory || "<none>")}
        {line("project", session.projectName || "<none>")}
        {line("worktree", session.worktree || "<none>")}
        {line("parent", session.parentId || "<root>")}
        {line("share", session.shareUrl || "<none>")}
        {line("created", session.created)}
        {line("updated", session.updated)}
        {line("archived", session.archived || "<no>")}
      </Box>

      {sectionTitle("Activity")}
      <Box marginTop={1} flexDirection="column">
        {line("title", session.title)}
        {line("messages", String(counts.messages))}
        {line("parts", String(counts.parts))}
        {line("todos", String(counts.todos))}
      </Box>

      {sectionTitle("Recent Text Parts")}
      {recentParts.length === 0 ? (
        <Box marginTop={1}>
          <Text dimColor>No recent text parts.</Text>
        </Box>
      ) : (
        <Box marginTop={1} flexDirection="column">
          {recentParts.map((part) => recentLine(part))}
        </Box>
      )}
    </Box>,
  );
}

export function renderNewSessionInk(title: string, prompt: string): string {
  return renderToString(
    <Box flexDirection="column">
      <Text bold color="cyan">
        Starting New Session
      </Text>
      <Box marginTop={1} flexDirection="column">
        {line("title", title)}
        {line("prompt", prompt)}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Launching OpenCode TUI...</Text>
      </Box>
    </Box>,
  );
}

interface SearchPickerProps {
  choices: Array<{ choice: SearchChoice; index: number }>;
  maxVisible: number;
  onDone: (value: number | null) => void;
}

function SearchPicker({ choices, maxVisible, onDone }: SearchPickerProps): ReactElement {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);

  const matches = useMemo(() => {
    if (!query.trim()) {
      return choices.slice(0, maxVisible).map((row) => ({ item: row, score: 0 }));
    }

    return rankFuzzy(choices, query, (row) => row.choice.searchText, maxVisible);
  }, [choices, maxVisible, query]);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelected((value) => Math.max(0, value - 1));
      return;
    }

    if (key.downArrow) {
      setSelected((value) => Math.min(Math.max(0, matches.length - 1), value + 1));
      return;
    }

    if (key.escape || (key.ctrl && input === "c")) {
      onDone(null);
      return;
    }

    if (key.return) {
      if (matches.length === 0) {
        onDone(null);
        return;
      }

      onDone(matches[selected].item.index);
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        Select Session
      </Text>
      <Text dimColor>Type to filter, ↑/↓ to move, Enter to pick, Esc to cancel.</Text>
      <Box marginTop={1}>
        <Text color="green">Search: </Text>
        <TextInput
          value={query}
          onChange={(value) => {
            setQuery(value);
            setSelected(0);
          }}
        />
      </Box>
      <Box marginTop={1} flexDirection="column">
        {matches.length === 0 ? (
          <Text dimColor>No matches.</Text>
        ) : (
          matches.map((match, index) => (
            <Text
              key={`${match.item.index}-${match.item.choice.label}`}
              color={index === selected ? "green" : undefined}
            >
              {index === selected ? "›" : " "} {match.item.choice.label}
              {match.item.choice.detail ? (
                <Text dimColor>{`  ${match.item.choice.detail}`}</Text>
              ) : null}
            </Text>
          ))
        )}
      </Box>
    </Box>
  );
}

interface ConfirmProps {
  message: string;
  onDone: (value: boolean) => void;
}

function ConfirmPrompt({ message, onDone }: ConfirmProps): ReactElement {
  useInput((input, key) => {
    if (input.toLowerCase() === "y") {
      onDone(true);
      return;
    }

    if (input.toLowerCase() === "n" || key.escape || (key.ctrl && input === "c") || key.return) {
      onDone(false);
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold color="yellow">
        Confirmation
      </Text>
      <Box marginTop={1}>
        <Text>{message}</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Press y to confirm, n/Enter/Esc to cancel.</Text>
      </Box>
    </Box>
  );
}

export async function selectWithSearchInk(
  choices: SearchChoice[],
  options: { maxVisible?: number } = {},
): Promise<number | null> {
  const { maxVisible = 12 } = options;

  return new Promise<number | null>((resolve) => {
    const indexedChoices = choices.map((choice, index) => ({ choice, index }));
    let settled = false;
    const instance = render(
      <SearchPicker
        choices={indexedChoices}
        maxVisible={maxVisible}
        onDone={(value) => {
          if (settled) {
            return;
          }

          settled = true;
          instance.unmount();
          resolve(value);
        }}
      />,
    );
  });
}

export async function confirmInk(message: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    let settled = false;
    const instance = render(
      <ConfirmPrompt
        message={message}
        onDone={(value) => {
          if (settled) {
            return;
          }

          settled = true;
          instance.unmount();
          resolve(value);
        }}
      />,
    );
  });
}
