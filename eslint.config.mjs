import tseslint from '@typescript-eslint/eslint-plugin/use-at-your-own-risk/raw-plugin';

export default [
    {
        ignores: ['out/**', 'node_modules/**'],
    },
    ...tseslint.flatConfigs['flat/recommended'],
    {
        files: ['src/**/*.ts'],
        rules: {
            // Keep compatibility with the extension's existing CommonJS-style code.
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-require-imports': 'off',
            '@typescript-eslint/no-this-alias': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            'no-var': 'off',
            'prefer-const': 'off',
        },
    },
];
