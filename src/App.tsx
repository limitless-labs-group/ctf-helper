import { AddFunding } from "@/components/fpmm/add-funding";
import { Button } from "@/components/ui/button";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

function App() {
  const { address } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <>
      <main className="p-5">
        <Button
          onClick={() =>
            !address ? connect({ connector: injected() }) : disconnect()
          }
        >
          {!address ? "Connect" : address}
        </Button>

        <div className="mt-5" />

        {address && (
          <>
            <AddFunding />
          </>
        )}
      </main>
    </>
  );
}

export default App;
