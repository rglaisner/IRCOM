import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { studentProgressStorageKey } from "@/lib/teacher/progress";
import { scenarioAttemptsStorageKey } from "@/lib/teacher/scenario-attempts";
import { clearPersistedSession } from "@/lib/teacher/reset-session";

const storage = new Map<string, string>();

function installLocalStorageMock(): void {
  const mock: Storage = {
    get length() {
      return storage.size;
    },
    clear() {
      storage.clear();
    },
    getItem(key: string) {
      return storage.get(key) ?? null;
    },
    key(index: number) {
      return [...storage.keys()][index] ?? null;
    },
    removeItem(key: string) {
      storage.delete(key);
    },
    setItem(key: string, value: string) {
      storage.set(key, value);
    },
  };

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: mock,
  });
}

describe("clearPersistedSession", () => {
  beforeEach(() => {
    storage.clear();
    installLocalStorageMock();
  });

  it("clears progress, attempts, and history but keeps language", () => {
    window.localStorage.setItem(studentProgressStorageKey, "{}");
    window.localStorage.setItem(scenarioAttemptsStorageKey, "{}");
    window.localStorage.setItem("ircom-gemini-history:atelier", "[]");
    window.localStorage.setItem("ircom-gemini-history:coach", "[]");
    window.localStorage.setItem("ircom-gemini-language", "en");

    clearPersistedSession();

    assert.equal(window.localStorage.getItem(studentProgressStorageKey), null);
    assert.equal(window.localStorage.getItem(scenarioAttemptsStorageKey), null);
    assert.equal(window.localStorage.getItem("ircom-gemini-history:atelier"), null);
    assert.equal(window.localStorage.getItem("ircom-gemini-history:coach"), null);
    assert.equal(window.localStorage.getItem("ircom-gemini-language"), "en");
  });
});
