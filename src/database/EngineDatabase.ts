import { executeFirst } from "./Database.js";

interface Engine {
  id: number;
  engine: string;
}

export async function getEngine(engine: string) {
  return executeFirst<Engine>(
    "SELECT [id], [engine] FROM [engines] WHERE [engine] = @engine",
    { engine },
  );
}
