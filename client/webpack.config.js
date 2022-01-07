const path = require('path')
const htmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    entry:{path:path.join(__dirname,'./src/app.ts')},
    output:{
        path:path.join(__dirname,'./dist'),
        filename:'bundle.js'
    },
    module:{
        rules:[
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
            },
            {test:/.css$/,use:['style-loader','css-loader']}
        ]
    },
    resolve: {   // 需要打包的文件后缀
        extensions: [".tsx", ".ts", ".js"]
    },
    // plugins:[
    //     new htmlWebpackPlugin({
    //         template:path.join(__dirname,'./src/index.html'),
    //         filename:'index.html'
    //     })
    // ],
}