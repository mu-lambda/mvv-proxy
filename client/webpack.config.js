module.exports = {
    entry: { 
        index: "./out/index.js",
        timetable: "./out/timetable.js",
    },
    mode: "production",
    output: {
        path: `${__dirname}/../www/out`,
        filename: "[name]-bundle.js",
    },
    resolve: {
        roots: ["./out"],
    },
};
