class LogLevel {
    static Debug = 0;
    static Info = 1;
    static Warn = 2;
    static Error = 3;
    static Critical = 4;

    static assert(log_level) {
        if (![LogLevel.Debug, LogLevel.Info, LogLevel.Warn, LogLevel.Error, LogLevel.Critical].includes(log_level)) {
            throw new Error(
                `log_level must be an instance of LogLevel. Unsupported param ${JSON.stringify(log_level)}`
            );
        }
    }
}

class Logger {
    #level = LogLevel.Info;

    /**
     * Set the log level for the logger. This will determine which log messages are displayed.
     * If the log level is set to `LogLevel.Debug`, all log messages having the value `LogLevel.Debug`, `LogLevel.Info`, `LogLevel.Warn`,
     * `LogLevel.Error`, `LogLevel.Critical` will be displayed.
     *
     * If the log level is set to `LogLevel.Error`, all log messages having the value `LogLevel.Error`, `LogLevel.Critical` will be displayed.
     *
     * Example
     * ```js
     * const logger = new Logger(LogLevel.Debug);
     * ```
     *
     * @param {LogLevel} log_level Should be of type LogLevel. Do not use integers directly, to make sure the code works fine even after
     * the internals are changed.
     */
    constructor(log_level) {
        // only set/check the log level if the client has provided it
        // otherwise use the set defaults above, i.e `LogLevel.Info`
        if (arguments.length > 0) {
            LogLevel.assert(log_level);
            this.#level = log_level;
        }
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
        return this.#level;
    }
}

module.exports = {
    Logger,
    LogLevel
}