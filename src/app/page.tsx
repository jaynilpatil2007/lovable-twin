"use client"

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";


export default function Home() {
  const trpc = useTRPC();
  const invoke = useMutation(trpc.invoke.mutationOptions({
    onSuccess: () => {
      toast.add({ title: "Background Job started" })
    }
  }))
  return (
    <>
      <div className="p-4 max-w-7xl mx-auto">
        <Button disabled={invoke.isPending} onClick={() => invoke.mutate({ text: "John" })}>
          Invoke Background Job
        </Button>
      </div>
    </>
  );
}
