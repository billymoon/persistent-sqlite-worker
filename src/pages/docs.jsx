import sql from "../persistent-sqlite-worker";
import { useEffect, useState } from "react";
// import useSWR from "swr"

// if (typeof window !== "undefined") window.sql = sql;

// const fetcher = query => sql(query).last({ withColumns: true, asArray: true });

// function fetchProfileData() {
//   return {
//     posts: wrapPromise(fetchPosts())
//   };
// }

// Suspense integrations like Relay implement
// a contract like this to integrate with React.
// Real implementations can be significantly more complex.
// Don't copy-paste this into your project!

function fetchPosts() {
  console.log("fetch posts...");
  return new Promise((resolve) => {
    sql`select * from docs;`
      .last({ withColumns: true, asArray: true })
      .then((results) => {
        setTimeout(() => {
          console.log("fetched docs", results);
          resolve(results);
        }, 200);
      });
  });
}

const Page = (props) => {
  // const posts = resource.read();
  // const { data } = useSWR(`select * from docs;`, fetcher, { suspense: true});

  console.log({ props });
  return (
    <div>
      <pre>
        <code>{JSON.stringify(props)}</code>
      </pre>
    </div>
  );
};

Page.suspendUntil = () => fetchPosts();

// // const Page = ({ results }) => {
// const resource = getResource(sql`select * from docs;`.last({ withColumns: true, asArray: true }))
// // const Page = ({ resource }) => {
// const Page = () => {
//   console.log({resource})
//   const results = resource.read();
//   console.log({results})
//   // const results = null
//   // console.log(results.results.read())
//   // const results = resource.results.read()
//   // console.log(results)
//   return (
//     <section
//       style={{
//         display: "flex",
//         flexDirection: "column",
//         maxWidth: 800,
//       }}
//     >
//       {results &&
//         (
//           <table>
//             <thead style={{ fontWeight: "bold" }}>
//               <tr>
//                 {results.columns.map((column, i) => <td key={i}>{column}</td>)}
//               </tr>
//             </thead>
//             <tbody>
//               {results.rows.map((row, i) => (
//                 <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//     </section>
//   );
// };

// Page.withData = () => sql`select * from docs;`.last({ withColumns: true, asArray: true })

export default Page;
