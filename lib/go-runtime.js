"use babel";

import {CompositeDisposable} from "atom";

export default {
  environment: null,
  provider: null,
  subscriptions: null,

  activate() {
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.commands.add("atom-workspace", "go-runtime:detect", () => {this.getProvider().detect();}));
  },

  deactivate() {
    this.subscriptions.dispose();
    this.environment = null;
    this.provider = null;
    this.subscriptions = null;
  },

  dispose() {
    if (this.subscriptions) {
      this.subscriptions.dispose();
    }
    this.subscriptions = null;
    this.env = null;
    this.provider = null;
  },

  getProvider() {
    if (this.provider !== undefined && this.provider !== null) {
      return this.provider;
    }
    let GoRuntimeProvider = require("./go-runtime-provider");
    this.provider = new GoRuntimeProvider();
    this.subscriptions.add(this.provider);
    return this.provider;
  },

  provide() {
    return this.getProvider();
  },

  consumeEnvironment(environment) {
    this.environment = environment;
  },
};
