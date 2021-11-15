import os
import logging
from enum import Enum


class LogLevel(Enum):
    SILENT = 0
    INFO = 1
    DEBUG = 2


class Log:
    level = LogLevel.SILENT
    levelTranslate = {
        LogLevel.SILENT: logging.NOTSET,
        LogLevel.INFO: logging.INFO,
        LogLevel.DEBUG: logging.DEBUG
    }

    @staticmethod
    def init():
        # Set log level from environment if it exists
        # if ('LOG_LEVEL' in os.environ):
        #     lvl = os.environ['LOG_LEVEL']
        #     if (lvl == '1'):
        #         Log.level = LogLevel.INFO
        #     elif (lvl == '2'):
        #         Log.level = LogLevel.DEBUG

        # # Set log file from environment if it exists
        # if ('LOG_FILE' in os.environ):
        #     Log.logFile = os.environ['LOG_FILE']

        Log.logFile = "./log.txt"
        Log.level = LogLevel.SILENT
        # Configue the logger
        logging.basicConfig(filename=Log.logFile, format='%(asctime)s %(levelname)s: %(message)s',
                            level=Log.levelTranslate[Log.level])
        Log.debug('Logger configured')

    @staticmethod
    def info(msg):
        logging.info(msg)

    @staticmethod
    def debug(msg):
        logging.debug(msg)

    @staticmethod
    def warning(msg):
        logging.warning(msg)

    @staticmethod
    def error(msg):
        logging.error(msg)
