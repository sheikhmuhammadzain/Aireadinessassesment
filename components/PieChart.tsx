import { useEffect, useRef } from 'react';

interface PieChartData {
  name: string;
  value: number;
}

interface PieChartProps {
  data: PieChartData[];
}

export function PieChart({ data }: PieChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate total value
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    // Define colors for each segment
    const colors = [
      '#0ea5e9', // sky-500
      '#8b5cf6', // violet-500
      '#ec4899', // pink-500
      '#f97316', // orange-500
      '#10b981', // emerald-500
      '#f59e0b', // amber-500
      '#ef4444', // red-500
      '#6366f1', // indigo-500
    ];

    // Draw pie chart
    let startAngle = 0;
    const radius = Math.min(canvas.width, canvas.height) / 2 - 10;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    data.forEach((item, index) => {
      const sliceAngle = (2 * Math.PI * item.value) / total;
      const endAngle = startAngle + sliceAngle;
      
      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      
      // Fill with color
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      
      // Draw label if slice is large enough
      if (item.value / total > 0.05) {
        const labelAngle = startAngle + sliceAngle / 2;
        const labelRadius = radius * 0.7;
        const labelX = centerX + labelRadius * Math.cos(labelAngle);
        const labelY = centerY + labelRadius * Math.sin(labelAngle);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Abbreviate long category names
        const shortName = item.name.split(' ')[1] || item.name.substring(0, 4);
        ctx.fillText(shortName, labelX, labelY);
      }
      
      startAngle = endAngle;
    });

    // Draw legend
    const legendX = 10;
    let legendY = canvas.height - (data.length * 20) - 10;
    
    data.forEach((item, index) => {
      // Draw color box
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(legendX, legendY, 15, 15);
      
      // Draw text
      ctx.fillStyle = '#000000';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      
      // Truncate long names
      const displayName = item.name.length > 15 
        ? item.name.substring(0, 12) + '...' 
        : item.name;
      
      ctx.fillText(`${displayName} (${item.value.toFixed(1)}%)`, legendX + 20, legendY + 7.5);
      
      legendY += 20;
    });

  }, [data]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={300} 
      className="max-w-full"
    />
  );
} 