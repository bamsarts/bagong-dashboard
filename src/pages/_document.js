import Document, { Html, Head, Main, NextScript } from 'next/document'

export default class MyDocument extends Document {

  render() {
    return (
      <Html>
        <Head>
          {/* <script 
          src="https://gwk.gopayapi.com/sdk/stable/gp-container.min.js" 
          async>
          </script> */}
        </Head>
        <body>
          <Main />
          <NextScript />
          <script> </script>
        </body>
      </Html>
    )
  }
}