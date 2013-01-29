nodejs-earlybird
================

Bootstraps the nodejs application binding the controllers and models to the global app.

See https://github.com/jimib/nodejs-basejump for example or use.

NOTE:

Each module now takes 2 arguments, app and next. To allow backward compatibility a module that returns the 'next' method is implementing an asynchronous callback and the earlybird library waits for it to complete before loading the rest of the application.