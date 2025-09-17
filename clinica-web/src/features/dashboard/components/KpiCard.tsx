type Props = { label: string; value: React.ReactNode };

export default function KpiCard({ label, value }: Props) {
  return (
    <div className="dash-card p-16 kpi">
      <div className="val">{value}</div>
      <div className="lbl">{label}</div>
    </div>
  );
}
