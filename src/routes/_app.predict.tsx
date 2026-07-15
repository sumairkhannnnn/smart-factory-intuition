import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from "recharts";

export const Route = createFileRoute("/_app/predict")({
  component: PredictPage,
});

interface Result {
  health: number;
  risk: "Low" | "Medium" | "High" | "Critical";
  failureProb: number;
  daysLeft: number;
  recommendation: string;
}

function computePrediction(vals: Record<string, number>): Result {
  const { temperature, vibration, motorCurrent, humidity, runningHours, load, rpm } = vals;
  let score = 100;
  score -= Math.max(0, temperature - 70) * 1.4;
  score -= Math.max(0, vibration - 3) * 5;
  score -= Math.max(0, motorCurrent - 12) * 2;
  score -= Math.max(0, humidity - 70) * 0.6;
  score -= Math.min(20, runningHours / 500);
  score -= Math.max(0, load - 80) * 0.8;
  score -= Math.max(0, rpm - 2500) / 100;
  score = Math.max(5, Math.min(100, Math.round(score)));
  const failureProb = Math.round(100 - score * 0.9);
  const daysLeft = Math.max(1, Math.round(score * 1.4));
  const risk: Result["risk"] =
    score >= 80 ? "Low" : score >= 60 ? "Medium" : score >= 40 ? "High" : "Critical";
  let rec = "System healthy. Continue routine inspections.";
  if (vibration > 6) rec = "Motor bearing vibration is increasing. Replace bearing within 5 days.";
  else if (temperature > 90)
    rec = "High temperature detected. Inspect cooling system and lubrication within 24 hours.";
  else if (motorCurrent > 18)
    rec = "Motor overloaded. Reduce load or check for mechanical binding.";
  else if (score < 60) rec = "Wear pattern emerging. Schedule preventive maintenance this week.";
  return { health: score, risk, failureProb, daysLeft, recommendation: rec };
}

const defaults = {
  temperature: 78,
  vibration: 4.5,
  motorCurrent: 12,
  humidity: 55,
  runningHours: 4200,
  load: 65,
  rpm: 1800,
};

const fields: { key: keyof typeof defaults; label: string; step: number }[] = [
  { key: "temperature", label: "Temperature (°C)", step: 0.5 },
  { key: "vibration", label: "Vibration (mm/s)", step: 0.1 },
  { key: "motorCurrent", label: "Motor Current (A)", step: 0.1 },
  { key: "humidity", label: "Humidity (%)", step: 1 },
  { key: "runningHours", label: "Running Hours", step: 10 },
  { key: "load", label: "Load (%)", step: 1 },
  { key: "rpm", label: "RPM", step: 10 },
];

export function PredictPage() {
  const [values, setValues] = useState(defaults);
  const [result, setResult] = useState<Result | null>(null);

  function predict() {
    setResult(computePrediction(values));
  }

  const riskColor: Record<Result["risk"], string> = {
    Low: "var(--color-success)",
    Medium: "var(--color-warning)",
    High: "var(--color-warning)",
    Critical: "var(--color-destructive)",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Failure Prediction</h1>
        <p className="text-sm text-muted-foreground">
          Enter live sensor readings to get a health score and recommendation
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sensor Inputs</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {fields.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label>{f.label}</Label>
                <Input
                  type="number"
                  step={f.step}
                  value={values[f.key]}
                  onChange={(e) =>
                    setValues({ ...values, [f.key]: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            ))}
            <div className="col-span-2">
              <Button className="w-full" onClick={predict}>
                <Sparkles className="mr-2 h-4 w-4" /> Predict
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prediction Result</CardTitle>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                Enter values and click Predict.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="70%"
                        outerRadius="100%"
                        data={[
                          {
                            name: "Health",
                            value: result.health,
                            fill: riskColor[result.risk],
                          },
                        ]}
                        startAngle={220}
                        endAngle={-40}
                      >
                        <RadialBar background dataKey="value" cornerRadius={12} />
                        <text
                          x="50%"
                          y="46%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-foreground text-3xl font-bold"
                        >
                          {result.health}%
                        </text>
                        <text
                          x="50%"
                          y="60%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-muted-foreground text-xs"
                        >
                          Health Score
                        </text>
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Risk Level</div>
                      <div
                        className="mt-1 inline-flex rounded-md px-2 py-1 text-sm font-semibold"
                        style={{
                          background: `color-mix(in oklab, ${riskColor[result.risk]} 20%, transparent)`,
                          color: riskColor[result.risk],
                        }}
                      >
                        {result.risk}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Failure Probability</div>
                      <div className="mt-1 flex items-center gap-2">
                        <Progress value={result.failureProb} className="h-2" />
                        <span className="w-10 text-right font-semibold">{result.failureProb}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Remaining useful life</div>
                      <div className="text-lg font-semibold">{result.daysLeft} days</div>
                    </div>
                  </div>
                </div>
                <div className="rounded-md border bg-accent/40 p-3 text-sm">
                  <b>AI Recommendation:</b> {result.recommendation}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
