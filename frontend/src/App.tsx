import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { AuthProvider } from './contexts/AuthContext';

const HomePage = lazy(() => import('./pages/HomePage'));
const ReportPage = lazy(() => import('./pages/ReportPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AddressPage = lazy(() => import('./pages/AddressPage'));
const DevPortalPage = lazy(() => import('./pages/DevPortalPage'));
const DevRegisterPage = lazy(() => import('./pages/DevRegisterPage'));
const DevLoginPage = lazy(() => import('./pages/DevLoginPage'));
const ApiDocsPage = lazy(() => import('./pages/ApiDocsPage'));

function LoadingFallback(): React.ReactElement {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-pulse text-text-muted font-heading">Loading...</div>
    </div>
  );
}

export default function App(): React.ReactElement {
  return (
    <AuthProvider>
      <Layout>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/address/:chain/:address" element={<AddressPage />} />
            <Route path="/developers" element={<DevPortalPage />} />
            <Route path="/developers/register" element={<DevRegisterPage />} />
            <Route path="/developers/login" element={<DevLoginPage />} />
            <Route path="/docs/api" element={<ApiDocsPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </AuthProvider>
  );
}
