import { DashboardArtifact } from '../types';

interface DashboardRequest {
  type: 'chart' | 'dashboard' | 'visualization';
  data?: any[];
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  title?: string;
  description?: string;
}

class DashboardGeneratorService {
  
  // Detect if user is asking for a visualization
  shouldCreateDashboard(message: string): boolean {
    const visualizationKeywords = [
      'visualize', 'chart', 'graph', 'dashboard', 'plot', 'show data',
      'create chart', 'display data', 'bar chart', 'line chart', 'pie chart',
      'scatter plot', 'histogram', 'heatmap', 'analytics', 'metrics',
      'gantt', 'timeline', 'schedule', 'project', 'mermaid', 'visual'
    ];
    
    return visualizationKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  // Extract dashboard requirements from user message
  extractDashboardRequest(message: string): DashboardRequest {
    const request: DashboardRequest = {
      type: 'dashboard',
      title: 'Data Visualization'
    };

    // Detect chart type
    if (message.toLowerCase().includes('line')) request.chartType = 'line';
    else if (message.toLowerCase().includes('bar')) request.chartType = 'bar';
    else if (message.toLowerCase().includes('pie')) request.chartType = 'pie';
    else if (message.toLowerCase().includes('area')) request.chartType = 'area';
    else if (message.toLowerCase().includes('scatter')) request.chartType = 'scatter';
    else request.chartType = 'bar'; // default

    // Extract title if mentioned
    const titleMatch = message.match(/(?:title|called|named)\s+["']([^"']+)["']/i);
    if (titleMatch) {
      request.title = titleMatch[1];
    }

    return request;
  }

  // Generate sample data based on context
  generateSampleData(context: string): any[] {
    // Project/Gantt data
    if (context.toLowerCase().includes('project') || 
        context.toLowerCase().includes('gantt') || 
        context.toLowerCase().includes('timeline') || 
        context.toLowerCase().includes('schedule')) {
      return [
        { task: 'Site Layout & General Arrangement', duration: 83, progress: 100, phase: 'Planning' },
        { task: 'Structural Calculations & Foundation', duration: 7, progress: 80, phase: 'Planning' },
        { task: 'Civil Works Specifications', duration: 56, progress: 60, phase: 'Design' },
        { task: 'Pipeline Route & Profile', duration: 84, progress: 40, phase: 'Design' },
        { task: 'Process Flow Diagrams', duration: 56, progress: 30, phase: 'Design' },
        { task: 'Equipment Specifications', duration: 42, progress: 20, phase: 'Design' },
        { task: 'Mechanical Layout Drawings', duration: 56, progress: 10, phase: 'Detailed Design' },
        { task: 'Surge Analysis & Protection', duration: 7, progress: 0, phase: 'Detailed Design' }
      ];
    }

    // Sales data
    if (context.toLowerCase().includes('sales') || context.toLowerCase().includes('revenue')) {
      return [
        { month: 'Jan', sales: 4000, revenue: 2400 },
        { month: 'Feb', sales: 3000, revenue: 1398 },
        { month: 'Mar', sales: 2000, revenue: 9800 },
        { month: 'Apr', sales: 2780, revenue: 3908 },
        { month: 'May', sales: 1890, revenue: 4800 },
        { month: 'Jun', sales: 2390, revenue: 3800 }
      ];
    }

    // User engagement data
    if (context.toLowerCase().includes('user') || context.toLowerCase().includes('engagement')) {
      return [
        { day: 'Mon', users: 120, sessions: 180 },
        { day: 'Tue', users: 150, sessions: 220 },
        { day: 'Wed', users: 180, sessions: 280 },
        { day: 'Thu', users: 200, sessions: 320 },
        { day: 'Fri', users: 250, sessions: 400 },
        { day: 'Sat', users: 180, sessions: 250 },
        { day: 'Sun', users: 140, sessions: 200 }
      ];
    }

    // Performance metrics
    if (context.toLowerCase().includes('performance') || context.toLowerCase().includes('metric')) {
      return [
        { metric: 'Load Time', value: 2.3, target: 2.0 },
        { metric: 'Uptime', value: 99.9, target: 99.5 },
        { metric: 'Error Rate', value: 0.1, target: 0.5 },
        { metric: 'Throughput', value: 1200, target: 1000 }
      ];
    }

    // Default sample data
    return [
      { name: 'Category A', value: 400, growth: 12 },
      { name: 'Category B', value: 300, growth: 8 },
      { name: 'Category C', value: 200, growth: -3 },
      { name: 'Category D', value: 278, growth: 15 },
      { name: 'Category E', value: 189, growth: 5 }
    ];
  }

  // Generate React dashboard code
  generateDashboardCode(request: DashboardRequest, data: any[]): string {
    const { chartType, title } = request;
    
    switch (chartType) {
      case 'line':
        return this.generateLineChart(title || 'Line Chart', data);
      case 'bar':
        return this.generateBarChart(title || 'Bar Chart', data);
      case 'pie':
        return this.generatePieChart(title || 'Pie Chart', data);
      case 'area':
        return this.generateAreaChart(title || 'Area Chart', data);
      default:
        return this.generateDashboard(title || 'Dashboard', data);
    }
  }

  private generateLineChart(title: string, data: any[]): string {
    return `
const Dashboard = ({ data: propData }) => {
  const { useState, useEffect } = React;
  const data = propData || ${JSON.stringify(data, null, 2)};
  
  return (
    React.createElement('div', { className: "w-full h-full" },
      React.createElement('h2', { 
        className: "movar-heading text-xl text-awe-midnight dark:text-white mb-4" 
      }, "${title}"),
      React.createElement('div', { 
        className: "bg-white dark:bg-awe-midnight-light p-4 rounded-lg border border-gray-200 dark:border-awe-midnight" 
      },
        React.createElement(Recharts.ResponsiveContainer, { width: "100%", height: 300 },
          React.createElement(Recharts.LineChart, { data: data },
            React.createElement(Recharts.CartesianGrid, { strokeDasharray: "3 3", stroke: "#e5e7eb" }),
            React.createElement(Recharts.XAxis, { 
              dataKey: Object.keys(data[0] || {})[0], 
              stroke: "#6b7280" 
            }),
            React.createElement(Recharts.YAxis, { stroke: "#6b7280" }),
            React.createElement(Recharts.Tooltip, { 
              contentStyle: {
                backgroundColor: '#1a2238',
                border: 'none',
                borderRadius: '8px',
                color: 'white'
              }
            }),
            React.createElement(Recharts.Legend),
            ...Object.keys(data[0] || {}).slice(1).map((key, index) =>
              React.createElement(Recharts.Line, {
                key: key,
                type: "monotone",
                dataKey: key,
                stroke: index === 0 ? '#0073ff' : '#22c55e',
                strokeWidth: 2,
                dot: { fill: index === 0 ? '#0073ff' : '#22c55e', strokeWidth: 2 }
              })
            )
          )
        )
      )
    )
  );
};`;
  }

  private generateBarChart(title: string, data: any[]): string {
    return `
const Dashboard = ({ data: propData }) => {
  const { useState, useEffect } = React;
  const data = propData || ${JSON.stringify(data, null, 2)};
  
  return (
    React.createElement('div', { className: "w-full h-full" },
      React.createElement('h2', { 
        className: "movar-heading text-xl text-awe-midnight dark:text-white mb-4" 
      }, "${title}"),
      React.createElement('div', { 
        className: "bg-white dark:bg-awe-midnight-light p-4 rounded-lg border border-gray-200 dark:border-awe-midnight" 
      },
        React.createElement(Recharts.ResponsiveContainer, { width: "100%", height: 300 },
          React.createElement(Recharts.BarChart, { data: data },
            React.createElement(Recharts.CartesianGrid, { strokeDasharray: "3 3", stroke: "#e5e7eb" }),
            React.createElement(Recharts.XAxis, { 
              dataKey: Object.keys(data[0] || {})[0], 
              stroke: "#6b7280" 
            }),
            React.createElement(Recharts.YAxis, { stroke: "#6b7280" }),
            React.createElement(Recharts.Tooltip, { 
              contentStyle: {
                backgroundColor: '#1a2238',
                border: 'none',
                borderRadius: '8px',
                color: 'white'
              }
            }),
            React.createElement(Recharts.Legend),
            ...Object.keys(data[0] || {}).slice(1).map((key, index) =>
              React.createElement(Recharts.Bar, {
                key: key,
                dataKey: key,
                fill: index === 0 ? '#0073ff' : '#22c55e',
                radius: [4, 4, 0, 0]
              })
            )
          )
        )
      )
    )
  );
};`;
  }

  private generatePieChart(title: string, data: any[]): string {
    return `
const Dashboard = ({ data: propData }) => {
  const { useState, useEffect } = React;
  const data = propData || ${JSON.stringify(data, null, 2)};
  const colors = ['#0073ff', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  const pieData = data.map((item, index) => ({
    ...item,
    fill: colors[index % colors.length]
  }));
  
  return (
    React.createElement('div', { className: "w-full h-full" },
      React.createElement('h2', { 
        className: "movar-heading text-xl text-awe-midnight dark:text-white mb-4" 
      }, "${title}"),
      React.createElement('div', { 
        className: "bg-white dark:bg-awe-midnight-light p-4 rounded-lg border border-gray-200 dark:border-awe-midnight" 
      },
        React.createElement(Recharts.ResponsiveContainer, { width: "100%", height: 300 },
          React.createElement(Recharts.PieChart, {},
            React.createElement(Recharts.Pie, {
              data: pieData,
              cx: "50%",
              cy: "50%",
              outerRadius: 80,
              dataKey: Object.keys(data[0] || {})[1] || 'value',
              label: ({ name, percent }) => \`\${name} \${(percent * 100).toFixed(0)}%\`
            }),
            React.createElement(Recharts.Tooltip, { 
              contentStyle: {
                backgroundColor: '#1a2238',
                border: 'none',
                borderRadius: '8px',
                color: 'white'
              }
            })
          )
        )
      )
    )
  );
};`;
  }

  private generateAreaChart(title: string, data: any[]): string {
    return `
const Dashboard = ({ data: propData }) => {
  const { useState, useEffect } = React;
  const data = propData || ${JSON.stringify(data, null, 2)};
  
  return (
    React.createElement('div', { className: "w-full h-full" },
      React.createElement('h2', { 
        className: "movar-heading text-xl text-awe-midnight dark:text-white mb-4" 
      }, "${title}"),
      React.createElement('div', { 
        className: "bg-white dark:bg-awe-midnight-light p-4 rounded-lg border border-gray-200 dark:border-awe-midnight" 
      },
        React.createElement(Recharts.ResponsiveContainer, { width: "100%", height: 300 },
          React.createElement(Recharts.AreaChart, { data: data },
            React.createElement(Recharts.CartesianGrid, { strokeDasharray: "3 3", stroke: "#e5e7eb" }),
            React.createElement(Recharts.XAxis, { 
              dataKey: Object.keys(data[0] || {})[0], 
              stroke: "#6b7280" 
            }),
            React.createElement(Recharts.YAxis, { stroke: "#6b7280" }),
            React.createElement(Recharts.Tooltip, { 
              contentStyle: {
                backgroundColor: '#1a2238',
                border: 'none',
                borderRadius: '8px',
                color: 'white'
              }
            }),
            React.createElement(Recharts.Legend),
            ...Object.keys(data[0] || {}).slice(1).map((key, index) =>
              React.createElement(Recharts.Area, {
                key: key,
                type: "monotone",
                dataKey: key,
                stackId: "1",
                stroke: index === 0 ? '#0073ff' : '#22c55e',
                fill: index === 0 ? '#0073ff' : '#22c55e',
                fillOpacity: 0.6
              })
            )
          )
        )
      )
    )
  );
};`;
  }

  private generateDashboard(title: string, data: any[]): string {
    return `
const Dashboard = ({ data: propData }) => {
  const { useState, useEffect } = React;
  const data = propData || ${JSON.stringify(data, null, 2)};
  
  const totalValue = data.reduce((sum, item) => sum + (item.value || 0), 0);
  const avgGrowth = data.reduce((sum, item) => sum + (item.growth || 0), 0) / data.length;
  
  return (
    React.createElement('div', { className: "w-full h-full space-y-6" },
      React.createElement('h2', { 
        className: "movar-heading text-xl text-awe-midnight dark:text-white" 
      }, "${title}"),
      
      React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
        React.createElement('div', { 
          className: "bg-white dark:bg-awe-midnight-light p-4 rounded-lg border border-gray-200 dark:border-awe-midnight" 
        },
          React.createElement('h3', { 
            className: "movar-body text-sm text-gray-600 dark:text-gray-400" 
          }, "Total Value"),
          React.createElement('p', { 
            className: "movar-heading text-2xl text-awe-midnight dark:text-white" 
          }, totalValue.toLocaleString())
        ),
        React.createElement('div', { 
          className: "bg-white dark:bg-awe-midnight-light p-4 rounded-lg border border-gray-200 dark:border-awe-midnight" 
        },
          React.createElement('h3', { 
            className: "movar-body text-sm text-gray-600 dark:text-gray-400" 
          }, "Average Growth"),
          React.createElement('p', { 
            className: "movar-heading text-2xl text-awe-midnight dark:text-white" 
          }, avgGrowth.toFixed(1) + "%")
        ),
        React.createElement('div', { 
          className: "bg-white dark:bg-awe-midnight-light p-4 rounded-lg border border-gray-200 dark:border-awe-midnight" 
        },
          React.createElement('h3', { 
            className: "movar-body text-sm text-gray-600 dark:text-gray-400" 
          }, "Data Points"),
          React.createElement('p', { 
            className: "movar-heading text-2xl text-awe-midnight dark:text-white" 
          }, data.length.toString())
        )
      ),
      
      React.createElement('div', { 
        className: "bg-white dark:bg-awe-midnight-light p-4 rounded-lg border border-gray-200 dark:border-awe-midnight" 
      },
        React.createElement(Recharts.ResponsiveContainer, { width: "100%", height: 300 },
          React.createElement(Recharts.BarChart, { data: data },
            React.createElement(Recharts.CartesianGrid, { strokeDasharray: "3 3", stroke: "#e5e7eb" }),
            React.createElement(Recharts.XAxis, { 
              dataKey: Object.keys(data[0] || {})[0], 
              stroke: "#6b7280" 
            }),
            React.createElement(Recharts.YAxis, { stroke: "#6b7280" }),
            React.createElement(Recharts.Tooltip, { 
              contentStyle: {
                backgroundColor: '#1a2238',
                border: 'none',
                borderRadius: '8px',
                color: 'white'
              }
            }),
            React.createElement(Recharts.Bar, {
              dataKey: "value",
              fill: "#0073ff",
              radius: [4, 4, 0, 0]
            })
          )
        )
      )
    )
  );
};`;
  }

  // Create dashboard artifact
  createDashboardArtifact(
    userMessage: string, 
    assistantResponse: string
  ): DashboardArtifact | null {
    if (!this.shouldCreateDashboard(userMessage)) {
      return null;
    }

    const request = this.extractDashboardRequest(userMessage);
    const data = this.generateSampleData(userMessage);
    const code = this.generateDashboardCode(request, data);

    return {
      id: crypto.randomUUID(),
      title: request.title || 'Data Visualization',
      code,
      type: request.type,
      data,
      createdAt: new Date()
    };
  }
}

export const dashboardGeneratorService = new DashboardGeneratorService();