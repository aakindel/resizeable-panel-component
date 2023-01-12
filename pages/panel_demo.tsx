import type { NextPage } from "next";
import Head from "next/head";

const PanelDemoPage: NextPage = () => {
  return (
    <div className="h-screen w-full">
      <Head>
        <title>Resizeable Panel Demo</title>
        <meta
          name="description"
          content="ResizeablePanel component demo page."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div
        className="flex h-full w-full flex-col items-center justify-center overflow-hidden bg-slate-100
        [@media(min-width:500px)]:bg-blue-50 [@media(min-width:725px)]:bg-green-50 
        [@media(min-width:1024px)]:bg-red-50 [@media(min-width:1280px)]:bg-yellow-50
        [@media(min-width:1536px)]:bg-fuchsia-50"
      >
        <div className="absolute top-24 text-sm font-semibold text-gray-500 [@media(min-width:500px)]:hidden">
          @ xs screen
        </div>
        <div
          className="mx-12 flex flex-col flex-wrap items-center justify-center gap-4 rounded-md border border-solid 
          border-gray-200 bg-white p-3 text-right text-sm text-gray-500 shadow-md 
          [@media(min-width:500px)]:flex-row [@media(min-width:725px)]:mx-auto"
        >
          <span className="flex flex-col flex-wrap items-center justify-center gap-4 [@media(min-width:500px)]:flex-row">
            <span className="block text-left">
              Drag the resize handle to see how this panel behaves at different
              sizes!
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default PanelDemoPage;
