import js from "@eslint/js";
import stylisticJs from "@stylistic/eslint-plugin-js";

export default [
	js.configs.recommended,
	{
		plugins: {
			"@stylistic/js": stylisticJs
		},
		rules: {
			"consistent-return": "error",
			"dot-notation": "error",
			"eqeqeq": "error",
			"guard-for-in": "error",
			"no-array-constructor": "error",
			"no-bitwise": "error",
			"no-empty": "error",
			"no-empty-function": "error",
			"no-empty-static-block": "error",
			"no-eq-null": "error",
			"no-eval": "error",
			"no-extend-native": "error",
			"no-extra-bind": "error",
			"no-implicit-coercion": "error",
			"no-implicit-globals": "error",
			"no-implied-eval": "error",
			"no-invalid-this": "error",
			"no-iterator": "error",
			"no-label-var": "error",
			"no-lone-blocks": "error",
			"no-lonely-if": "error",
			"no-loop-func": "error",
			"no-multi-assign": "error",
			"no-new": "error",
			"no-new-func": "error",
			"no-new-wrappers": "error",
			"no-object-constructor": "error",
			"no-octal-escape": "error",
			"no-proto": "error",
			"no-return-assign": "error",
			"no-script-url": "error",
			"no-sequences": "error",
			"no-undefined": "error",
			"no-unneeded-ternary": "error",
			"no-unused-expressions": "error",
			"no-useless-assignment": "error",
			"no-useless-call": "error",
			"no-useless-computed-key": "error",
			"no-useless-concat": "error",
			"no-useless-constructor": "error",
			"no-useless-escape": "error",
			"no-useless-rename": "error",
			"no-useless-return": "error",
			"no-void": "error",
			"no-warning-comments": "error",
			"one-var": ["error", "never"],
			"operator-assignment": ["error", "always"],
			"radix": "error",
			"@stylistic/js/dot-location": ["error", "property"],
			"@stylistic/js/eol-last": "error",
			"@stylistic/js/no-extra-semi": "error",
			"@stylistic/js/no-floating-decimal": "error",
			"@stylistic/js/no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
			"@stylistic/js/no-tabs": ["error", { allowIndentationTabs: true }],
			"@stylistic/js/no-trailing-spaces": "error",
			"@stylistic/js/operator-linebreak": ["error", "before"],
			"@stylistic/js/quotes": ["error", "double", { avoidEscape: true }],
			"@stylistic/js/semi": "error",
			"@stylistic/js/space-infix-ops": "error",
			// "@stylistic/js/space-unary-ops": "error"  // yields strange false positive on command line but not in VS Code
			"@stylistic/js/spaced-comment": ["error", "always", { block: { balanced: true, exceptions: ["*"] } }]
		}
	},
	{
		files: ["package/**/*.js"],
		languageOptions: {
			ecmaVersion: 5,
			globals: {
				"options"                : "readonly",
				"workspace"              : "readonly",
				"KWin"                   : "readonly",
				"print"                  : "readonly",
				"readConfig"             : "readonly",
				"registerScreenEdge"     : "readonly",
				"registerShortcut"       : "readonly",
				"assert"                 : "readonly",
				"assertTrue"             : "readonly",
				"assertFalse"            : "readonly",
				"assertEquals"           : "readonly",
				"assertNull"             : "readonly",
				"assertNotNull"          : "readonly",
				"callDBus"               : "readonly",
				"registerUserActionsMenu": "readonly"
			},
			sourceType: "commonjs"
		}
	}
];
