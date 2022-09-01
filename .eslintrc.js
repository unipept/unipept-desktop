module.exports = {
    root: true,
    env: {
        node: true,
    },
    "extends": [
        "plugin:vue/essential",
        "eslint:recommended",
        "@vue/typescript/recommended",
    ],
    parserOptions: {
        ecmaVersion: 2020,
    },
    rules: {
        "quotes": ["error", "double"],
        "indent": ["error", 4],
        "max-len": ["warn", { "code": 120 }],
        "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
        "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
        "no-async-promise-executor": "off",
        "no-undef": "off",
        "require-atomic-updates": "off",
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/no-inferrable-types": "warn",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "vue/no-unused-vars": "off",
        "vue/valid-v-slot": "off",
    },
};
