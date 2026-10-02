import { createInterface } from "node:readline";

/**
 * Saisie de mots de passe au clavier, sans écho à l'écran : ils ne
 * passent donc ni par la ligne de commande (historique du shell) ni
 * par un fichier.
 *
 * Les lignes lues sont mises en file d'attente plutôt que demandées
 * une par une : sur une entrée redirigée (script, tests), tout le flux
 * arrive d'un coup et les lignes non encore réclamées seraient perdues.
 */

export interface HiddenPrompt {
  ask(question: string): Promise<string>;
  close(): void;
}

export function createHiddenPrompt(): HiddenPrompt {
  const input = process.stdin;
  const output = process.stdout;
  // Hors terminal, readline n'écho rien : il n'y a qu'en TTY qu'il
  // faut couper l'écho des caractères tapés.
  const isTTY = Boolean(input.isTTY);

  const rl = createInterface({ input, output, terminal: isTTY });
  const internal = rl as unknown as { _writeToOutput: (text: string) => void };
  const echo = internal._writeToOutput?.bind(rl);

  const buffered: string[] = [];
  let waiting: { resolve: (line: string) => void; reject: (err: Error) => void } | null =
    null;
  let closed = false;

  rl.on("line", (line) => {
    if (waiting) {
      const pending = waiting;
      waiting = null;
      pending.resolve(line);
    } else {
      buffered.push(line);
    }
  });

  // Entrée fermée avant la réponse (Ctrl+D, flux vide) : sans ce
  // garde-fou l'attente resterait suspendue sans rien dire.
  rl.on("close", () => {
    closed = true;
    if (waiting) {
      const pending = waiting;
      waiting = null;
      pending.reject(new Error("Saisie interrompue."));
    }
  });

  return {
    async ask(question) {
      output.write(question);
      if (isTTY) internal._writeToOutput = () => {};
      try {
        if (buffered.length > 0) return buffered.shift()!.trim();
        if (closed) throw new Error("Saisie interrompue.");
        const line = await new Promise<string>((resolve, reject) => {
          waiting = { resolve, reject };
        });
        return line.trim();
      } finally {
        if (isTTY && echo) internal._writeToOutput = echo;
        output.write("\n");
      }
    },

    close() {
      rl.close();
    },
  };
}
