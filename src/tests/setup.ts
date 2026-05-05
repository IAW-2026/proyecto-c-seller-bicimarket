import { vi } from "vitest";

// Silence console.error in tests (inter-app retry logs)
vi.spyOn(console, "error").mockImplementation(() => {});
