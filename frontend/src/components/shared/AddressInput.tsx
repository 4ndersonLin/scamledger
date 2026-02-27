interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  chain?: string;
}

export default function AddressInput({
  value,
  onChange,
  chain: _chain,
}: AddressInputProps): React.ReactElement {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-navy-800 border border-navy-600 rounded px-4 py-3 font-mono text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-accent focus:ring-1 focus:ring-blue-accent"
      placeholder="0x..."
    />
  );
}
