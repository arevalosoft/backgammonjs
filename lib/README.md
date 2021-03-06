# backgammon.js-lib

The `backgammon.js-lib` library, used by both `backgammon.js-client` and `backgammon.js-server` packages, provides the following functionality:

- Object oriented model of classes modeling real-world and objects and abstract notions ([model.js](model.js) file);
- Message IDs shared by client and server communication objects ([comm.js](comm.js) file);
- Base `Rule` class describing a variant of the game ([rules/rule.js](rules/rule.js) file);
- Sample rules for two variants of the game: [rules/RuleBgCasual.js](rules/RuleBgCasual.js) and [rules/RuleBgGulbara.js](rules/RuleBgGulbara.js).

## The whole picture

To get an idea how the library package fits in the whole picture, look at
[project documentation](../docs/README.md) containing details on design and architecture.

## Library reference

Check out [library reference](https://cdn.rawgit.com/quasoft/backgammonjs/master/docs/backgammon.js-lib/0.0.1/index.html) and [class diagrams in documentation](../docs/README.md#model-classes) for more details on available classes.

To recompile library reference, using [jsdoc](http://usejsdoc.org/), execute the following:

```
cd lib
npm build:docs
```

## Other documents:

- [`Project README`](../README.md)
- [`Project Architecture`](../doc/README.md)
- Client application: [`backgammon.js-client`](../app/browser/README.md)
- Server application: [`backgammon.js-server`](../app/server/README.md)
