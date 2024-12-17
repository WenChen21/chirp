import Link from "next/link";
import type { PropsWithChildren } from "react";

export const PageLayout = (props: PropsWithChildren) => {
  return (
    < main className="flex h-screen justify-center" >
      <div className="w-full md:max-w-2xl border-x h-full border-slate-400 overflow-y-scroll">

        {props.children}
      </div >
    </main >
  );
};