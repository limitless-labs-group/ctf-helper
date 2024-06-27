import { AddFunding } from "@/components/fpmm/add-funding";
import { MergePositions } from "@/components/fpmm/merge-positions";
import { RemoveFunding } from "@/components/fpmm/remove-funding";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

function App() {
  const { address } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <>
      <main className="p-5 grid pb-96">
        <div className="flex justify-between mb-10">
          <img src="logo.svg" alt="Limitless" className="h-10" />
          
          <Button
            size="lg"
            onClick={() =>
              !address ? connect({ connector: injected() }) : disconnect()
            }
          >
            {!address ? "Connect" : address}
          </Button>
        </div>

        <div className="mt-5" />

        {address && (
          <div className="grid gap-6">
            <AddFunding />
            <RemoveFunding />
            <MergePositions />
          </div>
        )}
      </main>

      <Toaster />
    </>
  );
}

export default App;
