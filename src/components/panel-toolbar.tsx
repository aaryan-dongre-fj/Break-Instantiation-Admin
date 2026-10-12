import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

type SearchFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
};

export function SearchField({
  label,
  placeholder,
  value,
  onChange,
}: SearchFieldProps) {
  return (
    <div className="flex w-full flex-col md:w-1/2">
      <p className="mx-1 p-2 font-semibold">{label}</p>
      <div className="relative w-full md:w-4/5">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#718096]" />
        <Input
          value={value}
          placeholder={placeholder}
          className="rounded-[20px] pr-3 pl-10"
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  );
}

export function RecordCount({
  count,
  singular,
  plural,
}: {
  count: number;
  singular: string;
  plural: string;
}) {
  return (
    <p className="px-8 py-4 text-base font-semibold text-black/70">
      {count} {count === 1 ? singular : plural} found.
    </p>
  );
}
