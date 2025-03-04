// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiFileText, FiCreditCard, FiTrendingUp, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

import { useAuth } from '../hooks/useAuth';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useContentItems } from '../hooks/useContentItems';
import { useGenerationHistory } from '../hooks/useGenerationHistory';
import { useCreditAccount } from '../hooks/useCreditAccount';

import  Card  from '../components/common/Card';
import  Button  from '../components/common/Button';
import  LoadingSpinner  from '../components/common/LoadingSpinner';
/* import  RecentContentItem  from '../components/dashboard/RecentContentItem'; */
import  GenerationHistoryItem  from '../components/dashboard/GenerationHistoryItem';
/* import CreditUsagePanel  from '../components/dashboard/CreditUsagePanel'; */
/* import  WelcomePanel  from '../components/dashboard/WelcomePanel'; */

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const Dashboard = () => {
  const { user } = useAuth();
  const { 
    stats, 
    isLoading: isLoadingStats 
  } = useDashboardStats();
  
  const { 
    contentItems, 
    isLoading: isLoadingContent 
  } = useContentItems({ limit: 5 });
  
  const { 
    generations, 
    isLoading: isLoadingGenerations 
  } = useGenerationHistory({ limit: 5 });
  
  const { 
    creditAccount, 
    isLoading: isLoadingCreditAccount 
  } = useCreditAccount();

  const [creditUsageData, setCreditUsageData] = useState({
    labels: [],
    datasets: []
  });

  const [contentCreationData, setContentCreationData] = useState({
    labels: [],
    datasets: []
  });

  // Prepare chart data when stats are loaded
  useEffect(() => {
    if (stats && stats.creditUsage) {
      // Credit usage chart data
      const creditLabels = stats.creditUsage.map(item => item.date);
      const creditValues = stats.creditUsage.map(item => item.creditsUsed);
      
      setCreditUsageData({
        labels: creditLabels,
        datasets: [
          {
            label: 'Credits Used',
            data: creditValues,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            fill: true,
            tension: 0.4
          }
        ]
      });
      
      // Content creation chart data
      const contentLabels = stats.contentCreation.map(item => item.date);
      const contentCounts = stats.contentCreation.map(item => item.count);
      
      setContentCreationData({
        labels: contentLabels,
        datasets: [
          {
            label: 'Content Items Created',
            data: contentCounts,
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            borderRadius: 6
          }
        ]
      });
    }
  }, [stats]);

  const isLoading = isLoadingStats || isLoadingContent || isLoadingGenerations || isLoadingCreditAccount;

  // Common chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" message="Loading dashboard data..." />
        </div>
      ) : (
        <>
          {/* Welcome Panel */}
  {/*         <WelcomePanel user={user} /> */}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-8">
            <Card>
              <div className="flex items-center">
                <div className="rounded-full p-3 bg-blue-100 text-blue-600 mr-4">
                  <FiFileText size={24} />
                </div>
                <div>
                  <h3 className="text-gray-500 text-sm">Total Content</h3>
                  <p className="font-semibold text-2xl">{stats?.totalContent || 0}</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center">
                <div className="rounded-full p-3 bg-green-100 text-green-600 mr-4">
                  <FiCheckCircle size={24} />
                </div>
                <div>
                  <h3 className="text-gray-500 text-sm">Published</h3>
                  <p className="font-semibold text-2xl">{stats?.publishedContent || 0}</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center">
                <div className="rounded-full p-3 bg-purple-100 text-purple-600 mr-4">
                  <FiTrendingUp size={24} />
                </div>
                <div>
                  <h3 className="text-gray-500 text-sm">Generations</h3>
                  <p className="font-semibold text-2xl">{stats?.totalGenerations || 0}</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center">
                <div className="rounded-full p-3 bg-yellow-100 text-yellow-600 mr-4">
                  <FiCreditCard size={24} />
                </div>
                <div>
                  <h3 className="text-gray-500 text-sm">Credits Remaining</h3>
                  <p className="font-semibold text-2xl">{creditAccount?.creditsRemaining?.toLocaleString() || 0}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Dashboard Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Credit Usage Chart */}
              <Card>
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg font-medium text-gray-900">Credit Usage (Last 30 Days)</h3>
                </div>
                <div className="px-4 pb-5 h-64">
                  {creditUsageData.labels.length > 0 ? (
                    <Line data={creditUsageData} options={chartOptions} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <p>No credit usage data available</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Content Creation Chart */}
              <Card>
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg font-medium text-gray-900">Content Created (Last 30 Days)</h3>
                </div>
                <div className="px-4 pb-5 h-64">
                  {contentCreationData.labels.length > 0 ? (
                    <Bar data={contentCreationData} options={chartOptions} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <p>No content creation data available</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Recent Content */}
              <Card>
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Recent Content</h3>
                  <Link to="/content">
                    <Button variant="outline" size="sm">View All</Button>
                  </Link>
                </div>
{/*                 <div className="border-t border-gray-200">
                  {contentItems && contentItems.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {contentItems.map(item => (
                        <li key={item.id}>
                          <RecentContentItem item={item} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="py-6 px-4 text-center text-gray-500">
                      <p>No content items yet</p>
                      <Link to="/content/new" className="mt-2 inline-block">
                        <Button size="sm">
                          <FiPlus className="mr-1" /> Create Content
                        </Button>
                      </Link>
                    </div>
                  )}
                </div> */}
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Credit Usage Panel */}
     {/*          <CreditUsagePanel creditAccount={creditAccount} /> */}

              {/* Recent Generations */}
              <Card>
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Recent Generations</h3>
                  <Link to="/generations">
                    <Button variant="outline" size="sm">View All</Button>
                  </Link>
                </div>
                <div className="border-t border-gray-200">
                  {generations && generations.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {generations.map(generation => (
                        <li key={generation.id}>
                          <GenerationHistoryItem generation={generation} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="py-6 px-4 text-center text-gray-500">
                      <p>No generations yet</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Quick Actions */}
              <Card>
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 space-y-4">
                  <Link to="/content/new">
                    <Button fullWidth>
                      <FiPlus className="mr-2" /> Create New Content
                    </Button>
                  </Link>
                  <Link to="/templates">
                    <Button variant="outline" fullWidth>
                      <FiFileText className="mr-2" /> Browse Templates
                    </Button>
                  </Link>
                  <Link to="/credits/buy">
                    <Button variant="outline" fullWidth>
                      <FiCreditCard className="mr-2" /> Buy Credits
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* Status Panel */}
              <Card>
                <div className="px-4 py-5">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">System Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <FiCheckCircle className="text-green-500 mr-2" />
                      <span>AI Generation System: Operational</span>
                    </div>
                    <div className="flex items-center">
                      <FiCheckCircle className="text-green-500 mr-2" />
                      <span>Content Publishing: Operational</span>
                    </div>
                    <div className="flex items-center">
                      <FiClock className="text-yellow-500 mr-2" />
                      <span>WordPress Integration: Maintenance</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
