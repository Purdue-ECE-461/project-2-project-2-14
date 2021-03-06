// file to keep all the global variables used by the server
module.exports = {
    BUCKET_NAME: "ece461project2-333702.appspot.com",
    USER_KEY: "users",
    PACKAGE_KEY: "packages",
    LOG_KEY: "logs",
    AUTH_KEY: "auth",
    TOKEN_BYTES: 16,
    DELETE_COLLECTION_BATCH: 50,
    PACKAGE_ID_BYTES: 4,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    OFFSET_SIZE: 5,
    ADMIN_USERNAME: "Alfalfa",
    TMP_FOLDER: "tmp",
    BUS_FACTOR_SCORE: "BusFactor",
    CORRECTNESS_SCORE: "Correctness",
    RAMP_UP_SCORE: "RampUp",
    RESPONSIVE_MAINTAINER_SCORE: "ResponsiveMaintainer",
    LICENSE_SCORE: "LicenseScore",
    GOOD_PINNING_SCORE: "GoodPinningPractice",
    MIN_SCORE: 0.5,
    MAX_REQUESTS_PER_TOKEN: 1000,
    TOKEN_TTL: 10 * 60 * 60 * 1000,
    LOG_BUFFER_SIZE: 30,
    LOG_FOLDER: "debug_logs",
};
