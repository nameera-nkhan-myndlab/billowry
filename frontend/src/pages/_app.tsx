import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { installErrorReporter } from '../lib/errorReporter';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    installErrorReporter();
  }, []);

  return (
    <>
      <Head>
        <title>Billowry — Invoice Generator</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AppLayout>
        <Component {...pageProps} />
      </AppLayout>
    </>
  );
}