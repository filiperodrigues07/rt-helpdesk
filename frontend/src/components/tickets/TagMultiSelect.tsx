import { ChevronDown, Tag as TagIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { Tag } from '@/types';

interface TagMultiSelectProps {
  tags: Tag[];
  selected: string[];
  onChange: (tagIds: string[]) => void;
}

export function TagMultiSelect({ tags, selected, onChange }: TagMultiSelectProps) {
  function toggle(tagId: string) {
    onChange(selected.includes(tagId) ? selected.filter((id) => id !== tagId) : [...selected, tagId]);
  }

  const selectedTags = tags.filter((tag) => selected.includes(tag.id));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between font-normal">
          <span className="flex flex-wrap items-center gap-1">
            <TagIcon className="h-3.5 w-3.5 text-muted-foreground" />
            {selectedTags.length === 0 ? (
              <span className="text-muted-foreground">Selecionar tags</span>
            ) : (
              selectedTags.map((tag) => (
                <Badge key={tag.id} variant="secondary">
                  {tag.name}
                </Badge>
              ))
            )}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        {tags.map((tag) => (
          <DropdownMenuCheckboxItem
            key={tag.id}
            checked={selected.includes(tag.id)}
            onSelect={(event) => {
              event.preventDefault();
              toggle(tag.id);
            }}
          >
            {tag.name}
          </DropdownMenuCheckboxItem>
        ))}
        {tags.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">Nenhuma tag cadastrada</p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
