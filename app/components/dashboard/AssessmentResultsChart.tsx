"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ChartDataItem {
  name: string;
  score: number;
}

interface AssessmentResultsChartProps {
  data: ChartDataItem[];
  onGenerateReport: () => void;
  isGenerating: boolean;
  generationMessage: string;
}

export function AssessmentResultsChart({
  data,
  onGenerateReport,
  isGenerating,
  generationMessage,
}: AssessmentResultsChartProps) {
  console.log("Rendering chart with data:", JSON.stringify(data));
  
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Assessment Results Overview</CardTitle>
        <CardDescription>
          Readiness scores across different assessment areas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {data.length > 0 ? (
            <>
              <div className="text-xs text-muted-foreground mb-2">
                {`Found ${data.length} assessment results to display`}
              </div>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 12 }}
                      label={{
                        value: 'Score (%)',
                        angle: -90,
                        position: 'insideLeft',
                        style: { textAnchor: 'middle' }
                      }}
                    />
                    <Tooltip
                      formatter={(value) => [`${value}%`, 'Score']}
                      labelFormatter={(label) => `${label} Assessment`}
                    />
                    <Bar
                      dataKey="score"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                      name="Readiness Score"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center flex-col">
              <p className="text-muted-foreground">No chart data available</p>
              <p className="text-xs text-muted-foreground mt-2">Complete assessments to see results here</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-0">
        <div className="text-xs text-muted-foreground">
          Based on your completed assessments
        </div>
        <Button
          variant="outline"
          onClick={onGenerateReport}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {generationMessage}
            </>
          ) : (
            "Generate Strategic Report"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 