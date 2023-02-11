import { SQLiteFS } from "@aphro/absurd-sql";
import IndexedDBBackend from "@aphro/absurd-sql/dist/indexeddb-backend";

const dbPromise = (async () => {
  const initSqlJs = await import("@aphro/sql.js").then(
    (importedModule) => importedModule.default
  );
  const SQL = await initSqlJs({ locateFile: (file) => "/sql-wasm.wasm" });
  const sqlFS = new SQLiteFS(SQL.FS, new IndexedDBBackend());
  SQL.register_for_idb(sqlFS);

  SQL.FS.mkdir("/sql");
  SQL.FS.mount(sqlFS, {}, "/sql");

  const path = `/sql/persistent-sqlite.db`;
  if (typeof SharedArrayBuffer === "undefined") {
    let stream = SQL.FS.open(path, "a+");
    await stream.node.contents.readIfFallback();
    SQL.FS.close(stream);
  }

  const db = new SQL.Database(path, { filename: true });
  db.exec(`
    PRAGMA page_size=8192;
    PRAGMA journal_mode=MEMORY;
  `);
  return db;
})();

const runStmt = (stmt, params) => stmt.run(params);

const executeStmt = (stmt, params, options) => {
  const rows = [];
  const columns = stmt.getColumnNames();
  stmt.bind(params);
  while (stmt.step()) {
    rows.push(options.asArray ? stmt.get() : stmt.getAsObject());
  }
  stmt.free();
  return options.withColumns ? { columns, rows } : rows;
};

self.onmessage = async (event) => {
  const { data } = event;
  // TODO: event.waitUntil or something
  // for every mesage received, always return a message to ensure integrity of message queue sequence
  let returnMessage;
  try {
    const db = await dbPromise;
    if (data.action === "runAll") {
      const iterable = db.iterateStatements(data.query);
      for (const stmt of iterable) {
        runStmt(stmt, data.params.shift());
      }
      returnMessage = { ok: true };
    } else if (data.action === "executeAndReturnLast") {
      const iterable = db.iterateStatements(data.query);
      for (const stmt of iterable) {
        if (iterable.getRemainingSQL()) {
          runStmt(stmt, data.params.shift());
        } else {
          const result = executeStmt(stmt, data.params.shift(), {
            asArray: data.asArray,
            withColumns: data.withColumns,
          });
          returnMessage = result;
        }
      }
    } else if (data.action === "executeAndReturnAll") {
      const iterable = db.iterateStatements(data.query);
      const results = [];
      for (const stmt of iterable) {
        const result = executeStmt(stmt, data.params.shift(), {
          asArray: data.asArray,
          withColumns: data.withColumns,
        });
        results.push(result);
      }
      returnMessage = results;
    } else {
      returnMessage = { error: "No matched action" };
    }
  } catch (err) {
    returnMessage = { error: err.message };
  }
  self.postMessage(returnMessage);
};
