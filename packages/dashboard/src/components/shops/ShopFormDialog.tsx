import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { VisitPeriodUnit } from '@supermarket-list/shared';

export interface ShopFormData {
  name: string;
  visitPeriodValue: string;
  visitPeriodUnit: VisitPeriodUnit;
  hasVisitPeriod: boolean;
}

interface ShopFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ShopFormData;
  onFormChange: (form: ShopFormData) => void;
  isEditing: boolean;
  isSaving: boolean;
  onSubmit: () => void;
}

export function ShopFormDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  isEditing,
  isSaving,
  onSubmit,
}: ShopFormDialogProps) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {isEditing ? 'Edit Shop' : 'Add Shop'}
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shop-name">Name</Label>
            <Input
              id="shop-name"
              placeholder="e.g. Supermarket, Butcher..."
              value={form.name}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
              autoFocus
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="has-visit-period"
              checked={form.hasVisitPeriod}
              onChange={(e) => onFormChange({ ...form, hasVisitPeriod: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="has-visit-period">Set visit reminder</Label>
          </div>

          {form.hasVisitPeriod && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="visit-value">Every</Label>
                <Input
                  id="visit-value"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="365"
                  value={form.visitPeriodValue}
                  onChange={(e) =>
                    onFormChange({ ...form, visitPeriodValue: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="visit-unit">Period</Label>
                <Select
                  value={form.visitPeriodUnit}
                  onValueChange={(v) =>
                    onFormChange({ ...form, visitPeriodUnit: v as VisitPeriodUnit })
                  }
                >
                  <SelectTrigger id="visit-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
                    <SelectItem value="months">Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
        <ResponsiveDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!form.name.trim() || isSaving}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Add Shop'}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
