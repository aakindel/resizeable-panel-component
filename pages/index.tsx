import type { NextPage } from "next";
import Head from "next/head";
import { ResizeablePanelIFrame } from "../components/ResizeablePanel";

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="h-screen w-screen px-4 pt-24">
        <div className="mx-auto flex max-w-3xl flex-col gap-12">
          <ResizeablePanelIFrame
            pxHeight={500}
            title={"Resizeable Panel Demo"}
            src="/panel_demo"
          />
        </div>
        <div className=" mt-24 h-[10px] w-screen"></div>
      </main>
    </div>
  );
};

export default Home;
