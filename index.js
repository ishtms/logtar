const path = require("node:path");
const fs = require("node:fs");

class RollingConfig {
    static Minutely = 0;
    static Hourly = 1;
    static Daily = 2;
    static Weekly = 3;
    static Monthly = 4;
    static Yearly = 5;

    static assert(rolling_config) {
        if (
            ![this.Minutely, this.Hourly, this.Daily, this.Weekly, this.Monthly, this.Yearly].includes(rolling_config)
        ) {
            throw new Error(
                `rolling_config must be an instance of RollingConfig. Unsupported param ${JSON.stringify(
                    rolling_config
                )}`
            );
        }
    }

    /**
     * @param {string} time_in_string The time in string format. Supported values are m, h, d, w, m, y
     */
    static from_initials(time_in_string) {
        if (typeof time_in_string !== "string") {
            throw new Error(`time_in_string must be a string. Unsupported param ${JSON.stringify(time_in_string)}`);
        }

        switch (time_in_string.toLowerCase().trim()) {
            case "m":
                return this.Minutely;
            case "h":
                return this.Hourly;
            case "d":
                return this.Daily;
            case "w":
                return this.Weekly;
            case "mo":
                return this.Monthly;
            case "y":
                return this.Yearly;
            default:
                throw new Error(`Invalid time_in_string ${time_in_string}. Supported values are m, h, d, w, m, y`);
        }
    }
}

class LogConfig {
    #level = LogLevel.Info;

    // how often should the log file be rolled. rolled means a new file is created after every x minutes/hours/days/weeks/months/years
    #rolling_config = RollingConfig.Hourly;

    // the prefix to be added to every log message
    #file_prefix = "[Logtar]: ";

    // max size of the log file in bytes
    #max_file_size = 5 * 1024 * 1024; // 5 MB

    /**
     * @returns {LogConfig} A new instance of LogConfig with default values.
     */
    static with_defaults() {
        return new LogConfig();
    }

    static from_file(file_path) {
        const file_contents = fs.readFileSync(file_path);
        return LogConfig.#from_json(JSON.parse(file_contents));
    }

    static #from_json(json) {
        let log_config = new LogConfig();
        Object.keys(json).forEach((key) => {
            switch (key) {
                case "level":
                    log_config = log_config.with_log_level(json[key]);
                    break;
                case "rolling_config":
                    log_config = log_config.with_rolling_config(json[key]);
                    break;
                case "file_prefix":
                    log_config = log_config.with_file_prefix(json[key]);
                    break;
                case "max_file_size":
                    log_config = log_config.with_max_file_size(json[key]);
                    break;
            }
        });
        return log_config;
    }

    static assert(log_config) {
        if (arguments.length > 0 && !(log_config instanceof LogConfig)) {
            throw new Error(
                `log_config must be an instance of LogConfig. Unsupported param ${JSON.stringify(log_config)}`
            );
        }
    }

    get level() {
        return this.#level;
    }

    /**
     * @param {LogLevel} log_level The log level to be set.
     * @returns {LogConfig} The current instance of LogConfig.
     * @throws {Error} If the log_level is not an instance of LogLevel.
     */
    with_log_level(log_level) {
        LogLevel.assert(log_level);
        this.#level = log_level;
        return this;
    }

    get rolling_config() {
        return this.#rolling_config;
    }

    /**
     * @param {RollingConfig} rolling_config The rolling config to be set.
     * @returns {LogConfig} The current instance of LogConfig.
     * @throws {Error} If the rolling_config is not an instance of RollingConfig.
     */
    with_rolling_config(rolling_config) {
        RollingConfig.assert(rolling_config);
        this.#rolling_config = rolling_config;
        return this;
    }

    get file_prefix() {
        return this.#file_prefix;
    }

    /**
     * @param {string} file_prefix The file prefix to be set.
     * @returns {LogConfig} The current instance of LogConfig.
     * @throws {Error} If the file_prefix is not a string.
     */
    with_file_prefix(file_prefix) {
        if (typeof file_prefix !== "string") {
            throw new Error(`file_prefix must be a string. Unsupported param ${JSON.stringify(file_prefix)}`);
        }

        this.#file_prefix = file_prefix;
        return this;
    }

    get max_file_size() {
        return this.#max_file_size;
    }

    /**
     * @param {number} max_file_size The max file size to be set, in bytes.
     * @returns {LogConfig} The current instance of LogConfig.
     * @throws {Error} If the max_file_size is invalid.
     */
    with_max_file_size(max_file_size) {
        if (typeof max_file_size !== "number" || max_file_size < 100 || max_file_size === Infinity) {
            throw new Error(
                `max_file_size must be a number greater than 100 bytes. Unsupported param ${JSON.stringify(
                    max_file_size
                )}`
            );
        }
        this.#max_file_size = max_file_size;
        return this;
    }
}

class LogLevel {
    static #Debug = 0;
    static #Info = 1;
    static #Warn = 2;
    static #Error = 3;
    static #Critical = 4;

    static get Debug() {
        return this.#Debug;
    }

    static get Info() {
        return this.#Info;
    }

    static get Warn() {
        return this.#Warn;
    }

    static get Error() {
        return this.#Error;
    }

    static get Critical() {
        return this.#Critical;
    }

    static assert(log_level) {
        if (![this.Debug, this.Info, this.Warn, this.Error, this.Critical].includes(log_level)) {
            throw new Error(
                `log_level must be an instance of LogLevel. Unsupported param ${JSON.stringify(log_level)}`
            );
        }
    }
}

class Logger {
    #config;

    static with_defaults() {
        return Logger.default;
    }

    static with_config(log_config) {
        return new Logger(log_config);
    }

    constructor(log_config) {
        LogConfig.assert(log_config);
        this.#config = log_config;
    }

    static get default() {
        return new Logger();
    }
    /**
     * Get the current log level.
     *
     * @returns {LogLevel} The current log level.
     *
     * const logger = new Logger(LogLevel.Debug);
     * console.log(logger.level); // LogLevel.Debug
     * logger.level = LogLevel.Error; // throws error
     * logger.level = LogLevel.Debug; // works fine
     * logger.level = 0; // throws error
     */
    get level() {
        return this.#config.level;
    }
}

const config = LogConfig.with_defaults()
    .with_file_prefix("Testing")
    .with_log_level(LogLevel.Critical)
    .with_rolling_config(RollingConfig.from_initials("m"))
    .with_max_file_size(1000);

const logger = Logger.with_config(config);
const _config = LogConfig.from_file("config.demo.json");

module.exports = {
    Logger,
    LogLevel,
};
