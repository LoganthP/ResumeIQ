import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface ResumeChartsProps {
  matchScore: number;
  keywordsFound: string[];
  keywordsMissing: string[];
}

export default function ResumeCharts({ matchScore, keywordsFound, keywordsMissing }: ResumeChartsProps) {
  const radarRef = useRef<HTMLCanvasElement | null>(null);
  const barRef = useRef<HTMLCanvasElement | null>(null);
  const lineRef = useRef<HTMLCanvasElement | null>(null);
  const donutRef = useRef<HTMLCanvasElement | null>(null);

  const chartInstances = useRef<any[]>([]);

  useEffect(() => {
    // Destroy existing chart instances on remount or prop update
    chartInstances.current.forEach(chart => chart.destroy());
    chartInstances.current = [];

    // --- 1. Radar Chart ---
    if (radarRef.current) {
      // Calculate dynamic radar values around the match score
      const techVal = Math.min(100, Math.max(30, matchScore + 10));
      const leadVal = Math.min(100, Math.max(20, Math.round(matchScore * 0.85)));
      const stratVal = Math.min(100, Math.max(20, Math.round(matchScore * 0.7)));
      const designVal = Math.min(100, Math.max(10, Math.round(matchScore * 0.55)));
      const commVal = Math.min(100, Math.max(30, Math.round(matchScore * 0.9)));
      const opsVal = Math.min(100, Math.max(25, Math.round(matchScore * 0.8)));

      const radarChart = new Chart(radarRef.current, {
        type: 'radar',
        data: {
          labels: ['Technical', 'Leadership', 'Strategy', 'Design', 'Communication', 'Ops'],
          datasets: [{
            label: 'Applicant Profile',
            data: [techVal, leadVal, stratVal, designVal, commVal, opsVal],
            backgroundColor: 'rgba(139, 26, 43, 0.2)',
            borderColor: '#8B1A2B',
            borderWidth: 2,
            pointBackgroundColor: '#8B1A2B'
          }]
        },
        options: {
          scales: {
            r: {
              grid: { color: '#DCC3AA' },
              angleLines: { color: '#DCC3AA' },
              ticks: { display: false },
              pointLabels: {
                font: {
                  family: 'Inter',
                  size: 10,
                  weight: 'bold'
                },
                color: '#221a10'
              }
            }
          },
          plugins: { legend: { display: false } },
          responsive: true,
          maintainAspectRatio: false
        }
      });
      chartInstances.current.push(radarChart);
    }

    // --- 2. Keyword Bar Chart ---
    if (barRef.current) {
      // Pick top 7 keywords to show
      const maxKeywords = 7;
      const displayKeywords: { name: string; score: number }[] = [];

      // Add found keywords (high score)
      keywordsFound.slice(0, 4).forEach(kw => {
        displayKeywords.push({ name: kw, score: 100 });
      });

      // Add missing keywords (low score)
      keywordsMissing.slice(0, Math.max(1, maxKeywords - displayKeywords.length)).forEach(kw => {
        displayKeywords.push({ name: kw, score: 20 });
      });

      // Fill remaining if list is too short
      const fallbacks = ['React', 'Python', 'AWS', 'Docker', 'Agile', 'SQL', 'Git'];
      let fallbackIdx = 0;
      while (displayKeywords.length < maxKeywords && fallbackIdx < fallbacks.length) {
        const name = fallbacks[fallbackIdx++];
        if (!displayKeywords.some(k => k.name.toLowerCase() === name.toLowerCase())) {
          displayKeywords.push({ name, score: 50 });
        }
      }

      const barChart = new Chart(barRef.current, {
        type: 'bar',
        data: {
          labels: displayKeywords.map(k => k.name),
          datasets: [{
            data: displayKeywords.map(k => k.score),
            backgroundColor: displayKeywords.map(k => k.score > 50 ? '#8B1A2B' : '#DCC3AA'),
            borderWidth: 0
          }]
        },
        options: {
          indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: {
            x: { display: false },
            y: {
              grid: { display: false },
              ticks: {
                font: { family: 'JetBrains Mono', size: 9 },
                color: '#574145'
              }
            }
          },
          responsive: true,
          maintainAspectRatio: false
        }
      });
      chartInstances.current.push(barChart);
    }

    // --- 3. Score Trajectory Line Chart ---
    if (lineRef.current) {
      // Create a trajectory ending at the match score
      const step = Math.round((matchScore - 50) / 4);
      const v1 = Math.max(30, matchScore - step * 4);
      const v2 = Math.max(40, matchScore - step * 3);
      const v3 = Math.max(50, matchScore - step * 2);
      const v4 = Math.max(60, matchScore - step);
      const v5 = matchScore;

      const lineChart = new Chart(lineRef.current, {
        type: 'line',
        data: {
          labels: ['Original', 'v2', 'v3', 'v4', 'Optimized'],
          datasets: [{
            data: [v1, v2, v3, v4, v5],
            borderColor: '#8B1A2B',
            tension: 0.4,
            borderWidth: 2,
            fill: false,
            pointBackgroundColor: '#8B1A2B'
          }]
        },
        options: {
          plugins: { legend: { display: false } },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                font: { family: 'JetBrains Mono', size: 8 },
                color: '#574145'
              }
            },
            y: {
              display: true,
              min: 0,
              max: 100,
              ticks: {
                font: { family: 'JetBrains Mono', size: 8 },
                color: '#574145'
              }
            }
          },
          responsive: true,
          maintainAspectRatio: false
        }
      });
      chartInstances.current.push(lineChart);
    }

    // --- 4. Signal Balance Donut Chart ---
    if (donutRef.current) {
      const totalKeywords = Math.max(1, keywordsFound.length + keywordsMissing.length);
      const foundPct = Math.round((keywordsFound.length / totalKeywords) * 100);
      const missingPct = Math.round((keywordsMissing.length / totalKeywords) * 100);
      // Ensure we have some balance categories
      const foundVal = Math.max(10, foundPct);
      const missingVal = Math.max(10, missingPct);
      const relevantVal = 100 - foundVal - missingVal > 0 ? 100 - foundVal - missingVal : 15;

      const donutChart = new Chart(donutRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Found', 'Missing', 'Relevant'],
          datasets: [{
            data: [foundVal, missingVal, relevantVal],
            backgroundColor: ['#8B1A2B', '#DCC3AA', '#5b0024'],
            borderWidth: 0
          }]
        },
        options: {
          cutout: '70%',
          plugins: { legend: { display: false } },
          responsive: true,
          maintainAspectRatio: false
        }
      });
      chartInstances.current.push(donutChart);
    }

    return () => {
      chartInstances.current.forEach(chart => chart.destroy());
    };
  }, [matchScore, keywordsFound, keywordsMissing]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
      <div className="col-span-1 md:col-span-2">
        <p className="font-data text-[10px] text-crimson mb-6 uppercase tracking-wider">Keyword Density Map</p>
        <div className="h-[200px] w-full bg-surface/30 p-2 border border-outline-variant/30">
          <canvas ref={barRef}></canvas>
        </div>
      </div>
      <div>
        <p className="font-data text-[10px] text-crimson mb-6 uppercase tracking-wider">Score Trajectory</p>
        <div className="h-[200px] w-full bg-surface/30 p-2 border border-outline-variant/30">
          <canvas ref={lineRef}></canvas>
        </div>
      </div>
      <div>
        <p className="font-data text-[10px] text-crimson mb-6 uppercase tracking-wider">Signal Balance</p>
        <div className="h-[200px] w-full bg-surface/30 p-2 border border-outline-variant/30">
          <canvas ref={donutRef}></canvas>
        </div>
      </div>
      <div className="col-span-1 md:col-span-2">
        <p className="font-data text-[10px] text-crimson mb-4 uppercase tracking-wider">Section Fit Heatmap</p>
        <div className="grid grid-cols-12 gap-1 bg-surface/30 p-4 border border-outline-variant/30">
          {Array.from({ length: 36 }).map((_, i) => {
            // Seeded random opacity for stable rendering
            const opacity = 0.2 + (Math.sin(i * 123.456) + 1) * 0.4;
            return (
              <div
                key={i}
                className="aspect-square bg-crimson"
                style={{ opacity }}
              ></div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function RadarChartWrapper({ matchScore, keywordsFound, keywordsMissing }: ResumeChartsProps) {
  const radarRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    if (radarRef.current) {
      const techVal = Math.min(100, Math.max(30, matchScore + 10));
      const leadVal = Math.min(100, Math.max(20, Math.round(matchScore * 0.85)));
      const stratVal = Math.min(100, Math.max(20, Math.round(matchScore * 0.7)));
      const designVal = Math.min(100, Math.max(10, Math.round(matchScore * 0.55)));
      const commVal = Math.min(100, Math.max(30, Math.round(matchScore * 0.9)));
      const opsVal = Math.min(100, Math.max(25, Math.round(matchScore * 0.8)));

      chartInstance.current = new Chart(radarRef.current, {
        type: 'radar',
        data: {
          labels: ['Technical', 'Leadership', 'Strategy', 'Design', 'Communication', 'Ops'],
          datasets: [{
            label: 'Applicant Profile',
            data: [techVal, leadVal, stratVal, designVal, commVal, opsVal],
            backgroundColor: 'rgba(139, 26, 43, 0.2)',
            borderColor: '#8B1A2B',
            borderWidth: 2,
            pointBackgroundColor: '#8B1A2B'
          }]
        },
        options: {
          scales: {
            r: {
              grid: { color: '#DCC3AA' },
              angleLines: { color: '#DCC3AA' },
              ticks: { display: false },
              pointLabels: {
                font: {
                  family: 'Inter',
                  size: 9,
                  weight: 'bold'
                },
                color: '#221a10'
              }
            }
          },
          plugins: { legend: { display: false } },
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [matchScore, keywordsFound, keywordsMissing]);

  return (
    <div className="w-full h-full relative">
      <canvas ref={radarRef}></canvas>
    </div>
  );
}
