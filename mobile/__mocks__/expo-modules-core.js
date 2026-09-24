class EventEmitter {
  addListener = jest.fn();
  removeListeners = jest.fn();
  emit = jest.fn();
}

class SharedObject {}

if (!globalThis.expo) {
  globalThis.expo = {
    EventEmitter,
    SharedObject,
    modules: {},
  };
} else {
  globalThis.expo.SharedObject = SharedObject;
}

module.exports = {
  NativeModulesProxy: {},
  EventEmitter,
  Platform: {
    OS: "android",
  },
  requireNativeModule: jest.fn(() => ({})),
  requireOptionalNativeModule: jest.fn(() => null),
  installExpoGlobalPolyfill: jest.fn(),
};
