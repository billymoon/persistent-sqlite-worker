const stack = [];

const promisedDatabase = new Promise(async (resolve) => {
  // don't try to run service worker server side
  if (typeof window === "undefined") return;
  const { initBackend } = await import(
    "@aphro/absurd-sql/dist/indexeddb-main-thread"
  );
  const databaseWorker = new Worker(
    new URL("./service-worker.js", import.meta.url),
  );
  initBackend(databaseWorker);
  databaseWorker.onmessage = (evt) => {
    if (evt.data.error) {
      stack.shift();
      throw Error(evt.data.error);
    } else {
      stack.shift()(evt.data);
    }
  };
  resolve(databaseWorker);
});

const dispatch = (action, query, params, options) =>
  new Promise(async (resolve) => {
    const documentDB = await promisedDatabase;
    stack.push(resolve);
    documentDB.postMessage({ action, query: query.trim(), params, ...options });
  });

const isTag = (arg1, rest) =>
  !!(
    arg1 && arg1.length > 0 && arg1.raw && arg1.raw.length === arg1.length &&
    Object.isFrozen(arg1) &&
    rest.length + 1 === arg1.length
  );

const processInput = (arg1, ...rest) => {
  if (isTag(arg1, rest)) {
    return String.raw({ raw: arg1.raw }, ...rest);
  } else {
    return arg1;
  }
};

const persistentSqliteWorker = (...args) => {
  const query = processInput(...args);

  const apiFactory = (...params) => {
    return {
      last: (options) =>
        dispatch("executeAndReturnLast", query, params, options),
      all: (options) => dispatch("executeAndReturnAll", query, params, options),
      run: (options) => dispatch("runAll", query, params, options),
    };
  };

  return {
    ...apiFactory(),
    bind: apiFactory,
  };
};

export default persistentSqliteWorker;
