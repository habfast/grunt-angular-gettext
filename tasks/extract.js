var Extractor = require('angular-gettext-tools').Extractor;
var Po = require('pofile');
var fs = require('fs');

module.exports = function (grunt) {
    grunt.registerMultiTask('nggettext_extract', 'Extract strings from views', function () {

        var options = this.options();

        if (options.extensions) {
            for (var extension in options.extensions) {
                var strategy = options.extensions[extension];
                if (!Extractor.isValidStrategy(strategy)) {
                    grunt.log.error("Invalid strategy " + strategy + " for extension " + extension);
                }
            }
        }

        this.files.forEach(function (file) {
            var extractor = new Extractor(options);
            var failed = false;

            file.src.forEach(function (filename) {
                grunt.log.debug("Extracting " + filename);
                try {
                    extractor.parse(filename, grunt.file.read(filename));
                } catch (e) {
                    console.log(e);
                    grunt.log.error(e.message);
                    failed = true;
                }
            });

            if (!failed) {
                var catalog = Po.parse(fs.readFileSync(file.dest, 'utf-8'));

                console.log(failed);

                catalog.headers = {
                    'Content-Type': 'text/plain; charset=UTF-8',
                    'Content-Transfer-Encoding': '8bit',
                    'Project-Id-Version': ''
                };

                for (var index in catalog.items) {
                    delete extractor.strings[catalog.items[index].msgid];
                }

                for (var msgstr in extractor.strings) {
                    var msg = extractor.strings[msgstr];
                    var contexts = Object.keys(msg).sort();
                    for (var i = 0; i < contexts.length; i++) {
                        catalog.items.push(msg[contexts[i]]);
                    }
                }

                catalog.items.sort(function (a, b) {
                    return a.msgid.localeCompare(b.msgid);
                });

                extractor.options.postProcess(catalog);

                grunt.file.write(file.dest, catalog.toString());
            }
        });
    });
};
