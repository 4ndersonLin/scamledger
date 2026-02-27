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
      className="w-full bg-surface-sunken border border-border-subtle rounded-xl px-4 py-3 font-mono text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
      placeholder="0x..."
    />
  );
}
