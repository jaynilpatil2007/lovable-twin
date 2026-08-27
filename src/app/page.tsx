"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";


export default function Home() {
  const [value, setValue] = useState("");

  const trpc = useTRPC();
  const invoke = useMutation(trpc.invoke.mutationOptions({
    onSuccess: () => {
      toast.add({ title: "Background Job started" })
    }
  }))
  return (
    <>
      <div className="p-4 max-w-7xl mx-auto">
        <Input value={value} onChange={(e) => setValue(e.target.value)}/>
        <Button disabled={invoke.isPending} onClick={() => invoke.mutate({ prompt: value })}>
          Invoke Background Job
        </Button>
      </div>
    </>
  );
}
