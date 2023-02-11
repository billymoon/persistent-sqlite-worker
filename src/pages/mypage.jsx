const Page = (props) => {
  console.log({ props });
  return (
    <div>
      <pre>
        <code>{JSON.stringify(props)}</code>
      </pre>
    </div>
  );
};

Page.suspendUntil = () => new Promise((resolve) => setTimeout(resolve, 1000));

export default Page;
