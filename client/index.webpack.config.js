module.exports = {
    entry: "./out/index.js",
    mode: "production",
    output: {
        path: `${__dirname}/../www/out`,
        filename: "index-bundle.js",
    },
    resolve: {
        roots: ["./out"],
    },
};
