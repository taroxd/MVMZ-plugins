//=============================================================================
// i18n.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Module for i18n.
 * @author taroxd
 *
 * @param Default Locale
 * @desc The language used when the language detected is not supported.
 * @default en-US
 *
 * @param Resource Folder
 * @desc The folder where resource files are put in.
 * @default data/i18n
 *
 * @help
 *
 * Prefix any string in the MV/MZ editor with "__ " to enable i18n for it.
 *
 * Plugin Command:
 *   i18n en-US      # set language to en-US
 *
 * @command i18n
 * @text Set language
 * @desc Set the gameplay language
 *
 * @arg language
 * @type string
 * @text language
 * @desc The language code (e.g. en-US)
 */

window.i18n = function() {

    var parameters = PluginManager.parameters('i18n');
    var defaultLocale = parameters['Default Locale'];
    var supportedLocale = parameters['Supported Locale'];
    var resourceFolder = parameters['Resource Folder'];

    function i18n(string) {
        return (i18n[i18n.language] || {})[string] || string;
    }

    Object.defineProperty(i18n, 'language', {
        get: function() { return i18n._language; },
        set: function(lang) {
            if (lang == null) lang = navigator.language;
            lang = lang.substr(0, 3).toLowerCase() + lang.substr(3).toUpperCase();
            loadI18nResources(lang,
                function() { i18n._language = lang; },
                function() { i18n._language = defaultLocale; }
            );
        }
    });

    function loadI18nResources(language, onload, onerror) {
        if (i18n[language]) return onload();
        var xhr = new XMLHttpRequest();
        var url = resourceFolder + '/' + language + '.json';
        xhr.open('GET', url);
        xhr.overrideMimeType('application/json');
        xhr.onload = function() {
            if (xhr.status < 400) {
                i18n[language] = JSON.parse(xhr.responseText);
                onload();
            }
        };
        xhr.onerror = onerror;
        xhr.send();
    };

    function overrideObj(obj) {
        if (obj == null) return obj;
        Object.keys(obj).forEach(function(key) {
            var value = obj[key];
            switch(typeof value) {
            case 'string':
                if (value.startsWith('__ ')) {
                    value = value.substr(3);
                    Object.defineProperty(obj, key, {
                        get: function() { return i18n(value); },
                        set: function(v) { value = v; },
                        enumerable: true,
                        configurable: true
                    });
                }
                break;
            case 'object':
                overrideObj(value);
                break;
            }
        });
        return obj;
    }

    // override method
    DataManager.loadDataFile = function(name, src) {
        var xhr = new XMLHttpRequest();
        var url = 'data/' + src;
        xhr.open('GET', url);
        xhr.overrideMimeType('application/json');
        xhr.onload = function() {
            if (xhr.status < 400) {
                window[name] = overrideObj(JSON.parse(xhr.responseText));
                DataManager.onLoad(window[name]);
            }
        };
        xhr.onerror = function() {
            DataManager._errorUrl = DataManager._errorUrl || url;
        };
        window[name] = null;
        xhr.send();
    };

    Object.defineProperty(ConfigManager, 'language', {
        get: function() { return this._language; },
        set: function(lang) {
            this._language = lang;
            i18n.language = lang;
        },
        configurable: true
    });

    var makeData = ConfigManager.makeData;
    ConfigManager.makeData = function() {
        var config = makeData.call(this);
        config.language = this.language;
        return config;
    };

    var applyData = ConfigManager.applyData;
    ConfigManager.applyData = function(config) {
        applyData.call(this, config);
        this.language = config.language;
    };

    var pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        pluginCommand.call(this, command, args);
        if (command === 'i18n') {
            ConfigManager.language = args[0];
            ConfigManager.save();
        }
    };

    return i18n;
}();
