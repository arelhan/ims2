const typeMap: Record<string, string> = { NUMBER: 'number', DATE: 'date', EMAIL: 'email', URL: 'url', PHONE: 'tel' }

export function CustomFieldInput({ field, value, onChange }: {
  field: any
  value: string
  onChange: (val: string) => void
}) {
  const cls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"

  if (field.fieldType === 'BOOLEAN') {
    return (
      <input
        type="checkbox"
        checked={value === 'true'}
        onChange={e => onChange(e.target.checked ? 'true' : 'false')}
        className="w-4 h-4 rounded border-slate-300 accent-slate-900"
      />
    )
  }

  if (field.fieldType === 'SELECT') {
    const options = (field.placeholder || '')
      .split(',')
      .map((o: string) => o.trim())
      .filter(Boolean)
    return (
      <select
        required={field.isRequired}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`${cls} bg-white`}
      >
        <option value="">Seçiniz...</option>
        {options.map((opt: string) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    )
  }

  if (field.fieldType === 'TEXTAREA') {
    return (
      <textarea required={field.isRequired} value={value} onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder || ''} rows={3} className={cls} />
    )
  }

  return (
    <input
      type={typeMap[field.fieldType] ?? 'text'}
      required={field.isRequired}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={field.placeholder || ''}
      className={cls}
    />
  )
}
