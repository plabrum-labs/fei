import { useState } from "react";
import { Slider } from "@/primitives/Slider";
import { usePyCompute } from "@/primitives/usePyCompute";
import { PyCodeEditor } from "@/primitives/PyCodeEditor";
import { LineChart } from "@/primitives/LineChart";
import { AsyncBoundary } from "@/primitives/AsyncBoundary";
import CODE from "./sine.py?raw";

export function SineDemo() {
  const [freq, setFreq] = useState(1);
  const pyCompute = usePyCompute({ code: CODE, params: { freq }, packages: ["numpy"] });

  return (
    <div className="space-y-4">
      <Slider label="frequency" min={0.5} max={5} step={0.1} value={freq} onChange={setFreq} />
      <AsyncBoundary>
        <div className="space-y-4">
          <PyCodeEditor
            source={pyCompute.source}
            onSourceChange={pyCompute.setSource}
            status={pyCompute.status}
            runError={pyCompute.runError}
            isDirty={pyCompute.isDirty}
            onRun={pyCompute.runCode}
            onReset={pyCompute.resetCode}
          />
          <LineChart data={pyCompute.data} height={280} />
        </div>
      </AsyncBoundary>
    </div>
  );
}
