module.exports = {
    entry: "./out/index.js",
    mode: "production",
    output: {
        path: `${__dirname}/../www/out`,
        filename: "bundle.js",
    },
    resolve: {
        roots: ["./out"],
    },
};
