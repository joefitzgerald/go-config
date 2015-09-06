"use babel";

import {GoRuntime} from "../lib/go-runtime";

describe("GoRuntime", () => {
  let environmentMain, environmentService, goruntimeMain, goruntimeService, workspaceElement = null;
  beforeEach(() => {
    runs(() => {
      workspaceElement = atom.views.getView(atom.workspace);
    });
    waitsForPromise(() => {
      return atom.packages.activatePackage("environment").then(pack => {
        environmentMain = pack.mainModule;
      });
    });
    waitsForPromise(() => {
      return atom.packages.activatePackage("go-runtime").then(pack => {
        goruntimeMain = pack.mainModule;
      });
    });
    waitsFor(() => {
      return goruntimeMain.environment !== undefined && goruntimeMain.environment !== null;
    });
  });

  describe("when the go-runtime:detect event is triggered", () => {
    fit("detects installed go runtimes", () => {
      expect(goruntimeMain).toBeDefined();
      expect(goruntimeMain.provider).toBeDefined();

      atom.commands.dispatch(workspaceElement, "go-runtime:detect");
      expect(goruntimeMain.provider).toBeDefined();
    });
  });
});
