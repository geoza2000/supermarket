import { useMemo } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Clock, GripVertical, Pencil, Trash2 } from 'lucide-react';
import type { ShopDocument, VisitPeriod } from '@supermarket-list/shared';

type SortableShopListProps = {
  shops: ShopDocument[];
  disabled?: boolean;
  formatVisitPeriod: (vp: VisitPeriod | null) => string;
  formatLastVisited: (lastVisitedAt: string | null) => string;
  onEdit: (shop: ShopDocument) => void;
  onDelete: (shop: ShopDocument) => void;
  onReorder: (orderedShopIds: string[]) => void;
};

type SortableShopCardProps = {
  shop: ShopDocument;
  disabled?: boolean;
  formatVisitPeriod: (vp: VisitPeriod | null) => string;
  formatLastVisited: (lastVisitedAt: string | null) => string;
  onEdit: (shop: ShopDocument) => void;
  onDelete: (shop: ShopDocument) => void;
};

function SortableShopCard({
  shop,
  disabled,
  formatVisitPeriod,
  formatLastVisited,
  onEdit,
  onDelete,
}: SortableShopCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: shop.shopId, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'z-10 shadow-lg' : undefined}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-2">
          <button
            type="button"
            className="mt-0.5 shrink-0 touch-none rounded-md p-1 text-muted-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
            disabled={disabled}
            aria-label={`Drag to reorder ${shop.name}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="font-semibold">{shop.name}</h3>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatVisitPeriod(shop.visitPeriod)}
              </span>
              <Separator orientation="vertical" className="hidden h-4 sm:block" />
              <span>Last: {formatLastVisited(shop.lastVisitedAt)}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(shop)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => onDelete(shop)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SortableShopList({
  shops,
  disabled,
  formatVisitPeriod,
  formatLastVisited,
  onEdit,
  onDelete,
  onReorder,
}: SortableShopListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const ids = useMemo(() => shops.map((s) => s.shopId), [shops]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || disabled) return;
    const oldIndex = shops.findIndex((s) => s.shopId === active.id);
    const newIndex = shops.findIndex((s) => s.shopId === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(shops, oldIndex, newIndex);
    onReorder(next.map((s) => s.shopId));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {shops.map((shop) => (
            <SortableShopCard
              key={shop.shopId}
              shop={shop}
              disabled={disabled}
              formatVisitPeriod={formatVisitPeriod}
              formatLastVisited={formatLastVisited}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
