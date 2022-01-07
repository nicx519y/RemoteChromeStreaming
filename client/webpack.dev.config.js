const path = require('path')
const htmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    entry:{
        index:path.join(__dirname,'./src/app.ts')
    },
    output:{
        publicPath: '/',
        filename:'[name].js'
    },
    module:{
        rules:[
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use:['style-loader','css-loader'],
                exclude: /node_modules/,
            }
        ]
    },
    resolve: {   // 需要打包的文件后缀
        extensions: [".tsx", ".ts", ".js"]
    },
    plugins:[
        new htmlWebpackPlugin({
            template:path.join(__dirname,'./src/index.html'),
            filename:'index.html'
        })
    ],
    devServer: {
        host: '127.0.0.1',
        port: 8000,
    }
}