"use client"

import { useState, useEffect } from 'react'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart } from 'react-minimal-pie-chart'

interface WeightsFormProps {
  categories: string[]
  initialWeights?: Record<string, number>
  onWeightsChange: (weights: Record<string, number>) => void
}

export function WeightsForm({ categories, initialWeights, onWeightsChange }: WeightsFormProps) {
  const [weights, setWeights] = useState<Record<string, number>>(() => {
    // Initialize weights evenly if not provided
    if (!initialWeights) {
      const evenWeight = 100 / categories.length
      return Object.fromEntries(categories.map(cat => [cat, evenWeight]))
    }
    return initialWeights
  })

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0)

  const handleWeightChange = (category: string, newValue: number) => {
    const newWeights = { ...weights, [category]: newValue }
    
    // Normalize other weights to maintain total of 100
    const otherCategories = categories.filter(cat => cat !== category)
    const remainingWeight = 100 - newValue
    const factor = remainingWeight / (totalWeight - weights[category])
    
    otherCategories.forEach(cat => {
      newWeights[cat] = Math.round(weights[cat] * factor * 10) / 10
    })

    setWeights(newWeights)
    onWeightsChange(newWeights)
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Category Weights</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          {categories.map(category => (
            <div key={category} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{category}</span>
                <span>{weights[category]}%</span>
              </div>
              <Slider
                value={[weights[category]]} 
                min={0}
                max={100}
                step={0.1}
                onValueChange={([value]) => handleWeightChange(category, value)}
              />
            </div>
          ))}
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span className={totalWeight === 100 ? 'text-green-600' : 'text-red-600'}>
              {totalWeight.toFixed(1)}%
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weight Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <PieChart
            data={categories.map((category, i) => ({
              title: category,
              value: weights[category],
              color: `hsl(${(i * 360) / categories.length}, 70%, 50%)`
            }))}
            label={({ dataEntry }) => `${dataEntry.title} ${Math.round(dataEntry.value)}%`}
            labelStyle={{
              fontSize: '0.25rem',
              fontFamily: 'sans-serif',
            }}
            labelPosition={60}
          />
        </CardContent>
      </Card>
    </div>
  )
}
