import sql from "../persistent-sqlite-worker";
import { useEffect, useState } from "react";

if (typeof window !== "undefined") window.sql = sql;

const Page = ({ data }) => {
  const [query, setQuery] = useState("select * from docs;");
  const [results, setResults] = useState(null);

  console.log(data)

  useEffect(() => {
  }, [query]);

  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        maxWidth: 800,
      }}
    >
      <textarea
        rows={10}
        value={query}
        onChange={(evt) => setQuery(evt.target.value)}
      />
      <button
        onClick={async () =>
          setResults(
            await sql(query).last({ asArray: true, withColumns: true }),
          )}
      >
        Execute
      </button>
      {results &&
        (
          <table>
            <thead style={{ fontWeight: "bold" }}>
              <tr>
                {results.columns.map((column, i) => <td key={i}>{column}</td>)}
              </tr>
            </thead>
            <tbody>
              {results.rows.map((row, i) => (
                <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        )}
    </section>
  );
};

export default Page;
