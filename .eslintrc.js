module.exports = {
    extends: ['standard', 'standard-react'],
    plugins: ['prettier'],
    parser: 'babel-eslint',
    rules: {
        'max-len': ['warn', { code: 150 }],
        'func-names': 'off',
        indent: [
            'error',
            4,
            {
                SwitchCase: 1
            }
        ],
        'no-plusplus': 'off',
        'import/no-named-as-default': 'off',
        'import/prefer-default-export': 'off',
        'react/jsx-filename-extension': 'off',
        'react/jsx-indent': ['error', 4],
        'react/jsx-indent-props': ['error', 4],
        'jsx-quotes': ['error', 'prefer-double'],
        semi: ['error', 'always']
    }
};
