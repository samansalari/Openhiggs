import { useState, type FormEvent } from "react";
import { Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Category } from "@/lib/page-types";
import { qk, saveOrder, useInvalidate } from "./data";
import { SortableList } from "./SortableList";

export function CategoriesTab({ categories }: { categories: Category[] }) {
  const invalidate = useInvalidate();
  const [name, setName] = useState("");
  const [order, setOrder] = useState<Category[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});

  async function add(e: FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    const { error } = await supabase.from("categories").insert({ name: n.slice(0, 60), position: categories.length });
    if (error) return void toast.error(error.message);
    setName("");
    invalidate(qk.categories);
  }

  async function rename(c: Category) {
    const n = (names[c.id] ?? c.name).trim();
    if (!n || n === c.name) return;
    const { error } = await supabase.from("categories").update({ name: n.slice(0, 60) }).eq("id", c.id);
    if (error) return void toast.error(error.message);
    toast.success("Category renamed");
    invalidate(qk.categories);
  }

  async function remove(c: Category) {
    if (!confirm(`Delete "${c.name}"? Its links stay, without a category.`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) return void toast.error(error.message);
    invalidate(qk.categories);
    invalidate(qk.links);
  }

  async function reorder(next: Category[]) {
    setOrder(next);
    try {
      await saveOrder("categories", next.map((c) => c.id));
      await invalidate(qk.categories);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not reorder");
    } finally {
      setOrder(null);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="flex gap-2">
        <Input placeholder="New category name" aria-label="New category name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
        <Button type="submit">Add</Button>
      </form>
      <SortableList
        items={order ?? categories}
        onReorder={reorder}
        label={(c) => c.name}
        renderItem={(c) => (
          <div className="flex items-center gap-2">
            <Input
              aria-label={`Rename ${c.name}`}
              value={names[c.id] ?? c.name}
              onChange={(e) => setNames({ ...names, [c.id]: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && rename(c)}
              className="h-9"
            />
            {(names[c.id] ?? c.name) !== c.name && (
              <Button variant="ghost" size="icon" aria-label="Save name" onClick={() => rename(c)}><Check /></Button>
            )}
            <Button variant="ghost" size="icon" aria-label={`Delete ${c.name}`} onClick={() => remove(c)}><Trash2 /></Button>
          </div>
        )}
      />
      {categories.length === 0 && <p className="text-sm text-muted-foreground">No categories — links show as one simple list.</p>}
    </div>
  );
}
