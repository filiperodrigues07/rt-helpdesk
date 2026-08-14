import * as React from 'react';
import { Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AttachmentPickerProps {
  files: File[];
  onChange: (files: File[]) => void;
}

export function AttachmentPicker({ files, onChange }: AttachmentPickerProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  function handleSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    onChange([...files, ...selected]);
    event.target.value = '';
  }

  function removeFile(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
        onChange={handleSelect}
      />
      <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
        <Paperclip className="h-4 w-4" />
        Anexar arquivos
      </Button>

      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between rounded-md border border-border px-2 py-1 text-xs"
            >
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
