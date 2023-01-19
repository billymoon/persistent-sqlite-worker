# persistent-sqlite-worker

After seeing this blog post https://jlongster.com/future-sql-web I wanted to test out a persisted and performant sqlite database on the front end.

The goal of this repo is to create a simple wrapper module, and to document the configuration and how to use in a next.js app.

The original author published a proof of concept to https://github.com/jlongster/absurd-sql which includes modifications to SQLite specifically allowing filesystem abstractions required to connect to innodb in the browser, so requires a custom compiled sqlite in web assembly. It has been a while since that code was published, and there are a couple of features added to sqlite that are lacking in the original repo. I [found a fork](https://www.npmjs.com/package/@aphro/absurd-sql) with an updated SQLite that includes [JSON functions](https://www.sqlite.org/json1.html) and recursive queries.

The reason these features are important to me, is that it allows for storing arbitrary data structures, and traversing them so it becomes suitable to store graph data and query it from within SQLite.

## How it works

There are two javascript files, and a sqlite wasm binary file required to hook everything up. The sqlite wasm should be served up from a web app, which can import the main javascript file, which in turn imports and initialises the second javascript file as a service worker.

By running in a service worker, the main thread is not blocked by long running sql queries. By running as wasm, high performance is achieved. The wrapper exposes a convenient api that abstracts the complexity of messaging the worker.

## Quick start

Copy sqlite-wasm.wasm to a public folder and serve from `/` of your web app. Then import the sql api from `src/persistent-sqlite-worker` into your app...

    import sql from "./src/persistent-sqlite-worker";

You can start executing sql right away.

    sql`create table if not exists docs (id integer primary key autoincrement, value text);`.run()
    sql`insert into docs values (null, "doc one");`.run()
    sql`insert into docs values (null, "doc two");`.run()
    sql`select * from docs;`.last().then(console.log)
    // ==> [{"id":1,"value":"doc one"}, {"id":2,"value":"doc two"}]

## API

### Default Export

The wrapper is exposed as a single default export. Call this wrapper function as a string template or as a regular function passing a query into it and it will return methods to bind data, and execute the query.

    import sql from "./src/persistent-sqlite-worker";

    const addUserQuery = `insert into docs values (null, ?)`
    const addUserStatement = sql(addUserQuery)
    const boundStatement = addUserStatement.bind(["Some Guy"])
    await boundStatement.run()

... or more succinctly as ...

    await sql`insert into docs values (null, ?)`.bind(["Some Guy"]).run()
    
You can pass multiple statements which will all be run in sequence. Each bind argument maps to each statement. In this example, we run the preceding statements discarding any return value, and execute and return only the last statement by calling the `.last()` method.

    await sql`insert into docs values (null, ?); select * from docs where id > ?;`.bind(["Some Guy"], [1]).last()

You can bind params as an array that maps to instances of `?` in the query, or an object that maps to instanced of named variables in the query as detailed in [the sql.js documentation](https://sql.js.org/documentation/Statement.html#%255B%2522bind%2522%255D).

Along with `.run()` and `.last()`, there is also `.all()` which returns an array of results of each executed statement.

Both `.last()` and `.all()` accept options as an argument to return column names, and to return rows as objects or arrays...

    await sql`select * from docs;`.last({ withColumns: true, asArray: true })
    // ==> {"columns":["id","value"],"rows":[[1,"doc one"],[2,"doc two"]]}
