/**
 * Plotly Interactive Chart Wrapper
 * High-performance enterprise dark-theme aviation visualizations
 */

import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

export interface PlotlyChartProps {
  data: any[];
  layout?: any;
  config?: any;
  className?: string;
  style?: React.CSSProperties;
}

export const PlotlyChart: React.FC<PlotlyChartProps> = ({
  data,
  layout = {},
  config = {},
  className = 'w-full h-80',
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Default Airline Operations Dark Navy Theme
    const darkThemeLayout: Partial<Plotly.Layout> = {
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: {
        family: 'Plus Jakarta Sans, sans-serif',
        color: '#94a3b8', // slate-400
        size: 11,
      },
      margin: { t: 28, r: 20, l: 44, b: 38 },
      hoverlabel: {
        bgcolor: '#0f172a',
        bordercolor: '#334155',
        font: { family: 'Plus Jakarta Sans, sans-serif', color: '#f8fafc', size: 12 },
      },
      xaxis: {
        gridcolor: '#1e293b',
        zerolinecolor: '#334155',
        tickfont: { color: '#64748b', size: 10 },
      },
      yaxis: {
        gridcolor: '#1e293b',
        zerolinecolor: '#334155',
        tickfont: { color: '#64748b', size: 10 },
      },
      legend: {
        font: { color: '#cbd5e1', size: 11 },
        bgcolor: 'transparent',
      },
      autosize: true,
      ...layout,
    };

    const defaultConfig: Partial<Plotly.Config> = {
      responsive: true,
      displayModeBar: false,
      ...config,
    };

    Plotly.react(containerRef.current, data, darkThemeLayout, defaultConfig);

    const handleResize = () => {
      if (containerRef.current) {
        Plotly.Plots.resize(containerRef.current);
      }
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (containerRef.current) {
        Plotly.purge(containerRef.current);
      }
    };
  }, [data, layout, config]);

  return <div ref={containerRef} className={className} style={style} />;
};
