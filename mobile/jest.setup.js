/* eslint-env jest */

// React 19 test-renderer createRoot compatibility shim for React Native Testing Library
const TestRenderer = require("react-test-renderer");

function attachQueries(node) {
  if (!node || typeof node !== "object") return;
  if (!node.queryAll) {
    node.queryAll = function (predicate, options = {}) {
      if (!this.findAll) return [];
      try {
        const matches = this.findAll(predicate);
        if (options.matchDeepestOnly) {
          return matches.filter(
            (m) => !matches.some((other) => other !== m && other.findAll && other.findAll((sub) => sub === m).length > 0)
          );
        }
        return matches;
      } catch (e) {
        return [];
      }
    };
  }
}

if (!TestRenderer.createRoot) {
  TestRenderer.createRoot = function () {
    let instance = null;
    return {
      render(element) {
        instance = TestRenderer.create(element);
      },
      unmount() {
        if (instance) instance.unmount();
      },
      get container() {
        if (!instance) {
          return {
            toJSON: () => null,
            children: [],
          };
        }
        const root = instance.root;
        if (root) {
          root.toJSON = () => instance.toJSON();
          attachQueries(root);
        }
        return root;
      },
    };
  };
}

// Mock @expo/vector-icons
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Ionicons: (props) => React.createElement(Text, props, "Icon"),
    MaterialIcons: (props) => React.createElement(Text, props, "Icon"),
    MaterialCommunityIcons: (props) => React.createElement(Text, props, "Icon"),
    FontAwesome: (props) => React.createElement(Text, props, "Icon"),
    Feather: (props) => React.createElement(Text, props, "Icon"),
  };
});

// Mock expo-font
jest.mock("expo-font", () => ({
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(() => Promise.resolve()),
  useFonts: jest.fn(() => [true, null]),
}));

// Mock expo-constants
jest.mock("expo-constants", () => ({
  expoConfig: {
    extra: {},
  },
  manifest: {},
}));

// Mock react-native-reanimated
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => {};
  return Reanimated;
});
