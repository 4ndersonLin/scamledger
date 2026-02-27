import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import type { Chain, ReportInput, Report } from '@cryptoscam/shared';
import { api } from '../lib/api';
import { usePageMeta } from '../hooks/usePageMeta';
import ReportForm from '../components/report/ReportForm';
import SuccessModal from '../components/report/SuccessModal';

export default function ReportPage(): React.ReactElement {
  const { t } = useTranslation();
  usePageMeta({
    title: 'Submit Incident Report',
    description:
      'Report a cryptocurrency scam or hack incident. Help protect the community by sharing threat intelligence.',
  });
  const [searchParams] = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<{ chain?: Chain; address?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const initialChain = (searchParams.get('chain') as Chain) || undefined;
  const initialAddress = searchParams.get('address') || undefined;

  const handleSubmit = async (data: ReportInput): Promise<void> => {
    setSubmitError(null);
    const result = await api.post<Report>('/reports', data);
    if (result.success) {
      setSubmittedData({ chain: data.chain, address: data.address });
      setSubmitted(true);
    } else {
      setSubmitError(result.error.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-heading font-bold uppercase tracking-wider text-white mb-8">
        {t('report.title')}
      </h1>

      {submitError && (
        <div className="mb-6 bg-threat-red/10 border border-threat-red/30 rounded-lg p-4">
          <p className="text-sm text-threat-red">{submitError}</p>
        </div>
      )}

      <ReportForm
        initialChain={initialChain}
        initialAddress={initialAddress}
        onSubmit={handleSubmit}
      />

      {submitted && (
        <SuccessModal
          chain={submittedData.chain}
          address={submittedData.address}
          onClose={() => setSubmitted(false)}
        />
      )}
    </div>
  );
}
