export function ExportButtons({ csvName, rows, onPdf }: { csvName: string; rows: any[]; onPdf?: () => void }) {
  return (
    <div className="flex gap-2">
      <button className="border rounded-md px-3 py-1" onClick={() => {
        const evt = new CustomEvent("export-csv", { detail: { name: csvName, rows } });
        window.dispatchEvent(evt);
      }}>Exportar CSV</button>
      {onPdf && (
        <button className="border rounded-md px-3 py-1" onClick={onPdf}>Exportar PDF</button>
      )}
    </div>
  );
}
