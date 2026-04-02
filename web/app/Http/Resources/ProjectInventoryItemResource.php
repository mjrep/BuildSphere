<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectInventoryItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Compute Status
        $statusStr = 'in_stock';
        if ($this->current_stock <= 0) {
            $statusStr = 'out_of_stock';
        } elseif ($this->current_stock <= $this->critical_level) {
            $statusStr = 'low_stock';
        }

        return [
            'id'               => $this->id,
            'item_name'        => $this->item_name,
            'category'         => $this->category,
            'current_stock'    => $this->current_stock,
            'stock_unit'       => $this->stock_unit,
            'stock_display'    => $this->current_stock . ' ' . $this->stock_unit,
            'critical_level'   => $this->critical_level,
            'critical_display' => $this->critical_level . ' ' . $this->stock_unit,
            'price'            => $this->price,
            'price_unit'       => $this->price_unit,
            'price_display'    => '₱' . number_format($this->price, 0) . ' ' . $this->price_unit,
            'status'           => $statusStr,
        ];
    }
}
