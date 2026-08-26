import { Suspense } from "react";

import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { Client } from "./api/client";

export default async function Home() {
  
  const queryClient = getQueryClient();
   void queryClient.prefetchQuery(trpc.hello.queryOptions({ text: "Jaynil"}))

  return (
    <>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<p>...Loading</p>}>
          <Client />
        </Suspense>
      </HydrationBoundary>
    </>
  );
}
