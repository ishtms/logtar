const fs = require("node:fs/promises");
const path = require("node:path");

const { LogConfig } = require("./config/log-config");
const { LogLevel } = require("./utils/log-level");
const { RollingTimeOptions } = require("./utils/rolling-options");
const { check_and_create_dir } = require("./utils/helpers");

class Logger {
    /**
     * @type {LogConfig}
     */
    #config;

    /**
     * @type {fs.FileHandle}
     */
    #log_file_handle;

    /**
     * @param {LogLevel} log_level
     */
    constructor(log_config) {
        log_config = log_config || LogConfig.with_defaults();
        LogConfig.assert(log_config);
        this.#config = log_config;
        this.#init();
    }

    #method_cache = {};

    #init() {
        process.on("exit", this.#setup_for_process_exit.bind(this));
        process.on("SIGINT", this.#setup_for_process_exit.bind(this));
        process.on("SIGTERM", this.#setup_for_process_exit.bind(this));
        // you can't catch SIGKILL
        //process.on("SIGKILL", this.#setup_for_process_exit.bind(this));
    }

    async init() {
          const log_dir_path = check_and_create_dir("logs")

          const file_name = this.#config.file_prefix + new Date().toISOString().replace(/\..+/, "") + ".log";
          this.#log_file_handle = await fs.open(path.join(log_dir_path, file_name), "a+");
    }

    async #setup_for_process_exit(signal) {
        if (this.#log_file_handle.fd <= 0) return;

        this.critical(`Logger shutting down. Received signal: ${signal}`);
        await this.#log_file_handle.sync();
        await this.#log_file_handle.close();
        process.exit();
    }

    /**
     * @returns {Logger} A new instance of Logger with default config.
     */
    static with_defaults() {
        return new Logger();
    }

    /**
     *
     * @param {LogConfig} log_config
     * @returns {Logger} A new instance of Logger with the given config.
     */
    static with_config(log_config) {
        return new Logger(log_config);
    }

    get_log_caller() {
        if (this.#method_cache.hasOwnProperty(this.get_log_caller.name)) {
            return this.#method_cache[this.get_log_caller.name];
        }
        
        const error = {};
        Error.captureStackTrace(error);
        const callerFrame = error.stack.split("\n")[4];
        const parts = /\s+at\s+(.*)\s+\((.*):(\d+):(\d+)\)/.exec(callerFrame);

        if (parts && parts.length >= 5) {
            const currentFunction = parts[1];
            const currentFile = parts[2];
            const currentLine = parts[3];

            return (this.#method_cache[
                this.get_log_caller.name
            ] = `${currentFile}:${currentLine} ${currentFunction}()`);
        }

        return null;
    }

    /**
     * @param {string} message
     * @param {number} log_level
     */
    async #log(message, log_level) {
        if (log_level < this.#config.level || !this.#log_file_handle.fd) {
            return;
        }

        const log_message = `[${new Date().toISOString()}] [${LogLevel.to_string(
            log_level
        )}]: ${this.get_log_caller()} ${message}\n`;
        await this.#log_file_handle.write(log_message);
    }

    /**
     * @param {string} message
     */
    debug(message) {
        this.#log(message, LogLevel.Debug);
    }

    /**
     * @param {string} message
     */
    info(message) {
        this.#log(message, LogLevel.Info);
    }

    /**
     * @param {string} message
     */
    warn(message) {
        this.#log(message, LogLevel.Warn);
    }

    /**
     * @param {string} message
     */
    error(message) {
        this.#log(message, LogLevel.Error);
    }

    /**
     * @param {string} message
     */
    critical(message) {
        this.#log(message, LogLevel.Critical);
    }

    /** Getters */

    /**
     * @returns {LogLevel} The current log level.
     */
    get level() {
        return this.#config.level;
    }

    /**
     * @returns {string} The log file prefix
     */
    get file_prefix() {
        return this.#config.file_prefix;
    }

    /**
     * @returns {RollingTimeOptions}
     */
    get time_threshold() {
        return this.#config.rolling_config.time_threshold;
    }

    /**
     * @returns {RollingSizeOptions}
     */
    get size_threshold() {
        return this.#config.rolling_config.size_threshold;
    }
}


module.exports = { Logger };
