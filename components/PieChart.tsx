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
    
    // Define light blue shades for each segment
    const colors = [
      '#E0F7FF', // Lightest blue
      '#C2EAFF', // Very light blue
      '#A5DBFF', // Light blue
      '#8ECAE6', // Medium light blue
      '#73BFDC', // Medium blue
      '#5BA3C6', // Blue
      '#4389B0', // Deeper blue
      '#2C6F9B', // Rich blue
      '#1A5785', // Deep blue
      '#0A4570', // Darkest blue
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
      
      // Draw percentage inside the slice
      const percentage = Math.round((item.value / total) * 100);
      
      // Only show percentage if slice is large enough
      if (percentage >= 5) {
        const labelAngle = startAngle + sliceAngle / 2;
        const labelRadius = radius * 0.65; // Position closer to the center for better visibility
        const labelX = centerX + labelRadius * Math.cos(labelAngle);
        const labelY = centerY + labelRadius * Math.sin(labelAngle);
        
        // Use dark text for light backgrounds and light text for dark backgrounds
        const colorIndex = index % colors.length;
        ctx.fillStyle = colorIndex < 5 ? '#0A4570' : '#ffffff'; // Dark blue text for light slices, white for dark slices
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Show percentage
        ctx.fillText(`${percentage}%`, labelX, labelY);
      }
      
      startAngle = endAngle;
    });

    // Add a white circle in the center for better aesthetics
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.3, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

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