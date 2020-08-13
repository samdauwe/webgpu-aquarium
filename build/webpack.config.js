const fs = require('fs');
const path = require('path');

module.exports = {
    mode: 'production',
    target: 'web',
    context: path.join(__dirname, '../src'),
    entry: {
        app: './main.ts'
    },
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, '../dist')
    },
    resolve: {
        extensions: [ '.ts', '.tsx', '.js' ]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                loader: 'ts-loader',
                options: {
                    transpileOnly: false
                }
            }
        ]
    },
    devtool: 'source-map',
    watchOptions: {
        ignored: ['dist/**/*.js', 'index.html']
    },
    devServer: {
        publicPath: 'dist/'
    },
    node: {
        fs: 'empty',
    },
};