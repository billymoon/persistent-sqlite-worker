import { useRouter } from "next/router"
import { Suspense, useEffect, useState } from "react"
import Link from "next/link"

function wrapPromise(promise) {
  let status = "pending";
  let result;
  let suspender = promise.then(
    (r) => {
      status = "success";
      result = r;
    },
    (e) => {
      status = "error";
      result = e;
    }
  );
  return {
    read() {
      if (status === "pending") {
        throw suspender;
      } else if (status === "error") {
        throw result;
      } else if (status === "success") {
        return result;
      }
    }
  };
}

const ComponentProxy = ({ Component, pageProps, allowable }) => {
  // if (!allowable) throw new Promise((resolve) => {})
  return <Component {...pageProps} />
}

export default function MyApp({ Component, pageProps }) {
    const [allowable, setAllowable] = useState(null)
    const router = useRouter()
    useEffect(() => {
      console.log("mounted my app", allowable, Component.suspendUntil)
      if (allowable && Component.suspendUntil) {
        Component.suspendUntil().then(data => {
          console.log(data)
          allowable()
        })
      } else if (allowable) {
        allowable()
      }
    }, [Component, pageProps])

    useEffect(() => {
      let letItHappen = false
      console.log("listening to ", router)
      const handleRouteChangeStart = (url, { shallow }) => {
        console.log("route change start", args, Component.suspendUntil, router)
        if (!shallow) {
          setTimeout(() => {
            router.push(args[0], undefined, { shallow: true })
          }, 0)
          throw "cancel route change"
        }
        // if (!letItHappen) {
        //   setAllowable((state) => () => {
        //     letItHappen = true
        //   })
        // }
      }
      const handleRouteChangeComplete = (...args) => {
        letItHappen = false
        console.log("route change end", args, Component.suspendUntil)
      }
      router.events.on('routeChangeStart', handleRouteChangeStart)
      router.events.on('routeChangeComplete', handleRouteChangeComplete)
      return () => {
        router.events.off('routeChangeStart', handleRouteChangeStart)
        router.events.off('routeChangeComplete', handleRouteChangeComplete)
      }
    }, [])

    console.log("rendering", Component, pageProps, allowable)
    return (
        <div>
          <Link href="/">/Home</Link> ... | ...
          <Link href="/docs">/Docs</Link>
          <Link href="/docs?1">/Docs1</Link>
          <Link href="/mypage">/mypage</Link>
          <Suspense>
            <ComponentProxy Component={Component} pageProps={pageProps} allowable={allowable} />
          </Suspense>
        </div>
      )

  }