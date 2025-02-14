module.exports = {
    entry: "./out/geoindex.js",
    mode: "production",
    output: {
        path: `${__dirname}/../www/out`,
        filename: "geobundle.js",
    },
    resolve: {
        roots: ["./out"],
    },
};
