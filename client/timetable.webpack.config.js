module.exports = {
    entry: "./out/timetable.js",
    mode: "production",
    output: {
        path: `${__dirname}/../www/out`,
        filename: "timetable-bundle.js",
    },
    resolve: {
        roots: ["./out"],
    },
};
