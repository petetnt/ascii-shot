module.exports = {
  "parser": "babel-eslint",
  "plugins": ["ava"],
  "extends": ["motley", "plugin:ava/recommended"],
  "rules": {
    "no-console": 0,
    "global-require": 0,
  }
}
